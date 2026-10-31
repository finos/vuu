import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { describe, expect, it } from "vitest";
import "./global-mocks";
import {
  rows,
  size,
  update,
  type ViewportHarness,
  viewportHarness,
} from "./server-proxy-dsl";

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

/** A subscribed viewport and a client window over the same range. */
const setup = (from: number, to: number) => {
  const v = viewportHarness({ bufferSize: 10, range: [from, to] });
  v.subscribed();
  const client = new ClientWindow({ from, to });
  return { v, client };
};

/** Sends the viewport's pending client rows to the client window. */
const flushToClient = (v: ViewportHarness, client: ClientWindow) => {
  client.add(v.viewport.getClientRows()[0]);
};

/**
 * The Table updates its own window synchronously, then the server proxy
 * processes the range request.
 */
const setRange = (
  v: ViewportHarness,
  client: ClientWindow,
  from: number,
  to: number,
) => {
  client.setRange({ from, to });
  client.add(v.setRange(from, to).rows);
};

const sendUpdates = (
  v: ViewportHarness,
  client: ClientWindow,
  rowIndices: number[],
) => {
  v.receives(rowIndices.map((rowIndex) => update(rowIndex, Math.random())));
  flushToClient(v, client);
};

describe("Viewport render keys", () => {
  it("never holds duplicate keys on client when first range change reduces range size", () => {
    const { v, client } = setup(0, 30);

    v.receives(size(), rows(0, 40));
    flushToClient(v, client);
    expect(client.duplicateKeys).toEqual([]);

    // KeySet was constructed from the subscribe range, a distinct object, so
    // this shrink is detected and KeySet.init() re-assigns every key. Only
    // delta rows (none here) are sent to client, which retains old keys.
    setRange(v, client, 5, 25);
    expect(client.duplicateKeys).toEqual([]);

    // Update for row 15 now carries key 10. Row 10, still on the client,
    // also has key 10.
    sendUpdates(v, client, [15]);
    expect(client.duplicateKeys).toEqual([]);
  });

  it("recycles keys when range shrinks then grows (after first range change)", () => {
    const { v, client } = setup(0, 30);

    v.receives(size(), rows(0, 50));
    flushToClient(v, client);

    // Same-size range change. From here on, KeySet.range is a reference to
    // dataWindow.clientRange, which is mutated by setClientRange before
    // KeySet.reset is called, so size reductions are never detected.
    setRange(v, client, 1, 31);
    setRange(v, client, 1, 21);
    setRange(v, client, 1, 31);

    expect(client.duplicateKeys).toEqual([]);
    // 30 rows have been rendered at any one time, so 30 keys (0-29) suffice.
    // Keys freed by the shrink should be re-used, otherwise React will
    // unmount/remount rows.
    expect(Math.max(...client.keys)).toBeLessThan(30);
  });
});
