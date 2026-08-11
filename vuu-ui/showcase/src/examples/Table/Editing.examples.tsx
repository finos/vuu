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
  TestTableName,
} from "@vuu-ui/vuu-data-test";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import type { VuuRowDataItemType, VuuTable } from "@vuu-ui/vuu-protocol-types";
import { BulkEditPanel, InputCell, Table } from "@vuu-ui/vuu-table";
import {
  DataSourceStats,
  InlineAddRow,
  TableFooter,
  TableFooterTray,
} from "@vuu-ui/vuu-table-extras";
import {
  DataEditingProvider,
  EditButtons,
  type EditMode,
  useEditableTable,
  useEditSession,
} from "@vuu-ui/vuu-data-editing";
import {
  ColumnDescriptor,
  ColumnTypeRendering,
  DataRow,
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
  DataSourceProvider,
  registerComponent,
  toColumnName,
  useData,
} from "@vuu-ui/vuu-utils";
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
import type { CopyOption, DataSource } from "@vuu-ui/vuu-data-types";
import { LayoutProvider, Stack, View } from "@vuu-ui/vuu-layout";
import { ColumnFilter } from "@vuu-ui/vuu-filters";
import {
  ColumnFilterChangeHandler,
  ColumnFilterCommitHandler,
} from "@vuu-ui/vuu-filter-types";

const INSTRUMENTS = { module: "SIMUL", table: "instruments" };
const schema = getSchema("instruments");

const InstrumentColumns: ColumnDescriptor[] = [
  { name: "bbg", serverDataType: "string", width: 90 },
  { name: "currency", serverDataType: "string", width: 80 },
  { name: "description", serverDataType: "string", width: 150 },
  { name: "exchange", serverDataType: "string", width: 120 },
  { name: "isin", serverDataType: "string", width: 100 },
  { name: "lotSize", serverDataType: "int", width: 80 },
  { name: "ric", serverDataType: "string", width: 75 },
  { name: "vuuCreatedTimestamp", serverDataType: "epochtimestamp", width: 160 },
  { name: "vuuUpdatedTimestamp", serverDataType: "epochtimestamp", width: 160 },
  { name: "vuuMsg", serverDataType: "string", width: 120 },
];

let _viewportId = 1;

const UNDO_DELETE_COLUMN: ColumnDescriptor = {
  name: "undo",
  source: "client",
  width: 80,
  type: {
    name: "string",
    renderer: {
      name: "example.undo-cell",
      componentProps: {
        sessionTableMessageColumn: "vuuMsg",
      },
    },
  }
};

