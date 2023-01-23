import { DataSourceRow } from "@finos/vuu-data";
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
import { DragVisualizer } from "../../../../packages/vuu-datatable/src/DragVisualizer";
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils";
import { Filter } from "@finos/vuu-filter-types";
import { useSuggestionProvider } from "../Filters/useSuggestionProvider";

let displaySequence = 1;

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

const pinnedColumns = columns.map((col, i) => ({
  ...col,
  pin: i === 0 || i === 3 ? ("left" as const) : undefined,
}));

const defaultConfig = { columns };

const count = 100;
const data: DataSourceRow[] = [];
for (let i = 0; i < count; i++) {
  // prettier-ignore
  data.push([
    i, i, true, false, 1, 0, `row ${i + 1}`, 0, `row ${i + 1}`, "value 1", "value 2", "value 3", "value 4", "value 5", "value 6", "value 7",  "value 8", "value 9", "value 10" 
  ]);
}
const pinnedConfig = { columns: pinnedColumns };

export const DefaultTable = () => {
  return (
    <>
      {/* <DragVisualizer orientation="horizontal"> */}
      <DataTable config={defaultConfig} data={data} height={700} width={700} />
      {/* </DragVisualizer> */}
    </>
  );
};

DefaultTable.displaySequence = displaySequence++;

export const PinnedColumns = () => {
  const [isColumnBased, setIsColumnBased] = useState<boolean>(false);
  const handleToggleLayout = useCallback(() => {
    setIsColumnBased((value) => !value);
  }, []);
  return (
    <>
      <Toolbar>
        <ToggleButton toggled={isColumnBased} onToggle={handleToggleLayout}>
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </Toolbar>
      <DragVisualizer orientation="horizontal">
        <DataTable
          config={pinnedConfig}
          data={data}
          height={700}
          tableLayout={isColumnBased ? "column" : "row"}
          width={700}
        />
      </DragVisualizer>
    </>
  );
};

PinnedColumns.displaySequence = displaySequence++;

export const BetterTableFillContainer = () => {
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable config={defaultConfig} data={data} />
    </div>
  );
};
BetterTableFillContainer.displaySequence = displaySequence++;

export const BetterTableWithBorder = () => {
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable
        config={defaultConfig}
        data={data}
        style={{ border: "solid 2px red" }}
      />
    </div>
  );
};

BetterTableWithBorder.displaySequence = displaySequence++;

export const FlexLayoutTables = () => {
  return (
    <Flexbox style={{ flexDirection: "column", width: 800, height: 700 }}>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable config={defaultConfig} data={data} />
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
FlexLayoutTables.displaySequence = displaySequence++;

export const VuuDataTable = () => {
  const tables = useMemo(
    () => ["instruments", "orders", "parentOrders", "prices"],
    []
  );
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);

  const { schemas } = useSchemas();
  const { columns, config, dataSource, error } = useTestDataSource({
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
