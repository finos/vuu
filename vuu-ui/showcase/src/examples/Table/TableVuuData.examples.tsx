import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
} from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { FilterInput, useFilterSuggestionProvider } from "@finos/vuu-filters";
import { Flexbox, useViewContext, View } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import { VuuGroupBy, VuuSort, VuuTable } from "@finos/vuu-protocol-types";
import { Table, TableProps } from "@finos/vuu-table";
import {
  DatagridSettingsPanel,
  DataSourceStats,
} from "@finos/vuu-table-extras";
import { itemsChanged, toDataSourceColumns } from "@finos/vuu-utils";
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
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ErrorDisplay, Schema, useSchemas, useTestDataSource } from "../utils";

let displaySequence = 1;

export const VuuDataTable = () => {
  const [columnConfig, tables] = useMemo(
    () => [
      {
        description: { editable: true },
        currency: {
          label: "Currency",
          type: {
            name: "string" as const,
            renderer: {
              map: {
                CAD: "Canadian $",
                EUR: "Euros",
                GBX: "Pounds",
                USD: "Dollars",
              },
            },
          },
        },
      },
      ["instruments", "orders", "parentOrders", "childOrders", "prices"],
    ],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(-1);
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
    (config: Omit<GridConfig, "headings">, closePanel = false) => {
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

  const getCcyCol = (dataSource: DataSource) =>
    (dataSource as RemoteDataSource).table.table === "instruments"
      ? "currency"
      : "ccy";

  const groupByCurrency = useCallback(() => {
    if (selectedGroupIndex === 0) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        columns: columns.map((col) => col.name),
        groupBy: [getCcyCol(dataSource)],
      };
      // dataSource.groupBy = [getCcyCol(dataSource)];
      setSelectedGroupIndex(0);
    }
  }, [columns, dataSource, selectedGroupIndex]);
  const groupByCurrencyExchange = useCallback(() => {
    if (selectedGroupIndex === 1) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        columns: columns.map((col) => col.name),
        groupBy: [getCcyCol(dataSource), "exchange"],
      };

      // dataSource.groupBy = [getCcyCol(dataSource), "exchange"];
      setSelectedGroupIndex(1);
    }
  }, [columns, dataSource, selectedGroupIndex]);
  const groupByCurrencyExchangeRic = useCallback(() => {
    if (selectedGroupIndex === 2) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        columns: columns.map((col) => col.name),
        groupBy: [getCcyCol(dataSource), "exchange", "ric"],
      };
      setSelectedGroupIndex(2);
    }
  }, [columns, dataSource, selectedGroupIndex]);
  const groupByAccountAlgo = useCallback(() => {
    if (selectedGroupIndex === 2) {
      dataSource.groupBy = [];
      setSelectedGroupIndex(-1);
    } else {
      dataSource.config = {
        ...dataSource.config,
        aggregations: [
          { column: "price", aggType: 1 },
          { column: "quantity", aggType: 1 },
          { column: "filledQty", aggType: 1 },
        ],
        columns: [
          "account",
          "algo",
          "ccy",
          "averagePrice",
          "price",
          "quantity",
          "filledQty",
        ],
        groupBy: ["account", "algo"],
      };
      setSelectedGroupIndex(3);
    }
  }, [dataSource, selectedGroupIndex]);

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
          <ToggleButtonGroup selectedIndex={selectedGroupIndex}>
            <ToggleButton onClick={groupByCurrency} tooltipText="Currency">
              Currency
            </ToggleButton>
            <ToggleButton
              onClick={groupByCurrencyExchange}
              tooltipText="Currency and Exchange"
            >
              Currency, Exchange
            </ToggleButton>
            <ToggleButton
              onClick={groupByCurrencyExchangeRic}
              tooltipText="Currency, Exchange and Ric"
            >
              CCY, Exchange, Ric
            </ToggleButton>
            {selectedIndex === 2 ? (
              <ToggleButton
                onClick={groupByAccountAlgo}
                tooltipText="Account and Algo"
              >
                Account, Algo, 7 columns
              </ToggleButton>
            ) : (
              <ToggleButton>Ignore</ToggleButton>
            )}
          </ToggleButtonGroup>
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
      <Table
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={700}
        onConfigChange={handleTableConfigChange}
        onShowConfigEditor={showConfigEditor}
        renderBufferSize={20}
        width={750}
      />
      <Toolbar
        className="vuuTable-footer"
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
          <Table config={conf1} dataSource={ds1} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <Table config={conf2} dataSource={ds2} />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <Table config={conf3} dataSource={ds3} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <Table config={conf4} dataSource={ds4} />
        </View>
      </Flexbox>
    </Flexbox>
  );
};
FlexLayoutVuuTables.displaySequence = displaySequence++;

