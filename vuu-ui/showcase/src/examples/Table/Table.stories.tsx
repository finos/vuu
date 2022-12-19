import { DataSourceRow } from "@finos/vuu-data";
import { Column, DataTable } from "@finos/vuu-datatable";
import { Flexbox, View } from "@finos/vuu-layout";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
  Toolbar,
} from "@heswell/salt-lab";
import { useCallback, useMemo, useState } from "react";
import { DragVisualizer } from "../../../../packages/vuu-datatable/src/DragVisualizer";
import { ErrorDisplay, useTestDataSource } from "../utils";

export default {
  title: "Table/Table",
  component: "table",
};

let displaySequence = 1;

const columns: Column[] = [
  { name: "row number", pin: "left", width: 150 },
  { name: "column 1", pin: "left", width: 120 },
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

const count = 100;
const data: DataSourceRow[] = [];
for (let i = 0; i < count; i++) {
  // prettier-ignore
  data.push([
    i, i, true, false, 1, 0, `row ${i + 1}`, 0, `row ${i + 1}`, "value 1", "value 2", "value 3", "value 4", "value 5", "value 6", "value 7",  "value 8", "value 9", "value 10" 
  ]);
}

export const DefaultTable = () => {
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
          columns={columns}
          data={data}
          height={700}
          tableLayout={isColumnBased ? "column" : "row"}
          width={700}
        />
      </DragVisualizer>
    </>
  );
};

DefaultTable.displaySequence = displaySequence++;

export const BetterTableFillContainer = () => {
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable columns={columns} data={data} />
    </div>
  );
};
BetterTableFillContainer.displaySequence = displaySequence++;

export const BetterTableWithBorder = () => {
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable
        columns={columns}
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
          <DataTable columns={columns} data={data} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable columns={columns} data={data} />
        </View>
      </Flexbox>
      <Flexbox resizeable style={{ flexDirection: "row", flex: 1 }}>
        <View resizeable style={{ flex: 1 }}>
          <DataTable columns={columns} data={data} />
        </View>

        <View resizeable style={{ flex: 1 }}>
          <DataTable columns={columns} data={data} />
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
  const { columns, dataSource, error } = useTestDataSource({
    tablename: tables[selectedIndex],
  });

  const handleChange: ToggleButtonGroupChangeEventHandler = (
    event,
    index,
    toggled
  ) => {
    console.log(`onChange [${index}] toggled ${toggled}`);
    setSelectedIndex(index);
  };

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

      <DataTable
        dataSource={dataSource}
        columns={columns}
        // columnSizing="fill"
        height={600}
        width={700}
      />
    </>
  );
};
VuuDataTable.displaySequence = displaySequence++;
