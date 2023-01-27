import { Grid } from "@finos/vuu-datagrid";
import { DatagridSettingsPanel } from "@finos/vuu-datagrid-extras";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { Flexbox, View } from "@finos/vuu-layout";
import { Dialog } from "@finos/vuu-popups";
import {
  FormField,
  Input,
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
  Toolbar,
  ToolbarButton,
  Tooltray,
} from "@heswell/salt-lab";
import { Button } from "@salt-ds/core";
import { ReactElement, useCallback, useMemo, useRef, useState } from "react";
import { ErrorDisplay, useSchemas, useTestDataSource } from "../utils";
import { instrumentSchema } from "./columnMetaData";

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
  const [dialogContent, setDialogContent] = useState<ReactElement | null>(null);
  const { schemas } = useSchemas();
  const { columns, dataSource, error } = useTestDataSource({
    schemas,
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

  const handleConfigChange = useCallback((config: GridConfig) => {
    console.log("config change", {
      config,
    });
  }, []);

  const showSettings = useCallback(() => {
    setDialogContent(
      <DatagridSettingsPanel
        availableColumns={columns}
        gridConfig={{
          columns,
        }}
        onConfigChange={handleConfigChange}
      />
    );
  }, [columns, handleConfigChange]);

  const hideSettings = useCallback(() => {
    setDialogContent(null);
  }, []);

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  return (
    <>
      <Toolbar style={{ alignItems: "center", width: 700 }}>
        <ToggleButtonGroup
          onChange={handleChange}
          selectedIndex={selectedIndex}
        >
          <ToggleButton tooltipText="Alert">Instruments</ToggleButton>
          <ToggleButton tooltipText="Home">Orders</ToggleButton>
          <ToggleButton tooltipText="Print">Parent Orders</ToggleButton>
          <ToggleButton tooltipText="Search">Prices</ToggleButton>
        </ToggleButtonGroup>
        <ToolbarButton
          data-align-end
          data-icon="settings"
          onClick={showSettings}
          style={{ width: 28 }}
        />
      </Toolbar>

      <Grid
        dataSource={dataSource}
        columns={columns}
        // columnSizing="fill"
        height={600}
        selectionModel="extended"
        width={900}
      />
      <Dialog isOpen={dialogContent !== null} onClose={hideSettings}>
        {dialogContent}
      </Dialog>
    </>
  );
};
DefaultGrid.displaySequence = displaySequence++;

export const BasicGrid = () => {
  const { schemas } = useSchemas();
  const { columns, dataSource, error } = useTestDataSource({
    schemas,
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

  const { schemas } = useSchemas();
  const { columns, dataSource, error } = useTestDataSource({
    schemas,
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

export const BasicGridColumnFixedCols = () => {
  const gridRef = useRef(null);

  const { schemas } = useSchemas();
  const { columns, dataSource, error } = useTestDataSource({
    schemas,
    tablename: "parentOrders",
  });

  const fixedColumns = useMemo(
    () =>
      columns.map((column) =>
        column.name === "account" || column.name === "algo"
          ? {
              ...column,
              locked: true,
            }
          : column
      ),

    [columns]
  );

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
        columns={fixedColumns}
        height={600}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
      />
    </>
  );
};

BasicGridColumnFixedCols.displaySequence = displaySequence++;

export const ColumnHeaders1Level = () => {
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

ColumnHeaders1Level.displaySequence = displaySequence++;

export const SizeSpecifiedInProps = () => {
  const gridRef = useRef(null);

  const { columns, dataSource, error } = useTestDataSource({
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
        height={400}
        ref={gridRef}
        renderBufferSize={20}
        style={{ margin: 10, border: "solid 1px #ccc" }}
        width={700}
      />
    </>
  );
};

SizeSpecifiedInProps.displaySequence = displaySequence++;

export const GridResize = () => {
  const { schemas } = useSchemas();
  const {
    columns: cols1,
    dataSource: ds1,
    error: err1,
  } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });
  const {
    columns: cols2,
    dataSource: ds2,
    error: err2,
  } = useTestDataSource({
    schemas,
    tablename: "instruments",
  });

  if (err1) {
    return <ErrorDisplay>{err1}</ErrorDisplay>;
  } else if (err2) {
    return <ErrorDisplay>{err2}</ErrorDisplay>;
  }

  return (
    <Flexbox
      style={{
        width: 800,
        height: 600,
        flexDirection: "row",
        border: "solid 1px lightgrey",
      }}
    >
      <View resizeable style={{ flex: 1 }}>
        <Grid
          dataSource={ds1}
          columns={cols1}
          style={{ border: "solid 1px #ccc" }}
        />
      </View>
      <View resizeable style={{ flex: 1 }}>
        <Grid
          dataSource={ds2}
          columns={cols2}
          style={{ border: "solid 1px #ccc" }}
        />
      </View>
    </Flexbox>
  );
};

GridResize.displaySequence = displaySequence++;

export const ColumnHeaders2Levels = () => {
  const gridRef = useRef(null);

  const { columns, dataSource, error } = useTestDataSource({
    columnConfig: {
      bbg: { heading: ["BBG", "Group 1", "Instrument"] },
      isin: { heading: ["ISIN", "Group 1", "Instrument"] },
      ric: { heading: ["RIC", "Group 2", "Instrument"] },
      description: { heading: ["Description", "Group 2", "Instrument"] },
      currency: { heading: ["Currency", "Group 3", "Exchange Details"] },
      exchange: { heading: ["Exchange", "Group 3", "Exchange Details"] },
      lotSize: { heading: ["Lot Size", "Group 4", "Exchange Details"] },
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

ColumnHeaders2Levels.displaySequence = displaySequence++;

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
    dataSource.range = { from, to };
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
