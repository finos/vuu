import { Button } from "@heswell/uitk-core";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/uitk-lab";
import { useCallback, useMemo, useRef, useState } from "react";
import { ErrorDisplay, useTestDataSource } from "../utils";

import { Grid } from "@vuu-ui/data-grid";
import { RemoteDataSource } from "@vuu-ui/data-remote";

import {
  instrumentSchema,
  instrumentSchemaFixed,
  instrumentSchemaHeaders,
} from "./columnMetaData";

import { Flexbox, View } from "@vuu-ui/layout";
import { ParsedInput, ParserProvider } from "@vuu-ui/parsed-input";

import { extractFilter, parseFilter } from "@vuu-ui/datagrid-parsers";
import suggestionFactory from "./filter-suggestion-factory";

import "./Grid.stories.css";

export default {
  title: "Grid/Default",
  component: Grid,
};

let displaySequence = 1;

// export const EmptyGrid = () => <Grid />;
// EmptyGrid.displaySequence = displaySequence++;

export const DefaultGrid = () => {
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
        <ToggleButton ariaLabel="alert" tooltipText="Alert">
          Instruments
        </ToggleButton>
        <ToggleButton ariaLabel="home" tooltipText="Home">
          Orders
        </ToggleButton>
        <ToggleButton ariaLabel="print" tooltipText="Print">
          Parent Orders
        </ToggleButton>
        <ToggleButton tooltipText="Search">Prices</ToggleButton>
      </ToggleButtonGroup>

      <Grid
        dataSource={dataSource}
        columns={columns}
        columnSizing="fill"
        height={600}
        selectionModel="extended"
      />
    </>
  );
};
DefaultGrid.displaySequence = displaySequence++;

export const BasicGrid = () => {
  const { columns, dataSource, error } = useTestDataSource({
    tablename: "instruments",
  });
  const gridRef = useRef<HTMLDivElement>(null);
  const [rowHeight, setRowHeight] = useState(18);

  const incrementProp = () => {
    setRowHeight((value) => value + 1);
  };

  const decrementProp = () => {
    setRowHeight((value) => value - 1);
  };

  const incrementCssProperty = () => {
    if (gridRef.current) {
      const rowHeight = parseInt(
        getComputedStyle(gridRef.current).getPropertyValue(
          "--hw-grid-row-height"
        )
      );
      gridRef.current.style.setProperty(
        "--grid-row-height",
        `${rowHeight + 1}px`
      );
    }
  };

  const decrementCssProperty = () => {
    if (gridRef.current) {
      const rowHeight = parseInt(
        getComputedStyle(gridRef.current).getPropertyValue(
          "--hw-grid-row-height"
        )
      );
      gridRef.current?.style.setProperty(
        "--grid-row-height",
        `${rowHeight - 1}px`
      );
    }
  };

  const setLowDensity = () => {
    gridRef.current?.style.setProperty("--grid-row-height", `32px`);
  };
  const setHighDensity = () => {
    gridRef.current?.style.setProperty("--grid-row-height", `20px`);
  };

  const handleConfigChange = (config) => {
    console.log(`handleConfigChange ${JSON.stringify(config, null, 2)}`);
  };

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <Grid
        // cellSelectionModel="single-cell"
        className="StoryGrid"
        dataSource={dataSource}
        columns={columns}
        // columnSizing="fill"
        height={624}
        onConfigChange={handleConfigChange}
        ref={gridRef}
        renderBufferSize={50}
        rowHeight={rowHeight}
        selectionModel="single"
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
      <br />
      <button onClick={incrementProp}>Increase row height prop</button>
      <button onClick={decrementProp}>Decrease row height prop</button>
      <button onClick={incrementCssProperty}>
        Increase row height custom property
      </button>
      <button onClick={decrementCssProperty}>
        Decrease row height custom property
      </button>
      <br />
      <button onClick={setHighDensity}>High Density</button>
      <button onClick={setLowDensity}>Low Density</button>
    </>
  );
};

BasicGrid.displaySequence = displaySequence++;

