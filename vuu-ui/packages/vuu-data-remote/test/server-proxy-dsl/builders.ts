import { expect } from "vitest";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import { createTableRows, sizeRow, testSchema } from "../test-utils";

export const DEFAULT_SERVER_VP = "server-vp-1";
export const DEFAULT_CLIENT_VP = "client-vp-1";

/* ------------------------------------------------------------------ */
/* Rows sent by the server                                            */
/* ------------------------------------------------------------------ */

/** The SIZE row the server sends to report the viewport row count. */
export const size = (vpSize = 100, vp = DEFAULT_SERVER_VP): VuuRow =>
  sizeRow(vp, vpSize);

export interface RowOptions {
  /** row count reported on each row (vpSize), default 100 */
  vpSize?: number;
  ts?: number;
  sel?: 0 | 1;
  /** base for the numeric column, value = base + rowIndex, default 1000 */
  value?: number;
  vp?: string;
}

/**
 * Data rows [from, to) from the server. Row i has key `key-NN` (last two digits
 * of i), name `name NN` and numeric value `value + i`.
 */
export const rows = (
  from: number,
  to: number,
  {
    vpSize = 100,
    ts = 1,
    sel = 0,
    value = 1000,
    vp = DEFAULT_SERVER_VP,
  }: RowOptions = {},
): VuuRow[] => createTableRows(vp, from, to, vpSize, ts, sel, value);

/* ------------------------------------------------------------------ */
/* Messages expected at the client                                    */
/* ------------------------------------------------------------------ */

export interface ClientRowOptions {
  /** render key of the first row; keys run consecutively. Default: from */
  key?: number;
  ts?: number;
  sel?: 0 | 1;
  value?: number;
}

/**
 * Client row tuples [from, to) as the proxy builds them from rows(from, to)
 * for a flat (non-tree) viewport.
 */
export const clientRows = (
  from: number,
  to: number,
  { key = from, ts = 1, sel = 0, value = 1000 }: ClientRowOptions = {},
) => {
  const out: unknown[][] = [];
  for (let rowIndex = from; rowIndex < to; rowIndex++) {
    const nn = `0${rowIndex}`.slice(-2);
    const rowKey = `key-${nn}`;
    // biome-ignore format: one line of metadata, one line of data
    out.push([
      rowIndex, key + (rowIndex - from), true, false, 0, 0, rowKey, sel, ts, false,
      rowKey, `name ${nn}`, value + rowIndex, true,
    ]);
  }
  return out;
};

export interface ViewportUpdateOptions {
  rows?: unknown[][];
  size?: number;
  range?: [number, number];
  mode?: "update" | "size-only" | "batch";
  vp?: string;
}

export const viewportUpdate = ({
  rows,
  size,
  range,
  mode = "update",
  vp = DEFAULT_CLIENT_VP,
}: ViewportUpdateOptions) => ({
  type: "viewport-update",
  clientViewportId: vp,
  mode,
  ...(rows !== undefined && { rows }),
  ...(size !== undefined && { size }),
  ...(range !== undefined && { range: { from: range[0], to: range[1] } }),
});

export interface SubscribedOptions {
  range: [number, number];
  columns?: string[];
  vp?: string;
  tableSchema?: TableSchema;
}

/** The "subscribed" message sent to the client once the server ACKs CREATE_VP. */
export const subscribedMessage = ({
  range,
  columns = ["col-1", "col-2", "col-3", "col-4"],
  vp = DEFAULT_CLIENT_VP,
  tableSchema = testSchema,
}: SubscribedOptions) => ({
  type: "subscribed",
  clientViewportId: vp,
  aggregations: [],
  columns,
  filterSpec: { filter: "" },
  groupBy: [],
  range: { from: range[0], to: range[1] },
  sort: { sortDefs: [] },
  tableSchema,
});

/* ------------------------------------------------------------------ */
/* Requests expected at the server                                    */
/* ------------------------------------------------------------------ */

/**
 * Request bodies, as Viewport returns them. The ServerProxy wraps each one
 * in an envelope (module, sessionId, requestId); see serverRequest.
 */
export const changeRangeBody = (
  from: number,
  to: number,
  vp = DEFAULT_SERVER_VP,
) => ({ type: "CHANGE_VP_RANGE", viewPortId: vp, from, to });

export interface CreateVpOptions {
  range: [number, number];
  columns?: string[];
}

export const createVpBody = ({
  range,
  columns = ["col-1"],
}: CreateVpOptions) => ({
  type: "CREATE_VP",
  table: { module: "TEST", table: "test-table" },
  range: { from: range[0], to: range[1] },
  aggregations: [],
  columns,
  sort: { sortDefs: [] },
  groupBy: [],
  filterSpec: { filter: "" },
});

/** A request body in the envelope the ServerProxy sends over the websocket. */
export const serverRequest = (body: object, requestId?: string) => ({
  module: "CORE",
  sessionId: "dsdsd",
  requestId: requestId ?? expect.any(String),
  body,
});

export const changeRange = (
  from: number,
  to: number,
  {
    vp = DEFAULT_SERVER_VP,
    requestId,
  }: { vp?: string; requestId?: string } = {},
) => serverRequest(changeRangeBody(from, to, vp), requestId);
