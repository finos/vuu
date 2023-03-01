import { ArrayDataSource, DataSource, DataSourceConfig } from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import {
  DatagridSettingsPanel,
  DataSourceStats,
} from "@finos/vuu-datagrid-extras";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { DataTable, TableProps } from "@finos/vuu-datatable";
import { FilterInput } from "@finos/vuu-filters";
import { Flexbox, useViewContext, View } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import { itemsChanged, toDataSourceColumns } from "@finos/vuu-utils";

import { DragVisualizer } from "@finos/vuu-datatable/src/DragVisualizer";
import { Filter } from "@finos/vuu-filter-types";
import { useFilterSuggestionProvider } from "@finos/vuu-filters";
import {
  VuuGroupBy,
  VuuRowDataItemType,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
  Toolbar,
  Tooltray,
} from "@heswell/salt-lab";
import { Button } from "@salt-ds/core";
import {
  CSSProperties,
  ReactElement,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils";

let displaySequence = 1;

const NO_CONFIG = {} as const;
const useTableConfig = ({
  columnConfig = NO_CONFIG,
  count = 1000,
  leftPinnedColumns = [],
  rightPinnedColumns = [],
  renderBufferSize = 0,
}: {
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> };
  count?: number;
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  renderBufferSize?: number;
} = {}) => {
  return useMemo(() => {
    const data: VuuRowDataItemType[][] = [];
    for (let i = 0; i < count; i++) {
      // prettier-ignore
      data.push([
    `row ${i + 1}`, `#${i+1}  value 1`, "value 2", "value 3", "value 4", "value 5", "value 6", "value 7",  "value 8", "value 9", "value 10" 
  ] );
    }
    const columns: ColumnDescriptor[] = [
      { name: "row number", width: 150 },
      { name: "column 1", width: 120 },
      { name: "column 2", width: 120 },
      { name: "column 3", width: 120 },
      { name: "column 4", width: 120 },
      { name: "column 5", width: 120 },
      { name: "column 6", width: 120 },
      { name: "column 7", width: 120 },
      { name: "column 8", width: 120 },
      { name: "column 9", width: 120 },
      { name: "column 10", width: 120 },
    ].map((col) => ({
      ...col,
      ...columnConfig[col.name],
    }));

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data,
    });

    return { config: { columns }, dataSource, renderBufferSize };
  }, [
    columnConfig,
    count,
    leftPinnedColumns,
    renderBufferSize,
    rightPinnedColumns,
  ]);
};

export const DefaultTable = () => {
  const config = useTableConfig();
  return (
    <>
      {/* <DragVisualizer orientation="horizontal"> */}
      <DataTable {...config} height={700} renderBufferSize={20} width={700} />
      {/* </DragVisualizer> */}
    </>
  );
};
DefaultTable.displaySequence = displaySequence++;

export const TableLoading = () => {
  const config = useTableConfig({ count: 0 });
  return (
    <>
      {/* <DragVisualizer orientation="horizontal"> */}
      <DataTable
        {...config}
        height={700}
        renderBufferSize={20}
        width={700}
        className="vuuDataTable-loading"
      />
      {/* </DragVisualizer> */}
    </>
  );
};
TableLoading.displaySequence = displaySequence++;

export const DefaultTable10Rows = () => {
  const config = useTableConfig();
  return (
    <>
      {/* <DragVisualizer orientation="horizontal"> */}
      <DataTable {...config} height={240} renderBufferSize={20} width={700} />
      {/* </DragVisualizer> */}
    </>
  );
};

DefaultTable10Rows.displaySequence = displaySequence++;

export const DefaultTableMultiLevelHeadings = () => {
  const config = useTableConfig({
    columnConfig: {
      "row number": { heading: ["Level 0 Heading A", "Heading 1"] },
      "column 1": { heading: ["Level 0 Heading A", "Heading 1"] },
      "column 2": { heading: ["Level 0 Heading A", "Heading 1"] },
      "column 3": { heading: ["Level 0 Heading A", "Heading 1"] },
      "column 4": { heading: ["Level 0 Heading A", "Heading 2"] },
      "column 5": { heading: ["Level 0 Heading A", "Heading 2"] },
      "column 6": { heading: ["Level 0 Heading A", "Heading 2"] },
      "column 7": { heading: ["Level 0 Heading B", "Heading 3"] },
      "column 8": { heading: ["Level 0 Heading B", "Heading 3"] },
      "column 9": { heading: ["Level 0 Heading B", "Heading 3"] },
      "column 10": { heading: ["Level 0 Heading B", "Heading 3"] },
    },
  });
  return (
    <>
      {/* <DragVisualizer orientation="horizontal"> */}
      <DataTable {...config} height={700} renderBufferSize={20} width={700} />
      {/* </DragVisualizer> */}
    </>
  );
};

