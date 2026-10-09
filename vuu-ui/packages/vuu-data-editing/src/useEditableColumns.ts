import type { DataEditable, TableSchema } from "@vuu-ui/vuu-data-types";
import type {
  ColumnDescriptor,
  DataValueTypeDescriptor,
} from "@vuu-ui/vuu-table-types";
import { useMemo } from "react";
import { UNDO_CELL_RENDERER } from "./UndoCellRenderer";

/**
 * Per-column editing options. Use the shorthand forms for simple cases:
 * `true`/`false` or `{ insert, update }`.
 */
export interface EditableColumnOptions {
  /** @default true */
  editable?: DataEditable;
  /** Replaces the column type while editing. Takes precedence over `renderer`. */
  type?: ColumnDescriptor["type"];
  /** Name of a registered cell renderer to use while editing, e.g. "dropdown-cell". */
  renderer?: string;
  /** Values offered by a value-list renderer such as "dropdown-cell". */
  values?: string[];
}

export type EditableColumnSpec = DataEditable | EditableColumnOptions;

/**
 * Maps column names to editing options. The key `"*"` applies to every column
 * that has no entry of its own.
 */
export type EditableColumnsConfig = Record<string, EditableColumnSpec>;

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
  /** Column descriptors used in view mode and as the base for edit mode. */
  columns: ColumnDescriptor[];
  /**
   * Whether the table is currently showing the edit session. Typically
   * `isEditSessionReady` from `useEditableTable`. When false, `columns` are
   * returned unchanged.
   */
  isEditing: boolean;
  /**
   * Editing options per column. When omitted, every column that is not
   * read-only is editable.
   */
  editable?: EditableColumnsConfig;
  /**
   * Columns that are never editable.
   * @default ["vuuCreatedTimestamp", "vuuUpdatedTimestamp", "vuuMsg"]
   */
  readOnly?: readonly string[];
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

const isEditableOptions = (
  spec: EditableColumnSpec,
): spec is EditableColumnOptions =>
  typeof spec === "object" && !("insert" in spec && "update" in spec);

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

const applySpec = (
  column: ColumnDescriptor,
  spec: EditableColumnSpec | undefined,
): ColumnDescriptor => {
  if (spec === undefined) {
    return { ...column, editable: column.editable ?? true };
  } else if (!isEditableOptions(spec)) {
    return { ...column, editable: spec };
  }

  const { editable = true, renderer, type, values } = spec;
  if (type) {
    return { ...column, editable, type };
  } else if (renderer) {
    return {
      ...column,
      editable,
      type: {
        name: typeName(column),
        renderer: values ? { name: renderer, values } : { name: renderer },
      } as DataValueTypeDescriptor,
    };
  }
  return { ...column, editable };
};

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
  editable,
  isEditing,
  readOnly = DEFAULT_READ_ONLY_COLUMNS,
  undoColumn = false,
}: EditableColumnsHookProps): ColumnDescriptor[] => {
  if (!isEditing) {
    return columns;
  }

  const baseColumns: ColumnDescriptor[] =
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

  const wildcard = editable?.["*"];
  const editColumns = baseColumns.map<ColumnDescriptor>((column) => {
    if (column.source === "client" || readOnly.includes(column.name)) {
      return column;
    }
    const spec = editable?.[column.name] ?? wildcard;
    if (editable && spec === undefined) {
      return column;
    }
    return applySpec(column, spec);
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
 * Maps view-mode column descriptors to edit-mode descriptors, applying
 * per-column `editable` options and adding the action and undo columns.
 *
 * Returns `columns` unchanged when `isEditing` is false.
 *
 * @example
 * const columns = useEditableColumns({
 *   columns: InstrumentColumns,
 *   isEditing: isEditSessionReady,
 *   editable: {
 *     "*": true,
 *     isin: { insert: true, update: false },
 *     currency: { renderer: "dropdown-cell", values: ["EUR", "GBP", "USD"] },
 *   },
 *   undoColumn: true,
 *   actionColumn: "hidden",
 * });
 */
export const useEditableColumns = ({
  actionColumn,
  columns,
  columnsDiverge,
  editSchema,
  editable,
  isEditing,
  readOnly,
  undoColumn,
}: EditableColumnsHookProps) =>
  useMemo(
    () =>
      getEditableColumns({
        actionColumn,
        columns,
        columnsDiverge,
        editSchema,
        editable,
        isEditing,
        readOnly,
        undoColumn,
      }),
    [
      actionColumn,
      columns,
      columnsDiverge,
      editSchema,
      editable,
      isEditing,
      readOnly,
      undoColumn,
    ],
  );
