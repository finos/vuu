import { ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import {
  ContextMenuProvider,
  MenuActionHandler,
  MenuBuilder,
} from "@vuu-ui/vuu-context-menu";
import { useVuuMenuActions } from "@vuu-ui/vuu-data-react";
import { getSchema, LocalDataSourceProvider } from "@vuu-ui/vuu-data-test";
import { DataSource } from "@vuu-ui/vuu-data-types";
import type {
  SelectRowRangeRequest,
  VuuTable,
} from "@vuu-ui/vuu-protocol-types";
import { BulkEditPanel, InputCell, Table, TableProps } from "@vuu-ui/vuu-table";
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
import {
  applyDefaultColumnConfig,
  DataEditingProvider,
  DataSourceProvider,
  isRpcSuccess,
  registerComponent,
  toColumnName,
  useData,
  useEditableTable,
} from "@vuu-ui/vuu-utils";
import { EditButtons } from "@vuu-ui/vuu-utils/src/data-editing/EditButtons";
import { EditMode } from "@vuu-ui/vuu-utils/src/data-editing/useEditableTable";
import cx from "clsx";
import {
  ReactElement,
  SyntheticEvent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { DemoTableContainer } from "./DemoTableContainer";
import { ModalProvider } from "@vuu-ui/vuu-ui-controls";
import { getDefaultColumnConfig } from "./columnMetaData";
import { SimulTable } from "./SimulTableTemplate";

const INSTRUMENTS = { module: "SIMUL", table: "instruments" };
const schema = getSchema("instruments");

const EditTableTemplate = ({
  editableType,
  vuuTable,
}: {
  editableType?: DataValueTypeDescriptor;
  vuuTable: VuuTable;
}) => {
  const [editMode, setEditMode] = useState<EditMode>("view");

  const columns = useMemo(() => schema.columns.map(toColumnName), [schema]);

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
          <ToggleButton value="view">View</ToggleButton>
          <ToggleButton value="edit">Edit</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <DataEditingProvider editSession={editSession}>
          <Table
            config={config}
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
      <EditTableTemplate vuuTable={INSTRUMENTS} />
      <EditTableTemplate vuuTable={INSTRUMENTS} />
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
    </LocalDataSourceProvider>
  );
};

const useEditContextMenu = ({
  editSelectedRow,
  editSelectedRows,
}): TableContextMenuDef => {
  const menuBuilder: MenuBuilder<TableMenuLocation, TableContextMenuOptions> =
    useCallback((_location, options) => {
      if (options.selectedRows.length === 1) {
        return [{ id: "edit-row", label: "Edit row (local)", options }];
      } else if (options.selectedRows.length > 1) {
        return [{ id: "edit-rows", label: "Edit rows (local)", options }];
      } else {
        return [];
      }
    }, []);

  const menuActionHandler = useCallback<
    MenuActionHandler<string, TableContextMenuOptions>
  >((menuItemId, options) => {
    if (options) {
      const { column, dataRow } = options;
      switch (menuItemId) {
        case "edit-row": {
          editSelectedRow();
          return true;
        }
        case "edit-rows": {
          editSelectedRows();
          return true;
        }

        default:
          return false;
      }
    } else {
      return false;
    }
  }, []);

  return {
    menuBuilder,
    menuActionHandler,
  };
};

/** tags=data-consumer */
export const BulkEditTable = () => {
  const editSelectedRow = useCallback(() => {
    console.log("edit selected row");
  }, []);

  const editSelectedRows = useCallback(() => {
    console.log("edit selected rows");
  }, []);

  const contextMenuProps = useEditContextMenu({
    editSelectedRow,
    editSelectedRows,
  });

  return (
    <ModalProvider>
      <ContextMenuProvider {...contextMenuProps}>
        <SimulTable tableName="instruments" />
      </ContextMenuProvider>
    </ModalProvider>
  );
};
