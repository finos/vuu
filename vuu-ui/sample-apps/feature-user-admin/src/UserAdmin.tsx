import { ToggleButton, ToggleButtonGroup, Toolbar } from "@salt-ds/core";
import {
  DataEditingProvider,
  EditButtons,
  type EditMode,
  UNDO_CELL_RENDERER,
  useEditableTable,
} from "@vuu-ui/vuu-data-editing";
import type { DataSource, TableSchema } from "@vuu-ui/vuu-data-types";
import { Table } from "@vuu-ui/vuu-table";
import {
  DataSourceStats,
  InlineAddRow,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import type {
  ColumnDescriptor,
  DataRow,
  SelectionChangeHandler,
  TableConfig,
} from "@vuu-ui/vuu-table-types";
import { type SyntheticEvent, useCallback, useMemo, useState } from "react";
import { INTERNAL_COLUMN_NAMES, useUserAdmin } from "./useUserAdmin";

import "./UserAdmin.css";

const UNDO_DELETE_COLUMN: ColumnDescriptor = {
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

const EditableUsersTable = ({
  dataSource: sourceTableDataSource,
  onSelectionChange,
  schema,
}: {
  dataSource: DataSource;
  onSelectionChange: SelectionChangeHandler;
  schema: TableSchema;
}) => {
  const [editMode, setEditMode] = useState<EditMode>("view");
  const exitEditMode = useCallback(() => setEditMode("view"), []);
  const {
    canCancel,
    canSave,
    dataSource,
    editSession,
    hasSelection,
    onCancel,
    onDelete,
    onSave,
    rowClassNameGenerators,
  } = useEditableTable({
    dataSource: sourceTableDataSource,
    copyOption: "All",
    deleteMode: "soft",
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  const onToggleEditMode = useCallback(
    (event: SyntheticEvent<HTMLButtonElement>) => {
      setEditMode((event.target as HTMLButtonElement).value as EditMode);
    },
    [],
  );

  const isRowSelectable = useCallback(
    (dataRow: DataRow) => dataRow.vuu_action !== "deleteRow",
    [],
  );

  const config = useMemo<TableConfig>(() => {
    const visibleColumns = schema.columns.filter(
      ({ name }) => !INTERNAL_COLUMN_NAMES.has(name),
    );
    return {
      columnLayout: "fit",
      columns:
        editMode === "view"
          ? visibleColumns.map((column) => ({ ...column, editable: false }))
          : visibleColumns
              .map<ColumnDescriptor>((column) => ({
                ...column,
                editable:
                  column.name === schema.key
                    ? false
                    : column.editable !== false,
              }))
              .concat({ hidden: true, name: "vuu_action" }, UNDO_DELETE_COLUMN),
      rowClassNameGenerators,
      rowSeparators: true,
      zebraStripes: true,
    };
  }, [editMode, rowClassNameGenerators, schema]);

  return (
    <>
      <Toolbar className="vuuUserAdmin-toolbar">
        <ToggleButtonGroup onChange={onToggleEditMode} value={editMode}>
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </Toolbar>
      <div className="vuuUserAdmin-tableContainer">
        <DataEditingProvider editSession={editSession}>
          <Table
            config={config}
            customHeader={editMode === "edit" ? InlineAddRow : undefined}
            dataSource={dataSource}
            height="100%"
            isRowSelectable={editMode === "edit" ? isRowSelectable : undefined}
            navigationStyle="row"
            onSelectionChange={
              editMode === "view" ? onSelectionChange : undefined
            }
            renderBufferSize={20}
            rowHeight={21}
            selectionModel={editMode === "edit" ? "checkbox" : "single"}
            width="100%"
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={sourceTableDataSource} />
        ) : (
          <TableFooterTray position="center">
            <EditButtons
              canCancel={canCancel}
              canSave={canSave}
              editSession={editSession}
              hasSelection={hasSelection}
              onCancel={onCancel}
              onDelete={onDelete}
              onSave={onSave}
            />
          </TableFooterTray>
        )}
      </TableFooter>
    </>
  );
};

const UserAdmin = () => {
  const hookResult = useUserAdmin();

  if (!hookResult) {
    return (
      <div className="vuuUserAdmin-loading">
        Loading keycloak admin tables...
      </div>
    );
  }

  const { dataSources, handleUserSelectionChange, schemas } = hookResult;

  return (
    <div className="vuuUserAdmin">
      <EditableUsersTable
        dataSource={dataSources.users}
        onSelectionChange={handleUserSelectionChange}
        schema={schemas.users}
      />
    </div>
  );
};

export default UserAdmin;
