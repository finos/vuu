import React, { useCallback } from "react";
import { DataTable } from "./DataTable";
import { Column } from "./dataTableTypes";
import { Toolbar, ToggleButton } from "@heswell/uitk-lab";
import { DragVisualizer } from "./DragVisualizer";

import { useState } from "react";
import { DataSourceRow } from "@finos/vuu-data";
import { Flexbox, View } from "@finos/vuu-layout";

export default {
  title: "Table/Table",
  component: "table",
};

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

export const BetterTable = () => {
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

export const BetterTableFillContainer = () => {
  return (
    <div style={{ height: 700, width: 700 }}>
      <DataTable columns={columns} data={data} />
    </div>
  );
};

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
