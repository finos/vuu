import { VuuDataSourceProvider } from "@vuu-ui/vuu-data-react";
import { VuuBenchmarkPage } from "./vuu/VuuBenchmarkPage";
import { AgGridClientBenchmarkPage } from "./ag-grid/AgGridClientBenchmarkPage";
import { AgGridServerBenchmarkPage } from "./ag-grid/AgGridServerBenchmarkPage";
import { AgGridVuuBackendPage } from "./ag-grid/AgGridVuuBackendPage";

const VUU_WEBSOCKET_URL = "ws://localhost:8090/websocket";

type Grid = "vuu" | "ag-grid-client" | "ag-grid-server" | "ag-grid-vuu";

const GRID_VALUES: Grid[] = ["vuu", "ag-grid-client", "ag-grid-server", "ag-grid-vuu"];

const getGridFromUrl = (): Grid => {
  const params = new URLSearchParams(window.location.search);
  const grid = params.get("grid");
  return (GRID_VALUES as string[]).includes(grid ?? "") ? (grid as Grid) : "vuu";
};

export const App = () => {
  const grid = getGridFromUrl();
  if (grid === "ag-grid-client") {
    return <AgGridClientBenchmarkPage />;
  }
  if (grid === "ag-grid-server") {
    return <AgGridServerBenchmarkPage />;
  }
  // "vuu" and "ag-grid-vuu" both talk to the real VUU server, so both need
  // the connection context.
  return (
    <VuuDataSourceProvider
      autoConnect
      authenticate={false}
      websocketUrl={VUU_WEBSOCKET_URL}
    >
      {grid === "ag-grid-vuu" ? <AgGridVuuBackendPage /> : <VuuBenchmarkPage />}
    </VuuDataSourceProvider>
  );
};
