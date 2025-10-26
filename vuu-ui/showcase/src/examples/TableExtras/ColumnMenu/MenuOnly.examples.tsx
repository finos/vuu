import {
  ColumnMenu,
  ColumnSettingsPanel,
  TableProvider,
  useColumnActions,
  useTableAndColumnSettings,
} from "@vuu-ui/vuu-table-extras";
import { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { registerComponent, toColumnName, useData } from "@vuu-ui/vuu-utils";
import { useCallback, useMemo } from "react";
import { getSchema } from "@vuu-ui/vuu-data-test";
import { MenuActionHandler } from "@vuu-ui/vuu-context-menu";
import { ContextPanelProvider } from "@vuu-ui/vuu-ui-controls";
import { FlexboxLayout, LayoutProvider } from "@vuu-ui/vuu-layout";
import { ContextPanel } from "@vuu-ui/vuu-shell";

registerComponent("ColumnSettings", ColumnSettingsPanel, "view");

const tableSchema = getSchema("instruments");

/** tags=data-consumer */
export const CustomColumnMenuHandler = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource]);

  const column: RuntimeColumnDescriptor = useMemo(
    () => ({
      ariaColIndex: 1,
      label: "Currency",
      name: "ccy",
      valueFormatter: String,
      width: 120,
    }),
    [],
  );

  const menuActionHandler = useCallback<MenuActionHandler>((menuItemId) => {
    console.log(`menuActionHandler ${menuItemId}`);
    return true;
  }, []);

  return (
    <div style={{ padding: 12 }}>
      <TableProvider
        dataSource={dataSource}
        menuActionHandler={menuActionHandler}
      >
        <ColumnMenu column={column} />
      </TableProvider>
    </div>
  );
};

/** tags=data-consumer */
export const DefaultColumnMenuHandlers = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource]);

  const column: RuntimeColumnDescriptor = useMemo(
    () => ({
      ariaColIndex: 1,
      label: "Currency",
      name: "ccy",
      valueFormatter: String,
      width: 120,
    }),
    [],
  );

  const menuActionHandler = useColumnActions({
    // this is the dataSource that actually gets used, not the one from TableProvider
    dataSource,
    onDisplaySettingsAction: () => {
      console.log("display settings");
    },
    onColumnDisplayAction: () => {
      console.log("column display");
    },
  });

  return (
    <div style={{ padding: 12 }}>
      <TableProvider
        dataSource={dataSource}
        menuActionHandler={menuActionHandler}
      >
        <ColumnMenu column={column} />
      </TableProvider>
    </div>
  );
};

const WithSettingsHookTemplate = () => {
  const { VuuDataSource } = useData();

  const dataSource = useMemo(() => {
    return new VuuDataSource({
      columns: tableSchema.columns.map(toColumnName),
      table: tableSchema.table,
    });
  }, [VuuDataSource]);

  const column: RuntimeColumnDescriptor = useMemo(
    () => ({
      ariaColIndex: 1,
      label: "Currency",
      name: "ccy",
      valueFormatter: String,
      width: 120,
    }),
    [],
  );

  const { showColumnSettingsPanel, showTableSettingsPanel } =
    useTableAndColumnSettings({
      availableColumns: [
        { name: "ccy", serverDataType: "string" },
        { name: "exchange", serverDataType: "string" },
      ],
      onConfigChange: () => console.log("onConfig changed"),
      onCreateCalculatedColumn: () => console.log("create calculated column"),
      onDataSourceConfigChange: () =>
        console.log("on datasourcxe config change"),
      tableConfig: {
        columns: [
          { name: "ccy", serverDataType: "string" },
          { name: "exchange", serverDataType: "string" },
        ],
      },
    });

  const menuActionHandler = useColumnActions({
    // this is the dataSource that actually gets used, not the one from TableProvider
    dataSource,
    onDisplaySettingsAction: (action) => {
      if (action.type === "column-settings") {
        showColumnSettingsPanel(action);
      } else {
        showTableSettingsPanel();
      }
    },
    onColumnDisplayAction: (action) => {
      console.log(`column display ${action.type}`);
    },
  });

  return (
    <TableProvider
      dataSource={dataSource}
      menuActionHandler={menuActionHandler}
    >
      <ColumnMenu column={column} />
    </TableProvider>
  );
};

export const SettingsHookDefaultsToDialog = () => (
  <ContextPanelProvider>
    <WithSettingsHookTemplate />
  </ContextPanelProvider>
);

export const SettingsHookWithContextPanel = () => (
  <LayoutProvider>
    <FlexboxLayout style={{ width: "100vw", height: "100vh" }}>
      <div style={{ height: "100%", width: "100%" }}>
        <ContextPanelProvider>
          <WithSettingsHookTemplate />
        </ContextPanelProvider>
      </div>
      <ContextPanel id="context-panel" />
    </FlexboxLayout>
  </LayoutProvider>
);
