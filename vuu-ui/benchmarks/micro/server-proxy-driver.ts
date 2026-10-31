import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
// imported from source, so the benchmarks measure the code in this checkout
import { ServerProxy } from "../../packages/vuu-data-remote/src/server-proxy/server-proxy";
import type { WebSocketConnection } from "../../packages/vuu-data-remote/src/WebSocketConnection";
import { datasetColumns, generateRows, type Row } from "../harness/dataset";

export const COLS = 20;
/** row count of the server-side table */
export const TABLE_SIZE = 10_000;

const TABLE = { module: "BENCHMARK", table: "server_proxy_bench" };
const COLUMNS = datasetColumns({ cols: COLS });
const COLUMN_NAMES = COLUMNS.map(({ name }) => name);
/** column that changes on every update, so the proxy never sees unchanged data */
const SEQ = 1;

let tableRows: Row[] | undefined;
/** The server-side table, generated once and shared by every benchmark. */
export const serverTable = () =>
  (tableRows ??= generateRows({
    rows: TABLE_SIZE,
    cols: COLS,
    cellType: "plain",
    seed: 1,
  }));

type ServerRequest = {
  requestId: string;
  body: { type: string } & Record<string, unknown>;
};

type ServerMessage = Parameters<ServerProxy["handleMessageFromServer"]>[0];
type ClientMessage = Parameters<ServerProxy["handleMessageFromClient"]>[0];

export const serverViewportId = (key: number) => `server-vp-${key}`;
export const clientViewportId = (key: number) => `client-vp-${key}`;

/** A data row as the server sends it; seq goes in the seq column. */
export const vuuRow = (vp: string, rowIndex: number, seq: number): VuuRow => {
  const data = serverTable()[rowIndex].slice();
  data[SEQ] = String(seq);
  return {
    viewPortId: vp,
    vpSize: TABLE_SIZE,
    rowIndex,
    rowKey: data[0] as string,
    updateType: "U",
    ts: seq,
    sel: 0,
    vpVersion: "",
    data,
  };
};

const rangeRows = new Map<string, VuuRow[]>();
/**
 * Rows the server sends when they come into a viewport's range, built once
 * per viewport so that serving a range request allocates no rows.
 */
const rangeRow = (vp: string, rowIndex: number) => {
  let rows = rangeRows.get(vp);
  if (!rows) {
    rows = serverTable().map((_, i) => vuuRow(vp, i, 0));
    rangeRows.set(vp, rows);
  }
  return rows[rowIndex];
};

const sizeRow = (vp: string): VuuRow => ({
  viewPortId: vp,
  vpSize: TABLE_SIZE,
  rowIndex: -1,
  rowKey: "SIZE",
  updateType: "SIZE",
  ts: 0,
  sel: 0,
  vpVersion: "",
  data: [],
});

export const tableRowMessage = (rows: VuuRow[]): ServerMessage =>
  ({
    module: "CORE",
    requestId: "NA",
    token: "",
    user: "",
    body: { type: "TABLE_ROW", batch: "", isLast: true, timeStamp: 0, rows },
  }) as unknown as ServerMessage;

const response = (requestId: string, body: object): ServerMessage =>
  ({
    module: "CORE",
    requestId,
    token: "",
    user: "",
    body,
  }) as unknown as ServerMessage;

const range = (from: number, to: number) => {
  const out: number[] = [];
  for (let i = from; i < to; i++) out.push(i);
  return out;
};

export interface ViewportOptions {
  /** visible rows, default 50 */
  visibleRows?: number;
  /** rows the proxy keeps either side of the client range, default 100 */
  bufferSize?: number;
}

/**
 * Drives a ServerProxy in process. Messages to the client are counted, not
 * kept. Requests to the server are answered synchronously by serve(), which
 * plays a minimal Vuu server: it acknowledges CREATE_VP, GET_TABLE_META and
 * CHANGE_VP_RANGE, and sends the rows that come into a viewport's range.
 */
