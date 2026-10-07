import {
  DataSourceRow,
  ServerProxySubscribeMessage,
} from "@vuu-ui/vuu-data-types";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import { Viewport } from "../src/server-proxy/viewport";
import "./global-mocks";
import {
  createSubscription,
  createTableRows,
  sizeRow,
  testSchema,
  updateTableRow,
} from "./test-utils";

/**
 * Minimal model of the client-side DataRowMovingWindow, as used by the Table.
 * Rows are held by rowIndex; rows outside the current range are discarded
 * when the range changes. The render key of each row is the key assigned by
 * the Viewport KeySet at the time the row was sent to the client.
 */
class ClientWindow {
  private rows = new Map<number, number>();
  constructor(private range: VuuRange) {}

  setRange(range: VuuRange) {
    this.range = range;
    for (const rowIndex of this.rows.keys()) {
      if (rowIndex < range.from || rowIndex >= range.to) {
        this.rows.delete(rowIndex);
      }
    }
  }

  add(rows: readonly DataSourceRow[] | undefined) {
    rows?.forEach(([rowIndex, key]) => {
      if (rowIndex >= this.range.from && rowIndex < this.range.to) {
        this.rows.set(rowIndex, key);
      }
    });
  }

  get keys() {
    return Array.from(this.rows.values());
  }

  get duplicateKeys() {
    const seen = new Set<number>();
    return this.keys.filter((key) => seen.has(key) || !seen.add(key));
  }
}

const createViewport = (range: VuuRange) => {
  const vp = new Viewport(
    {
      aggregations: [],
      columns: ["col1"],
      filterSpec: { filter: "" },
      groupBy: [],
      sort: { sortDefs: [] },
      bufferSize: 10,
      range,
      table: { module: "TEST", table: "test-table" },
      viewport: "vp1",
    } as ServerProxySubscribeMessage,
    () => undefined,
  );
  const [, serverSubscription] = createSubscription();
  vp.handleSubscribed(serverSubscription.body, testSchema);
  return vp;
};

const setRange = (
  vp: Viewport,
  client: ClientWindow,
  requestId: string,
  range: VuuRange,
) => {
  // Table updates its own window synchronously, then the request is
  // processed by the server proxy.
  client.setRange(range);
  const [, rows] = vp.rangeRequest(requestId, range);
  client.add(rows);
};

const sendUpdates = (
  vp: Viewport,
  client: ClientWindow,
  rowIndices: number[],
) => {
  vp.updateRows(
    rowIndices.map((rowIndex) =>
      updateTableRow("server-vp-1", rowIndex, Math.random()),
    ),
  );
  const [rows] = vp.getClientRows();
  client.add(rows);
};

describe("Viewport render keys", () => {
  it("never holds duplicate keys on client when first range change reduces range size", () => {
    const vp = createViewport({ from: 0, to: 30 });
    const client = new ClientWindow({ from: 0, to: 30 });

    vp.updateRows([sizeRow(), ...createTableRows("server-vp-1", 0, 40)]);
    client.add(vp.getClientRows()[0]);
    expect(client.duplicateKeys).toEqual([]);

    // KeySet was constructed from the subscribe range, a distinct object, so
    // this shrink is detected and KeySet.init() re-assigns every key. Only
    // delta rows (none here) are sent to client, which retains old keys.
    setRange(vp, client, "1", { from: 5, to: 25 });
    expect(client.duplicateKeys).toEqual([]);

    // Update for row 15 now carries key 10. Row 10, still on the client,
    // also has key 10.
    sendUpdates(vp, client, [15]);
    expect(client.duplicateKeys).toEqual([]);
  });

  it("recycles keys when range shrinks then grows (after first range change)", () => {
    const vp = createViewport({ from: 0, to: 30 });
    const client = new ClientWindow({ from: 0, to: 30 });

    vp.updateRows([sizeRow(), ...createTableRows("server-vp-1", 0, 50)]);
    client.add(vp.getClientRows()[0]);

    // Same-size range change. From here on, KeySet.range is a reference to
    // dataWindow.clientRange, which is mutated by setClientRange before
    // KeySet.reset is called, so size reductions are never detected.
    setRange(vp, client, "1", { from: 1, to: 31 });
    setRange(vp, client, "2", { from: 1, to: 21 });
    setRange(vp, client, "3", { from: 1, to: 31 });

    expect(client.duplicateKeys).toEqual([]);
    // 30 rows have been rendered at any one time, so 30 keys (0-29) suffice.
    // Keys freed by the shrink should be re-used, otherwise React will
    // unmount/remount rows.
    expect(Math.max(...client.keys)).toBeLessThan(30);
  });
});