DefaultTableMultiLevelHeadings.displaySequence = displaySequence++;

export const LeftPinnedColumns = () => {
  const [isColumnBased, setIsColumnBased] = useState<boolean>(false);
  const handleToggleLayout = useCallback(() => {
    setIsColumnBased((value) => !value);
  }, []);

  const config = useTableConfig({
    leftPinnedColumns: [0, 3],
  });

  return (
    <div style={{ width: 900, height: 900 }}>
      <Toolbar>
        <ToggleButton toggled={isColumnBased} onToggle={handleToggleLayout}>
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </Toolbar>
      <DragVisualizer orientation="horizontal">
        <DataTable
          {...config}
          height={700}
          tableLayout={isColumnBased ? "column" : "row"}
          width={700}
        />
      </DragVisualizer>
    </div>
  );
};

LeftPinnedColumns.displaySequence = displaySequence++;

export const RightPinnedColumns = () => {
  const [isColumnBased, setIsColumnBased] = useState<boolean>(false);
  const handleToggleLayout = useCallback(() => {
    setIsColumnBased((value) => !value);
  }, []);
  const config = useTableConfig({
    rightPinnedColumns: [0, 3],
  });

  return (
    <div style={{ width: 900, height: 900 }}>
      <Toolbar>
        <ToggleButton toggled={isColumnBased} onToggle={handleToggleLayout}>
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </Toolbar>
      <DragVisualizer orientation="horizontal">
        <DataTable
          {...config}
          height={700}
          tableLayout={isColumnBased ? "column" : "row"}
          width={700}
        />
      </DragVisualizer>
    </div>
  );
};

RightPinnedColumns.displaySequence = displaySequence++;

export const BetterTableFillContainer = () => {
  const config = useTableConfig();
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable {...config} />
    </div>
  );
};
BetterTableFillContainer.displaySequence = displaySequence++;

export const BetterTableWithBorder = () => {
  const config = useTableConfig();
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable {...config} style={{ border: "solid 2px red" }} />
    </div>
  );
};

BetterTableWithBorder.displaySequence = displaySequence++;

export const FlexLayoutTables = () => {
  const config1 = useTableConfig({ renderBufferSize: 0 });
  const config2 = useTableConfig({ renderBufferSize: 20 });
  const config3 = useTableConfig({ renderBufferSize: 50 });
  const config4 = useTableConfig({ renderBufferSize: 100 });
  return (
    <Flexbox style={{ flexDirection: "column", width: "100%", height: "100%" }}>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable {...config1} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable {...config2} />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable {...config3} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable {...config4} />
        </View>
      </Flexbox>
    </Flexbox>
  );
};
FlexLayoutTables.displaySequence = displaySequence++;

