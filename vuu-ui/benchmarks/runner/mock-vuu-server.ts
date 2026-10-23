import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { performance } from "node:perf_hooks";
import {
  burstPauseMs,
  datasetColumns,
  datasetTableName,
  generateRows,
  parseDatasetTableName,
  type Row,
  STEADY_INTERVAL_MS,
  steadyUpdatesDue,
  updatedRow,
  updateRandom,
} from "../harness/dataset";
import type {
  DatasetConfig,
  MockControlRequest,
  MockControlResponse,
  TickConfig,
} from "../harness/types";
import { acceptUpgrade, type WebSocketConnection } from "./websocket";

/**
 * Mock Vuu server for the remote scenarios. Speaks the subset of the Vuu
 * WebSocket protocol a Table on a VuuDataSource uses: LOGIN, table metadata,
 * CREATE_VP, CHANGE_VP, CHANGE_VP_RANGE and REMOVE_VP, with TABLE_ROW
 * messages for the rows in each viewport's range. Data comes from the same
 * seeded generator as the local scenarios; the table name identifies the
 * dataset (see datasetTableName).
 *
 * A second connection, on /control, lets the page start a server-side update
 * feed and read the server clock (see MockControlRequest).
 */

/** server clock, epoch ms with sub-ms resolution, comparable to the page's */
const serverTime = () => performance.timeOrigin + performance.now();

interface VuuClientMessage {
  requestId: string;
  sessionId: string;
  module: string;
  body: { type: string } & Record<string, unknown>;
}

interface Viewport {
  id: string;
  table: string;
  connection: WebSocketConnection;
  data: Row[];
  /** rows changed by a tick run, by row index; data itself is shared */
  updated: Map<number, Row>;
  /** row index in the dataset of each viewport column */
  columnIndices: number[];
  from: number;
  to: number;
}

const send = (
  connection: WebSocketConnection,
  requestId: string,
  sessionId: string,
  body: object,
) => {
  connection.send(
    JSON.stringify({ requestId, sessionId, module: "CORE", body }),
  );
};

