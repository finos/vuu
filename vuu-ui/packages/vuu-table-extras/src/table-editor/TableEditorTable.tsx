import {
  type EditableColumnsHookProps,
  useEditableColumns,
} from "@vuu-ui/vuu-data-editing";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import { useCallback, useMemo } from "react";
import { InlineAddRow } from "../inline-add-row";
import { useTableEditorContext } from "./TableEditorContext";

export interface TableEditorTableProps
  extends Omit<
      TableProps,
      "customHeader" | "dataSource" | "isRowSelectable" | "selectionModel"
    >,
    Partial<
      Pick<EditableColumnsHookProps, "editable" | "readOnly" | "undoColumn">
    > {
  /** Table editing: show a row, above the column headers, for adding rows. */
  showInlineAddRow?: boolean;
}

const NO_ROWS_SELECTABLE = () => false;

const TableCellEditorTable = ({
  config,
  editable,
  readOnly,
  showInlineAddRow = false,
  undoColumn = false,
  ...tableProps
}: TableEditorTableProps) => {
  const { allowDelete, editableTable } =
    useTableEditorContext("TableEditorTable");
  const {
    columnsDiverge,
    dataSource,
    editSchema,
    isEditSessionReady,
    isRowSelectable,
    rowClassNameGenerators,
  } = editableTable as NonNullable<typeof editableTable>;

  const columns = useEditableColumns({
    actionColumn: allowDelete ? "hidden" : false,
    columns: config.columns,
    columnsDiverge,
    editSchema,
    editable,
    isEditing: isEditSessionReady,
    readOnly,
    undoColumn,
  });

  const tableConfig = useMemo<TableConfig>(
    () => ({
      ...config,
      columns,
      rowClassNameGenerators: isEditSessionReady
        ? (config.rowClassNameGenerators ?? []).concat(
            rowClassNameGenerators ?? [],
          )
        : config.rowClassNameGenerators,
    }),
    [columns, config, isEditSessionReady, rowClassNameGenerators],
  );

  const canDelete = isEditSessionReady && allowDelete;

  return (
    <Table
      renderBufferSize={10}
      {...tableProps}
      config={tableConfig}
      customHeader={
        isEditSessionReady && showInlineAddRow ? InlineAddRow : undefined
      }
      dataSource={dataSource}
      isRowSelectable={canDelete ? isRowSelectable : undefined}
      selectionModel={canDelete ? "checkbox" : "none"}
    />
  );
};

const FormEditorTable = ({
  editable: _editable,
  onSelect,
  readOnly: _readOnly,
  showInlineAddRow: _showInlineAddRow,
  undoColumn: _undoColumn,
  ...tableProps
}: TableEditorTableProps) => {
  const {
    dataSource,
    isEditing,
    onSelect: selectRow,
  } = useTableEditorContext("TableEditorTable");

  const handleSelect = useCallback(
    (dataRow: DataRow | null) => {
      selectRow(dataRow);
      onSelect?.(dataRow);
    },
    [onSelect, selectRow],
  );

  return (
    <Table
      renderBufferSize={10}
      {...tableProps}
      dataSource={dataSource}
      isRowSelectable={isEditing ? NO_ROWS_SELECTABLE : undefined}
      onSelect={handleSelect}
      selectionModel="single"
    />
  );
};

/**
 * The Table of the enclosing `EditableTable` or `TableWithEditForm`, bound to its dataSource and mode.
 *
 * - Table editing: cells become editable in edit mode, edited, added and
 *   deleted rows are styled, and rows can be checked for deletion when
 *   `allowDelete` is set on the provider.
 * - Form editing: single selection, which selects the row shown in
 *   `TableEditorForm`. Selection is locked while the form is being edited.
 */
export const TableEditorTable = (props: TableEditorTableProps) => {
  const { editIn } = useTableEditorContext("TableEditorTable");
  return editIn === "form" ? (
    <FormEditorTable {...props} />
  ) : (
    <TableCellEditorTable {...props} />
  );
};
