import { Flexbox, View } from "@finos/vuu-layout";
import { Table } from "@finos/vuu-table";
import { DragVisualizer } from "@finos/vuu-table/src/table/DragVisualizer";
import { Checkbox, ToggleButton } from "@salt-ds/core";
import { ChangeEvent, CSSProperties, useCallback, useState } from "react";
import { useTableConfig, useTestDataSource } from "../utils";
import { getAllSchemas } from "@finos/vuu-data-test";

let displaySequence = 1;

export const DefaultTable = () => {
  const { typeaheadHook, ...config } = useTableConfig({
    columnCount: 10,
    count: 1_000,
  });
  const [zebraStripes, setZebraStripes] = useState(true);
  const handleZebraChanged = useCallback(
    (evt: ChangeEvent<HTMLInputElement>) => {
      const { checked } = evt.target as HTMLInputElement;
      setZebraStripes(checked);
    },
    []
  );
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Table
        {...config}
        height={440}
        renderBufferSize={100}
        rowHeight={20}
        width={700}
      />
      <div
        className="vuuToolbarProxy vuuToolbarProxy-vertical"
        style={{ height: "unset" } as CSSProperties}
      >
        <Checkbox
          checked={zebraStripes === true}
          onChange={handleZebraChanged}
        />
      </div>
    </div>
  );
};
DefaultTable.displaySequence = displaySequence++;

export const TableLoading = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({ count: 0 });
  return (
    <>
      <Table
        {...config}
        height={700}
        renderBufferSize={20}
        width={700}
        className="vuuTable-loading"
      />
    </>
  );
};
TableLoading.displaySequence = displaySequence++;

export const SmallTable = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 10,
    count: 1000,
  });
  return (
    <>
      <Table
        {...config}
        headerHeight={30}
        height={645}
        renderBufferSize={20}
        rowHeight={30}
        width={715}
      />
    </>
  );
};
SmallTable.displaySequence = displaySequence++;

export const WideTableLowRowcount = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
    columnCount: 20,
    count: 10,
  });
  return (
    <>
      <Table {...config} height={500} renderBufferSize={20} width={700} />
    </>
  );
};
WideTableLowRowcount.displaySequence = displaySequence++;

export const DefaultTable10Rows = () => {
  const { typeaheadHook: _, ...config } = useTableConfig();
  return (
    <>
      <Table {...config} height={240} renderBufferSize={20} width={700} />
    </>
  );
};
DefaultTable10Rows.displaySequence = displaySequence++;

export const DefaultTable1millionRows = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({ count: 1_000_000 });
  return (
    <>
      <Table {...config} height={440} renderBufferSize={20} width={700} />
    </>
  );
};
DefaultTable1millionRows.displaySequence = displaySequence++;

export const DefaultTable2millionRows = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({ count: 2_000_000 });
  return (
    <>
      <Table {...config} height={440} renderBufferSize={20} width={700} />
    </>
  );
};
DefaultTable2millionRows.displaySequence = displaySequence++;

export const DefaultTable200C0lumns = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({ columnCount: 200 });
  return (
    <>
      <Table {...config} height={600} renderBufferSize={50} width={700} />
    </>
  );
};

DefaultTable200C0lumns.displaySequence = displaySequence++;

export const ColumnHeaders1Level = () => {
  const schemas = getAllSchemas();
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
        height={700}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
    </>
  );
};

ColumnHeaders1Level.displaySequence = displaySequence++;

export const ColumnHeadingsMultiLevel = () => {
  const { typeaheadHook: _, ...config } = useTableConfig({
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

ColumnHeadingsMultiLevel.displaySequence = displaySequence++;

export const LeftPinnedColumns = () => {
  const [isColumnBased, setIsColumnBased] = useState<boolean>(false);
  const handleToggleLayout = useCallback(() => {
    setIsColumnBased((value) => !value);
  }, []);

  const { typeaheadHook: _, ...config } = useTableConfig({
    leftPinnedColumns: [0, 3],
  });

  return (
    <div style={{ width: 900, height: 900 }}>
      <div className="vuuToolbarProxy">
        <ToggleButton
          selected={isColumnBased}
          onChange={handleToggleLayout}
          value={0}
        >
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </div>
      <DragVisualizer orientation="horizontal">
        <Table {...config} height={700} width={700} />
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
  const { typeaheadHook: _, ...config } = useTableConfig({
    rightPinnedColumns: [0, 3],
  });

  return (
    <div style={{ width: 900, height: 900 }}>
      <div className="vuuToolbarProxy">
        <ToggleButton
          selected={isColumnBased}
          onChange={handleToggleLayout}
          value={0}
        >
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </div>
      <DragVisualizer orientation="horizontal">
        <Table {...config} height={700} width={700} />
      </DragVisualizer>
    </div>
  );
};

RightPinnedColumns.displaySequence = displaySequence++;

export const BetterTableFillContainer = () => {
  const { typeaheadHook: _, ...config } = useTableConfig();
  return (
    <div style={{ height: 700, width: 700 }}>
      <Table {...config} />
    </div>
  );
};
BetterTableFillContainer.displaySequence = displaySequence++;

export const BetterTableWithBorder = () => {
  const { typeaheadHook: _, ...config } = useTableConfig();
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
