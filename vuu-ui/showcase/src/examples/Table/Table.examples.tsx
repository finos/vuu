import { ArrayDataSource, DataSourceConfig } from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import {
  DatagridSettingsPanel,
  DataSourceStats,
} from "@finos/vuu-table-extras";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { Table, TableProps } from "@finos/vuu-table";
import { FilterInput } from "@finos/vuu-filters";
import { Flexbox, useViewContext, View } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import { itemsChanged, toDataSourceColumns } from "@finos/vuu-utils";

import { DragVisualizer } from "@finos/vuu-table/src/DragVisualizer";
import { Filter } from "@finos/vuu-filter-types";
import { useFilterSuggestionProvider } from "@finos/vuu-filters";
import {
  VuuGroupBy,
  VuuRowDataItemType,
  VuuSort,
  VuuTable,
} from "@finos/vuu-protocol-types";
import {
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
  Toolbar,
  ToolbarField,
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

const NO_CONFIG = {} as const;
const useTableConfig = ({
  columnConfig = NO_CONFIG,
  columnCount = 10,
  count = 1000,
  leftPinnedColumns = [],
  rightPinnedColumns = [],
  renderBufferSize = 0,
}: {
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> };
  columnCount?: number;
  count?: number;
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  renderBufferSize?: number;
} = {}) => {
  return useMemo(() => {
    const data: VuuRowDataItemType[][] = [];
    for (let i = 0; i < count; i++) {
      // prettier-ignore
      data.push(
    [`row ${i + 1}`].concat(Array(columnCount).fill(true).map((v,j) => `value ${j+1} @ ${i + 1}`)) 
    );
    }

    const columns: ColumnDescriptor[] = [
      { name: "row number", width: 150 },
    ].concat(
      Array(columnCount)
        .fill(true)
        .map((base, i) => {
          const name = `column ${i + 1}`;
          return { name, width: 100, ...columnConfig[name] };
        })
    );

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data,
    });

    return { config: { columns }, dataSource, renderBufferSize };
  }, [
    columnConfig,
    columnCount,
    count,
    leftPinnedColumns,
    renderBufferSize,
    rightPinnedColumns,
  ]);
};

export const DefaultTable = () => {
  const config = useTableConfig();
  const [zebraStripes, setZebraStripes] = useState(true);
  const handleZebraChanged = useCallback((_evt, checked) => {
    setZebraStripes(checked);
  }, []);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Table
        {...config}
        height={700}
        renderBufferSize={50}
        width={700}
        zebraStripes={zebraStripes}
      />
      <Toolbar
        orientation="vertical"
        style={
          { height: "unset", "--saltFormField-margin": "6px" } as CSSProperties
        }
      >
        <ToolbarField label="Zebra Stripes">
          <Checkbox
            checked={zebraStripes === true}
            onChange={handleZebraChanged}
          />
        </ToolbarField>
      </Toolbar>
    </div>
  );
};
DefaultTable.displaySequence = displaySequence++;

export const TableLoading = () => {
  const config = useTableConfig({ count: 0 });
  return (
    <>
      {/* <DragVisualizer orientation="horizontal"> */}
      <Table
        {...config}
        height={700}
        renderBufferSize={20}
        width={700}
        className="vuuTable-loading"
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
      <Table {...config} height={240} renderBufferSize={20} width={700} />
      {/* </DragVisualizer> */}
    </>
  );
};

export const DefaultTable200C0lumns = () => {
  const config = useTableConfig({ columnCount: 200 });
  return (
    <>
      <Table {...config} height={600} renderBufferSize={50} width={700} />
    </>
  );
};

DefaultTable200C0lumns.displaySequence = displaySequence++;

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
      <Table {...config} height={700} renderBufferSize={20} width={700} />
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
        <Table
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
        <Table
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
      <Table {...config} />
    </div>
  );
};
BetterTableFillContainer.displaySequence = displaySequence++;

export const BetterTableWithBorder = () => {
  const config = useTableConfig();
  return (
    <div style={{ height: 700, width: 700 }}>
      <Table {...config} style={{ border: "solid 2px red" }} />
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
          <Table {...config1} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <Table {...config2} />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <Table {...config3} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <Table {...config4} />
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
      <Table
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
    (config: GridConfig, closePanel = false) => {
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
      <Table
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

export const vuuTablePersistedConfig = () => {
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
vuuTablePersistedConfig.displaySequence = displaySequence++;

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
    (config: GridConfig, closePanel = false) => {
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
