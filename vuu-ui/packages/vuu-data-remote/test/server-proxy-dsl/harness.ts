import { expect } from "vitest";
import type { WithFullConfig } from "@vuu-ui/vuu-data-types";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import {
  ServerProxy,
  TEST_setRequestId,
} from "../../src/server-proxy/server-proxy";
import type { Viewport } from "../../src/server-proxy/viewport";
import type { WebSocketConnection } from "../../src/WebSocketConnection";
import {
  COMMON_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createSubscription,
  subscribe,
} from "../test-utils";
import { DEFAULT_CLIENT_VP, DEFAULT_SERVER_VP } from "./builders";

export interface SubscriptionOptions {
  bufferSize?: number;
  /** "1" gives client-vp-1 / server-vp-1, "2" gives client-vp-2 / server-vp-2 */
  key?: string;
  /** end of the initial client range, default 10 */
  to?: number;
}

export interface HarnessOptions extends SubscriptionOptions {
  /** false: create the proxy with no viewport. Default true. */
  subscribe?: boolean;
  /** keep the subscription's messages pending instead of discarding them */
  keepSubscribeMessages?: boolean;
}

type ServerRequest = {
  requestId: string;
  body: { type: string; viewPortId?: string; [key: string]: unknown };
};

/**
 * Drives a ServerProxy from both sides and records what it sends.
 *
 * Messages to the client and requests to the server collect in two pending
 * lists. expectClient / expectServer check the whole pending list exactly
 * (order and count) and then empty it. discard() empties both lists without
 * checking them.
 */
export class ServerProxyHarness {
  readonly proxy: ServerProxy;
  #toClient: unknown[] = [];
  #toServer: ServerRequest[] = [];
  #serverHistory: ServerRequest[] = [];

  constructor() {
    const connection = {
      connectionTimeout: 0,
      on: () => undefined,
      requiresLogin: true,
      send: (msg: ServerRequest) => {
        this.#toServer.push(msg);
        this.#serverHistory.push(msg);
      },
      status: "ready" as const,
    };
    this.proxy = new ServerProxy(
      connection as unknown as WebSocketConnection,
      (msg) => this.#toClient.push(msg),
    );
    this.proxy["sessionId"] = "dsdsd";
    this.proxy["authToken"] = "test";
  }

  /** Subscribes another viewport and waits for the server ACKs. */
  async subscribe({
    bufferSize = 0,
    key = "1",
    to = 10,
  }: SubscriptionOptions = {}) {
    await subscribe(this.proxy, { bufferSize, key, to });
  }

  /**
   * Sends the subscribe request without the server ACKs. complete() delivers
   * CREATE_VP_SUCCESS and TABLE_META_RESP and waits for the proxy to settle.
   */
  startSubscription({
    bufferSize = 0,
    key = "1",
    to = 10,
  }: SubscriptionOptions = {}) {
    const [request, ack, tableMeta] = createSubscription({
      bufferSize,
      key,
      to,
    });
    this.proxy.subscribe(request);
    return {
      complete: async () => {
        this.proxy.handleMessageFromServer(ack);
        this.proxy.handleMessageFromServer(tableMeta);
        await new Promise((resolve) => setTimeout(resolve, 0));
      },
    };
  }

