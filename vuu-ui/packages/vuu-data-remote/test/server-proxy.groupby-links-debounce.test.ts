import "./global-mocks";
import { describe, expect, it } from "vitest";
import { COMMON_TABLE_ROW_ATTRS } from "./test-utils";
import {
  changeVp,
  clientRows,
  groupClientRow,
  groupClientRows,
  groupRow,
  groupRows,
  rows,
  serverProxyHarness,
  size,
  sizeOnly,
  viewportUpdate,
  type ServerProxyHarness,
} from "./server-proxy-dsl";

/* Local helpers ---------------------------------------------------- */

/** Groups by col-4 and has the server ACK the CHANGE_VP. */
const groupByCol4 = (t: ServerProxyHarness) => {
  t.client.config({ groupBy: ["col-4"] });
  t.expectClient();
  t.expectServer(changeVp({ groupBy: ["col-4"] }));
  t.server.acks("CHANGE_VP");
};

describe("ServerProxy", () => {
  describe("GroupBy", () => {
    it("sets viewport isTree when groupby in place", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      groupByCol4(t);

      expect(t.viewportState().isTree).toBe(true);
    });

    it("on changing group, sends grouped records as batch, with SIZE record", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      groupByCol4(t);
      t.discard();

      t.server.sends(groupRows());
      expect(t.viewportState().cachedRowCount).toBe(4);
      t.expectClient(viewportUpdate({ size: 4, rows: groupClientRows(0, 4) }));
    });

    it("on changing group, sends grouped records as batch, without SIZE record", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      groupByCol4(t);
      t.discard();

      t.server.sends(groupRows(false));
      expect(t.viewportState().cachedRowCount).toBe(4);
      t.expectClient(viewportUpdate({ size: 4, rows: groupClientRows(0, 4) }));
    });

    it("on changing group, it may receive group records in multiple batches", async () => {
      const t = await serverProxyHarness({ bufferSize: 100 });
      t.server.sends(size(), rows(0, 110));
      t.discard();

      groupByCol4(t);
      t.discard();

      // the group rows arrive in two batches; each batch is sent on as it arrives
      const grouped = groupRows(false);
      t.server.receives(
        { ...COMMON_TABLE_ROW_ATTRS, timeStamp: 1, rows: grouped.slice(0, 2) },
        "2",
      );
      t.server.receives(
        { ...COMMON_TABLE_ROW_ATTRS, timeStamp: 2, rows: grouped.slice(2) },
        "3",
      );

      expect(t.viewportState().cachedRowCount).toBe(4);
      t.expectClient(
        viewportUpdate({ size: 4, rows: groupClientRows(0, 2) }),
        viewportUpdate({ rows: groupClientRows(2, 4) }),
      );
    });

    it("ignores regular row updates after grouping is in place", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.config({ groupBy: ["col-4"] });
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(rows(0, 10));
      t.expectClient();
    });

    it("processes group row updates", async () => {
      const t = await serverProxyHarness({ bufferSize: 100 });
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.config({ groupBy: ["col-4"] });
      t.server.acks("CHANGE_VP");
      t.discard();

      t.server.sends(groupRows());
      expect(t.viewportState().cachedRowCount).toBe(4);
      t.expectClient(viewportUpdate({ size: 4, rows: groupClientRows(0, 4) }));

      t.server.sends(groupRow(1, "EUR", 43942));
      expect(t.viewportState().cachedRowCount).toBe(4);
      t.expectClient(
        viewportUpdate({ rows: [groupClientRow(1, "EUR", 43942)] }),
      );
    });
  });

  describe("SIZE records", () => {
    it("subscribe whilst table is loading", async () => {
      const t = await serverProxyHarness();

      t.server.sends(size(1));
      t.expectClient(sizeOnly(1));

      t.server.sends(rows(0, 1), size(293), rows(1, 10, { vpSize: 293 }));
      t.expectClient(viewportUpdate({ size: 293, rows: clientRows(0, 10) }));

      t.server.sends(size(850));
      t.expectClient(sizeOnly(850));

      t.server.sends(size(880));
      t.expectClient(sizeOnly(880));

      t.server.sends(size(921));
      t.expectClient(sizeOnly(921));

      t.server.sends(size(948));
      t.expectClient(sizeOnly(948));
    });
  });

  describe("on visual linking", () => {
    it("returns link table rows", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.server.sends(size(), rows(0, 10));
      t.server.sends(
        size(100, "server-vp-2"),
        rows(0, 10, { vp: "server-vp-2" }),
      );
      t.client.createLink();
      t.discard();

      t.server.sends(
        rows(0, 1, { sel: 1, value: 2000 }),
        size(20, "server-vp-2"),
        rows(0, 10, { ts: 2, value: 2000, vp: "server-vp-2" }),
      );

      t.expectClient(
        viewportUpdate({ rows: clientRows(0, 1, { sel: 1, value: 2000 }) }),
        viewportUpdate({
          size: 100,
          rows: clientRows(0, 10, { ts: 2, value: 2000 }),
          vp: "client-vp-2",
        }),
      );
    });
  });

  describe("debounce mode", () => {
    it("clears pending range request when request is filled", async () => {
      const t = await serverProxyHarness();
      expect(t.viewportState().pendingRangeCount).toBe(0);

      t.server.sends(size(), rows(0, 10));

      t.client.setRange(24, 34);
      expect(t.viewportState().pendingRangeCount).toBe(1);

      t.server.acksRange(24, 34);
      expect(t.viewportState().pendingRangeCount).toBe(1);

      t.server.sends(rows(24, 34));
      expect(t.viewportState().pendingRangeCount).toBe(0);
    });

    it("clears pending range request when only partial set of rows received", async () => {
      const t = await serverProxyHarness();
      expect(t.viewportState().pendingRangeCount).toBe(0);

      t.server.sends(size(), rows(0, 10));
      t.client.setRange(24, 34);
      t.server.acksRange(24, 34);

      t.server.sends(rows(24, 28));
      expect(t.viewportState().pendingRangeCount).toBe(0);
    });

    it("queues pending range requests, until filled, no message to client until current client range filled", async () => {
      const t = await serverProxyHarness();
      expect(t.viewportState().pendingRangeCount).toBe(0);

      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.setRange(24, 34);
      expect(t.viewportState().pendingRangeCount).toBe(1);
      t.server.acksRange(24, 34);

      t.client.setRange(44, 54);
      expect(t.viewportState().pendingRangeCount).toBe(2);
      t.server.acksRange(44, 54);

      t.expectClient();
      expect(t.viewportState().pendingRangeCount).toBe(2);

      t.server.sends(rows(24, 34));
      expect(t.viewportState().pendingRangeCount).toBe(1);
      t.expectClient();

      t.server.sends(rows(44, 54));
      expect(t.viewportState().pendingRangeCount).toBe(0);
      t.expectClient(viewportUpdate({ rows: clientRows(44, 54, { key: 0 }) }));
    });

    it("sends debounce request to client when rows requested before previous request acked", async () => {
      const t = await serverProxyHarness();
      // the SIZE row is for server-vp-2, which does not exist
      t.server.sends(size(100, "server-vp-2"), rows(0, 10));
      t.discard();

      t.client.setRange(24, 34);
      t.client.setRange(44, 54);

      t.expectClient({
        clientViewportId: "client-vp-1",
        type: "debounce-begin",
      });
    });
  });

  describe("config", () => {
    it("sets viewport isTree when config includes groupby", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      groupByCol4(t);

      expect(t.viewportState().isTree).toBe(true);
    });
  });
});
