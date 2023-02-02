import { ArrayDataSource } from "@finos/vuu-data";
import { DatagridSettingsPanel } from "@finos/vuu-datagrid-extras";
import { ColumnDescriptor, GridConfig } from "@finos/vuu-datagrid-types";
import { DataTable } from "@finos/vuu-datatable";
import { Flexbox, View } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import { itemsChanged } from "@finos/vuu-utils";
import { FilterInput } from "@finos/vuu-filters";

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
import { DragVisualizer } from "@finos/vuu-datatable/src/DragVisualizer";
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils";
import { Filter } from "@finos/vuu-filter-types";
import { useSuggestionProvider } from "../Filters/useSuggestionProvider";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";

let displaySequence = 1;

const useTableConfig = ({
  leftPinnedColumns = [],
  rightPinnedColumns = [],
  renderBufferSize = 0,
}: {
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  renderBufferSize?: number;
} = {}) => {
  return useMemo(() => {
    const count = 1000;
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
    ];

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data,
    });

    return { config: { columns }, dataSource, renderBufferSize };
  }, [leftPinnedColumns, renderBufferSize, rightPinnedColumns]);
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
      { description: { editable: true } },
      ["instruments", "orders", "parentOrders", "prices"],
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

  const configRef = useRef<GridConfig>(config);
  const [tableConfig, setTableConfig] = useState<GridConfig>(config);

  console.log({ columns });

  const filterSuggestionProvider = useSuggestionProvider({
    columns,
    table,
  });

  useMemo(() => {
    setTableConfig((configRef.current = config));
  }, [config]);

  const handleChange: ToggleButtonGroupChangeEventHandler = (_event, index) => {
    setSelectedIndex(index);
  };

  const handleConfigChange = useCallback(
    (config: GridConfig, closePanel = false) => {
      setTableConfig((currentConfig) => {
        if (itemsChanged(currentConfig.columns, config.columns, "name")) {
          dataSource.columns = config.columns.map((col) => col.name);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  const handleTableConfigChange = useCallback((config: GridConfig) => {
    // we want this to be used when editor is opened next, but we don;t want
    // to trigger a re-render of our dataTable
    configRef.current = config;
  }, []);

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
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton tooltipText="Alert">Instruments</ToggleButton>
        <ToggleButton tooltipText="Home">Orders</ToggleButton>
        <ToggleButton tooltipText="Print">Parent Orders</ToggleButton>
        <ToggleButton tooltipText="Search">Prices</ToggleButton>
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
  const { config, dataSource } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });

  return (
    <Flexbox style={{ flexDirection: "column", width: 800, height: 700 }}>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable config={config} dataSource={dataSource} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable config={defaultConfig} data={data} />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable config={defaultConfig} data={data} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable config={defaultConfig} data={data} />
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

  const configRef = useRef<GridConfig>(config);
  const [tableConfig, setTableConfig] = useState<GridConfig>(config);

  const filterSuggestionProvider = useSuggestionProvider({
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
          dataSource.columns = config.columns.map(toServerSpec);
        }
        return (configRef.current = config);
      });
      closePanel && setDialogContent(null);
    },
    [dataSource]
  );

  const handleTableConfigChange = useCallback((config: GridConfig) => {
    // we want this to be used when editor is opened next, but we don;t want
    // to trigger a re-render of our dataTable
    configRef.current = config;
  }, []);

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
