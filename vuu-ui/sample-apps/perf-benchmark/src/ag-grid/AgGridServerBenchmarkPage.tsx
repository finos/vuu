import { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type {
  GridApi,
  GridReadyEvent,
  IServerSideDatasource,
  IServerSideGetRowsParams,
} from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ServerSideRowModelModule, ServerSideRowModelApiModule } from "ag-grid-enterprise";

import type { InstrumentRow } from "../harness/instruments";
import type { BurstResult, TickStats } from "../harness/TickEngine";
import { createFpsCounter, createFrameMetricsRecorder } from "../harness/frameMetrics";
import type { BenchmarkApi } from "../harness/types";
import { columnDefs } from "./columnDefs";

// No license key set - this is local benchmarking only, never distributed,
// so the evaluation watermark/console warning ag-grid shows without one is
// fine to leave as-is.
ModuleRegistry.registerModules([
  AllCommunityModule,
  ServerSideRowModelModule,
  ServerSideRowModelApiModule,
]);

const FEED_SERVER_URL = "ws://localhost:4000/feed";

const getRowCountFromUrl = (): 10000 | 100000 => {
  const params = new URLSearchParams(window.location.search);
  return params.get("rows") === "100000" ? 100000 : 10000;
};

type ServerMessage =
  | { type: "ready" }
  | { type: "update"; rows: InstrumentRow[] }
  | ({ type: "burstResult"; requestId: number } & BurstResult)
  | ({ type: "streamStats"; requestId: number } & TickStats)
  | { type: "rowsResult"; requestId: number; rows: InstrumentRow[]; rowCount: number };

/**
 * ag-grid's Enterprise Server-Side Row Model (SSRM): unlike
 * AgGridClientBenchmarkPage, the browser never holds the full dataset - it
 * requests row blocks on demand (getRows), and the feed server does the
 * sorting/filtering/paging. This is the variant intended to be structurally
 * comparable to how VUU's real client behaves (thin client, server does the
 * heavy lifting), so the sort/filter/scroll numbers here are the ones worth
 * weighing against VUU's, not the client-side row model's.
 */
