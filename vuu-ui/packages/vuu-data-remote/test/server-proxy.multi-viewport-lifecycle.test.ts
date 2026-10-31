import "./global-mocks";
import { describe, expect, it } from "vitest";
import type { VuuRow } from "@vuu-ui/vuu-protocol-types";
import {
  changeRange,
  clientRow,
  clientRows,
  disableVp,
  enableVp,
  rows,
  serverProxyHarness,
  serverRequest,
  size,
  subscribedMessage,
  update,
  viewportUpdate,
} from "./server-proxy-dsl";

/** CHANGE_VP_SUCCESS body for server-vp-1 with the given filter. */
const changeVpSuccess = (filter: string) => ({
  aggregations: [],
  columns: ["col-1", "col-2", "col-3", "col-4"],
  sort: { sortDefs: [] },
  filterSpec: { filter },
  groupBy: [],
  type: "CHANGE_VP_SUCCESS",
  viewPortId: "server-vp-1",
});

/** Updated client rows, each with ts 2 and the numeric column set to value. */
const updatedRows = (values: Array<[rowIndex: number, value: number]>) =>
  values.map(([rowIndex, value]) => clientRow(rowIndex, { ts: 2, value }));

describe("ServerProxy", () => {
  describe("multiple subscriptions", () => {
    it("sends messages to correct clients once subscribed", async () => {
      const t = await serverProxyHarness({ keepSubscribeMessages: true });
      await t.subscribe({ key: "2" });

      t.expectClient(
        subscribedMessage({ range: [0, 10] }),
        subscribedMessage({ range: [0, 10], vp: "client-vp-2" }),
      );
      expect(t.proxyState().viewportCount).toEqual(2);
    });

    it("sends data to each client when initial full datasets are received as separate batches", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.discard();

      t.server.sends(size(100, "server-vp-1"), rows(0, 10));
      t.server.sends(
        size(100, "server-vp-2"),
        rows(0, 10, { vp: "server-vp-2" }),
      );

      t.expectClient(
        viewportUpdate({ size: 100, rows: clientRows(0, 10) }),
        viewportUpdate({
          size: 100,
          rows: clientRows(0, 10),
          vp: "client-vp-2",
        }),
      );
    });

    it("sends data to each client when initial full datasets are received interleaved", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.discard();

      const rows1 = rows(0, 10);
      const rows2 = rows(0, 10, { vp: "server-vp-2" });
      const interleaved: VuuRow[] = [];
      rows1.forEach((row, i) => {
        interleaved.push(row, rows2[i]);
      });

      t.server.sends(
        size(100, "server-vp-1"),
        size(100, "server-vp-2"),
        interleaved,
      );

      t.expectClient(
        viewportUpdate({ size: 100, rows: clientRows(0, 10) }),
        viewportUpdate({
          size: 100,
          rows: clientRows(0, 10),
          vp: "client-vp-2",
        }),
      );
    });

    it("sends data to each client followed by mixed updates", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.server.sends(size(100, "server-vp-1"), rows(0, 10));
      t.server.sends(
        size(200, "server-vp-2"),
        rows(0, 10, { vpSize: 200, vp: "server-vp-2" }),
      );
      t.discard();

      const vp2 = { vpSize: 200, vp: "server-vp-2" };
      t.server.sends(
        update(3, 2003),
        update(3, 2003, vp2),
        update(1, 2003),
        update(5, 2003, vp2),
        update(4, 2003, vp2),
      );

      t.expectClient(
        viewportUpdate({
          rows: updatedRows([
            [1, 2003],
            [3, 2003],
          ]),
        }),
        viewportUpdate({
          rows: updatedRows([
            [3, 2003],
            [4, 2003],
            [5, 2003],
          ]),
          vp: "client-vp-2",
        }),
      );
    });

    it("sends mixed updates, including size change for one vp", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.server.sends(size(100, "server-vp-1"), rows(0, 10));
      t.server.sends(
        size(200, "server-vp-2"),
        rows(0, 10, { vpSize: 200, vp: "server-vp-2" }),
      );
      t.discard();

      const vp1 = { vpSize: 50 };
      t.server.sends(
        size(50, "server-vp-1"),
        update(3, 2003, vp1),
        update(3, 2003, { vpSize: 200, vp: "server-vp-2" }),
        update(1, 2003, vp1),
        update(5, 2003, { vpSize: 200, vp: "server-vp-2" }),
        update(4, 2003, { vpSize: 200, vp: "server-vp-2" }),
      );

      t.expectClient(
        viewportUpdate({
          size: 50,
          rows: updatedRows([
            [1, 2003],
            [3, 2003],
          ]),
        }),
        viewportUpdate({
          rows: updatedRows([
            [3, 2003],
            [4, 2003],
            [5, 2003],
          ]),
          vp: "client-vp-2",
        }),
      );

      const vp2 = { vpSize: 75, vp: "server-vp-2" };
      t.server.sends(
        size(75, "server-vp-2"),
        update(3, 2004, vp1),
        update(3, 2004, vp2),
        update(1, 2004, vp1),
        update(5, 2004, vp2),
        update(4, 2004, vp2),
      );

      t.expectClient(
        viewportUpdate({
          rows: updatedRows([
            [1, 2004],
            [3, 2004],
          ]),
        }),
        viewportUpdate({
          size: 75,
          rows: updatedRows([
            [3, 2004],
            [4, 2004],
            [5, 2004],
          ]),
          vp: "client-vp-2",
        }),
      );
    });

    it("updates whilst suspended are applied by not sent to client", async () => {
      const t = await serverProxyHarness();
      const size99 = { vpSize: 99 };

      t.server.sends(
        update(0, 0, size99),
        update(2, 2, size99),
        update(5, 5, size99),
        update(6, 6, size99),
        update(8, 8, size99),
        size(99),
      );
      t.server.sends(
        update(1, 1, size99),
        update(3, 3, size99),
        update(7, 7, size99),
      );
      t.server.sends(update(4, 4, size99), update(9, 9, size99));

      t.expectClient(
        viewportUpdate({
          size: 99,
          rows: updatedRows([
            [0, 0],
            [2, 2],
            [5, 5],
            [6, 6],
            [8, 8],
          ]),
        }),
        viewportUpdate({
          rows: updatedRows([
            [1, 1],
            [3, 3],
            [7, 7],
          ]),
        }),
        viewportUpdate({
          rows: updatedRows([
            [4, 4],
            [9, 9],
          ]),
        }),
      );

      t.client.suspend();
      t.client.config({});
      t.client.config({ filterSpec: { filter: "col-4 = true" } });
      // These acks carry requestIds "1" and "2", which match no pending
      // request, so the proxy logs an error and ignores them.
      t.server.receives(changeVpSuccess(""), "1");
      t.server.receives(changeVpSuccess("col-4 = true"), "2");
      t.discard();

      const size100 = { vpSize: 100 };
      t.server.sends(
        update(0, 10_000, size100),
        update(1, 0, size100),
        update(2, 1, size100),
        update(5, 4, size100),
        update(8, 7, size100),
        update(7, 6, size100),
        update(10, 9, size100),
        update(6, 5, size100),
        update(4, 3, size100),
        update(3, 2, size100),
        update(9, 8, size100),
        size(100),
      );
      // filter back on, 0 removed
      t.server.sends(
        update(9, 9, size99),
        update(2, 2, size99),
        update(7, 7, size99),
        update(5, 5, size99),
        update(6, 6, size99),
        update(1, 1, size99),
        update(0, 0, size99),
        update(8, 8, size99),
        update(3, 3, size99),
        update(4, 4, size99),
        size(99),
      );
      t.expectClient();

      t.client.resume();
      t.expectClient(
        viewportUpdate({
          size: 99,
          rows: updatedRows(
            [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(
              (i) => [i, i] as [number, number],
            ),
          ),
        }),
      );

      t.client.config({ filterSpec: { filter: "col-4 = false" } });
      // requestId "3" matches no pending request either
      t.server.receives(changeVpSuccess("col-4 = true"), "3");
      t.discard();

      t.server.sends(update(0, 10_000, { vpSize: 1 }), size(1));
      t.expectClient(
        viewportUpdate({ size: 1, rows: updatedRows([[0, 10_000]]) }),
      );
    });
  });

  describe("disable and enable", () => {
    it("sends a message to server when client calls disable", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      expect(t.viewportState().disabled).toBe(false);

      t.client.disable();
      t.expectServer(disableVp());
      t.expectClient();
      // disabled is only set once the server ACKs
      expect(t.viewportState().disabled).toBe(false);

      t.server.acks("DISABLE_VP");
      expect(t.viewportState().disabled).toBe(true);
    });

    it("sends a message to server when client calls enable, re-sends data from cache to client", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.client.disable();
      t.server.acks("DISABLE_VP");
      t.discard();

      expect(t.viewportState().disabled).toBe(true);

      t.client.enable();
      t.expectServer(enableVp());
      t.expectClient();
      expect(t.viewportState().disabled).toBe(true);

      t.server.acks("ENABLE_VP");
      expect(t.viewportState().disabled).toBe(false);

      t.expectClient(
        { type: "enabled", clientViewportId: "client-vp-1" },
        viewportUpdate({ size: 100, rows: clientRows(0, 10) }),
      );
    });

    it("does nothing if client calls enable for a viewport which has not been disabled", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.client.enable();
      t.expectServer();
      t.expectClient();
    });

    it("disable sends message to server", async () => {
      const t = await serverProxyHarness();

      t.client.disable();
      // viewport isn't disabled until request ACKed
      expect(t.viewportState().disabled).toBe(false);
      t.expectServer(disableVp());
    });

    it("viewport is disabled when disable request is ACKed", async () => {
      const t = await serverProxyHarness();

      t.client.disable();
      t.server.acks("DISABLE_VP");

      expect(t.viewportState().disabled).toBe(true);
    });

    it("viewport is enabled when enable request is ACKed", async () => {
      const t = await serverProxyHarness();

      t.client.disable();
      t.server.acks("DISABLE_VP");

      t.client.enable();
      expect(t.viewportState().disabled).toBe(true);

      t.server.acks("ENABLE_VP");
      expect(t.viewportState().disabled).toBe(false);
    });

    it("full data update is sent to client once enable is ACKed", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(100), rows(0, 10));
      t.discard();

      t.client.disable();
      t.server.acks("DISABLE_VP");
      t.client.enable();
      t.server.acks("ENABLE_VP");

      t.expectClient(
        { type: "disabled", clientViewportId: "client-vp-1" },
        { type: "enabled", clientViewportId: "client-vp-1" },
        viewportUpdate({ size: 100, rows: clientRows(0, 10) }),
      );
    });
  });

  describe("request queuing", () => {
    it("queue is empty in normal operation", async () => {
      const t = await serverProxyHarness();
      expect(t.proxyState().queuedRequestCount).toEqual(0);
    });

    it("queues range requests sent before subscription completes, sends to server after subscription completes", async () => {
      const t = await serverProxyHarness({ subscribe: false });

      const subscription = t.startSubscription();
      // range request before the subscription is ACKed
      t.client.setRange(0, 20);
      expect(t.proxyState().queuedRequestCount).toEqual(1);
      t.discard();

      await subscription.complete();

      expect(t.proxyState().queuedRequestCount).toEqual(0);
      // the queued request keeps the requestId it was given when queued
      t.expectServer(
        changeRange(0, 20, { requestId: "2" }),
        serverRequest({ type: "GET_VP_VISUAL_LINKS", vpId: "server-vp-1" }),
        serverRequest({ type: "GET_VIEW_PORT_MENUS", vpId: "server-vp-1" }),
      );
    });
  });
});
