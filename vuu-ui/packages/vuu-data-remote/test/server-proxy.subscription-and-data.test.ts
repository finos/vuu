import "./global-mocks";
import { describe, expect, it } from "vitest";
import {
  clientRow,
  clientRows,
  rows,
  serverProxyHarness,
  size,
  sizeOnly,
  subscribedMessage,
  subscriptionRequests,
  update,
  viewportUpdate,
} from "./server-proxy-dsl";

describe("ServerProxy", () => {
  describe("subscription", () => {
    it("sends server requests for metadata, links and menus along with subscription", async () => {
      const t = await serverProxyHarness({ keepSubscribeMessages: true });
      t.expectServer(...subscriptionRequests([0, 10]));
    });

    it("initialises Viewport when server ACKS subscription", async () => {
      const t = await serverProxyHarness();

      const proxy = t.proxyState();
      expect(proxy.viewportCount).toEqual(1);
      expect(proxy.serverViewportFor("client-vp-1")).toEqual("server-vp-1");
      expect(t.viewportState()).toMatchObject({
        clientViewportId: "client-vp-1",
        serverViewportId: "server-vp-1",
        status: "subscribed",
      });
    });

    it("sends message to client once subscribed", async () => {
      const t = await serverProxyHarness({ keepSubscribeMessages: true });
      t.expectClient(subscribedMessage({ range: [0, 10] }));
    });
  });

  describe("Data Handling", () => {
    it("sends data to client when initial full dataset is received", async () => {
      const t = await serverProxyHarness();

      t.server.sends(size(), rows(0, 10));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 10) }));
    });

    it("sends data to client even before  all data for client range is available", async () => {
      const t = await serverProxyHarness();

      t.server.sends(size(), rows(0, 5));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 5) }));

      t.server.sends(rows(5, 10, { ts: 2 }));
      t.expectClient(viewportUpdate({ rows: clientRows(5, 10, { ts: 2 }) }));
    });

    it("1) sends data to client when initial full dataset is received 2) sets rowcount to 0 3) sends fresh data to client in 2 batches, SIZE record at end of first batch, which is enough to fill client range", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });

      t.server.sends(size(), rows(0, 10));
      t.server.sends(size(0));
      t.discard();

      t.server.sends(rows(0, 10), size());
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 10) }));

      t.server.sends(rows(10, 20));
      t.expectClient();
    });

    it("1) sends zero count to client when table is initially empty 2) sends each rowcount and row when rows arrive individually, does not wait for full range when all rows are available", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });

      t.server.sends(size(0));
      t.expectClient(sizeOnly(0));

      t.server.sends(size(1), rows(0, 1, { vpSize: 1 }));
      t.expectClient(viewportUpdate({ size: 1, rows: clientRows(0, 1) }));

      t.server.sends(size(2), rows(1, 2, { vpSize: 2 }));
      t.expectClient(viewportUpdate({ size: 2, rows: clientRows(1, 2) }));

      t.server.sends(rows(2, 3, { vpSize: 3 }), size(3));
      t.expectClient(viewportUpdate({ size: 3, rows: clientRows(2, 3) }));
    });

    it("1) sends data to client when initial full dataset is received 2) sets rowcount to 0 3) sends fresh data to client in 2 batches, SIZE record at end of first batch, first batch is NOT enough to fill client range", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });

      t.server.sends(size(), rows(0, 10));
      t.server.sends(size(0));
      t.discard();

      t.server.sends(rows(0, 7), size());
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 7) }));

      t.server.sends(rows(7, 20));
      t.expectClient(viewportUpdate({ rows: clientRows(7, 10) }));
    });
  });

  describe("Scrolling, no buffer", () => {
    it("scrolls forward, partial viewport", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.setRange(2, 12);
      t.server.acksRange(2, 12);
      t.expectClient();

      t.server.sends(rows(10, 12));
      t.expectClient(viewportUpdate({ rows: clientRows(10, 12, { key: 0 }) }));
    });

    it("scrolls forward, discrete viewport", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.setRange(20, 30);
      t.server.acksRange(20, 30);
      t.expectClient();

      t.server.sends(rows(20, 30));
      t.expectClient(viewportUpdate({ rows: clientRows(20, 30, { key: 0 }) }));
    });
  });

  describe("Updates", () => {
    it("Updates, no scrolling, only sends updated rows to client", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.server.sends(update(3, 2003));
      t.expectClient(
        viewportUpdate({ rows: [clientRow(3, { ts: 2, value: 2003 })] }),
      );
    });
  });

  describe("Buffering data", () => {
    it("buffers 10 rows, server sends entire buffer set", async () => {
      const t = await serverProxyHarness({
        bufferSize: 10,
        keepSubscribeMessages: true,
      });
      t.expectServer(...subscriptionRequests([0, 20]));
      t.discard();

      t.server.sends(size(), rows(0, 20));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 10) }));
    });

    it("10 rows in grid, so 11 requested, (render buffer 0), 10 rows in Viewport buffer, page down, narrowing of range by 1 row", async () => {
      const t = await serverProxyHarness({
        bufferSize: 10,
        to: 11,
        keepSubscribeMessages: true,
      });
      t.expectServer(...subscriptionRequests([0, 21]));
      t.discard();

      t.server.sends(size(), rows(0, 21));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 11) }));

      t.client.setRange(10, 20);
      t.expectClient(
        viewportUpdate({
          range: [10, 20],
          rows: clientRows(11, 20, { key: 0 }),
        }),
      );
    });

    it("buffers 10 rows, server sends partial buffer set, enough to fulfill client request, followed by rest", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });

      t.server.sends(size(), rows(0, 10));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 10) }));

      // buffer top-up only
      t.server.sends(rows(10, 20));
      t.expectClient();
    });

    it("buffers 10 rows, server sends partial buffer set, NOT enough to fulfill client request, followed by rest", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });

      t.server.sends(size(), rows(0, 9));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 9) }));

      t.server.sends(rows(9, 15, { ts: 2 }));
      t.expectClient(viewportUpdate({ rows: clientRows(9, 10, { ts: 2 }) }));

      // buffer top-up only
      t.server.sends(rows(15, 20));
      t.expectClient();
    });
  });
});