const EditTableTemplate = ({
  editableType,
  filterColumn,
  showInlineAddRow = false,
  testId = "",
  vuuTable,
  ...htmlAttributes
}: Omit<
  HTMLAttributes<HTMLDivElement>,
  "onDragStart" | "onDrop" | "onSelect"
> & {
  editableType?: DataValueTypeDescriptor;
  filterColumn?: string;
  showInlineAddRow?: boolean;
  testId?: string;
  vuuTable: VuuTable;
}) => {
  const [editMode, setEditMode] = useState<EditMode>("view");
  const [filterValue, setFilterValue] = useState("");
  const [keyFilterValue, setKeyFilterValue] = useState("");
  const { VuuDataSource } = useData();

  const columns = useMemo(() => schema.columns.map(toColumnName), []);

  const onToggleEditMode = useCallback(
    async (e: SyntheticEvent<HTMLButtonElement>) => {
      const toggleButton = e.target as HTMLButtonElement;
      const editMode = toggleButton.value as EditMode;
      setEditMode(editMode);
    },
    [],
  );

  const sourceTableDataSource = useMemo(
    () =>
      new VuuDataSource({
        columns,
        sessionTableMessageColumn: "vuuMsg",
        table: schema.table,
        viewport: `vp-${_viewportId++}`,
      }),
    [VuuDataSource, columns],
  );

  const exitEditMode = useCallback(() => {
    setEditMode("view");
  }, []);

  const {
    canCancel,
    canSave,
    dataSource,
    editSession,
    onCancel,
    onSave,
    sourceDataSource,
  } = useEditableTable({
    dataSource: sourceTableDataSource,
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  const handleColumnFilterCommit = useCallback<ColumnFilterCommitHandler>(
    (column, op, value) => {
      if (column.name === "bbg") {
        sourceDataSource.setFilter?.({
          column: column.name,
          op: "starts",
          value,
        });
        setKeyFilterValue(`${value}`);
      } else if (
        op !== "between" &&
        op !== "between-inclusive" &&
        op !== "in"
      ) {
        sourceDataSource.setFilter?.({
          column: column.name,
          op,
          value,
        });
        setFilterValue(`${value}`);
      }
    },
    [sourceDataSource],
  );

  const handleColumnFilterChange = useCallback<ColumnFilterChangeHandler>(
    (value, column, op) => {
      console.log(`${value} ${column.name} ${op}`);
      if (column.name === "bbg") {
        setKeyFilterValue(`${value}`);
      } else {
        setFilterValue(`${value}`);
      }
    },
    [],
  );
  const config = useMemo<TableConfig>(
    () => {

      return {
        columns:
          editMode === "view"
            ? InstrumentColumns
            : InstrumentColumns.map((col) =>
              col.name === "lotSize"
                ? {
                  ...col,
                  editable: true,
                  type: editableType,
                }
                : col.name === "currency"
                  ? {
                    ...col,
                    editable: true,
                    type: {
                      name: "string",
                      renderer: {
                        name: "dropdown-cell",
                        values: [
                          "CAD",
                          "EUR",
                          "GBP",
                          "GBX",
                          "JPY",
                          "SEK",
                          "USD",
                        ],
                      },
                    } as DataValueTypeDescriptor,
                  }
                  : col.name === "isin"
                    ? {
                      ...col,
                      editable: { insert: true, update: false },
                    }
                    : col.name === "vuuCreatedTimestamp" ||
                      col.name === "vuuUpdatedTimestamp" ||
                      col.name === "vuuMsg"
                      ? col
                      : { ...col, editable: true },
            ).concat({
              hidden: showInlineAddRow,
              name: "setToDelete",
            } as ColumnDescriptor),
        columnDefaultWidth: 150,
        rowSeparators: true,
        zebraStripes: true,
      };
    },
    [editMode, editableType, showInlineAddRow],
  );

  return (
    <div
      data-testid={`edit-table${testId}`}
      style={{
        display: "flex",
        flexDirection: "column",
        height: 285,
      }}
    >
      <div
        style={{
          alignItems: "center",
          background: "var(--salt-container-secondary-background)",
          display: "flex",
          flex: "0 0 32px",
          gap: 12,
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
        <ColumnFilter
          TypeaheadProps={{ minCharacterCountToTriggerSuggestions: 0 }}
          column={{ name: "bbg", serverDataType: "string" }}
          onColumnFilterChange={handleColumnFilterChange}
          onCommit={handleColumnFilterCommit}
          table={schema.table}
          value={keyFilterValue}
        />
        {filterColumn ? (
          <DataSourceProvider dataSource={sourceDataSource}>
            <ColumnFilter
              TypeaheadProps={{ minCharacterCountToTriggerSuggestions: 0 }}
              column={{ name: "currency", serverDataType: "string" }}
              onColumnFilterChange={handleColumnFilterChange}
              onCommit={handleColumnFilterCommit}
              table={schema.table}
              value={filterValue}
            />
          </DataSourceProvider>
        ) : null}
      </div>
      <div style={{ flex: "1 1 auto" }}>
        <DataEditingProvider editSession={editSession}>
          <Table
            {...htmlAttributes}
            config={config}
            data-viewport={dataSource.viewport}
            data-testid={`table${testId}`}
            dataSource={dataSource}
            customHeader={
              editMode === "edit" && showInlineAddRow ? InlineAddRow : undefined
            }
            renderBufferSize={10}
            selectionModel="none"
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={sourceDataSource} />
        ) : (
          <TableFooterTray position="center">
            <EditButtons
              canCancel={canCancel}
              canSave={canSave}
              editSession={editSession}
              onCancel={onCancel}
              onSave={onSave}
            />
          </TableFooterTray>
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
    </>
  );
};

/** tags=data-consumer */
export const EditableInstrumentsWithInlineAddRow = () => (
  <EditTableTemplate
    showInlineAddRow
    testId="-inline-add-row"
    vuuTable={INSTRUMENTS}
  />
);

const EditableInstrumentsTemplate = ({
  copyOption,
  showInlineAddRow = false,
}: {
  copyOption?: CopyOption;
  showInlineAddRow?: boolean;
}) => {
  const [editMode, setEditMode] = useState<EditMode>("view");
  const { VuuDataSource } = useData();

  const columns = useMemo(() => schema.columns.map(toColumnName), []);

  const sourceTableDataSource = useMemo(
    () =>
      new VuuDataSource({
        columns,
        table: schema.table,
        viewport: `vp-${_viewportId++}`,
      }),
    [VuuDataSource, columns],
  );

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
    sourceDataSource,
  } = useEditableTable({
    dataSource: sourceTableDataSource,
    copyOption,
    deleteMode: "soft",
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  const onToggleEditMode = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      setEditMode((e.target as HTMLButtonElement).value as EditMode);
    },
    [],
  );

  const isRowSelectable = useCallback(
    (dataRow: DataRow) => dataRow.setToDelete !== true,
    [],
  );

  const config = useMemo<TableConfig>(
    () => {

      return {
        columns:
          editMode === "view"
            ? InstrumentColumns
            :
            InstrumentColumns.map((col) =>
              col.name === "isin" ||
                col.name === "vuuCreatedTimestamp" ||
                col.name === "vuuUpdatedTimestamp" ||
                col.name === "vuuMsg"
                ? col
                : { ...col, editable: true },
            ).concat(
              {
                name: 'setToDelete',
                hidden: true,
              },
              UNDO_DELETE_COLUMN),

        columnDefaultWidth: 150,
        rowSeparators: true,
        zebraStripes: true,
      };
    },
    [editMode],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 320 }}>
      <div
        style={{
          alignItems: "center",
          background: "var(--salt-container-secondary-background)",
          display: "flex",
          flex: "0 0 32px",
          gap: 12,
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
            data-viewport={dataSource.viewport}
            dataSource={dataSource}
            customHeader={
              editMode === "edit" && showInlineAddRow ? InlineAddRow : undefined
            }
            renderBufferSize={10}
            isRowSelectable={editMode === "edit" ? isRowSelectable : undefined}
            selectionModel={editMode === "edit" ? "checkbox" : "none"}
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={sourceDataSource} />
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
              saveLabel="Submit"
            />
          </TableFooterTray>
        )}
      </TableFooter>
    </div>
  );
};

/** tags=data-consumer */
export const EditableInstrumentsInlineEdit = () => (
  <LocalDataSourceProvider>
    <NotificationsProvider>
      <EditableInstrumentsTemplate copyOption="All" />
    </NotificationsProvider>
  </LocalDataSourceProvider>
);

/** tags=data-consumer */
export const CreateSessionTableInstruments = () => (
  <LocalDataSourceProvider>
    <NotificationsProvider>
      <EditableInstrumentsTemplate copyOption="All" />
    </NotificationsProvider>
  </LocalDataSourceProvider>
);

/** tags=data-consumer */
export const InstrumentsAddEditDelete = () => (
  <LocalDataSourceProvider>
    <NotificationsProvider>
      <EditableInstrumentsTemplate copyOption="All" showInlineAddRow />
    </NotificationsProvider>
  </LocalDataSourceProvider>
);

const EditableTestTableTemplate = ({
  tableName,
}: {
  tableName: TestTableName;
}) => {
  const [editMode, setEditMode] = useState<EditMode>("view");
  const { VuuDataSource } = useData();
  const tableSchema = getSchema(tableName);
  const columns = useMemo(
    () => tableSchema.columns.map(toColumnName),
    [tableSchema.columns],
  );

  const sourceTableDataSource = useMemo(
    () =>
      new VuuDataSource({
        columns,
        table: tableSchema.table,
        viewport: `vp-${_viewportId++}`,
      }),
    [VuuDataSource, columns, tableSchema.table],
  );

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
    sourceDataSource,
  } = useEditableTable({
    dataSource: sourceTableDataSource,
    copyOption: "All",
    deleteMode: "soft",
    isEditMode: editMode === "edit",
    onCancel: exitEditMode,
    onSave: exitEditMode,
  });

  const onToggleEditMode = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      setEditMode((e.target as HTMLButtonElement).value as EditMode);
    },
    [],
  );

  const isRowSelectable = useCallback(
    (dataRow: DataRow) => dataRow.setToDelete !== true,
    [],
  );

  const config = useMemo<TableConfig>(
    () => ({
      columns:
        editMode === "view"
          ? tableSchema.columns
          :
          tableSchema.columns.map<ColumnDescriptor>((column) => ({
            ...column,
            editable: true,
          })).concat({ hidden: true, name: "setToDelete" }, UNDO_DELETE_COLUMN),
      columnDefaultWidth: 150,
      rowSeparators: true,
      zebraStripes: true,
    }),
    [editMode, tableSchema.columns],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 320 }}>
      <div
        style={{
          alignItems: "center",
          background: "var(--salt-container-secondary-background)",
          display: "flex",
          flex: "0 0 32px",
          gap: 12,
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
            data-viewport={dataSource.viewport}
            dataSource={dataSource}
            customHeader={editMode === "edit" ? InlineAddRow : undefined}
            isRowSelectable={editMode === "edit" ? isRowSelectable : undefined}
            renderBufferSize={10}
            selectionModel={editMode === "edit" ? "checkbox" : "none"}
          />
        </DataEditingProvider>
      </div>
      <TableFooter>
        {editMode === "view" ? (
          <DataSourceStats dataSource={sourceDataSource} />
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
              saveLabel="Submit"
            />
          </TableFooterTray>
        )}
      </TableFooter>
    </div>
  );
};