export const VuuDataTable = () => {
  const [columnConfig, tables] = useMemo(
    () => [
      {
        description: { editable: true },
      },
      ["instruments", "orders", "parentOrders", "childOrders", "prices"],
    ],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);

  const { schemas } = useSchemas();
  const { columns, config, dataSource, error } = useTestDataSource({
    columnConfig,
    schemas,
    tablename: tables[selectedIndex],
  });

  const table = useMemo(
    () => ({ module: "SIMUL", table: tables[selectedIndex] }),
    [selectedIndex, tables]
  );

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  const filterSuggestionProvider = useFilterSuggestionProvider({
    columns,
    table,
  });

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  const handleChange: ToggleButtonGroupChangeEventHandler = (_event, index) => {
    setSelectedIndex(index);
  };

  const handleSettingsConfigChange = useCallback(
    (config: GridConfig, closePanel = false) => {
      console.log(`Table.examples config changed`, {
        config,
      });
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          // side effect: update columns on dataSource
          dataSource.columns = config.columns.map(toDataSourceColumns);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      // we want this to be used when editor is opened next, but we don;t want
      // to trigger a re-render of our dataTable
      configRef.current = config;
    },
    []
  );

  const showConfigEditor = useCallback(() => {
    setDialogContent(
      <DatagridSettingsPanel
        availableColumns={columns}
        gridConfig={configRef.current}
        onConfigChange={handleSettingsConfigChange}
      />
    );
  }, [columns, handleSettingsConfigChange]);

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  const groupByCurrency = useCallback(() => {
    dataSource.groupBy = ["currency"];
  }, [dataSource]);
  const groupByCurrencyExchange = useCallback(() => {
    dataSource.groupBy = ["currency", "exchange"];
  }, [dataSource]);
  const groupByCurrencyExchangeRic = useCallback(() => {
    if (dataSource.table.table === "instruments") {
      dataSource.groupBy = ["currency", "exchange", "ric"];
    } else if (dataSource.table.table === "childOrders") {
      dataSource.groupBy = ["ccy", "exchange", "ric"];
    }
  }, [dataSource]);

  const handleSubmitFilter = useCallback(
    (filterStruct: Filter | undefined, filter: string, filterName?: string) => {
      filterName && console.log(`named filter created '${filterName}'`);
      dataSource.filter = { filter, filterStruct };
    },
    [dataSource]
  );

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton tooltipText="Alert">Instruments</ToggleButton>
        <ToggleButton tooltipText="Home">Orders</ToggleButton>
        <ToggleButton tooltipText="Print">Parent Orders</ToggleButton>
        <ToggleButton tooltipText="Child Orders">Child Orders</ToggleButton>
        <ToggleButton tooltipText="Prices">Prices</ToggleButton>
      </ToggleButtonGroup>
      <Toolbar
        className="salt-density-high"
        style={
          {
            "--saltToolbar-height": "28px",
            "--saltToolbar-alignItems": "center",
          } as CSSProperties
        }
      >
        <Tooltray>
          <Button onClick={groupByCurrency}>Currency</Button>
          <Button onClick={groupByCurrencyExchange}>Currency, Exchange</Button>
          <Button onClick={groupByCurrencyExchangeRic}>
            CCY, Exchange, Ric
          </Button>
        </Tooltray>
        <Tooltray>
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </Tooltray>
      </Toolbar>
      <DataTable
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={600}
        onConfigChange={handleTableConfigChange}
        onShowConfigEditor={showConfigEditor}
        renderBufferSize={20}
        width={750}
      />
      <Toolbar
        className="vuuDataTable-footer"
        style={
          {
            "--saltToolbar-height": "20px",
            "--saltToolbar-background":
              "var(--salt-container-primary-background)",
            borderTop: "solid 1px var(--salt-container-primary-borderColor)",
            color: "var(--salt-text-secondary-foreground)",
            width: 750,
          } as CSSProperties
        }
      >
        <DataSourceStats dataSource={dataSource} />
      </Toolbar>
      <Dialog
        className="vuuDialog-gridConfig"
        isOpen={dialogContent !== null}
        onClose={hideSettings}
        title="Grid and Column Settings"
      >
        {dialogContent}
      </Dialog>
    </>
  );
};
VuuDataTable.displaySequence = displaySequence++;

export const FlexLayoutVuuTables = () => {
  const { schemas } = useSchemas();
  const { config: conf1, dataSource: ds1 } = useTestDataSource({ schemas });
  const { config: conf2, dataSource: ds2 } = useTestDataSource({ schemas });
  const { config: conf3, dataSource: ds3 } = useTestDataSource({ schemas });
  const { config: conf4, dataSource: ds4 } = useTestDataSource({ schemas });

  return (
    <Flexbox style={{ flexDirection: "column", width: 800, height: 700 }}>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable config={conf1} dataSource={ds1} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable config={conf2} dataSource={ds2} />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable config={conf3} dataSource={ds3} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable config={conf4} dataSource={ds4} />
        </View>
      </Flexbox>
    </Flexbox>
  );
};
FlexLayoutVuuTables.displaySequence = displaySequence++;

