import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import {
  ContextMenuItemDescriptor,
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import {
  getSchema,
  LocalDataSourceProvider,
  SimulTableName,
} from "@vuu-ui/vuu-data-test";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { BulkEditPanel, InputCell, Table } from "@vuu-ui/vuu-table";
import { DataSourceStats, TableFooter } from "@vuu-ui/vuu-table-extras";
import {
  DataValueTypeDescriptor,
  TableCellEditHandler,
  TableCellRendererProps,
  TableConfig,
  TableContextMenuDef,
  TableContextMenuOptions,
  TableMenuLocation,
} from "@vuu-ui/vuu-table-types";
import { ModalProvider, useModal } from "@vuu-ui/vuu-ui-controls";
import {
  DataEditingProvider,
  registerComponent,
  toColumnName,
  useData,
  useEditableTable,
} from "@vuu-ui/vuu-utils";
import { EditButtons } from "@vuu-ui/vuu-utils/src/data-editing/EditButtons";
import { EditMode } from "@vuu-ui/vuu-utils/src/data-editing/useEditableTable";
import cx from "clsx";
import {
  HTMLAttributes,
  ReactElement,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { SimulTable } from "./SimulTableTemplate";
import { EditSessionMode } from "@vuu-ui/vuu-data-types";
import { LayoutProvider, Stack, View } from "@vuu-ui/vuu-layout";

const INSTRUMENTS = { module: "SIMUL", table: "instruments" };
const schema = getSchema("instruments");

const EditTableTemplate = ({
  editableType,
  testId = "",
  vuuTable,
  ...htmlAttributes
}: Omit<
  HTMLAttributes<HTMLDivElement>,
  "onDragStart" | "onDrop" | "onSelect"
> & {
  editableType?: DataValueTypeDescriptor;
  testId?: string;
  vuuTable: VuuTable;
}) => {
  const [editMode, setEditMode] = useState<EditMode>("view");

  const columns = useMemo(() => schema.columns.map(toColumnName), []);

  const onToggleEditMode = useCallback(
    async (e: SyntheticEvent<HTMLButtonElement>) => {
      const toggleButton = e.target as HTMLButtonElement;
      const editMode = toggleButton.value as EditMode;
      setEditMode(editMode);
    },
    [],
  );

  const exitEditMode = useCallback(() => {
    setEditMode("view");
  }, []);

  const { dataSource, editSession, onCancel, onSave } = useEditableTable({
    columns,
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
    table: vuuTable,
  });

  const config = useMemo<TableConfig>(
    () => ({
      columns:
        editMode === "view"
          ? schema.columns
          : schema.columns.map((col) =>
              col.name === "lotSize"
                ? {
                    ...col,
                    editable: true,
                    type: editableType,
                  }
                : { ...col, editable: true },
            ),
      columnDefaultWidth: 150,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [editMode, editableType],
  );

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: 1500,
        height: 285,
      }}
    >
      <div
        style={{
          alignItems: "center",
          display: "flex",
          background: "var(--salt-container-secondary-background)",
          flex: "0 0 32px",
          padding: "0 var(--salt-spacing-100)",
        }}
      >
        <ToggleButtonGroup onChange={onToggleEditMode} value={editMode}>
          <ToggleButton data-testid={`toggle-view${testId}`} value="view">
            View
          </ToggleButton>
          <ToggleButton data-testid={`toggle-edit${testId}`} value="edit">
            Edit
          </ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <DataEditingProvider editSession={editSession}>
          <Table
            {...htmlAttributes}
            config={config}
            data-testid={`table${testId}`}
            dataSource={dataSource}
            renderBufferSize={10}
            selectionModel="none"
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={dataSource} />
        ) : (
          <EditButtons
            editSession={editSession}
            onCancel={onCancel}
            onSave={onSave}
          />
        )}
      </TableFooter>
    </div>
  );
};

/** tags=data-consumer */
export const EditableInstruments = () => {
  return (
    <>
      <EditTableTemplate testId="-1" vuuTable={INSTRUMENTS} />
      <EditTableTemplate testId="-2" vuuTable={INSTRUMENTS} />
    </>
  );
};

const CustomCell = ({
  className: classNameProp,
  column,
  dataRow,
  onEdit,
}: TableCellRendererProps) => {
  const classBase = "CustomCell";
  const [directionOfChange, setDirectionOfChange] = useState<
    "up" | "down" | ""
  >("");
  const { name, valueFormatter } = column;
  const value = valueFormatter(dataRow[name]);

  const handleEdit = useCallback<TableCellEditHandler>(
    (editState, editPhase) => {
      if (editPhase === "commit") {
        const { previousValue, value } = editState;
        console.log(
          `committed from ${previousValue} (${typeof previousValue}) to ${value} (${typeof value})`,
        );

        if (typeof previousValue === "number" && typeof value === "number") {
          const direction =
            value > previousValue ? "up" : value < previousValue ? "down" : "";
          console.log(`direction = ${direction}`);
          setDirectionOfChange(direction);
        }
      }

      return onEdit?.(editState, editPhase);
    },
    [onEdit],
  );

  return (
    <div
      className={cx(classBase, classNameProp, {
        [`${classBase}-up`]: directionOfChange === "up",
        [`${classBase}-down`]: directionOfChange === "down",
      })}
      style={{
        alignItems: "center",
        display: "flex",
        height: "100%",
        width: "100%",
      }}
    >
      {column.editable ? (
        <InputCell column={column} dataRow={dataRow} onEdit={handleEdit} />
      ) : (
        <span>{value}</span>
      )}
    </div>
  );
};

