import { ToolkitProvider } from "@heswell/uitk-core";
import { useAgGridDataSource } from "@vuu-ui/vuu-data-ag-grid";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { useMemo } from "react";
import { ErrorDisplay, useAutoLoginToVuuServer } from "../utils";
import { createColumnDefs } from "./createColumnDefs";

import "./VuuAgGrid.css";
import "./VuuGrid.css";

let displaySequence = 0;

const instrumentDataSourceConfig = {
  bufferSize: 100,
  columns: [
    "bbg",
    "currency",
    "description",
    "exchange",
    "isin",
    "lotSize",
    "ric",
  ],
  table: { table: "instruments", module: "SIMUL" },
  serverUrl: "127.0.0.1:8090/websocket",
};

export const AgGridInstruments = () => {
  const error = useAutoLoginToVuuServer();

  const { createFilterDataProvider, ...gridConfig } = useAgGridDataSource(
    instrumentDataSourceConfig
  );

  const columnDefs = useMemo(
    () =>
      createColumnDefs(
        createFilterDataProvider(instrumentDataSourceConfig.table)
      ),
    [createFilterDataProvider]
  );

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }
  return (
    <ToolkitProvider density="high">
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

export const AgGridInstrumentsGrouped = () => {
  const error = useAutoLoginToVuuServer();

  const { createFilterDataProvider, ...gridConfig } = useAgGridDataSource({
    ...instrumentDataSourceConfig,
    group: ["currency", "exchange"],
  });

  const columnDefs = useMemo(
    () =>
      createColumnDefs(
        createFilterDataProvider(instrumentDataSourceConfig.table),
        {
          currency: {
            rowGroup: true,
          },
          exchange: {
            rowGroup: true,
          },
        }
      ),
    [createFilterDataProvider]
  );

  console.log({ columnDefs });

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }
  return (
    <ToolkitProvider density="high">
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
AgGridInstrumentsGrouped.displaySequence = displaySequence++;
