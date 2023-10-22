import {
  DataSource,
  DataSourceConfig,
  RemoteDataSource,
  TableSchema,
} from "@finos/vuu-data";
import { getAllSchemas } from "@finos/vuu-data-test";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { Filter } from "@finos/vuu-filter-types";
import { FilterInput, useFilterSuggestionProvider } from "@finos/vuu-filters";
import { Flexbox, useViewContext, View } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import { VuuGroupBy, VuuSort, VuuTable } from "@finos/vuu-protocol-types";
import { Table, TableProps } from "@finos/vuu-table";
import { DataSourceStats } from "@finos/vuu-table-extras";
import { itemsChanged, toDataSourceColumns } from "@finos/vuu-utils";
import { Button, ToggleButton, ToggleButtonGroup } from "@salt-ds/core";
import {
  ReactElement,
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ErrorDisplay, useTestDataSource } from "../utils";

let displaySequence = 1;

export const VuuDataTable = () => {
  const [columnConfig] = useMemo(
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
    ],
    []
  );
  const [tablename, setTablename] = useState("instruments");
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number>(-1);
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);

  const schemas = getAllSchemas();
  const { columns, config, dataSource, error } = useTestDataSource({
    columnConfig,
    schemas,
    tablename,
  });

  const table = useMemo(
    () => ({ module: "SIMUL", table: tablename }),
    [tablename]
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

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    setTablename(value);
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
      <ToggleButtonGroup onChange={handleChange} value={tablename}>
        <ToggleButton value="instruments">Instruments</ToggleButton>
        <ToggleButton value="orders">Orders</ToggleButton>
        <ToggleButton value="parentOrders">Parent Orders</ToggleButton>
        <ToggleButton value="childOrders">Child Orders</ToggleButton>
        <ToggleButton value="prices">Prices</ToggleButton>
      </ToggleButtonGroup>
      <div
        className="vuuToolbarProxy salt-density-high"
        style={{ display: "flex" }}
      >
        <div className="vuuTooltrayProxy">
          <ToggleButtonGroup value={selectedGroupIndex}>
            <ToggleButton onClick={groupByCurrency} value={0}>
              Currency
            </ToggleButton>
            <ToggleButton onClick={groupByCurrencyExchange} value={1}>
              Currency, Exchange
            </ToggleButton>
            <ToggleButton onClick={groupByCurrencyExchangeRic} value={2}>
              CCY, Exchange, Ric
            </ToggleButton>
            {tablename === "parentOrders" ? (
              <ToggleButton onClick={groupByAccountAlgo} value={3}>
                Account, Algo, 7 columns
              </ToggleButton>
            ) : (
              <ToggleButton value={4}>Ignore</ToggleButton>
            )}
          </ToggleButtonGroup>
        </div>
        <div>
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </div>
      </div>
      <Table
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={645}
        onConfigChange={handleTableConfigChange}
        renderBufferSize={20}
        width={750}
      />
      <div
        className="vuuToolbarProxy vuuTable-footer"
        style={{
          height: 20,
          borderTop: "solid 1px var(--salt-container-primary-borderColor)",
          color: "var(--salt-text-secondary-foreground)",
          width: 750,
        }}
      >
        <DataSourceStats dataSource={dataSource} />
      </div>
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
  const schemas = getAllSchemas();
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

  const schemas = getAllSchemas();
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
      <div
        className="vuuToolbarProxy salt-density-high"
        style={{
          height: 28,
        }}
      >
        <div className="vuuTooltrayProxy">
          <Button onClick={groupByCurrency}>Currency</Button>
          <Button onClick={groupByCurrencyExchange}>Currency, Exchange</Button>
        </div>
        <div className="vuuTooltrayProxy">
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </div>
      </div>
      <Table
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={600}
        onConfigChange={handleTableConfigChange}
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
  const schemas = getAllSchemas();

  // const handleDataSourceConfigChange = useCallback(
  //   (config?: DataSourceConfig) => {
  //     save?.(config, "datasource-config");
  //   },
  //   [save]
  // );

  const { columns, config, dataSource, error } = useTestDataSource({
    // onConfigChange: handleDataSourceConfigChange,
    schemas,
    tablename: table.table,
  });

  const configRef = useRef<Omit<GridConfig, "headings">>(config);
  const [tableConfig, setTableConfig] =
    useState<Omit<GridConfig, "headings">>(config);

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

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
      <div
        className="vuuToolbarProxy salt-density-high"
        style={{
          height: 28,
        }}
      >
        <div className="vuuTooltrayProxy">
          <FilterInput
            existingFilter={dataSource.filter.filterStruct}
            onSubmitFilter={handleSubmitFilter}
            style={{ width: 300 }}
            suggestionProvider={filterSuggestionProvider}
          />
        </div>
      </div>

      <Table
        allowConfigEditing
        dataSource={dataSource}
        onConfigChange={handleTableConfigChange}
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
  const schemas = getAllSchemas();
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
  const schemas = getAllSchemas();
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
  const schemas = getAllSchemas();
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

const toColumnDescriptor =
  (schema: TableSchema) =>
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

  const schemas = getAllSchemas();
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

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  const handleChange = (evt: SyntheticEvent<HTMLButtonElement>) => {
    const { value } = evt.target as HTMLButtonElement;
    setSelectedIndex(parseInt(value));
  };

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <ToggleButtonGroup onChange={handleChange} value={selectedIndex}>
        <ToggleButton value={0}>Set 1</ToggleButton>
        <ToggleButton value={1}>Set 2</ToggleButton>
        <ToggleButton value={2}>Set 3</ToggleButton>
        <ToggleButton value={3}>All Columns</ToggleButton>
      </ToggleButtonGroup>

      <Table
        allowConfigEditing
        dataSource={dataSource}
        config={tableConfig}
        // columnSizing="fill"
        height={600}
        onConfigChange={handleTableConfigChange}
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