export const VuuDataTableCalculatedColumns = () => {
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const calculatedColumns: ColumnDescriptor[] = useMemo(
    () => [
      {
        name: "notional",
        expression: "=price*quantity",
        serverDataType: "double",
        type: {
          name: "number",
          formatting: {
            decimals: 2,
          },
        },
      },
      {
        name: "isBuy",
        expression: '=if(side="Sell","N","Y")',
        serverDataType: "char",
      },
      {
        name: "CcySort",
        expression: '=if(ccy="Gbp",1,if(ccy="USD",2,3))',
        serverDataType: "char",
        width: 60,
      },
      {
        name: "CcyLower",
        expression: "=lower(ccy)",
        serverDataType: "string",
        width: 60,
      },
      {
        name: "AccountUpper",
        expression: "=upper(account)",
        label: "ACCOUNT",
        serverDataType: "string",
      },
      {
        name: "ExchangeCcy",
        expression: '=concatenate("---", exchange,"...",ccy, "---")',
        serverDataType: "string",
      },
      {
        name: "ExchangeIsNY",
        expression: '=starts(exchange,"N")',
        serverDataType: "boolean",
      },
      // {
      //   name: "Text",
      //   expression: "=text(quantity)",
      //   serverDataType: "string",
      // },
    ],
    []
  );

  const { schemas } = useSchemas();
  const { columns, config, dataSource, error } = useTestDataSource({
    schemas,
    tablename: "parentOrders",
    calculatedColumns,
  });

  const table = { table: "parentOrders", module: "SIMUL" };

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  const filterSuggestionProvider = useFilterSuggestionProvider({
    columns,
    table,
  });

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  const handleConfigChange = useCallback(
    (config: GridConfig, closePanel = false) => {
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          dataSource.columns = config.columns.map(toDataSourceColumns);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      // we want this to be used when editor is opened next, but we don;t want
      // to trigger a re-render of our dataTable
      configRef.current = config;
    },
    []
  );

  const showConfigEditor = useCallback(() => {
    setDialogContent(
      <DatagridSettingsPanel
        availableColumns={columns}
        gridConfig={configRef.current}
        onConfigChange={handleConfigChange}
      />
    );
  }, [columns, handleConfigChange]);

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  const groupByCurrency = useCallback(() => {
    dataSource.groupBy = ["currency"];
  }, [dataSource]);
  const groupByCurrencyExchange = useCallback(() => {
    dataSource.groupBy = ["currency", "exchange"];
  }, [dataSource]);

  const handleSubmitFilter = useCallback(
    (filterStruct: Filter | undefined, filter: string, filterName?: string) => {
      filterName && console.log(`named filter created '${filterName}'`);
      dataSource.filter = { filter, filterStruct };
    },
    [dataSource]
  );

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <Toolbar
        className="salt-density-high"
        style={
          {
            "--saltToolbar-height": "28px",
            "--saltToolbar-alignItems": "center",
          } as CSSProperties
        }
      >
        <Tooltray>
          <Button onClick={groupByCurrency}>Currency</Button>
          <Button onClick={groupByCurrencyExchange}>Currency, Exchange</Button>
        </Tooltray>
        <Tooltray>
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </Tooltray>
      </Toolbar>
      <DataTable
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={600}
        onConfigChange={handleTableConfigChange}
        onShowConfigEditor={showConfigEditor}
        width={750}
      />
      <Dialog
        className="vuuDialog-gridConfig"
        isOpen={dialogContent !== null}
        onClose={hideSettings}
        title="Grid and Column Settings"
      >
        {dialogContent}
      </Dialog>
    </>
  );
};
VuuDataTableCalculatedColumns.displaySequence = displaySequence++;

export const ColumnHeaders1Level = () => {
  const { schemas } = useSchemas();
  const { config, dataSource } = useTestDataSource({
    columnConfig: {
      bbg: { heading: ["Instrument"] },
      isin: { heading: ["Instrument"] },
      ric: { heading: ["Instrument"] },
      description: { heading: ["Instrument"] },
      currency: { heading: ["Exchange Details"] },
      exchange: { heading: ["Exchange Details"] },
      lotSize: { heading: ["Exchange Details"] },
    },
    columnNames: [
      "bbg",
      "isin",
      "ric",
      "description",
      "currency",
      "exchange",
      "lotSize",
    ],
    schemas,
  });

  return (
    <>
      <div>
        <input defaultValue="Life is" />
      </div>
      <DataTable
        config={config}
        dataSource={dataSource}
        height={600}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
    </>
  );
};

ColumnHeaders1Level.displaySequence = displaySequence++;