/** tags=data-consumer */
export const TestTableEmpty = () => (
  <LocalDataSourceProvider>
    <NotificationsProvider>
      <EditableTestTableTemplate tableName="TestEditEmpty" />
    </NotificationsProvider>
  </LocalDataSourceProvider>
);

/** tags=data-consumer */
export const TestTableFIveRows = () => (
  <LocalDataSourceProvider>
    <NotificationsProvider>
      <EditableTestTableTemplate tableName="TestEdit" />
    </NotificationsProvider>
  </LocalDataSourceProvider>
);

/** tags=data-consumer */
export const TwoEditableInstruments = () => {
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

const UndoCellRenderer = ({ column, dataRow }: TableCellRendererProps) => {
  const editSession = useEditSession();
  const renderer = (column.type as DataValueTypeDescriptor)?.renderer as ColumnTypeRendering;
  const sessionTableMessageColumn =
    (renderer?.componentProps?.sessionTableMessageColumn as string) ?? "vuuMsg";

  // For cell edits: #rowEdits is populated synchronously so hasRowChanges works immediately.
  // For soft-deleted rows: #deletedRows is populated after the RPC await, so we read
  // the sessionTableMessageColumn directly from the row data — it is always present
  // when the row re-renders.
  const isRowChanged =
    editSession?.hasRowChanges(dataRow.key) || dataRow.setToDelete === true || dataRow[sessionTableMessageColumn] === "SOFT_DELETED";

  if (!isRowChanged) return null;
  return (
    <Button
      appearance="transparent"
      onClick={() => editSession?.undoRowChange(dataRow.key)}
      style={{ height: "100%", width: "100%" }}
    >
      Undo
    </Button>
  );
};
registerComponent("example.undo-cell", UndoCellRenderer, "cell-renderer");

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
    copyOption: CopyOption;
  }>({ editing: false, copyOption: "Selected" });

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
    setEditState({ editing: false, copyOption: "Selected" });
  }, [closeDialog]);

  const exitEditMode = useCallback(() => clearEditState(), [clearEditState]);

  const {
    editSession,
    onCancel,
    onSave,
    sessionDataSource,
    sourceDataSource,
  } =
    useEditableTable({
      dataSource: sourceTableDataSource,
      copyOption: editState.copyOption,
      isEditMode: editState.editing,
      onCancel: exitEditMode,
      onSave: exitEditMode,
    });

  const editSelectedRow = useCallback(() => {
    console.log("edit selected row");
  }, []);

  const editSelectedRows = useCallback(async () => {
    setEditState({ editing: true, copyOption: "Selected" });
  }, []);

  const insertRows = useCallback(async () => {
    setEditState({ editing: true, copyOption: "Empty" });
  }, []);

  const handleSave = useCallback(() => {
    onSave();
  }, [onSave]);

  useMemo(() => {
    if (sessionDataSource) {
      showDialog(
        <DataEditingProvider editSession={editSession}>
          <BulkEditPanel
            parentDs={sourceDataSource}
            sessionDs={sessionDataSource}
          />
        </DataEditingProvider>,
        "Edit rows",
        [
          <Button key="cancel" onClick={onCancel}>
            Cancel
          </Button>,
          <Button key="save" onClick={handleSave}>
            Save
          </Button>,
        ],
      );
    } else {
      closeDialog();
    }
  }, [
    closeDialog,
    editSession,
    handleSave,
    onCancel,
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
        dataSource={sourceDataSource}
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
          width: 1040,
        }}
      >
        <View title="Editable Instruments">
          <EditTableTemplate vuuTable={INSTRUMENTS} />
          <EditTableTemplate vuuTable={INSTRUMENTS} />
        </View>
        <View title="Editable Instruments">
          <EditTableTemplate vuuTable={INSTRUMENTS} filterColumn="currency" />
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

