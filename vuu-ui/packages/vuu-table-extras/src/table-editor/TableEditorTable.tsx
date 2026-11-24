import {
  type EditableColumnsHookProps,
  useEditableColumns,
} from "@vuu-ui/vuu-data-editing";
import { Table, type TableProps } from "@vuu-ui/vuu-table";
import type { DataRow, TableConfig } from "@vuu-ui/vuu-table-types";
import { subscribedOnly } from "@vuu-ui/vuu-utils";
import { useCallback, useLayoutEffect, useMemo } from "react";
import { InlineAddRow } from "../inline-add-row";
import { useTableEditorContext } from "./TableEditorContext";

export interface TableEditorTableProps
  extends Omit<TableProps, "customHeader" | "dataSource" | "isRowSelectable">,
    Partial<Pick<EditableColumnsHookProps, "undoColumn">> {
  /**
   * Session table editing: show a row, above the column headers, for adding
   * rows.
   */
  showInlineAddRow?: boolean;
  /**
   * Session table editing: selection in view mode, e.g. for actions on the
   * selected rows. While editing, rows are checked for deletion when
   * `allowDelete` is set on the provider, otherwise they cannot be selected.
   */
  selectionModel?: TableProps["selectionModel"];
}

const NO_ROWS_SELECTABLE = () => false;

const TableCellEditorTable = ({
  config,
  selectionModel = "none",
  showInlineAddRow = false,
  undoColumn = false,
  ...tableProps
}: TableEditorTableProps) => {
  const { allowDelete, editableTable } =
    useTableEditorContext("TableEditorTable");
  const {
    dataSource,
    editSchema,
    isEditSessionReady,
    isRowSelectable,
    rowClassNameGenerators,
    sourceDataSource,
  } = editableTable as NonNullable<typeof editableTable>;

  // A session data source may subscribe fewer columns than the view, when
  // the session table has its own schema. Until it is ready, show only the
  // columns it subscribes; once it is, only those in the session schema.
  // A remote data source has no schema until subscribed, so until then view
  // mode also shows only the columns it subscribes.
  const { tableSchema } = dataSource;
  const configColumns = useMemo(
    () =>
      !isEditSessionReady &&
      (dataSource !== sourceDataSource || tableSchema === undefined)
        ? config.columns.filter(subscribedOnly(dataSource.columns))
        : config.columns,
    [
      config.columns,
      dataSource,
      isEditSessionReady,
      sourceDataSource,
      tableSchema,
    ],
  );

  const columns = useEditableColumns({
    actionColumn: allowDelete ? "hidden" : false,
    columns: configColumns,
    editSchema,
    isEditing: isEditSessionReady,
    schema: dataSource.tableSchema ?? editSchema,
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
      selectionModel={
        canDelete ? "checkbox" : isEditSessionReady ? "none" : selectionModel
      }
    />
  );
};

const DirectCellEditorTable = ({
  config,
  showInlineAddRow: _showInlineAddRow,
  undoColumn: _undoColumn,
  ...tableProps
}: TableEditorTableProps) => {
  const { dataSource, isEditing } = useTableEditorContext("TableEditorTable");

  const columns = useEditableColumns({
    columns: config.columns,
    isEditing,
    schema: dataSource.tableSchema,
  });

  const tableConfig = useMemo<TableConfig>(
    () => ({ ...config, columns }),
    [columns, config],
  );

  return (
    <Table
      renderBufferSize={10}
      {...tableProps}
      config={tableConfig}
      dataSource={dataSource}
    />
  );
};

const FormEditorTable = ({
  config,
  onSelect,
  selectionModel: _selectionModel,
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

  // editing happens in the form, cells are never editable
  const columns = useEditableColumns({
    columns: config.columns,
    isEditing: false,
  });
  const tableConfig = useMemo<TableConfig>(
    () => ({ ...config, columns }),
    [columns, config],
  );

  return (
    <Table
      renderBufferSize={10}
      {...tableProps}
      config={tableConfig}
      dataSource={dataSource}
      isRowSelectable={isEditing ? NO_ROWS_SELECTABLE : undefined}
      onSelect={handleSelect}
      selectionModel="single"
    />
  );
};

/**
 * The Table of the enclosing `EditableTable`, bound to its dataSource and
 * mode. Its `config.columns` are also used by generated forms, for labels,
 * editors etc.
 *
 * - Inline session editing: cells become editable in edit mode, edited,
 *   added and deleted rows are styled, and rows can be checked for deletion
 *   when `allowDelete` is set on the provider.
 * - Inline direct editing: cells are editable in edit mode, and each edit is
 *   sent straight to the dataSource. `showInlineAddRow` and `undoColumn`
 *   are ignored.
 * - Form editing: single selection, which selects the row shown in
 *   `TableEditorForm`. Selection is locked while the form is being edited.
 */
export const TableEditorTable = (props: TableEditorTableProps) => {
  const { editModel, editStrategy, setColumns } =
    useTableEditorContext("TableEditorTable");
  const { columns } = props.config;
  useLayoutEffect(() => {
    setColumns(columns);
  }, [columns, setColumns]);
  useLayoutEffect(() => () => setColumns(undefined), [setColumns]);
  return editStrategy === "form" ? (
    <FormEditorTable {...props} />
  ) : editModel === "direct" ? (
    <DirectCellEditorTable {...props} />
  ) : (
    <TableCellEditorTable {...props} />
  );
};