const ConfigurableDataTable = ({
  table,
  ...props
}: Omit<TableProps, "config" | "dataSource"> & {
  table: VuuTable;
}) => {
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const { save } = useViewContext();
  const { schemas } = useSchemas();

  const handleDataSourceConfigChange = useCallback(
    (config?: DataSourceConfig) => {
      save?.(config, "datasource-config");
    },
    [save]
  );

  const { columns, config, dataSource, error } = useTestDataSource({
    onConfigChange: handleDataSourceConfigChange,
    schemas,
    tablename: table.table,
  });

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  // This needs to trigger a re-render of Table
  const handleSettingConfigChange = useCallback(
    (config: GridConfig, closePanel = false) => {
      save?.(config, "table-config");
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          dataSource.columns = config.columns.map(toDataSourceColumns);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource, save]
  );

  // This does NOT need to trigger a re-render of Table
  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      // we want this to be used when editor is opened next, but we don;t want
      // to trigger a re-render of our dataTable
      configRef.current = config;
      save?.(config, "table-config");
    },
    [save]
  );

  const handleSubmitFilter = useCallback(
    (filterStruct: Filter | undefined, filter: string, filterName?: string) => {
      filterName && console.log(`named filter created '${filterName}'`);
      dataSource.filter = { filter, filterStruct };
    },
    [dataSource]
  );

  const showConfigEditor = useCallback(() => {
    setDialogContent(
      <DatagridSettingsPanel
        availableColumns={columns}
        gridConfig={configRef.current}
        onConfigChange={handleSettingConfigChange}
      />
    );
  }, [columns, handleSettingConfigChange]);

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  const filterSuggestionProvider = useFilterSuggestionProvider({
    columns,
    table,
  });

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <Toolbar
        className="salt-density-high"
        style={
          {
            "--saltToolbar-height": "28px",
            "--saltToolbar-alignItems": "center",
          } as CSSProperties
        }
      >
        <Tooltray>
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </Tooltray>
      </Toolbar>

      <DataTable
        allowConfigEditing
        dataSource={dataSource}
        onConfigChange={handleTableConfigChange}
        onShowConfigEditor={showConfigEditor}
        {...props}
        config={tableConfig}
      />
      <Dialog
        className="vuuDialog-gridConfig"
        isOpen={dialogContent !== null}
        onClose={hideSettings}
        title="Grid and Column Settings"
      >
        {dialogContent}
      </Dialog>
    </>
  );
};

export const VuuDataTablePersistedConfig = () => {
  const table: VuuTable = useMemo(
    () => ({ module: "SIMUL", table: "instruments" }),
    []
  );
  return (
    <>
      <View>
        <ConfigurableDataTable
          height={600}
          renderBufferSize={20}
          table={table}
          width={750}
        />
      </View>
    </>
  );
};
VuuDataTablePersistedConfig.displaySequence = displaySequence++;

export const VuuTablePredefinedConfig = () => {
  const { schemas } = useSchemas();
  const sort: VuuSort = { sortDefs: [{ column: "lotSize", sortType: "D" }] };
  const filter: DataSourceFilter = {
    filter: 'currency="EUR"',
    filterStruct: {
      op: "=",
      column: "currency",
      value: "EUR",
    },
  };
  const { config, dataSource } = useTestDataSource({ filter, schemas, sort });

  return (
    <Flexbox style={{ flexDirection: "column", width: 800, height: 800 }}>
      <View resizeable style={{ flex: 1 }}>
        <DataTable config={config} dataSource={dataSource} />
      </View>
      <div data-resizeable style={{ flex: 1 }} />
    </Flexbox>
  );
};
VuuTablePredefinedConfig.displaySequence = displaySequence++;

export const VuuTablePredefinedGroupBy = () => {
  const { schemas } = useSchemas();
  const groupBy: VuuGroupBy = ["exchange", "currency"];
  const { config, dataSource } = useTestDataSource({ groupBy, schemas });

  return (
    <Flexbox style={{ flexDirection: "column", height: 800 }}>
      <View resizeable style={{ flex: 1 }}>
        <DataTable config={config} dataSource={dataSource} />
      </View>
      <div data-resizeable style={{ flex: 1 }} />
    </Flexbox>
  );
};
VuuTablePredefinedGroupBy.displaySequence = displaySequence++;

export const HiddenColumns = () => {
  const columnConfig = useMemo(
    () => ({ averagePrice: { hidden: true }, childCount: { hidden: true } }),
    []
  );
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const { schemas } = useSchemas();
  const { columns, config, dataSource, error } = useTestDataSource({
    columnConfig,
    schemas,
    tablename: "parentOrders",
  });

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  const handleSettingsConfigChange = useCallback(
    (config: GridConfig, closePanel = false) => {
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          dataSource.columns = config.columns.map(toDataSourceColumns);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  const handleTableConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">) => {
      // we want this to be used when editor is opened next, but we don;t want
      // to trigger a re-render of our dataTable
      configRef.current = config;
    },
    []
  );

  const showConfigEditor = useCallback(() => {
    setDialogContent(
      <DatagridSettingsPanel
        availableColumns={columns}
        gridConfig={configRef.current}
        onConfigChange={handleSettingsConfigChange}
      />
    );
  }, [columns, handleSettingsConfigChange]);

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <DataTable
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={600}
        onConfigChange={handleTableConfigChange}
        onShowConfigEditor={showConfigEditor}
        width={750}
      />
      <Dialog
        className="vuuDialog-gridConfig"
        isOpen={dialogContent !== null}
        onClose={hideSettings}
        title="Grid and Column Settings"
      >
        {dialogContent}
      </Dialog>
    </>
  );
};
HiddenColumns.displaySequence = displaySequence++;