registerComponent("example.color-coded-editor", CustomCell, "cell-renderer");

export const EditableInstrumentsCustomCellRenderer = () => {
  const editableType = useMemo<DataValueTypeDescriptor>(
    () => ({
      name: "number",
      renderer: { name: "example.color-coded-editor" },
    }),
    [],
  );

  return (
    <LocalDataSourceProvider>
      <NotificationsProvider>
        <style>{`
        .CustomCell-up {
          --vuuTableInputCell-edited-color: green;
        }
        .CustomCell-down {
          --vuuTableInputCell-edited-color: red;
        }
      
      `}</style>
        <EditTableTemplate editableType={editableType} vuuTable={INSTRUMENTS} />
        <EditTableTemplate vuuTable={INSTRUMENTS} />
      </NotificationsProvider>
    </LocalDataSourceProvider>
  );
};

const useEditContextMenu = ({
  editSelectedRow,
  editSelectedRows,
  insertRows,
}: {
  editSelectedRow: () => void;
  editSelectedRows: () => void;
  insertRows: () => void;
}): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback((_location, options) => {
      const menuOptions: ContextMenuItemDescriptor[] = [];
      if (options.selectedRows.length === 1) {
        menuOptions.push({
          id: "edit-row",
          label: "Edit row (local)",
          options,
        });
      } else if (options.selectedRows.length > 1) {
        menuOptions.push({
          id: "edit-rows",
          label: "Edit rows (local)",
          options,
        });
      }
      menuOptions.push({
        id: "insert-rows",
        label: "Insert rows (local)",
        options,
      });

      return menuOptions;
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >(
    (menuItemId, options) => {
      if (options) {
        switch (menuItemId) {
          case "edit-row": {
            editSelectedRow();
            return true;
          }
          case "edit-rows": {
            editSelectedRows();
            return true;
          }
          case "insert-rows": {
            insertRows();
            return true;
          }

          default:
            return false;
        }
      } else {
        return false;
      }
    },
    [editSelectedRow, editSelectedRows, insertRows],
  );

  return {
    menuBuilder,
    menuActionHandler,
  };
};

const BulkEditTableTemplate = ({
  vuuTable = INSTRUMENTS,
}: {
  vuuTable?: VuuTable;
}) => {
  const { closeDialog, showDialog } = useModal();
  const { VuuDataSource } = useData();

  const [editState, setEditState] = useState<{
    editing: boolean;
    dialog?: ReactElement;
    editSessionMode: EditSessionMode;
  }>({ editing: false, editSessionMode: "selected-rows" });

  const sourceTableDataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: schema.table,
      }),
    [VuuDataSource],
  );

  const clearEditState = useCallback(() => {
    closeDialog();
    setEditState({ editing: false, editSessionMode: "selected-rows" });
  }, [closeDialog]);

  const exitEditMode = useCallback(() => clearEditState(), [clearEditState]);

  const { dataSource, editSession, onCancel, onSave, sessionDataSource } =
    useEditableTable({
      dataSource: sourceTableDataSource,
      editSessionMode: editState.editSessionMode,
      isEditMode: editState.editing,
      onCancel: exitEditMode,
      onSave: exitEditMode,
    });

  const editSelectedRow = useCallback(() => {
    console.log("edit selected row");
  }, []);

  const editSelectedRows = useCallback(async () => {
    setEditState({ editing: true, editSessionMode: "selected-rows" });
  }, []);

  const insertRows = useCallback(async () => {
    setEditState({ editing: true, editSessionMode: "empty-session-table" });
  }, []);

  useMemo(() => {
    if (sessionDataSource) {
      showDialog(
        <DataEditingProvider editSession={editSession}>
          <BulkEditPanel parentDs={dataSource} sessionDs={sessionDataSource} />
        </DataEditingProvider>,
        "Edit rows",
        [
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="save" onClick={onSave}>
            Save
          </Button>,
        ],
      );
    } else {
      closeDialog();
    }
  }, [
    closeDialog,
    dataSource,
    editSession,
    onCancel,
    onSave,
    sessionDataSource,
    showDialog,
  ]);

  const contextMenuProps = useEditContextMenu({
    editSelectedRow,
    editSelectedRows,
    insertRows,
  });

  return (
    <ContextMenuProvider {...contextMenuProps}>
      <SimulTable
        dataSource={dataSource}
        tableName={vuuTable.table as SimulTableName}
      />
    </ContextMenuProvider>
  );
};

/** tags=data-consumer */
export const BulkEditTable = () => {
  return (
    <ModalProvider>
      <BulkEditTableTemplate />
    </ModalProvider>
  );
};

const WithTabbedTablesTemplate = () => {
  const [active, setActive] = useState(0);

  return (
    <LayoutProvider>
      <Stack
        active={active}
        onTabSelectionChanged={setActive}
        style={{
          border: "solid 1px var(--salt-container-secondary-borderColor)",
          height: 800,
          margin: 10,
          width: 600,
        }}
      >
        <View title="Editable Instruments">
          <EditTableTemplate vuuTable={INSTRUMENTS} />
          <EditTableTemplate vuuTable={INSTRUMENTS} />
        </View>
        <View title="Editable Instruments">
          <EditTableTemplate vuuTable={INSTRUMENTS} />
        </View>
        <View title="Editable Instruments (selected only)">
          <BulkEditTableTemplate vuuTable={INSTRUMENTS} />
        </View>
      </Stack>
    </LayoutProvider>
  );
};

/** tags=data-consumer */
export const WithTabbedTables = () => {
  return (
    <ModalProvider>
      <WithTabbedTablesTemplate />
    </ModalProvider>
  );
};