export class ServerProxyDriver {
  readonly proxy: ServerProxy;
  messagesToClient = 0;
  #requests: ServerRequest[] = [];
  #serverRanges = new Map<string, { from: number; to: number }>();

  constructor() {
    const connection = {
      connectionTimeout: 0,
      on: () => undefined,
      requiresLogin: true,
      send: (request: ServerRequest) => this.#requests.push(request),
      status: "ready",
    };
    this.proxy = new ServerProxy(
      connection as unknown as WebSocketConnection,
      () => {
        this.messagesToClient += 1;
      },
    );
    this.proxy["sessionId"] = "bench";
    this.proxy["authToken"] = "bench";
  }

  /** Subscribes viewport `key` to rows 0..visibleRows and loads its rows. */
  async subscribe(
    key: number,
    { visibleRows = 50, bufferSize = 100 }: ViewportOptions = {},
  ) {
    this.proxy.subscribe({
      aggregations: [],
      bufferSize,
      columns: COLUMN_NAMES,
      filterSpec: { filter: "" },
      groupBy: [],
      range: { from: 0, to: visibleRows },
      sort: { sortDefs: [] },
      table: TABLE,
      viewport: clientViewportId(key),
    });
    this.serve();
    // the proxy awaits CREATE_VP and table metadata together, and drops
    // rows for a viewport until both have arrived
    await new Promise((resolve) => setTimeout(resolve, 0));
    this.serve();
    const vp = serverViewportId(key);
    const { from, to } = this.#serverRanges.get(vp) ?? { from: 0, to: 0 };
    this.server(
      tableRowMessage([
        sizeRow(vp),
        ...range(from, to).map((i) => rangeRow(vp, i)),
      ]),
    );
  }

  /** Sends a client message, then lets the server answer any requests. */
  client(message: ClientMessage) {
    this.proxy.handleMessageFromClient(message);
    this.serve();
  }

  setRange(key: number, from: number, to: number) {
    this.client({
      type: "setViewRange",
      viewport: clientViewportId(key),
      range: { from, to },
    } as ClientMessage);
  }

  server(message: ServerMessage) {
    this.proxy.handleMessageFromServer(message);
  }

  /** Answers every pending request, in the order sent. */
  serve() {
    while (this.#requests.length > 0) {
      const requests = this.#requests;
      this.#requests = [];
      for (const { requestId, body } of requests) {
        switch (body.type) {
          case "GET_TABLE_META":
            this.server(
              response(requestId, {
                type: "TABLE_META_RESP",
                table: TABLE,
                columns: COLUMN_NAMES,
                dataTypes: COLUMNS.map((c) => c.serverDataType),
                key: COLUMN_NAMES[0],
                editableColumns: [],
                maxRangeEnd: TABLE_SIZE,
                maxRangeWidth: 1_000,
              }),
            );
            break;
          case "CREATE_VP": {
            const key = Number(requestId.replace("client-vp-", ""));
            const vp = serverViewportId(key);
            const { from, to } = body.range as { from: number; to: number };
            this.server(
              response(requestId, {
                ...body,
                type: "CREATE_VP_SUCCESS",
                table: TABLE.table,
                viewPortId: vp,
              }),
            );
            this.#serverRanges.set(vp, { from, to });
            break;
          }
          case "CHANGE_VP_RANGE": {
            const {
              viewPortId: vp,
              from,
              to,
            } = body as unknown as {
              viewPortId: string;
              from: number;
              to: number;
            };
            const previous = this.#serverRanges.get(vp) ?? { from: 0, to: 0 };
            this.#serverRanges.set(vp, { from, to });
            this.server(
              response(requestId, {
                type: "CHANGE_VP_RANGE_SUCCESS",
                viewPortId: vp,
                from,
                to,
              }),
            );
            const rows: VuuRow[] = [];
            for (let i = from; i < to; i++) {
              if (i < previous.from || i >= previous.to) {
                rows.push(rangeRow(vp, i));
              }
            }
            if (rows.length > 0) {
              this.server(tableRowMessage(rows));
            }
            break;
          }
          default:
          // links, menus: no reply needed
        }
      }
    }
  }
}
