import { Flexbox, View } from "@finos/vuu-layout";
import { Table } from "@finos/vuu-table";
import { DragVisualizer } from "@finos/vuu-table/src/DragVisualizer";
import {
  Checkbox,
  ToggleButton,
  Toolbar,
  ToolbarField,
} from "@heswell/salt-lab";
import { CSSProperties, useCallback, useMemo, useState } from "react";
import { useSchemas, useTableConfig, useTestDataSource } from "../utils";
import { ArrayDataSource } from "@finos/vuu-data";
import { faker } from '@faker-js/faker';
import { parseFilter } from "@finos/vuu-filter-parser";

let displaySequence = 1;

export const DefaultTable = () => {
  const { typeaheadHook, ...config } = useTableConfig({
    columns: 10,
    count: 1_000,
  });
  const [zebraStripes, setZebraStripes] = useState(true);
  const handleZebraChanged = useCallback((_evt, checked) => {
    setZebraStripes(checked);
  }, []);
  return (
    <div style={{ display: "flex", gap: 12 }}>
      <Table
        {...config}
        height={440}
        renderBufferSize={100}
        rowHeight={20}
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
      <Toolbar>
        <ToggleButton toggled={isColumnBased} onToggle={handleToggleLayout}>
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </Toolbar>
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
      <Toolbar>
        <ToggleButton toggled={isColumnBased} onToggle={handleToggleLayout}>
          {isColumnBased ? "Column based table" : "Row based table"}
        </ToggleButton>
      </Toolbar>
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

function createArray(numofrows: number, numofcolumns: number) {
  const result = [];

  for (let i = 0; i < numofrows; i++) {
    let FakerDataGenerator = [
      faker.company.name(),
      faker.finance.currencyCode(),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 100, max: 2000, dec: 0}),
      faker.finance.transactionType(),
      faker.finance.transactionDescription(),
      faker.date.anytime(),
      faker.finance.accountName(),
      faker.finance.accountNumber(),
      faker.commerce.department(),
      faker.commerce.product(),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
      faker.finance.amount({ min: 5, max: 10, dec: 2}),
    ]
    result.push([
      i+1,
      FakerDataGenerator[0],
      FakerDataGenerator[1],
      FakerDataGenerator[2],
      FakerDataGenerator[3],
      String(Math.floor(Number(FakerDataGenerator[2])*Number(FakerDataGenerator[3]))),
      FakerDataGenerator[4],
      FakerDataGenerator[5],
      FakerDataGenerator[6],
      FakerDataGenerator[7],
      FakerDataGenerator[8],
      FakerDataGenerator[9],
      FakerDataGenerator[10],
      FakerDataGenerator[11],
      FakerDataGenerator[12],
      FakerDataGenerator[13],
      FakerDataGenerator[14],
      FakerDataGenerator[15],
      FakerDataGenerator[16],
      FakerDataGenerator[17],
      FakerDataGenerator[18],
    ]);
  }

  return result;
}


const columns = [
  {name: 'row number', width: 150},
  {name: 'name', width: 100},
  {name: 'currency', width: 100},
  {name: 'price', width: 100},
  {name: 'lot size', width: 100},
  {name: 'order size', width: 100},
  {name: 'order type', width: 100},
  {name: 'order description', width: 100},
  {name: 'order date', width: 100},
  {name: 'account name', width: 100},
  {name: 'account number', width: 100},
  {name: 'department', width: 100},
  {name: 'industry', width: 100},
  {name: 'PE ratio', width: 100},
  {name: 'EPS', width: 100},
  {name: 'market cap', width: 100},
  {name: 'volume', width: 100},
  {name: 'beta', width: 100},
  {name: 'dividend', width: 100},
  {name: 'yield', width: 100},
  {name: 'return on equity', width: 100},
  ]

const numofrows = 10000;
const numofcolumns = columns.length;
const newArray = createArray(numofrows, numofcolumns);

const config = {columns}
const data = newArray

export const SmaTable = () => {
  console.log({config})

  const [inputValue, setInputValue] = useState('');

  const dataSource = useMemo(() => {
  return new ArrayDataSource({columnDescriptors: columns, data: data})
  } , [])

  const handleInputChange = useCallback((event) => {
    setInputValue(event.target.value);
  }, []);

  const handleOnClick = useCallback(() => {
    const filter = inputValue//'industry = "Bike"'
    const filterStruct = parseFilter(filter)
    dataSource.filter = { filter, filterStruct };
  }, [dataSource, inputValue]);
  
  return (
    <>
    <input type="text" value={inputValue} onChange={handleInputChange} />
    <button onClick={handleOnClick}>filter</button>

      <Table
        config={config}
        dataSource={dataSource}
        headerHeight={30}
        height={645}
        renderBufferSize={20}
        rowHeight={30}
        width={715} />
    </>
  );
};
SmaTable.displaySequence = displaySequence++;