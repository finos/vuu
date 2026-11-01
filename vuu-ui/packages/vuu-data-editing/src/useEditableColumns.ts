import type {
  DataEditable,
  DataValueEditor,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type {
  ColumnDescriptor,
  DataValueTypeDescriptor,
} from "@vuu-ui/vuu-table-types";
import { isDataValueEditable } from "@vuu-ui/vuu-utils";
import { useMemo } from "react";
import { UNDO_CELL_RENDERER } from "./UndoCellRenderer";

/** Columns maintained by the Vuu server, never editable by default. */
export const DEFAULT_READ_ONLY_COLUMNS = [
  "vuuCreatedTimestamp",
  "vuuUpdatedTimestamp",
  "vuuMsg",
] as const;

/** The client-side column that hosts the `UndoCellRenderer`. */
export const UNDO_COLUMN: ColumnDescriptor = {
  name: "undo",
  source: "client",
  width: 80,
  type: {
    name: "string",
    renderer: {
      name: UNDO_CELL_RENDERER,
    },
  },
};

export interface EditableColumnsHookProps {
  /**
   * Column descriptors used in view mode and as the base for edit mode. A
   * column's `editable` narrows what the server schema allows, its `editor`
   * is used as the cell editor in edit mode.
   */
  columns: readonly ColumnDescriptor[];
  /**
   * Whether the table is currently showing the edit session. Typically
   * `isEditSessionReady` from `useEditableTable`. When false, editing is
   * switched off for every column.
   */
  isEditing: boolean;
  /**
   * The schema of the table being edited. A column the schema marks as not
   * editable can never be edited, whatever the column descriptor says.
   * Columns with no `editable` flag in the schema are editable.
   */
  schema?: TableSchema;
  /**
   * Append the client-side undo column while editing. Pass a partial
   * descriptor to override defaults such as width.
   */
  undoColumn?: boolean | Partial<ColumnDescriptor>;
  /**
   * Append the session table's `vuuAction` column while editing, either
   * hidden (it still drives row styling) or visible.
   */
  actionColumn?: "hidden" | "visible" | false;
  /**
   * When true, edit-mode columns are built from `editSchema` rather than
   * `columns`. Pass `columnsDiverge` and `editSchema` from `useEditableTable`.
   * Descriptors in `columns` with a matching name are used as a base so that
   * labels, widths and formatting are preserved.
   */
  columnsDiverge?: boolean;
  editSchema?: TableSchema;
}

const typeName = (
  column: ColumnDescriptor,
): DataValueTypeDescriptor["name"] => {
  if (typeof column.type === "string") {
    return column.type;
  } else if (column.type) {
    return column.type.name;
  }
  return "string";
};

const isReadOnlyColumn = (name: string) =>
  (DEFAULT_READ_ONLY_COLUMNS as readonly string[]).includes(name);

/**
 * Combines the schema and column `editable` values. The column can only
 * narrow what the schema allows.
 */
export const narrowEditable = (
  schemaEditable: DataEditable = true,
  columnEditable: DataEditable = true,
): DataEditable => {
  if (schemaEditable === true) {
    return columnEditable;
  } else if (schemaEditable === false || columnEditable === false) {
    return false;
  }
  const insert =
    isDataValueEditable({ editable: schemaEditable }, "insert") &&
    isDataValueEditable({ editable: columnEditable }, "insert");
  const update =
    isDataValueEditable({ editable: schemaEditable }, "update") &&
    isDataValueEditable({ editable: columnEditable }, "update");
  return insert === update ? insert : { insert, update };
};

/**
 * The cell renderer used to edit a value. Typeahead has no cell editor, so
 * it is left to the default input-cell.
 */
const withEditor = (
  column: ColumnDescriptor,
  editor?: DataValueEditor,
): ColumnDescriptor => {
  if (editor === undefined || editor.name === "typeahead") {
    return column;
  }
  return {
    ...column,
    type: {
      name: typeName(column),
      renderer: editor,
    } as DataValueTypeDescriptor,
  };
};

const toViewColumn = (column: ColumnDescriptor) =>
  column.editable === undefined || column.editable === false
    ? column
    : { ...column, editable: false };

/**
 * Builds edit-mode column descriptors. Exposed for use outside React, e.g. in
 * tests or when composing a TableConfig by hand. Most code should use
 * `useEditableColumns`.
 */
export const getEditableColumns = ({
  actionColumn = false,
  columns,
  columnsDiverge = false,
  editSchema,
  isEditing,
  schema = editSchema,
  undoColumn = false,
}: EditableColumnsHookProps): readonly ColumnDescriptor[] => {
  if (!isEditing) {
    return columns.some((c) => c.editable !== undefined && c.editable !== false)
      ? columns.map(toViewColumn)
      : columns;
  }

  const baseColumns: readonly ColumnDescriptor[] =
    columnsDiverge && editSchema
      ? editSchema.columns
          .filter(({ name }) => name !== "vuuAction")
          .map(
            (schemaColumn) =>
              columns.find(({ name }) => name === schemaColumn.name) ?? {
                name: schemaColumn.name,
                serverDataType: schemaColumn.serverDataType,
              },
          )
      : columns;

  const editColumns = baseColumns.map<ColumnDescriptor>((column) => {
    if (column.source === "client") {
      return column;
    } else if (isReadOnlyColumn(column.name)) {
      return column.editable === undefined
        ? column
        : { ...column, editable: false };
    }
    const schemaColumn = schema?.columns.find(
      ({ name }) => name === column.name,
    );
    const editable = narrowEditable(schemaColumn?.editable, column.editable);
    return withEditor({ ...column, editable }, column.editor);
  });

  if (actionColumn) {
    editColumns.push({
      hidden: actionColumn === "hidden",
      name: "vuuAction",
      serverDataType: "string",
    });
  }
  if (undoColumn) {
    editColumns.push(
      undoColumn === true ? UNDO_COLUMN : { ...UNDO_COLUMN, ...undoColumn },
    );
  }

  return editColumns;
};

/**
 * Maps view-mode column descriptors to edit-mode descriptors and adds the
 * action and undo columns. Editability comes from the schema, narrowed by
 * each column's `editable`; a column's `editor` becomes its cell editor.
 *
 * When `isEditing` is false, editing is switched off for every column.
 *
 * @example
 * const columns = useEditableColumns({
 *   columns: [
 *     { name: "ric", editable: { insert: true, update: false } },
 *     {
 *       name: "currency",
 *       editor: { name: "dropdown-cell", values: ["EUR", "GBP", "USD"] },
 *     },
 *     { name: "lastUpdate", editable: false },
 *   ],
 *   isEditing: isEditSessionReady,
 *   schema: dataSource.tableSchema,
 *   undoColumn: true,
 *   actionColumn: "hidden",
 * });
 */
export const useEditableColumns = ({
  actionColumn,
  columns,
  columnsDiverge,
  editSchema,
  isEditing,
  schema,
  undoColumn,
}: EditableColumnsHookProps) =>
  useMemo(
    () =>
      getEditableColumns({
        actionColumn,
        columns,
        columnsDiverge,
        editSchema,
        isEditing,
        schema,
        undoColumn,
      }),
    [
      actionColumn,
      columns,
      columnsDiverge,
      editSchema,
      isEditing,
      schema,
      undoColumn,
    ],
  );
