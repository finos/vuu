import { expect } from "vitest";
import type { TableSchema, WithFullConfig } from "@vuu-ui/vuu-data-types";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import {
  COMMON_ROW_ATTRS,
  createTableGroupRows,
  createTableRows,
  sizeRow,
  testSchema,
  updateTableRow,
} from "../test-utils";

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

export interface UpdateOptions {
  /** suffix for rowKey and name, default: last two digits of rowIndex */
  id?: string;
  vpSize?: number;
  /** default 2 */
  ts?: number;
  vp?: string;
}

/** An update to the row at rowIndex, setting the numeric column to value. */
export const update = (
  rowIndex: number,
  value: string | number | boolean,
  { id = "", vpSize = 100, ts = 2, vp = DEFAULT_SERVER_VP }: UpdateOptions = {},
): VuuRow => updateTableRow(vp, rowIndex, value, { key: id, vpSize, ts });

/**
 * Group rows for server-vp-1 grouped by currency (USD, EUR, GBX, CAD),
 * optionally preceded by a SIZE row of 4.
 */
export const groupRows = (withSizeRow = true): VuuRow[] =>
  createTableGroupRows(withSizeRow).body.rows;

/** Group labels and counts in groupRows(), by rowIndex. */
export const GROUPS: Array<[label: string, count: number]> = [
  ["USD", 43714],
  ["EUR", 43941],
  ["GBX", 43997],
  ["CAD", 44108],
];

/** One group row from the server for server-vp-1, laid out as in groupRows(). */
export const groupRow = (
  rowIndex: number,
  label: string,
  count: number,
): VuuRow => ({
  ...COMMON_ROW_ATTRS,
  viewPortId: DEFAULT_SERVER_VP,
  vpSize: 4,
  rowIndex,
  rowKey: `$root|${label}`,
  updateType: "U",
  // biome-ignore format: matches createTableGroupRows layout
  data: [1, false, `$root|${label}`, false, label, count, "", label, "", "", "", "", ""],
});

/* ------------------------------------------------------------------ */
/* Messages expected at the client                                    */
/* ------------------------------------------------------------------ */

export interface SingleClientRowOptions {
  /** render key, default rowIndex */
  key?: number;
  /** suffix for rowKey and name, default: last two digits of rowIndex */
  id?: string;
  ts?: number;
  sel?: 0 | 1;
  /** numeric column, default 1000 + rowIndex */
  value?: string | number | boolean;
}

/** One flat client row tuple, e.g. for a row sent by update(). */
export const clientRow = (
  rowIndex: number,
  {
    key = rowIndex,
    id = `0${rowIndex}`.slice(-2),
    ts = 1,
    sel = 0,
    value = 1000 + rowIndex,
  }: SingleClientRowOptions = {},
) => {
  const rowKey = `key-${id}`;
  // biome-ignore format: one line of metadata, one line of data
  return [
    rowIndex, key, true, false, 0, 0, rowKey, sel, ts, false,
    rowKey, `name ${id}`, value, true,
  ];
};

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

/** Tree client row tuple for a collapsed depth-1 group row. */
export const groupClientRow = (
  rowIndex: number,
  label: string,
  count: number,
) =>
  // biome-ignore format: one line of metadata, one line of data
  [
    rowIndex, rowIndex, false, false, 1, count, `$root|${label}`, 0, 1, false,
    "", label, "", "", "", "", "",
  ];

/** Tree client rows [from, to) for groupRows(). */
export const groupClientRows = (from: number, to: number) =>
  GROUPS.slice(from, to).map(([label, count], i) =>
    groupClientRow(from + i, label, count),
  );

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

/** Size-only viewport update, sent when only the row count changed. */
export const sizeOnly = (size: number, vp = DEFAULT_CLIENT_VP) =>
  viewportUpdate({ mode: "size-only", size, vp });

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

interface RequestOptions {
  vp?: string;
  requestId?: string;
}

/** CHANGE_VP sent for a client config message; unset fields take defaults. */
export const changeVp = (
  config: Partial<WithFullConfig> = {},
  { vp = DEFAULT_SERVER_VP, requestId }: RequestOptions = {},
) =>
  serverRequest(
    {
      aggregations: [],
      viewPortId: vp,
      type: "CHANGE_VP",
      columns: ["col-1", "col-2", "col-3", "col-4"],
      sort: { sortDefs: [] },
      filterSpec: { filter: "" },
      groupBy: [],
      ...config,
    },
    requestId,
  );

export const disableVp = ({
  vp = DEFAULT_SERVER_VP,
  requestId,
}: RequestOptions = {}) =>
  serverRequest({ type: "DISABLE_VP", viewPortId: vp }, requestId);

export const enableVp = ({
  vp = DEFAULT_SERVER_VP,
  requestId,
}: RequestOptions = {}) =>
  serverRequest({ type: "ENABLE_VP", viewPortId: vp }, requestId);

export const selectRow = (
  rowKey: string,
  {
    vp = DEFAULT_SERVER_VP,
    requestId = "client-request-1",
    preserveExistingSelection = false,
  }: RequestOptions & { preserveExistingSelection?: boolean } = {},
) =>
  serverRequest(
    { preserveExistingSelection, rowKey, type: "SELECT_ROW", vpId: vp },
    requestId,
  );

/** The four requests the proxy sends when client-vp-1 subscribes. */
export const subscriptionRequests = (range: [number, number]) => [
  serverRequest(
    { table: { module: "TEST", table: "test-table" }, type: "GET_TABLE_META" },
    "1",
  ),
  serverRequest(createVpBody({ range }), "client-vp-1"),
  serverRequest({ type: "GET_VP_VISUAL_LINKS", vpId: DEFAULT_SERVER_VP }, "2"),
  serverRequest({ type: "GET_VIEW_PORT_MENUS", vpId: DEFAULT_SERVER_VP }, "3"),
];