const CURRENCY_CODES = ["USD", "GBP", "EUR", "JPY", "HKD"];
const EXCHANGE_CODES = ["XNAS", "XLON", "XNYS", "XHKG", "XPAR"];
const TICKER_SYMBOLS = [
  "AAPL",
  "MSFT",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "NVDA",
  "NFLX",
  "ORCL",
  "IBM",
  "INTC",
  "AMD",
  "QCOM",
  "TXN",
  "AVGO",
];

const pickRandomValue = <T,>(values: T[]): T =>
  values[Math.floor(Math.random() * values.length)];

const createRandomInstrumentRow = (): Record<string, VuuRowDataItemType> => {
  const ticker = pickRandomValue(TICKER_SYMBOLS);
  const currency = pickRandomValue(CURRENCY_CODES);
  const exchange = pickRandomValue(EXCHANGE_CODES);
  return {
    ric: `${ticker}.${exchange.slice(1, 3)}`,
    bbg: `${ticker} ${currency} Equity`,
    currency,
    description: `${ticker} Inc`,
    exchange,
    isin: `US${Math.random().toString(36).slice(2, 12).toUpperCase()}`,
    lotSize: Math.floor(Math.random() * 1000) + 1,
  };
};

const addRowsSessionTableConfig: TableConfig = {
  columns: schema.columns,
  columnDefaultWidth: 120,
  rowSeparators: true,
  zebraStripes: true,
};

