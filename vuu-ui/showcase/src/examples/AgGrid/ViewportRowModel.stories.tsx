import { ToolkitProvider } from "@heswell/uitk-core";
import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import React, { useMemo, useState } from "react";
import { ErrorDisplay, useAutoLoginToVuuServer } from "../utils";
import { createColumnDefs } from "./createColumnDefs";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/uitk-lab";

import "./VuuAgGrid.css";
import "./VuuGrid.css";

let displaySequence = 0;
const serverUrl = "127.0.0.1:8090/websocket";
const module = "SIMUL";

// prettier-ignore
const dataSourceConfig = [
  {
  bufferSize: 100,
  columns: [
    "bbg", "currency", "description", "exchange", "isin", "lotSize", "ric"],
  table: { table: "instruments", module },
  serverUrl,
},  {
  bufferSize: 100,
  columns: [
    "ccy", "created", "filledQuantity", "lastUpdate", "orderId", "quantity", "ric", "size", "trader"],
  table: { table: "orders", module },
  serverUrl,
}, {
  bufferSize: 100,
  columns: [
    "account", "algo", "averagePrice", "ccy", "childCount", "exchange", "filledQty", "id", "idAsInt", "lastUpdate", "openQty", "price", "quantity", "ric", "side", "status", "volLimit"],
  table: { table: "parentOrders", module },
  serverUrl,
}, {
  bufferSize: 100,
  columns: [
    "ask", "askSize", "bid", "bidSize", "close", "last", "open", "phase", "ric", "scenario"],
  table: { table: "prices", module },
  serverUrl,
}
];

export const AgGridInstruments = () => {
  const error = useAutoLoginToVuuServer();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const { createFilterDataProvider, ...gridConfig } = useViewportRowModel(
    dataSourceConfig[selectedIndex]
  );

  const columnDefs = useMemo(
    () =>
      createColumnDefs(
        createFilterDataProvider(dataSourceConfig[selectedIndex].table),
        dataSourceConfig[selectedIndex].table.table
      ),
    [createFilterDataProvider, selectedIndex]
  );

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

  console.log({ columnDefs });

  return (
    <ToolkitProvider density="high">
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

      <div style={{ width: 800, height: 500 }} className="ag-theme-balham">
        <AgGridReact
          {...gridConfig}
          columnDefs={columnDefs}
          headerHeight={24}
          rowGroupPanelShow="always"
          rowHeight={18}
        />
      </div>
    </ToolkitProvider>
  );
};
AgGridInstruments.displaySequence = displaySequence++;