export const AgGridServerBenchmarkPage = () => {
  const rowCount = useMemo(getRowCountFromUrl, []);
  const [connected, setConnected] = useState(false);
  const gridApiRef = useRef<GridApi<InstrumentRow> | undefined>(undefined);
  const wsRef = useRef<WebSocket | undefined>(undefined);

  useEffect(() => {
    const ws = new WebSocket(`${FEED_SERVER_URL}?rows=${rowCount}&mode=server`);
    wsRef.current = ws;
    const frameMetrics = createFrameMetricsRecorder();
    const fpsCounter = createFpsCounter();

    let nextRequestId = 1;
    const pending = new Map<number, (message: ServerMessage) => void>();

    const send = (message: Record<string, unknown>) => ws.send(JSON.stringify(message));

    const request = (message: Record<string, unknown>): Promise<ServerMessage> => {
      const requestId = nextRequestId++;
      return new Promise((resolve) => {
        pending.set(requestId, resolve);
        send({ ...message, requestId });
      });
    };

    ws.onopen = () => setConnected(true);

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerMessage;
      if (message.type === "update") {
        gridApiRef.current?.applyServerSideTransactionAsync({ update: message.rows });
      } else if (
        message.type === "burstResult" ||
        message.type === "streamStats" ||
        message.type === "rowsResult"
      ) {
        pending.get(message.requestId)?.(message);
        pending.delete(message.requestId);
      }
    };

    const api: BenchmarkApi = {
      rowCount,
      // Already reset over HTTP before this page navigated - see gotoGrid.
      // Kept as a no-op so BenchmarkApi's contract is uniform across variants.
      resetDataset: () => {},
      startTicking: (updatesPerSecond, updatesPerMessage = 100) => {
        send({ type: "startTicking", updatesPerSecond, updatesPerMessage });
      },
      stopTicking: () => {
        send({ type: "stopTicking" });
      },
      fireBurst: async (totalUpdates, updatesPerMessage = 100) => {
        const result = await request({ type: "fireBurst", totalUpdates, updatesPerMessage });
        if (result.type !== "burstResult") {
          throw new Error(`unexpected response to fireBurst: ${JSON.stringify(result)}`);
        }
        return result;
      },
      getTickStats: async (): Promise<TickStats> => {
        const result = await request({ type: "getStreamStats" });
        if (result.type !== "streamStats") {
          throw new Error(`unexpected response to getStreamStats: ${JSON.stringify(result)}`);
        }
        return result;
      },
      resetTickStats: () => {
        send({ type: "resetStreamStats" });
      },
      startFpsCounter: () => fpsCounter.start(),
      stopFpsCounter: () => fpsCounter.stop(),
      getFrameMetrics: () => frameMetrics.getMetrics(),
      resetFrameMetrics: () => frameMetrics.reset(),
      applySort: (column, direction) => {
        // Changing column state on an SSRM grid automatically triggers a
        // fresh getRows request with the new sortModel - no manual refresh needed.
        gridApiRef.current?.applyColumnState({
          state: [{ colId: column, sort: direction === "asc" ? "asc" : "desc" }],
          defaultState: { sort: null },
        });
      },
      applyFilter: async (column, op, value) => {
        const api = gridApiRef.current;
        if (!api) return;
        const filterType = typeof value === "string" ? "text" : "number";
        const opType = op === "eq" ? "equals" : op === "gt" ? "greaterThan" : "lessThan";
        // Same as the client-side row model: this triggers a fresh getRows
        // request under the hood once onFilterChanged fires.
        await api.setColumnFilterModel(column, { filterType, type: opType, filter: value });
        api.onFilterChanged();
      },
      clearFilter: async () => {
        gridApiRef.current?.setFilterModel(null);
      },
    };
    window.__benchmark = api;

    return () => {
      frameMetrics.disconnect();
      ws.close();
      delete window.__benchmark;
    };
  }, [rowCount]);

  const serverSideDatasource = useMemo<IServerSideDatasource<InstrumentRow>>(
    () => ({
      getRows: (params: IServerSideGetRowsParams<InstrumentRow>) => {
        const ws = wsRef.current;
        if (!ws || ws.readyState !== WebSocket.OPEN) {
          params.fail();
          return;
        }
        const requestId = Date.now() + Math.random();
        const handleMessage = (event: MessageEvent) => {
          const message = JSON.parse(event.data) as ServerMessage;
          if (message.type === "rowsResult" && message.requestId === requestId) {
            ws.removeEventListener("message", handleMessage);
            params.success({ rowData: message.rows, rowCount: message.rowCount });
          }
        };
        ws.addEventListener("message", handleMessage);
        ws.send(
          JSON.stringify({
            type: "getRows",
            requestId,
            startRow: params.request.startRow,
            endRow: params.request.endRow,
            sortModel: params.request.sortModel,
            filterModel: params.request.filterModel,
          }),
        );
      },
    }),
    [],
  );

  const onGridReady = (event: GridReadyEvent<InstrumentRow>) => {
    gridApiRef.current = event.api;
  };

  if (!connected) {
    return <div data-testid="ag-grid-benchmark-grid-loading">Connecting to feed server...</div>;
  }

  return (
    <div
      className="ag-theme-quartz"
      data-testid="ag-grid-benchmark-grid"
      style={{ height: "100vh", width: "100vw" }}
    >
      <AgGridReact<InstrumentRow>
        columnDefs={columnDefs}
        getRowId={(params) => params.data.ric}
        onGridReady={onGridReady}
        rowModelType="serverSide"
        serverSideDatasource={serverSideDatasource}
        cacheBlockSize={100}
        asyncTransactionWaitMillis={0}
      />
    </div>
  );
};
