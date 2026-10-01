import { useEffect, useMemo, useRef, useState } from "react";
import { AgGridReact } from "ag-grid-react";
import type { GridApi, GridReadyEvent } from "ag-grid-community";
import { AllCommunityModule, ModuleRegistry } from "ag-grid-community";
import { ViewportRowModelModule } from "ag-grid-enterprise";
import { useData, toColumnName } from "@vuu-ui/vuu-utils";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";

import type { InstrumentRow } from "../harness/instruments";
import type { BurstResult, TickStats } from "../harness/TickEngine";
import { createFpsCounter, createFrameMetricsRecorder } from "../harness/frameMetrics";
import type { BenchmarkApi } from "../harness/types";
import { columnDefs } from "./columnDefs";
import { VuuViewportDatasource } from "./vuuViewportBridge";

ModuleRegistry.registerModules([AllCommunityModule, ViewportRowModelModule]);

const BENCHMARK_MODULE = "BENCHMARK";

const getRowCountFromUrl = (): 10000 | 100000 => {
  const params = new URLSearchParams(window.location.search);
  return params.get("rows") === "100000" ? 100000 : 10000;
};

const getTableName = (rowCount: 10000 | 100000) =>
  rowCount === 100000 ? "benchmarkInstruments100k" : "benchmarkInstruments10k";

/**
 * ag-grid pointed at VUU's *real* server (the same one VuuBenchmarkPage
 * uses), via ag-grid's Viewport Row Model rather than either the
 * client-side or Server-Side Row Model used by the other two ag-grid
 * variants. This is the closest apples-to-apples comparison: same backend,
 * same wire protocol, same RPCs - the only variable is which grid library
 * renders the client side.
 */
export const AgGridVuuBackendPage = () => {
  const rowCount = useMemo(getRowCountFromUrl, []);
  const tableName = getTableName(rowCount);
  const { VuuDataSource, getServerAPI } = useData();
  const [schema, setSchema] = useState<TableSchema | undefined>(undefined);
  const gridApiRef = useRef<GridApi<InstrumentRow> | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const serverAPI = await getServerAPI();
      const tableSchema = await serverAPI.getTableSchema({
        module: BENCHMARK_MODULE,
        table: tableName,
      });
      if (!cancelled) setSchema(tableSchema);
    })();
    return () => {
      cancelled = true;
    };
  }, [getServerAPI, tableName]);

  const dataSource = useMemo(() => {
    return schema
      ? new VuuDataSource({
          columns: schema.columns.map(toColumnName),
          table: schema.table,
        })
      : undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [VuuDataSource, schema]);

  const viewportDatasource = useMemo(
    () => (dataSource ? new VuuViewportDatasource(dataSource) : undefined),
    [dataSource],
  );

  useEffect(() => {
    if (!dataSource || !viewportDatasource) return;

    const frameMetrics = createFrameMetricsRecorder();
    const fpsCounter = createFpsCounter();

    // BenchmarkTickProvider (Scala) tracks its own per-message scheduling
    // drift the same way TickEngine.ts does client/feed-server-side, so
    // getStreamStats returns the authoritative stats directly.
    const rpc = (rpcName: string, params: Record<string, VuuRowDataItemType>) =>
      dataSource.rpcRequest?.({ type: "RPC_REQUEST", rpcName, params });

    const api: BenchmarkApi = {
      rowCount,
      resetDataset: async () => {
        const response = await rpc("resetDataset", {});
        if (response?.type !== "SUCCESS_RESULT") {
          throw new Error(`resetDataset RPC failed: ${JSON.stringify(response)}`);
        }
      },
      startTicking: (updatesPerSecond, updatesPerMessage = 100) => {
        rpc("startTicking", { updatesPerSecond, updatesPerMessage });
      },
      stopTicking: () => {
        rpc("stopTicking", {});
      },
      fireBurst: async (totalUpdates, updatesPerMessage = 100) => {
        const response = await rpc("fireBurst", { totalUpdates, updatesPerMessage });
        if (response?.type === "SUCCESS_RESULT") {
          return response.data as BurstResult;
        }
        throw new Error(`fireBurst RPC failed: ${JSON.stringify(response)}`);
      },
      getTickStats: async (): Promise<TickStats> => {
        const response = await rpc("getStreamStats", {});
        if (response?.type !== "SUCCESS_RESULT") {
          throw new Error(`getStreamStats RPC failed: ${JSON.stringify(response)}`);
        }
        return response.data as TickStats;
      },
      resetTickStats: () => {
        rpc("resetStreamStats", {});
      },
      startFpsCounter: () => fpsCounter.start(),
      stopFpsCounter: () => fpsCounter.stop(),
      getFrameMetrics: () => frameMetrics.getMetrics(),
      resetFrameMetrics: () => frameMetrics.reset(),
      applySort: (column, direction) => {
        viewportDatasource.sort(column, direction);
      },
      applyFilter: (column, op, value) => {
        const opSymbol = op === "eq" ? "=" : op === "gt" ? ">" : "<";
        const formattedValue = typeof value === "string" ? `"${value}"` : value;
        viewportDatasource.filter(`${column} ${opSymbol} ${formattedValue}`);
      },
      clearFilter: () => {
        viewportDatasource.filter("");
      },
    };
    window.__benchmark = api;

    return () => {
      frameMetrics.disconnect();
      viewportDatasource.destroy();
      delete window.__benchmark;
    };
  }, [dataSource, viewportDatasource, rowCount]);

  const onGridReady = (event: GridReadyEvent<InstrumentRow>) => {
    gridApiRef.current = event.api;
  };

  if (!viewportDatasource) {
    return <div data-testid="ag-grid-benchmark-grid-loading">Connecting to VUU server...</div>;
  }

  return (
    <div
      className="ag-theme-quartz"
      data-testid="ag-grid-benchmark-grid"
      style={{ height: "100vh", width: "100vw" }}
    >
      <AgGridReact<InstrumentRow>
        columnDefs={columnDefs}
        onGridReady={onGridReady}
        rowModelType="viewport"
        viewportDatasource={viewportDatasource}
      />
    </div>
  );
};
