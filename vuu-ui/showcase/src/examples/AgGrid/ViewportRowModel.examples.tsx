import { useViewportRowModel } from "@finos/vuu-data-ag-grid";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupChangeEventHandler,
} from "@heswell/salt-lab";
import { SaltProvider } from "@salt-ds/core";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useMemo, useState } from "react";
import { ErrorDisplay, useAutoLoginToVuuServer } from "../utils";
import { createColumnDefs } from "./createColumnDefs";

import { RemoteDataSource } from "@finos/vuu-data";
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
    "ccy", "created", "filledQuantity", "lastUpdate", "orderId", "quantity", "ric", "side", "trader"],
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

export const AgGridTables = () => {
  const error = useAutoLoginToVuuServer();
  const [selectedIndex, setSelectedIndex] = useState<number>(0);

  const dataSource = useMemo(
    () => new RemoteDataSource(dataSourceConfig[selectedIndex]),
    [selectedIndex]
  );

  const { createFilterDataProvider, ...gridConfig } =
    useViewportRowModel(dataSource);

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
    setSelectedIndex(index);
  };

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }

  console.log({ columnDefs });

  return (
    <SaltProvider density="high">
      <ToggleButtonGroup onChange={handleChange} selectedIndex={selectedIndex}>
        <ToggleButton tooltipText="Alert">Instruments</ToggleButton>
        <ToggleButton tooltipText="Home">Orders</ToggleButton>
        <ToggleButton tooltipText="Print">Parent Orders</ToggleButton>
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
    </SaltProvider>
  );
};
AgGridTables.displaySequence = displaySequence++;