/** port 0 picks a free port */
export const startMockVuuServer = async (port = 0) => {
  const datasets = new Map<string, Row[]>();
  const viewports = new Map<string, Viewport>();
  let nextViewportId = 1;
  let nextSessionId = 1;

  const getDataset = (table: string) => {
    let data = datasets.get(table);
    if (!data) {
      const dataset = parseDatasetTableName(table);
      if (!dataset) return undefined;
      data = generateRows({ ...dataset, cellType: "plain" });
      datasets.set(table, data);
    }
    return data;
  };

  const rowAt = (vp: Viewport, index: number) =>
    vp.updated.get(index) ?? vp.data[index];

  const toVuuRow = (vp: Viewport, index: number, ts: number) => {
    const row = rowAt(vp, index);
    return {
      viewPortId: vp.id,
      vpSize: vp.data.length,
      rowIndex: index,
      rowKey: row[0],
      updateType: "U",
      ts,
      sel: 0,
      vpVersion: "",
      data: vp.columnIndices.map((i) => row[i]),
    };
  };

  const sendRows = (vp: Viewport, indices: Iterable<number>, size = false) => {
    const ts = Date.now();
    const rows: object[] = size
      ? [
          {
            viewPortId: vp.id,
            vpSize: vp.data.length,
            rowIndex: -1,
            rowKey: "SIZE",
            updateType: "SIZE",
            ts,
            sel: 0,
            vpVersion: "",
            data: [],
          },
        ]
      : [];
    for (const index of indices) {
      if (index >= vp.from && index < vp.to && index < vp.data.length) {
        rows.push(toVuuRow(vp, index, ts));
      }
    }
    if (rows.length > 0) {
      send(vp.connection, "NA", "", { type: "TABLE_ROW", batch: "", rows });
    }
    return rows.length;
  };

  const range = (from: number, to: number) => {
    const indices: number[] = [];
    for (let i = from; i < to; i++) indices.push(i);
    return indices;
  };

  const handleVuuMessage = (
    connection: WebSocketConnection,
    sessionId: string,
    { requestId, body }: VuuClientMessage,
  ) => {
    const reply = (response: object) =>
      send(connection, requestId, sessionId, response);
    switch (body.type) {
      case "LOGIN":
        reply({ type: "LOGIN_SUCCESS", vuuServerId: "bench-mock" });
        break;
      case "HB_RESP":
        break;
      case "GET_TABLE_META": {
        const table = body.table as { module: string; table: string };
        const dataset = parseDatasetTableName(table.table);
        if (!dataset) {
          reply({ type: "ERROR", msg: `unknown table ${table.table}` });
          break;
        }
        const columns = datasetColumns(dataset);
        reply({
          type: "TABLE_META_RESP",
          table,
          columns: columns.map((c) => c.name),
          dataTypes: columns.map((c) => c.serverDataType),
          editableColumns: [],
          key: columns[0].name,
          maxRangeEnd: Number.MAX_SAFE_INTEGER,
          maxRangeWidth: Number.MAX_SAFE_INTEGER,
        });
        break;
      }
      case "CREATE_VP": {
        const table = body.table as { module: string; table: string };
        const dataset = parseDatasetTableName(table.table);
        const data = getDataset(table.table);
        if (!dataset || !data) {
          reply({ type: "CREATE_VP_REJECT", table, msg: "unknown table" });
          break;
        }
        const names = datasetColumns(dataset).map((c) => c.name);
        const columns = body.columns as string[];
        const { from, to } = body.range as { from: number; to: number };
        const vp: Viewport = {
          id: `vp-${nextViewportId++}`,
          table: table.table,
          connection,
          data,
          updated: new Map(),
          columnIndices: columns.map((name) => names.indexOf(name)),
          from,
          to,
        };
        viewports.set(vp.id, vp);
        reply({
          type: "CREATE_VP_SUCCESS",
          viewPortId: vp.id,
          table: table.table,
          range: { from, to },
          columns,
          sort: body.sort,
          groupBy: body.groupBy,
          filterSpec: body.filterSpec,
          aggregations: body.aggregations,
        });
        sendRows(vp, range(from, to), true);
        break;
      }
      case "CHANGE_VP": {
        const vp = viewports.get(body.viewPortId as string);
        if (!vp) break;
        const dataset = parseDatasetTableName(vp.table);
        if (dataset) {
          const names = datasetColumns(dataset).map((c) => c.name);
          vp.columnIndices = (body.columns as string[]).map((name) =>
            names.indexOf(name),
          );
        }
        reply({
          type: "CHANGE_VP_SUCCESS",
          viewPortId: vp.id,
          columns: body.columns,
          sort: body.sort,
          groupBy: body.groupBy,
          filterSpec: body.filterSpec,
          aggregations: body.aggregations,
        });
        sendRows(vp, range(vp.from, vp.to));
        break;
      }
      case "CHANGE_VP_RANGE": {
        const vp = viewports.get(body.viewPortId as string);
        if (!vp) break;
        const from = body.from as number;
        const to = body.to as number;
        const { from: oldFrom, to: oldTo } = vp;
        vp.from = from;
        vp.to = to;
        reply({ type: "CHANGE_VP_RANGE_SUCCESS", viewPortId: vp.id, from, to });
        // like the Vuu server, send only the rows that entered the range
        sendRows(
          vp,
          range(from, to).filter((i) => i < oldFrom || i >= oldTo),
        );
        break;
      }
      case "REMOVE_VP":
        viewports.delete(body.viewPortId as string);
        reply({ type: "REMOVE_VP_SUCCESS", viewPortId: body.viewPortId });
        break;
      case "DISABLE_VP":
      case "ENABLE_VP":
        reply({
          type: `${body.type}_SUCCESS`,
          viewPortId: body.viewPortId,
        });
        break;
      case "GET_VP_VISUAL_LINKS":
        reply({ type: "VP_VISUAL_LINKS_RESP", links: [], vpId: body.vpId });
        break;
      case "GET_VIEW_PORT_MENUS":
        reply({
          type: "VIEW_PORT_MENUS_RESP",
          menu: { name: "ROOT", menus: [] },
          vpId: body.vpId,
        });
        break;
      default:
        console.warn(`[mock-vuu-server] unhandled ${body.type}`);
    }
  };

  /**
   * Runs an update feed over the most recently created viewport on `table`.
   * The update stream for a seed matches the in-page feed of the local
   * scenarios; each batch is one TABLE_ROW message holding the latest value
   * of every updated row in the viewport's range.
   */
  const tick = (table: string, config: TickConfig, seed: number) =>
    new Promise<{ updatesEmitted: number; batchTimes: number[] }>((resolve) => {
      const vp = [...viewports.values()]
        .filter((v) => v.table === table)
        .at(-1);
      if (!vp) {
        resolve({ updatesEmitted: 0, batchTimes: [] });
        return;
      }
      const random = updateRandom(seed);
      const tickingRows = Math.min(config.tickingRows, vp.data.length);
      const batchTimes: number[] = [];
      let emitted = 0;

      const emitBatch = (rowIndices: () => Iterable<number>) => {
        const seq = batchTimes.length + 1;
        const changed = new Set<number>();
        for (const index of rowIndices()) {
          vp.updated.set(
            index,
            updatedRow(rowAt(vp, index), seq, random, config.columnsPerUpdate),
          );
          changed.add(index);
          emitted += 1;
        }
        batchTimes.push(serverTime());
        sendRows(vp, changed);
      };

      const start = performance.now();
      const finished = () =>
        performance.now() - start >= config.durationMs || !viewports.has(vp.id);

      if (config.mode === "burst") {
        const burst = () => {
          if (finished()) {
            resolve({ updatesEmitted: emitted, batchTimes });
            return;
          }
          emitBatch(() => range(0, tickingRows));
          setTimeout(burst, burstPauseMs(random));
        };
        burst();
      } else {
        const steady = () => {
          if (finished()) {
            resolve({ updatesEmitted: emitted, batchTimes });
            return;
          }
          const due = steadyUpdatesDue(
            config.updatesPerSecond,
            performance.now() - start,
          );
          if (due > emitted) {
            emitBatch(function* () {
              while (emitted < due) {
                yield Math.floor(random() * tickingRows);
              }
            });
          }
          setTimeout(steady, STEADY_INTERVAL_MS);
        };
        steady();
      }
    });

  const handleControlMessage = async (
    connection: WebSocketConnection,
    request: MockControlRequest,
  ) => {
    const reply = (response: MockControlResponse) =>
      connection.send(JSON.stringify(response));
    switch (request.type) {
      case "clock":
        reply({ type: "clock", id: request.id, serverTime: serverTime() });
        break;
      case "tick": {
        const result = await tick(request.table, request.config, request.seed);
        reply({ type: "tick-done", id: request.id, ...result });
        break;
      }
    }
  };

  const server = createServer((_req, res) => {
    res.writeHead(426, { "content-type": "text/plain" }).end("WebSocket only");
  });
  const connections = new Set<WebSocketConnection>();
  server.on("upgrade", (req, socket) => {
    const connection = acceptUpgrade(req, socket);
    if (!connection) return;
    connections.add(connection);
    if (req.url?.startsWith("/control")) {
      connection.onmessage = (text) =>
        handleControlMessage(connection, JSON.parse(text));
      connection.onclose = () => connections.delete(connection);
    } else {
      const sessionId = `session-${nextSessionId++}`;
      connection.onmessage = (text) =>
        handleVuuMessage(connection, sessionId, JSON.parse(text));
      connection.onclose = () => {
        connections.delete(connection);
        for (const [id, vp] of viewports) {
          if (vp.connection === connection) viewports.delete(id);
        }
      };
    }
  });

  await new Promise<void>((done) => server.listen(port, "127.0.0.1", done));
  const address = server.address() as AddressInfo;
  return {
    url: `ws://127.0.0.1:${address.port}/`,
    /**
     * Generates a dataset ahead of the first CREATE_VP that uses it, and
     * releases any others
     */
    prepare: (dataset: DatasetConfig) => {
      const table = datasetTableName(dataset);
      for (const name of datasets.keys()) {
        if (name !== table) datasets.delete(name);
      }
      getDataset(table);
    },
    close: () =>
      new Promise<void>((done) => {
        for (const connection of connections) connection.close();
        server.close(() => done());
      }),
  };
};
