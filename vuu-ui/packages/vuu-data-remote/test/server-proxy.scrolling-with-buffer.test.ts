import "./global-mocks";
import { describe, expect, it } from "vitest";
import {
  changeRange,
  clientRows,
  rows,
  serverProxyHarness,
  size,
  viewportUpdate,
} from "./server-proxy-dsl";

describe("ServerProxy", () => {
  describe("scrolling, with buffer", () => {
    it("scroll to end", async () => {
      const t = await serverProxyHarness({ bufferSize: 100, to: 20 });
      t.server.sends(size(5000), rows(0, 120, { vpSize: 5000 }));
      t.discard();

      t.client.setRange(4975, 5000);
      t.expectClient();
      t.expectServer(changeRange(4875, 5100));

      t.server.acksRange(4975, 5100);
      t.expectClient();

      t.server.sends(rows(4975, 5000, { vpSize: 5000 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(4975, 5000, { key: 0 }) }),
      );
    });

    it("returns client range requests from buffer, if available. Calls server when end of buffer is approached", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      t.server.sends(size(), rows(0, 20));
      t.discard();

      t.client.setRange(2, 12);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [2, 12],
          rows: clientRows(10, 12, { key: 0 }),
        }),
      );

      t.client.setRange(5, 15);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [5, 15],
          rows: clientRows(12, 15, { key: 2 }),
        }),
      );

      t.client.setRange(8, 18);
      t.expectServer(changeRange(0, 28));
      t.expectClient(
        viewportUpdate({
          range: [8, 18],
          rows: clientRows(15, 18, { key: 5 }),
        }),
      );
    });

    it("returns client range requests from buffer, if available. Final request is only partially available in cache. Resolved when next server data received", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      // full snapshot for the initial subscription range
      t.server.sends(size(), rows(0, 20));
      t.discard();

      // 2..12 is within the cache: no server call, rows come from cache
      t.client.setRange(2, 12);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [2, 12],
          rows: clientRows(10, 12, { key: 0 }),
        }),
      );

      // 5..15 is still within the cache
      t.client.setRange(5, 15);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [5, 15],
          rows: clientRows(12, 15, { key: 2 }),
        }),
      );

      // 8..18 is within the cache but close enough to its edge to request more
      t.client.setRange(8, 18);
      t.expectServer(changeRange(0, 28));
      t.expectClient(
        viewportUpdate({
          range: [8, 18],
          rows: clientRows(15, 18, { key: 5 }),
        }),
      );

      t.server.acksRange(0, 28);

      // cache runs out: only 18 and 19 are available
      t.client.setRange(12, 22);
      t.expectClient(
        viewportUpdate({
          range: [12, 22],
          rows: clientRows(18, 20, { key: 8 }),
        }),
      );

      t.server.sends(rows(20, 28));
      t.expectClient(viewportUpdate({ rows: clientRows(20, 22, { key: 0 }) }));
    });

    it("records sent to client when enough data available, client scrolls before initial rows rendered", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });

      // server responds with just rows 0..4, all in client range
      t.server.sends(size(), rows(0, 5));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 5) }));

      // client scrolls before the rest of the initial data arrives
      t.client.setRange(2, 12);
      t.expectClient();

      // rows 5..9 arrive, all in client range
      t.server.sends(rows(5, 10, { ts: 2 }));
      t.expectClient(viewportUpdate({ rows: clientRows(5, 10, { ts: 2 }) }));

      t.server.sends(rows(10, 15, { ts: 3 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(10, 12, { key: 0, ts: 3 }) }),
      );
    });

    it("data sequence is correct when scrolling backward, data arrives from server in multiple batches", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      // rows 0..20 cached, 0..10 sent to client
      t.server.sends(size(), rows(0, 20));
      t.discard();

      // 20..30 with buffer is 10..40; 10..20 kept, server sends 20..40
      t.client.setRange(20, 30);
      t.server.acksRange(10, 40);
      t.server.sends(rows(20, 40, { ts: 2 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(20, 30, { key: 0, ts: 2 }) }),
      );

      // scroll back to 12..22 (2..32 with buffer); every client row is cached
      t.client.setRange(12, 22);
      t.expectClient(
        viewportUpdate({
          range: [12, 22],
          rows: clientRows(12, 20, { key: 2 }),
        }),
      );

      t.server.acksRange(2, 32);
      // 2 of the 8 awaited rows arrive
      t.server.sends(rows(8, 10, { ts: 3 }));
      t.expectClient();

      // the remaining rows arrive
      t.server.sends(rows(2, 8, { ts: 4 }));
      t.expectClient();
    });

    it("Data sequence is correct when ... scrolling backward user scrolls faster than cache replenished data arrives from server in multiple batches", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      // rows 0..20 cached, 0..10 sent to client
      t.server.sends(size(), rows(0, 20));
      t.discard();

      // 20..30 with buffer is 10..40; 10..20 kept, server sends 20..40
      t.client.setRange(20, 30);
      t.server.acksRange(10, 40);
      t.server.sends(rows(20, 40, { ts: 2 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(20, 30, { key: 0, ts: 2 }) }),
      );

      // scroll back to 5..15 (0..25 with buffer); only 10..15 are cached,
      // those are sent now
      t.client.setRange(5, 15);
      t.expectClient(
        viewportUpdate({
          range: [5, 15],
          rows: clientRows(10, 15, { key: 5 }),
        }),
      );

      t.server.acksRange(0, 25);
      // 2 of the 10 awaited rows arrive, both in client range
      t.server.sends(rows(8, 10, { ts: 3 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(8, 10, { key: 3, ts: 3 }) }),
      );

      // the remaining rows arrive
      t.server.sends(rows(0, 8, { ts: 4 }));
      t.expectClient(
        viewportUpdate({ rows: clientRows(5, 8, { key: 0, ts: 4 }) }),
      );
    });

    it("Scrolling with large buffer. Keys are recomputed on each scroll. Calls server when end of buffer is approached", async () => {
      const t = await serverProxyHarness({ bufferSize: 100 });
      t.server.sends(size(1000), rows(0, 110, { vpSize: 1000 }));

      expect(t.viewportState()).toMatchObject({
        cachedRowCount: 110,
        clientRange: { from: 0, to: 10 },
      });
      t.discard();

      t.client.setRange(12, 23);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [12, 23],
          rows: clientRows(12, 23, { key: 0 }),
        }),
      );

      t.client.setRange(30, 40);
      t.expectServer();
      t.expectClient(
        viewportUpdate({
          range: [30, 40],
          rows: clientRows(30, 40, { key: 0 }),
        }),
      );
    });
  });
});