const AddRowPanel = ({
  addRowDataSource,
  editSessionDataSource,
}: {
  addRowDataSource: DataSource;
  editSessionDataSource: DataSource;
}) => {
  const [insertErrorMessage, setInsertErrorMessage] = useState<
    string | undefined
  >();

  const handleInsertRandomRows = useCallback(async () => {
    setInsertErrorMessage(undefined);
    for (let rowIndex = 0; rowIndex < 10; rowIndex++) {
      const rowData = createRandomInstrumentRow();
      const rpcResult = await addRowDataSource.rpcRequest?.({
        type: "RPC_REQUEST",
        rpcName: "addRow",
        params: {
          rowData,
        } as unknown as Record<string, VuuRowDataItemType>,
      });
      if (rpcResult?.type === "ERROR_RESULT") {
        setInsertErrorMessage(rpcResult.errorMessage);
        break;
      }
    }
  }, [addRowDataSource]);

  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: "var(--salt-spacing-100)",
        height: "100%",
        minHeight: 0,
        overflow: "auto",
        padding: "var(--salt-spacing-200)",
        width: "100%",
      }}
    >
      <div style={{ flex: "0 0 340px", minHeight: 0, overflow: "hidden" }}>
        <Table
          config={addRowsSessionTableConfig}
          dataSource={editSessionDataSource}
          renderBufferSize={5}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
      {insertErrorMessage && (
        <div style={{ color: "var(--salt-status-error-foreground)" }}>
          {insertErrorMessage}
        </div>
      )}
      <div
        style={{
          display: "flex",
          flex: "0 0 auto",
          gap: "var(--salt-spacing-100)",
        }}
      >
        <Button
          appearance="solid"
          sentiment="accented"
          onClick={handleInsertRandomRows}
        >
          Insert 10 Random Rows
        </Button>
      </div>
    </div>
  );
};

const AddRowTableTemplate = () => {
  const { VuuDataSource } = useData();

  const instrumentsDataSource = useMemo(
    () =>
      new VuuDataSource({
        columns: schema.columns.map(toColumnName),
        table: INSTRUMENTS,
      }),
    [VuuDataSource],
  );

  const keepEditSessionOpen = useCallback(() => {
    // Add Rows example keeps an active empty-session-table for inline usage.
  }, []);

  const {
    dataSource: addRowDataSource,
    sessionDataSource: editSessionDataSource,
  } = useEditableTable({
    dataSource: instrumentsDataSource,
    copyOption: "Empty",
    isEditMode: true,
    onCancel: keepEditSessionOpen,
    onSave: keepEditSessionOpen,
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 560,
        width: 1100,
      }}
    >
      <div style={{ flex: "1 1 auto", minHeight: 0 }}>
        {editSessionDataSource ? (
          <AddRowPanel
            addRowDataSource={addRowDataSource}
            editSessionDataSource={editSessionDataSource}
          />
        ) : (
          <div
            style={{
              alignItems: "center",
              border: "1px solid var(--salt-container-secondary-borderColor)",
              display: "flex",
              height: "100%",
              justifyContent: "center",
            }}
          >
            Preparing add rows session...
          </div>
        )}
      </div>
    </div>
  );
};

/** tags=data-consumer */
export const AddRowsToSessionTable = () => {
  return (
    <ModalProvider>
      <LocalDataSourceProvider>
        <NotificationsProvider>
          <AddRowTableTemplate />
        </NotificationsProvider>
      </LocalDataSourceProvider>
    </ModalProvider>
  );
};
