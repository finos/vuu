import { useEffect, useMemo, useState } from "react";
import { Table } from "@vuu-ui/vuu-table";
import type { TableConfig } from "@vuu-ui/vuu-table-types";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { useData, toColumnName } from "@vuu-ui/vuu-utils";

import "@vuu-ui/vuu-theme/index.css";
import "@vuu-ui/vuu-icons/index.css";

import { INSTRUMENT_COLUMNS } from "../harness/instruments";
import type { BurstResult, TickStats } from "../harness/TickEngine";
import { createFpsCounter, createFrameMetricsRecorder } from "../harness/frameMetrics";
import type { BenchmarkApi } from "../harness/types";

const BENCHMARK_MODULE = "BENCHMARK";

const getRowCountFromUrl = (): 10000 | 100000 => {
  const params = new URLSearchParams(window.location.search);
  return params.get("rows") === "100000" ? 100000 : 10000;
};

const getTableName = (rowCount: 10000 | 100000) =>
  rowCount === 100000 ? "benchmarkInstruments100k" : "benchmarkInstruments10k";

export const VuuBenchmarkPage = () => {
  const rowCount = useMemo(getRowCountFromUrl, []);
  const tableName = getTableName(rowCount);
  const { VuuDataSource, getServerAPI } = useData();
  const [schema, setSchema] = useState<TableSchema | undefined>(undefined);

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

  useEffect(() => {
    if (!dataSource) return;

    const frameMetrics = createFrameMetricsRecorder();
    const fpsCounter = createFpsCounter();

    // The real server ticks the dataset itself (RPC-controlled), and tracks
    // its own per-message scheduling drift the same way TickEngine.ts does
    // client/feed-server-side (BenchmarkTickProvider.runOnce, Scala) - so
    // getStreamStats returns the authoritative stats directly, no
    // client-side approximation needed.
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
        dataSource.sort = {
          sortDefs: [{ column, sortType: direction === "asc" ? "A" : "D" }],
        };
      },
      applyFilter: (column, op, value) => {
        const opSymbol = op === "eq" ? "=" : op === "gt" ? ">" : "<";
        const formattedValue =
          typeof value === "string" ? `"${value}"` : value;
        dataSource.filter = { filter: `${column} ${opSymbol} ${formattedValue}` };
      },
      clearFilter: () => {
        dataSource.filter = { filter: "" };
      },
    };
    window.__benchmark = api;

    return () => {
      frameMetrics.disconnect();
      dataSource.unsubscribe();
      delete window.__benchmark;
    };
  }, [dataSource, rowCount]);

  const config: TableConfig = useMemo(
    () => ({
      columns: INSTRUMENT_COLUMNS,
      rowSeparators: true,
    }),
    [],
  );

  if (!dataSource) {
    return <div data-testid="vuu-benchmark-grid-loading">Connecting to VUU server...</div>;
  }

  return (
    <div data-testid="vuu-benchmark-grid" style={{ height: "100vh", width: "100vw" }}>
      <Table config={config} dataSource={dataSource} height={800} width={1400} />
    </div>
  );
};
