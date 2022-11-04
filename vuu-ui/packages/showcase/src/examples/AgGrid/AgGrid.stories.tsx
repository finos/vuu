import { ToolkitProvider } from "@heswell/uitk-core";
import { useAgGridDataSource } from "@vuu-ui/ag-grid";
import "ag-grid-community/dist/styles/ag-grid.css";
import "ag-grid-community/dist/styles/ag-theme-balham.css";
import "ag-grid-enterprise";
import { AgGridReact } from "ag-grid-react";
import { CSSProperties, useMemo } from "react";
import { createColumnDefs } from "./createColumnDefs";
import { ErrorDisplay, useAutoLoginToVuuServer } from "../utils";

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

export const AgGridServersideRowModel = () => {
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

  const layout = {
    display: "grid",
    gridTemplateColumns: "1fr",
    gridTemplateRows: "1fr",
    gap: "10px 20px",
    height: 500,
    margin: "10px auto",
    width: 800,
  } as CSSProperties;

  if (error) {
    return <ErrorDisplay>{error}</ErrorDisplay>;
  }
  return (
    <ToolkitProvider density="high">
      <div style={layout}>
        <div className="ag-theme-balham">
          <AgGridReact
            {...gridConfig}
            columnDefs={columnDefs}
            headerHeight={18}
            rowGroupPanelShow="always"
            rowHeight={18}
          />
        </div>
      </div>
    </ToolkitProvider>
  );
};
AgGridServersideRowModel.displaySequence = displaySequence++;