export const PersistConfig = () => {
  const configRef = useRef({
    columns: instrumentSchema.columns,
  });
  const [configDisplay, setConfigDisplay] = useState(() => configRef.current);
  const [config, setConfig] = useState(() => configRef.current);

  const applyConfig = () => {
    setConfig(configRef.current);
  };

  const { columns, dataSource, error } = useTestDataSource({
    tablename: "instruments",
  });

  const handleConfigChange = useCallback(
    (updates) => {
      configRef.current = { ...config, ...updates };
      setConfigDisplay(configRef.current);
    },
    [config]
  );

  const gridStyles = `
    .StoryGrid {
      --hwDataGridCell-border-style: none;
      --hwDataGridRow-background-odd: var(--surface1);
      --hwDataGrid-font-size: 10px;
    }
  `;

  console.log(`render`, config);

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <style>{gridStyles}</style>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        className="StoryGrid"
        dataSource={dataSource}
        columns={columns}
        // columns={instrumentSchema.columns}
        columnSizing="fill"
        height={300}
        onConfigChange={handleConfigChange}
        renderBufferSize={50}
        selectionModel="single"
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
      <textarea
        readOnly
        style={{ height: 500, margin: "0 10px", width: "calc(100% - 20px)" }}
        value={JSON.stringify(configDisplay, null, 2)}
      />
      <Button onClick={applyConfig}>Apply Config</Button>
    </>
  );
};
PersistConfig.displaySequence = displaySequence++;

// export const BasicGridColumnLabels = () => {
//   const gridRef = useRef(null)

//   const dataConfig = useMemo(() => ({
//     bufferSize: 100,
//     columns: instrumentSchemaLabels.columns.map(col => col.name),
//     tableName: 'instruments',
//     configUrl: '/tables/instruments/config.js',
//   }),[]);

//   const dataSource = useMemo(() => new RemoteDataSource(dataConfig), [dataConfig]);

//   return <>
//     <div>
//       <input defaultValue="Life is" />
//     </div>
//     <Grid
//       dataSource={dataSource}
//       columns={instrumentSchemaLabels.columns}
//       height={600}
//       ref={gridRef}
//       renderBufferSize={20}
//       style={{ margin: 10, border: 'solid 1px #ccc' }}
//     />
//   </>;
// };

export const BasicGridColumnFixedCols = () => {
  const gridRef = useRef(null);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchemaFixed.columns.map((col) => col.name),
      tableName: "instruments",
      configUrl: "/tables/instruments/config.js",
    }),
    []
  );

  const { columns, dataSource, error } = useTestDataSource({
    columnConfig: { description: { locked: true } },
    tablename: "instruments",
  });

  console.log({ columns });

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        dataSource={dataSource}
        columns={columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
    </>
  );
};

BasicGridColumnFixedCols.displaySequence = displaySequence++;

export const BasicGridColumnHeaders = () => {
  const gridRef = useRef(null);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchema.columns.map((col) => col.name),
      tableName: "instruments",
      configUrl: "/tables/instruments/config.js",
    }),
    []
  );

  const dataSource = useMemo(
    () => new RemoteDataSource(dataConfig),
    [dataConfig]
  );

  return (
    <>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        dataSource={dataSource}
        columns={instrumentSchemaHeaders.columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
    </>
  );
};

BasicGridColumnHeaders.displaySequence = displaySequence++;

export const BasicGridWithFilter = () => {
  const gridRef = useRef(null);
  const [namedFilters, setNamedFilters] = useState([]);

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchema.columns.map((col) => col.name),
      tableName: "instruments",
      configUrl: "/tables/instruments/config.js",
    }),
    []
  );

  const dataSource = useMemo(
    () => new RemoteDataSource(dataConfig),
    [dataConfig]
  );

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    dataSource.filterQuery(filter);
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  return (
    <>
      <ParserProvider
        parser={parseFilter}
        suggestionFactory={suggestionFactory({
          columnNames: dataConfig.columns,
          namedFilters,
        })}
      >
        <div style={{ width: 600, flex: "0 0 32px" }}>
          <ParsedInput onCommit={handleCommit} />
        </div>
      </ParserProvider>
      <Grid
        dataSource={dataSource}
        columns={instrumentSchema.columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ border: "solid 1px #ccc" }}
      />
    </>
  );
};

export const FilteredGridInLayout = () => {
  return (
    <Flexbox style={{ width: 800, height: 600, flexDirection: "column" }}>
      <View title="DataGrid" header style={{ flex: 1 }} resizeable>
        <BasicGridWithFilter />
      </View>
      <div style={{ flex: 1, backgroundColor: "blue" }} data-resizeable></div>
    </Flexbox>
  );
};

BasicGridWithFilter.displaySequence = displaySequence++;
