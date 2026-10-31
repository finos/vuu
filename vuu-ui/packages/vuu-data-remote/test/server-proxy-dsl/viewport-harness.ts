import type {
  ServerProxySubscribeMessage,
  TableSchema,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import { Viewport } from "../../src/server-proxy/viewport";
import { createSubscription, testSchema } from "../test-utils";
import { DEFAULT_CLIENT_VP } from "./builders";
import { freezeClock } from "./clock";

export interface ViewportHarnessOptions {
  /** omitted: Viewport's own default (50) */
  bufferSize?: number;
  /** initial client range, default [0, 10] */
  range?: [number, number];
  columns?: string[];
}

export interface AckSubscriptionOptions {
  /** range in the server's CREATE_VP_SUCCESS, default [0, 10] */
  ackRange?: [number, number];
  maxRangeEnd?: number;
}

/**
 * Drives a bare Viewport, with no ServerProxy or websocket. Request ids are
 * numbered "1", "2", ... per harness, and acks reuse the id of the request
 * they answer.
 */
export class ViewportHarness {
  readonly viewport: Viewport;
  #nextRequestId = 1;
  #lastRangeRequestId: string | undefined;

  constructor({
    bufferSize,
    range = [0, 10],
    columns = ["col-1"],
  }: ViewportHarnessOptions = {}) {
    this.viewport = new Viewport(
      {
        aggregations: [],
        ...(bufferSize !== undefined && { bufferSize }),
        columns,
        filterSpec: { filter: "" },
        groupBy: [],
        range: { from: range[0], to: range[1] },
        sort: { sortDefs: [] },
        table: { module: "TEST", table: "test-table" },
        viewport: DEFAULT_CLIENT_VP,
      } as ServerProxySubscribeMessage,
      () => undefined,
    );
  }

  get status() {
    return this.viewport.status;
  }

  /** Returns the CREATE_VP request body. */
  subscribe() {
    return this.viewport.subscribe();
  }

  /**
   * Applies the server's CREATE_VP_SUCCESS (server-vp-1, columns col-1..col-4)
   * and returns the message the Viewport builds for the client.
   */
  subscribed({ ackRange = [0, 10], maxRangeEnd }: AckSubscriptionOptions = {}) {
    const [, ack] = createSubscription();
    const tableSchema: TableSchema =
      maxRangeEnd === undefined
        ? testSchema
        : {
            ...testSchema,
            rangeLimits: {
              maxRangeWidth: 1_000,
              ...testSchema.rangeLimits,
              maxRangeEnd,
            },
          };
    return this.viewport.handleSubscribed(
      { ...ack.body, range: { from: ackRange[0], to: ackRange[1] } },
      tableSchema,
    );
  }

  /** TABLE_ROW rows from the server; accepts single rows and arrays. */
  receives(...items: Array<VuuRow | VuuRow[]>) {
    this.viewport.updateRows(items.flat());
  }

  /** Client range change. Returns what the Viewport hands back. */
  setRange(from: number, to: number) {
    const requestId = this.#requestId();
    this.#lastRangeRequestId = requestId;
    const [serverRequest, rows, debounceRequest] = this.viewport.rangeRequest(
      requestId,
      { from, to },
    );
    return { serverRequest, rows, debounceRequest };
  }

  /** CHANGE_VP_RANGE_SUCCESS for the most recent setRange. */
  acksRange(from: number, to: number) {
    if (this.#lastRangeRequestId === undefined) {
      throw Error("acksRange called before any setRange");
    }
    this.viewport.completeOperation(this.#lastRangeRequestId, from, to);
  }

  config(config: Partial<WithFullConfig>) {
    return this.viewport.setConfig(this.#requestId(), {
      aggregations: [],
      columns: ["col-1", "col-2", "col-3", "col-4"],
      filterSpec: { filter: "" },
      groupBy: [],
      sort: { sortDefs: [] },
      ...config,
    });
  }

  /**
   * Whether each range is already covered by a pending server request,
   * keyed "from:to" so a failing diff names the range.
   */
  alreadyPending(...ranges: Array<[number, number]>) {
    const result: Record<string, boolean> = {};
    for (const [from, to] of ranges) {
      result[`${from}:${to}`] = this.viewport["rangeRequestAlreadyPending"]({
        from,
        to,
      });
    }
    return result;
  }

  /** Read-only view of internal state. */
  state() {
    const dataWindow = this.viewport["dataWindow"];
    return {
      status: this.viewport.status,
      rowCount: dataWindow?.rowCount,
      cachedRowCount: dataWindow?.["internalData"].length,
      pendingRanges: this.viewport["pendingRangeRequests"].map(
        ({ from, to, acked }) => ({ from, to, acked }),
      ),
    };
  }

  #requestId() {
    return `${this.#nextRequestId++}`;
  }
}

export const viewportHarness = (options?: ViewportHarnessOptions) => {
  freezeClock();
  return new ViewportHarness(options);
};