  /** Actions arriving from the server over the websocket. */
  readonly server = {
    /** TABLE_ROW message; accepts single rows and arrays of rows. */
    sends: (...items: Array<VuuRow | VuuRow[]>) => {
      this.proxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: { ...COMMON_TABLE_ROW_ATTRS, rows: items.flat() },
      });
    },
    /**
     * CHANGE_VP_RANGE_SUCCESS for the most recent CHANGE_VP_RANGE the proxy
     * sent for this viewport, using that request's id.
     */
    acksRange: (from: number, to: number, vp = DEFAULT_SERVER_VP) => {
      this.server.acks("CHANGE_VP_RANGE", { from, to }, vp);
    },
    /**
     * `${type}_SUCCESS` for the most recent `type` request sent for this
     * viewport, using that request's id. The body echoes the request body,
     * with any overrides applied.
     */
    acks: (type: string, overrides: object = {}, vp = DEFAULT_SERVER_VP) => {
      const { requestId, body } = this.#lastRequest(type, vp);
      this.server.receives(
        { ...body, ...overrides, type: `${type}_SUCCESS` },
        requestId,
      );
    },
    /** Any other server message body. */
    receives: (body: object, requestId = "") => {
      this.proxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId,
        body,
      } as Parameters<ServerProxy["handleMessageFromServer"]>[0]);
    },
  };

  /** Actions arriving from the UI client. */
  readonly client = {
    setRange: (from: number, to: number, vp = DEFAULT_CLIENT_VP) => {
      this.client.send({
        viewport: vp,
        type: "setViewRange",
        range: { from, to },
      });
    },
    /** config message; unset fields take the subscription's defaults. */
    config: (config: Partial<WithFullConfig>, vp = DEFAULT_CLIENT_VP) => {
      this.client.send({
        viewport: vp,
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [] },
          ...config,
        },
      });
    },
    select: (
      rowKey: string,
      {
        requestId = "client-request-1",
        preserveExistingSelection = false,
        vp = DEFAULT_CLIENT_VP,
      } = {},
    ) => {
      this.client.send({
        preserveExistingSelection,
        requestId,
        rowKey,
        type: "SELECT_ROW",
        vpId: vp,
      });
    },
    disable: (vp = DEFAULT_CLIENT_VP) =>
      this.client.send({ type: "disable", viewport: vp }),
    enable: (vp = DEFAULT_CLIENT_VP) =>
      this.client.send({ type: "enable", viewport: vp }),
    suspend: (
      vp = DEFAULT_CLIENT_VP,
      options: { escalateToDisable?: boolean; escalateDelay?: number } = {},
    ) => this.client.send({ type: "suspend", viewport: vp, ...options }),
    resume: (vp = DEFAULT_CLIENT_VP) =>
      this.client.send({ type: "resume", viewport: vp }),
    createLink: ({
      parent = "client-vp-1",
      child = "client-vp-2",
      parentColumn = "col-1",
      childColumn = "col-1",
      requestId = "req1",
    } = {}) =>
      this.client.send({
        requestId,
        type: "CREATE_VISUAL_LINK",
        parentVpId: parent,
        parentColumnName: parentColumn,
        childColumnName: childColumn,
        childVpId: child,
      }),
    /** Any other client message. */
    send: (message: object) => {
      this.proxy.handleMessageFromClient(
        message as Parameters<ServerProxy["handleMessageFromClient"]>[0],
      );
    },
  };

  /** Checks every pending client message, in order, then clears them. */
  expectClient(...expected: unknown[]) {
    const actual = this.#toClient;
    this.#toClient = [];
    expectWithReadableRows(actual, expected, "messages to client");
  }

  /** Checks every pending server request, in order, then clears them. */
  expectServer(...expected: unknown[]) {
    const actual = this.#toServer;
    this.#toServer = [];
    expect(actual, "requests to server").toEqual(expected);
  }

  discard() {
    this.#toClient = [];
    this.#toServer = [];
  }

  /** Read-only view of a viewport's internal state. */
  viewportState(vp = DEFAULT_SERVER_VP) {
    const viewport = this.#viewport(vp);
    const dataWindow = viewport["dataWindow"];
    return {
      status: viewport.status,
      clientViewportId: viewport.clientViewportId,
      serverViewportId: viewport.serverViewportId,
      isTree: viewport.isTree,
      disabled: viewport.disabled,
      suspended: viewport.suspended,
      cachedRowCount: dataWindow?.["internalData"].length,
      clientRange: dataWindow?.clientRange,
      pendingRangeCount: viewport["pendingRangeRequests"].length,
      filter: viewport["filter"],
    };
  }

  /** The cached row at rowIndex, as held by the viewport's data window. */
  cachedRow(rowIndex: number, vp = DEFAULT_SERVER_VP) {
    return this.#viewport(vp)["dataWindow"]?.getAtIndex(rowIndex);
  }

  /** Read-only view of the proxy's internal state. */
  proxyState() {
    return {
      viewportCount: this.proxy["viewports"].size,
      queuedRequestCount: this.proxy["queuedRequests"].length,
      serverViewportFor: (clientVp: string) =>
        this.proxy["mapClientToServerViewport"].get(clientVp),
    };
  }

  #viewport(vp: string) {
    const viewport = this.proxy["viewports"].get(vp) as Viewport | undefined;
    if (!viewport) throw Error(`no viewport ${vp}`);
    return viewport;
  }

  #lastRequest(type: string, vp: string) {
    for (let i = this.#serverHistory.length - 1; i >= 0; i--) {
      const { body } = this.#serverHistory[i];
      if (body.type === type && body.viewPortId === vp) {
        return this.#serverHistory[i];
      }
    }
    throw Error(`no ${type} request has been sent for ${vp}`);
  }
}

/**
 * Creates a ServerProxy with one subscribed viewport (client-vp-1 /
 * server-vp-1, range 0..to). Messages from the subscription are discarded
 * unless keepSubscribeMessages is set.
 */
export const serverProxyHarness = async ({
  subscribe = true,
  keepSubscribeMessages = false,
  ...subscription
}: HarnessOptions = {}) => {
  TEST_setRequestId(1);
  const t = new ServerProxyHarness();
  if (subscribe) {
    await t.subscribe(subscription);
    if (!keepSubscribeMessages) {
      t.discard();
    }
  }
  return t;
};

/* ------------------------------------------------------------------ */
/* Readable failures                                                  */
/* ------------------------------------------------------------------ */

const isRowTuple = (row: unknown): row is unknown[] =>
  Array.isArray(row) && row.length >= 10;

/** One line per row: `#10 k0 key-10 sel0 ts1 | "key-10","name 10",1010,true` */
const formatRow = (row: unknown[]) => {
  const [idx, key, isLeaf, isExpanded, depth, count, rowKey, sel, ts, isNew] =
    row;
  const flags = [
    isLeaf !== true && `leaf=${isLeaf}`,
    isExpanded !== false && `expanded=${isExpanded}`,
    depth !== 0 && `depth=${depth}`,
    count !== 0 && `count=${count}`,
    isNew !== false && `new=${isNew}`,
  ].filter(Boolean);
  const data = row.slice(10).map((v) => JSON.stringify(v));
  return `#${idx} k${key} ${rowKey} sel${sel} ts${ts}${
    flags.length ? ` [${flags.join(" ")}]` : ""
  } | ${data.join(",")}`;
};

const withFormattedRows = (messages: unknown[]) =>
  messages.map((msg) => {
    const rows = (msg as { rows?: unknown })?.rows;
    return Array.isArray(rows)
      ? {
          ...(msg as object),
          rows: rows.map((r) => (isRowTuple(r) ? formatRow(r) : r)),
        }
      : msg;
  });

/**
 * Exact toEqual on the raw messages. If that fails, the rows are compared
 * again as one-line strings so the diff shows which rows differ.
 */
const expectWithReadableRows = (
  actual: unknown[],
  expected: unknown[],
  label: string,
) => {
  try {
    expect(actual, label).toEqual(expected);
  } catch (rawError) {
    expect(withFormattedRows(actual), label).toEqual(
      withFormattedRows(expected),
    );
    // formatting hid the difference, so report the raw failure
    throw rawError;
  }
};