export const VuuTableCalculatedColumns = () => {
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
    (config: Omit<GridConfig, "headings">, closePanel = false) => {
      setTableConfig((currentConfig) => {
        if (
          dataSource &&
          itemsChanged(currentConfig.columns, config.columns, "name")
        ) {
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
    if (dataSource) {
      dataSource.groupBy = ["currency"];
    }
  }, [dataSource]);

  const groupByCurrencyExchange = useCallback(() => {
    if (dataSource) {
      dataSource.groupBy = ["currency", "exchange"];
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
      <Table
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
VuuTableCalculatedColumns.displaySequence = displaySequence++;

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
    (config: Omit<GridConfig, "headings">, closePanel = false) => {
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

      <Table
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

export const VuuTablePersistedConfig = () => {
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
VuuTablePersistedConfig.displaySequence = displaySequence++;

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
        <Table config={config} dataSource={dataSource} />
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
        <Table config={config} dataSource={dataSource} />
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
    (config: Omit<GridConfig, "headings">, closePanel = false) => {
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
      <Table
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

export const toColumnDescriptor =
  (schema: Schema) =>
  (columnName: string): ColumnDescriptor => {
    const column = schema.columns.find(({ name }) => name === columnName);
    if (column) {
      return column;
    } else {
      throw Error(`No column '${columnName}' in schema`);
    }
  };

type SavedConfig = Array<{
  "datasource-config": DataSourceConfig;
  "table-config": { columns: ColumnDescriptor[] };
}>;

export const SwitchColumns = () => {
  const [selectedIndex, _setSelectedIndex] = useState<number>(0);
  const selectedIndexRef = useRef(0);
  const setSelectedIndex = useCallback((value: number) => {
    _setSelectedIndex((selectedIndexRef.current = value));
  }, []);

  const { schemas } = useSchemas();
  const { parentOrders: parentOrdersSchema } = schemas;

  const [namedConfigurations, setConfig] = useMemo<[SavedConfig, any]>(() => {
    // prettier-ignore
    const whpColumns = ["account", "algo", "ccy", "exchange", "ric"]
    // prettier-ignore
    const wovColumns = ["account", "side", "price", "averagePrice", "quantity", "filledQty"];
    // prettier-ignore
    const apColumns = ["account", "status", "volLimit"];
    // prettier-ignore
    const config: SavedConfig =[
      { "datasource-config": {columns: whpColumns},
        "table-config": { columns: whpColumns.map(toColumnDescriptor(parentOrdersSchema)) },
      },
      {
        "datasource-config": { columns: wovColumns, groupBy: ["account"]},
        "table-config": { columns: wovColumns.map(toColumnDescriptor(parentOrdersSchema)) },
      },
      {
        "datasource-config": { columns: apColumns },
        "table-config": { columns: apColumns.map(toColumnDescriptor(parentOrdersSchema))},
      },
      {
        "datasource-config": { 
          columns: parentOrdersSchema.columns.map((col) => col.name),
          filter: { filter: 'algo = "TWAP"' },
        },
        "table-config": { columns: parentOrdersSchema.columns },
      },
    ];

    const setConfig = (dataSourceConfig: DataSourceConfig) => {
      console.log(
        `set [${selectedIndexRef.current}] to ${JSON.stringify(
          dataSourceConfig,
          null,
          2
        )}`
      );
      config[selectedIndexRef.current]["datasource-config"] = dataSourceConfig;
    };

    return [config, setConfig];
  }, [parentOrdersSchema]);

  const namedConfiguration = namedConfigurations[selectedIndex];
  const config = namedConfiguration["table-config"];

  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const { columns, dataSource, error } = useTestDataSource({
    columnNames: namedConfiguration["datasource-config"].columns,
    schemas,
    tablename: "parentOrders",
  });

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  useEffect(() => {
    setTableConfig(
      (configRef.current = {
        columns: namedConfiguration["table-config"].columns,
      })
    );
    if (dataSource) {
      dataSource.config = namedConfiguration["datasource-config"];
    }
  }, [dataSource, namedConfiguration]);

  const handleSettingsConfigChange = useCallback(
    (config: Omit<GridConfig, "headings">, closePanel = false) => {
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          if (dataSource) {
            dataSource.columns = config.columns.map(toDataSourceColumns);
          }
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  useMemo(() => {
    dataSource.on("config", (config) => {
      setConfig(config);
    });
  }, [dataSource, setConfig]);

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

  const handleChange: ToggleButtonGroupChangeEventHandler = (_event, index) => {
    setSelectedIndex(index);
  };

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton tooltipText="Alert">Set 1</ToggleButton>
        <ToggleButton tooltipText="Home">Set 2</ToggleButton>
        <ToggleButton tooltipText="Print">Set 3</ToggleButton>
        <ToggleButton tooltipText="Child Orders">All Columns</ToggleButton>
      </ToggleButtonGroup>

      <Table
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
SwitchColumns.displaySequence = displaySequence++;
