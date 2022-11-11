import { Button, FormField, Input } from "@heswell/uitk-core";
import { Toolbar, Tooltray } from "@heswell/uitk-lab";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/uitk-lab";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { ErrorDisplay, useTestDataSource } from "../utils";

import { Grid } from "@vuu-ui/vuu-datagrid";

import { instrumentSchema } from "./columnMetaData";

import { Flexbox, View } from "@vuu-ui/vuu-layout";
import { VuuFilter } from "../utils/VuuFilter";
import { extractFilter } from "@vuu-ui/datagrid-parsers";

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

  const { columns, dataSource, error } = useTestDataSource({
    columnConfig: {
      description: { label: "Description", locked: true },
      bbg: { label: "BBG" },
      currency: { label: "Currency" },
      exchange: { label: "Exchange" },
      isin: { label: "ISIN" },
      lotSize: { label: "Lot Size" },
      ric: { label: "RIC" },
    },

    tablename: "instruments",
  });

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

  const { columns, dataSource, error } = useTestDataSource({
    columnConfig: {
      bbg: { heading: ["BBG", "Instrument"] },
      isin: { heading: ["ISIN", "Instrument"] },
      ric: { heading: ["RIC", "Instrument"] },
      description: { heading: ["Description", "Instrument"] },
      currency: { heading: ["Currency", "Exchange Details"] },
      exchange: { heading: ["Exchange", "Exchange Details"] },
      lotSize: { heading: ["Lot Size", "Exchange Details"] },
    },
    tablename: "instruments",
  });

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

BasicGridColumnHeaders.displaySequence = displaySequence++;

export const BasicGridWithFilter = () => {
  const gridRef = useRef(null);
  const [namedFilters, setNamedFilters] = useState([]);

  const { columns, dataSource, error } = useTestDataSource({
    tablename: "instruments",
  });

  const handleCommit = (result) => {
    const { filter, name } = extractFilter(result);
    dataSource.filterQuery(filter);
    if (name) {
      setNamedFilters(namedFilters.concat({ name, filter }));
    }
  };

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <VuuFilter columns={columns} />
      <Grid
        dataSource={dataSource}
        columns={columns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ border: "solid 1px #ccc" }}
      />
    </>
  );
};
BasicGridWithFilter.displaySequence = displaySequence++;

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

FilteredGridInLayout.displaySequence = displaySequence++;

export const BufferVariations = () => {
  const { columns, dataSource, error } = useTestDataSource({
    bufferSize: 10,
    tablename: "instruments",
  });
  const gridRef = useRef<HTMLDivElement>(null);

  const handleConfigChange = (config) => {
    console.log(`handleConfigChange ${JSON.stringify(config, null, 2)}`);
  };

  const [bufferSize, setBufferSize] = useState(10);
  const [from, setFrom] = useState(0);
  const [to, setTo] = useState(10);

  const handleSetBufferSize = useCallback(
    (evt, value) => setBufferSize(value),
    []
  );
  const handleSetFrom = useCallback(
    (evt, value) => setFrom(parseInt(value, 10)),
    []
  );
  const handleSetTo = useCallback(
    (evt, value) => setTo(parseInt(value, 10)),
    []
  );

  const handleSetRange = useCallback(() => {
    console.log(`setRange ${from} - ${to}`);
    dataSource.setRange(from, to);
  }, [dataSource, from, to]);

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <Grid
        dataSource={dataSource}
        columns={columns}
        // columnSizing="fill"
        headerHeight={36}
        height={380}
        onConfigChange={handleConfigChange}
        ref={gridRef}
        renderBufferSize={0}
        rowHeight={36}
        selectionModel="single"
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
      <br />
      <Toolbar>
        <Tooltray>
          <FormField label="buffer size" labelPlacement="left">
            <Input
              onChange={handleSetBufferSize}
              value={`${bufferSize}`}
              style={{ width: 50 }}
            />
          </FormField>
        </Tooltray>
        <Tooltray>
          <FormField label="from" labelPlacement="left">
            <Input
              onChange={handleSetFrom}
              value={from}
              style={{ width: 50 }}
            />
          </FormField>
          <FormField label="to" labelPlacement="left">
            <Input onChange={handleSetTo} value={to} style={{ width: 50 }} />
          </FormField>
          <Button onClick={handleSetRange}>set range</Button>
        </Tooltray>
      </Toolbar>
    </>
  );
};

BufferVariations.displaySequence = displaySequence++;
