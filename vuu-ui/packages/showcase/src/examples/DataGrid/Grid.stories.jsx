import React, { useCallback, useMemo, useRef, useState } from "react";
import { useTestDataSource } from "./useTestDataSource";

import { Grid } from "@vuu-ui/data-grid";
import { RemoteDataSource } from "@vuu-ui/data-remote";

import {
  instrumentSchema,
  instrumentSchemaFixed,
  instrumentSchemaHeaders,
} from "./columnMetaData";

import { Button } from "@vuu-ui/ui-controls";
import { Flexbox, View } from "@vuu-ui/layout";
import { ParsedInput, ParserProvider } from "@vuu-ui/parsed-input";

import { parseFilter, extractFilter } from "@vuu-ui/datagrid-parsers";
import suggestionFactory from "./filter-suggestion-factory";

import "./Grid.stories.css";

// eslint-disable-next-line import/no-anonymous-default-export
export default {
  title: "Grid/Default",
  component: Grid,
};

export const EmptyGrid = () => <Grid />;

export const DefaultGrid = () => {
  const { dataSource, instrumentColumns } = useTestDataSource();
  return (
    <Grid
      dataSource={dataSource}
      columns={instrumentColumns}
      columnSizing="fill"
      height={600}
      selectionModel="extended"
    />
  );
};

export const BasicGrid = () => {
  const { dataSource, instrumentColumns } = useTestDataSource();
  const gridRef = useRef(null);
  const [rowHeight, setRowHeight] = useState(18);

  const incrementProp = () => {
    setRowHeight((value) => value + 1);
  };

  const decrementProp = () => {
    setRowHeight((value) => value - 1);
  };

  const incrementCssProperty = () => {
    const rowHeight = parseInt(
      getComputedStyle(gridRef.current).getPropertyValue("--hw-grid-row-height")
    );
    gridRef.current.style.setProperty(
      "--grid-row-height",
      `${rowHeight + 1}px`
    );
  };

  const decrementCssProperty = () => {
    const rowHeight = parseInt(
      getComputedStyle(gridRef.current).getPropertyValue("--hw-grid-row-height")
    );
    gridRef.current.style.setProperty(
      "--grid-row-height",
      `${rowHeight - 1}px`
    );
  };

  const setLowDensity = () => {
    gridRef.current.style.setProperty("--grid-row-height", `32px`);
  };
  const setHighDensity = () => {
    gridRef.current.style.setProperty("--grid-row-height", `20px`);
  };

  const handleConfigChange = (config) => {
    console.log(`handleConfigChange ${JSON.stringify(config, null, 2)}`);
  };

  const gridStyles = `
    .StoryGrid {
      --hwDataGridCell-border-style: none;
      --hwDataGridRow-background-odd: var(--surface1);
      --hwDataGrid-font-size: 10px;
    }
  `;

  return (
    <>
      <style>{gridStyles}</style>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        // cellSelectionModel="single-cell"
        className="StoryGrid"
        dataSource={dataSource}
        columns={instrumentColumns}
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

export const PersistConfig = () => {
  const configRef = useRef({
    columns: instrumentSchema.columns,
  });
  const [configDisplay, setConfigDisplay] = useState(() => configRef.current);
  const [config, setConfig] = useState(() => configRef.current);
  const [rowHeight, setRowHeight] = useState(18);

  const applyConfig = () => {
    setConfig(configRef.current);
  };

  const dataConfig = useMemo(
    () => ({
      bufferSize: 0,
      columns: instrumentSchema.columns.map((col) => col.name),
      tableName: "instruments",
      configUrl: "/tables/instruments/config.js",
    }),
    []
  );

  const dataSource1 = useMemo(
    () => new RemoteDataSource(dataConfig),
    [dataConfig]
  );

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

  return (
    <>
      <style>{gridStyles}</style>
      <div>
        <input defaultValue="Life is" />
      </div>
      <Grid
        className="StoryGrid"
        dataSource={dataSource1}
        columns={config.columns}
        // columns={instrumentSchema.columns}
        columnSizing="fill"
        height={300}
        onConfigChange={handleConfigChange}
        renderBufferSize={50}
        rowHeight={rowHeight}
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
        columns={instrumentSchemaFixed.columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
    </>
  );
};

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
