import { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { GridApi, GridReadyEvent } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";

import type { InstrumentRow } from "../harness/instruments";
import type { BurstResult, TickStats } from "../harness/TickEngine";
import { createFpsCounter, createFrameMetricsRecorder } from "../harness/frameMetrics";
import type { BenchmarkApi } from "../harness/types";
import { columnDefs } from "./columnDefs";

ModuleRegistry.registerModules([AllCommunityModule]);

const FEED_SERVER_URL = "ws://localhost:4000/feed";

const getRowCountFromUrl = (): 10000 | 100000 => {
  const params = new URLSearchParams(window.location.search);
  return params.get("rows") === "100000" ? 100000 : 10000;
};

// Server (feed-server/server.ts) push messages, and the request/response
// pairs used for fireBurst / getStreamStats (correlated by requestId since
// a plain WebSocket has no built-in call-and-reply semantics).
type ServerMessage =
  | { type: "init"; rows: InstrumentRow[] }
  | { type: "update"; rows: InstrumentRow[] }
  | ({ type: "burstResult"; requestId: number } & BurstResult)
  | ({ type: "streamStats"; requestId: number } & TickStats);

/**
 * ag-grid's normal client-side row model: the browser holds the full
 * dataset and sorts/filters/updates it itself. Compare against
 * AgGridServerBenchmarkPage, which uses the Enterprise Server-Side Row
 * Model instead (server holds the data, browser holds only loaded blocks).
 */
export const AgGridClientBenchmarkPage = () => {
  const rowCount = useMemo(getRowCountFromUrl, []);
  const [rowData, setRowData] = useState<InstrumentRow[] | undefined>(undefined);
  const gridApiRef = useRef<GridApi<InstrumentRow> | undefined>(undefined);

  useEffect(() => {
    const ws = new WebSocket(`${FEED_SERVER_URL}?rows=${rowCount}&mode=client`);
    const frameMetrics = createFrameMetricsRecorder();
    const fpsCounter = createFpsCounter();

    // Pending fireBurst/getStreamStats calls, keyed by requestId, resolved
    // when the matching response message arrives.
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

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as ServerMessage;
      if (message.type === "init") {
        setRowData(message.rows);
      } else if (message.type === "update") {
        gridApiRef.current?.applyTransactionAsync({ update: message.rows });
      } else if (message.type === "burstResult" || message.type === "streamStats") {
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
        gridApiRef.current?.applyColumnState({
          state: [{ colId: column, sort: direction === "asc" ? "asc" : "desc" }],
          defaultState: { sort: null },
        });
      },
      applyFilter: async (column, op, value) => {
        const api = gridApiRef.current;
        if (!api) return;
        const filterType = typeof value === "string" ? "text" : "number";
        const opType =
          op === "eq"
            ? "equals"
            : op === "gt"
              ? "greaterThan"
              : "lessThan";
        await api.setColumnFilterModel(column, { filterType, type: opType, filter: value });
        api.onFilterChanged();
      },
      clearFilter: async () => {
        const api = gridApiRef.current;
        if (!api) return;
        api.setFilterModel(null);
      },
    };
    window.__benchmark = api;

    return () => {
      frameMetrics.disconnect();
      ws.close();
      delete window.__benchmark;
    };
  }, [rowCount]);

  const onGridReady = (event: GridReadyEvent<InstrumentRow>) => {
    gridApiRef.current = event.api;
  };

  if (!rowData) {
    return <div data-testid="ag-grid-benchmark-grid-loading">Connecting to feed server...</div>;
  }

  return (
    <div
      className="ag-theme-quartz"
      data-testid="ag-grid-benchmark-grid"
      style={{ height: "100vh", width: "100vw" }}
    >
      <AgGridReact<InstrumentRow>
        rowData={rowData}
        columnDefs={columnDefs}
        getRowId={(params) => params.data.ric}
        onGridReady={onGridReady}
        asyncTransactionWaitMillis={0}
      />
    </div>
  );
};
