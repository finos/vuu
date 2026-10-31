import { expect } from "vitest";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import {
  ServerProxy,
  TEST_setRequestId,
} from "../../src/server-proxy/server-proxy";
import type { Viewport } from "../../src/server-proxy/viewport";
import type { WebSocketConnection } from "../../src/WebSocketConnection";
import { COMMON_ATTRS, COMMON_TABLE_ROW_ATTRS, subscribe } from "../test-utils";
import { DEFAULT_CLIENT_VP, DEFAULT_SERVER_VP } from "./builders";

export interface HarnessOptions {
  bufferSize?: number;
  /** end of the initial client range, default 10 */
  to?: number;
}

type ServerRequest = {
  requestId: string;
  body: { type: string; viewPortId?: string };
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
      const request = this.#lastRequest("CHANGE_VP_RANGE", vp);
      this.proxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: request.requestId,
        body: { type: "CHANGE_VP_RANGE_SUCCESS", viewPortId: vp, from, to },
      });
    },
  };

  /** Actions arriving from the UI client. */
  readonly client = {
    setRange: (from: number, to: number, vp = DEFAULT_CLIENT_VP) => {
      this.proxy.handleMessageFromClient({
        viewport: vp,
        type: "setViewRange",
        range: { from, to },
      });
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
    const viewport = this.proxy["viewports"].get(vp) as Viewport | undefined;
    if (!viewport) throw Error(`no viewport ${vp}`);
    const dataWindow = viewport["dataWindow"];
    return {
      cachedRowCount: dataWindow?.["internalData"].length,
      clientRange: dataWindow?.clientRange,
    };
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
 * server-vp-1, range 0..to). Messages from the subscription are discarded.
 */
export const serverProxyHarness = async ({
  bufferSize = 0,
  to = 10,
}: HarnessOptions = {}) => {
  TEST_setRequestId(1);
  const t = new ServerProxyHarness();
  await subscribe(t.proxy, { bufferSize, to });
  t.discard();
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
