import "./global-mocks";
import { describe, expect, it, vi } from "vitest";
import {
  changeRange,
  clientRow,
  clientRows,
  rows,
  selectRow,
  serverProxyHarness,
  size,
  sizeOnly,
  update,
  viewportUpdate,
} from "./server-proxy-dsl";

/** update() for each row in [from, to), all with the same value. */
const updates = (
  from: number,
  to: number,
  value: number,
  options: Parameters<typeof update>[2] = {},
) =>
  Array.from({ length: to - from }, (_, i) => update(from + i, value, options));

/** clientRow() for each row in [from, to), all with the same options. */
const clientRowsWith = (
  from: number,
  to: number,
  options: Parameters<typeof clientRow>[1] = {},
) => Array.from({ length: to - from }, (_, i) => clientRow(from + i, options));

const EUR_FILTER = { filterSpec: { filter: 'ccy = "EUR"' } };
const NO_FILTER = { filterSpec: { filter: "" } };

describe("ServerProxy", () => {
  describe("synchronising with server", () => {
    it("does not spam server when buffer limit reached and server request already in-flight", async () => {
      const t = await serverProxyHarness({ bufferSize: 20 });
      // 1) server sends initial set of rows
      t.server.sends(size(), rows(0, 30));
      t.discard();

      // 2) 16..26 is all in cache, so the client gets rows now, but we are
      // close to the end of the buffer, so we read ahead from the server
      t.client.setRange(16, 26);
      t.expectServer(changeRange(0, 46));
      t.expectClient(expect.anything());

      // 17..27: the request in flight already covers this range
      t.client.setRange(17, 27);
      t.expectServer();
      t.expectClient(expect.anything());

      // 18..28: same as above
      t.client.setRange(18, 28);
      t.expectServer();
      t.expectClient(expect.anything());
    });

    it("re-requests data from server even before receiving results", async () => {
      const t = await serverProxyHarness({ bufferSize: 20 });
      // 1) server sends initial set of rows
      t.server.sends(size(), rows(0, 30));
      t.discard();

      // 2) all rows are in cache, but we are close to the edge of the buffer.
      // bufferSize 20 requests +/- 10 around the client range
      t.client.setRange(16, 26);
      t.expectServer(changeRange(0, 46));
      t.expectClient(expect.anything());

      // 3) server ACKs range change
      t.server.acksRange(0, 46);
      t.discard();

      // 4) a request is already in flight, so none is sent; all rows cached
      t.client.setRange(17, 27);
      t.expectServer();
      t.expectClient(expect.anything());

      // 5) still waiting, client scrolls beyond the cache; the rows we have
      // are sent
      t.client.setRange(24, 34);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [24, 34],
          rows: clientRows(27, 30, { key: 1 }),
        }),
      );
    });
  });

  describe("growing and shrinking rowset (Orders)", () => {
    it("initializes with rowset that does not fill client viewport", async () => {
      const t = await serverProxyHarness({ bufferSize: 100, to: 20 });

      t.server.sends(size(10), rows(0, 10, { vpSize: 10 }));
      t.expectClient(viewportUpdate({ size: 10, rows: clientRows(0, 10) }));
    });

    it("gradually reduces, then grows viewport", async () => {
      const t = await serverProxyHarness({ bufferSize: 100, to: 20 });

      const timeNow = Date.now();
      vi.setSystemTime(timeNow);

      t.server.sends(size(10), rows(0, 10, { vpSize: 10 }));
      t.discard();

      t.server.sends(size(9));
      t.expectClient(sizeOnly(9));

      vi.setSystemTime(timeNow + 10);
      t.server.sends(size(8));
      t.expectClient(sizeOnly(8));

      vi.setSystemTime(timeNow + 20);
      t.server.sends(size(1));
      t.expectClient(sizeOnly(1));

      // the original notes this intermittently produced no message
      t.server.sends(size(0));
      t.expectClient(sizeOnly(0));

      // the original marks mode "update" in the next three as WRONG
      t.server.sends(size(1), rows(0, 1, { vpSize: 1 }));
      t.expectClient(viewportUpdate({ size: 1, rows: clientRows(0, 1) }));

      t.server.sends(size(2), rows(1, 2, { vpSize: 2 }));
      t.expectClient(viewportUpdate({ size: 2, rows: clientRows(1, 2) }));

      t.server.sends(size(6), rows(2, 6, { vpSize: 6 }));
      t.expectClient(viewportUpdate({ size: 6, rows: clientRows(2, 6) }));
    });
  });

  describe("selection", () => {
    it("single select", async () => {
      const t = await serverProxyHarness({ to: 20 });
      t.server.sends(size(10), rows(0, 10, { vpSize: 10 }));
      t.discard();

      // the client's requestId is passed through to the server
      t.client.select("key-01", { requestId: "client-request-1" });
      t.expectClient();
      t.expectServer(selectRow("key-01", { requestId: "client-request-1" }));

      t.client.select("key-02", { requestId: "client-request-2" });
      t.expectClient();
      t.expectServer(selectRow("key-02", { requestId: "client-request-2" }));
    });
  });

  describe("filtering", () => {
    it("invokes filter on viewport, which stores current filter criteria", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.config(EUR_FILTER);
      t.server.acks("CHANGE_VP");

      expect(t.viewportState().filter).toEqual({ filter: 'ccy = "EUR"' });
    });

    it("sets batch mode when a filter has been applied", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.config(EUR_FILTER);
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(size(43), updates(0, 10, 1234, { vpSize: 43 }));
      t.expectClient(
        viewportUpdate({
          rows: clientRowsWith(0, 10, { ts: 2, value: 1234 }),
          size: 43,
        }),
      );
    });

    it("handles TABLE_ROWS that precede filter request together with filtered rows, in same batch", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.config(EUR_FILTER);
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(
        updates(0, 10, 1234, { vpSize: 100 }),
        size(43),
        updates(0, 10, 2004, { vpSize: 43 }),
      );
      t.expectClient(
        viewportUpdate({
          rows: clientRowsWith(0, 10, { ts: 2, value: 2004 }),
          size: 43,
        }),
      );
    });

    it("1) applies filter that sets rowsize to 1, 2) removes filter, all rows refreshed", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      t.server.sends(size(), rows(0, 20));
      t.discard();

      t.client.config(EUR_FILTER);
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(size(1), update(0, 1234, { vpSize: 1 }));

      t.client.config(NO_FILTER);
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(size(), rows(0, 20, { ts: 3 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(0, 10, { ts: 3 }), size: 100 }),
      );
    });

    it("1) applies filter that sets rowsize to 1, 2) removes filter, all rows refreshed, in multiple batches", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      t.server.sends(size(), rows(0, 20));
      t.discard();

      t.client.config(EUR_FILTER);
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(size(1), update(0, 1234, { id: "abc", vpSize: 1 }));
      t.expectClient(expect.anything());

      t.client.config(NO_FILTER);
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(size(), rows(0, 5, { ts: 3 }));
      t.server.sends(rows(5, 20, { ts: 3 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(0, 5, { ts: 3 }), size: 100 }),
        viewportUpdate({ rows: clientRows(5, 10, { ts: 3 }) }),
      );
    });
  });
});
