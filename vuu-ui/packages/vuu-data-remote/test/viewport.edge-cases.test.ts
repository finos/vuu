import "./global-mocks";
import { afterEach, describe, expect, it, vi } from "vitest";
import { NO_DATA_UPDATE, type Viewport } from "../src/server-proxy/viewport";
import {
  changeVp,
  clientRows,
  groupClientRows,
  groupRows,
  rows,
  type ServerProxyHarness,
  serverProxyHarness,
  size,
  sizeOnly,
  subscribedMessage,
  viewportHarness,
  viewportUpdate,
} from "./server-proxy-dsl";
import { createSubscription, testSchema } from "./test-utils";

/* Local helpers ---------------------------------------------------- */

/** The Viewport held by the proxy, for calls with no client message. */
const viewportOf = (t: ServerProxyHarness, vp = "server-vp-1") =>
  t.proxy["viewports"].get(vp) as Viewport;

const ALL_COLUMNS = ["col-1", "col-2", "col-3", "col-4"];

/** The config message the proxy posts once the server ACKs CHANGE_VP. */
const configMessage = (groupBy: string[] = []) => ({
  clientViewportId: "client-vp-1",
  type: "config",
  config: {
    aggregations: [],
    columns: ALL_COLUMNS,
    filterSpec: { filter: "" },
    groupBy,
    sort: { sortDefs: [] },
  },
});

/**
 * Sends size-only rows 1..count, 1ms apart, so the fourth and later are
 * throttled; sizes 1..3 reach the client at once.
 */
const throttleSizeUpdates = (t: ServerProxyHarness, count: number) => {
  vi.useFakeTimers();
  vi.setSystemTime("2025-01-01T09:00:00.000Z");
  for (let i = 1; i <= count; i++) {
    vi.advanceTimersByTime(1);
    t.server.sends(size(i));
  }
  t.expectClient(sizeOnly(1), sizeOnly(2), sizeOnly(3));
};

describe("Viewport edge cases", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  describe("clearCache", () => {
    it("sets the row count to 0, empties the cache and tells the client", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(100), rows(0, 10));
      t.discard();
      expect(t.viewportState().cachedRowCount).toEqual(10);

      viewportOf(t).clearCache();

      t.expectClient({
        clientViewportId: "client-vp-1",
        type: "viewport-clear",
      });
      expect(t.viewportState().cachedRowCount).toEqual(0);
      expect(viewportOf(t).size).toEqual(0);
    });

    it("sends the full client range again when the server resends the rows", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(100), rows(0, 10));
      t.discard();
      viewportOf(t).clearCache();
      t.discard();

      t.server.sends(size(100), rows(0, 10));
      t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 10) }));
    });
  });

  describe("getClientRows", () => {
    it("returns NO_DATA_UPDATE when neither rows nor row count have changed", () => {
      const v = viewportHarness();
      v.subscribed();
      expect(v.viewport.getClientRows()).toBe(NO_DATA_UPDATE);
    });
  });

  describe("size-only throttle", () => {
    it("cancels the pending throttled size message when data rows arrive", async () => {
      const t = await serverProxyHarness();
      throttleSizeUpdates(t, 6);

      // rows in the client range end the throttle; the size comes with them
      t.server.sends(rows(0, 2, { vpSize: 6 }));
      t.expectClient(viewportUpdate({ size: 6, rows: clientRows(0, 2) }));

      vi.advanceTimersByTime(100);
      t.expectClient();
    });

    it("cancels the pending throttled size message when a size update is not throttled", async () => {
      const t = await serverProxyHarness();
      throttleSizeUpdates(t, 6);

      // 500ms or more since the last size update: no longer throttled
      vi.setSystemTime(Date.now() + 600);
      t.server.sends(size(7));
      t.expectClient(sizeOnly(7));

      vi.advanceTimersByTime(100);
      t.expectClient();
    });
  });

  describe("handleSubscribed", () => {
    it("adds the session table name to the schema when the server returns a different table", () => {
      const v = viewportHarness();
      const [, ack] = createSubscription();

      const message = v.viewport.handleSubscribed(
        { ...ack.body, table: "session-table-1" },
        testSchema,
      );

      expect(message).toEqual(
        subscribedMessage({
          range: [0, 10],
          tableSchema: {
            ...testSchema,
            table: {
              module: "TEST",
              table: "test-table",
              session: "session-table-1",
            },
          },
        }),
      );
    });
  });

  describe("config", () => {
    it("sets isTree back to false when a config without groupBy is ACKed", async () => {
      const t = await serverProxyHarness();
      t.client.config({ groupBy: ["col-4"] });
      t.server.acks("CHANGE_VP");
      t.discard();
      expect(t.viewportState().isTree).toBe(true);

      t.client.config({ groupBy: [] });
      t.expectServer(changeVp({ groupBy: [] }));
      expect(t.viewportState().isTree).toBe(true);

      t.server.acks("CHANGE_VP");
      t.expectClient(configMessage([]));
      expect(t.viewportState().isTree).toBe(false);
    });

    it("sends an empty filter when the config filter is not a string", async () => {
      const t = await serverProxyHarness();

      t.client.config({
        filterSpec: { filter: undefined as unknown as string },
      });
      t.expectServer(changeVp({ filterSpec: { filter: "" } }));
    });

    it("sends an empty filter when the config has no filterSpec", async () => {
      const t = await serverProxyHarness();

      t.client.config({ filterSpec: undefined });
      t.expectServer(changeVp({ filterSpec: { filter: "" } }));

      // Current behaviour: the ACK stores the client's config, not the request
      // sent, so the viewport's filter becomes undefined.
      t.server.acks("CHANGE_VP");
      expect(t.viewportState().filter).toBeUndefined();
    });
  });

  describe("createRequest", () => {
    it("fills unset fields from the viewport's current config", () => {
      const v = viewportHarness();
      v.subscribed();
      const sort = { sortDefs: [{ column: "col-1", sortType: "A" as const }] };

      expect(v.viewport.createRequest({ sort })).toEqual({
        type: "CHANGE_VP",
        viewPortId: "server-vp-1",
        aggregations: [],
        columns: ALL_COLUMNS,
        sort,
        groupBy: [],
        filterSpec: { filter: "" },
      });
    });

    it("sends only the given fields when overWrite is set", () => {
      const v = viewportHarness();
      v.subscribed();
      const sort = { sortDefs: [{ column: "col-1", sortType: "A" as const }] };

      expect(v.viewport.createRequest({ sort }, true)).toEqual({
        type: "CHANGE_VP",
        viewPortId: "server-vp-1",
        sort,
      });
    });
  });

  describe("clientRange", () => {
    it("returns the range the viewport was created with", () => {
      const v = viewportHarness({ range: [5, 15] });
      expect(v.viewport.clientRange).toEqual({ from: 5, to: 15 });
    });

    it("is not updated by range requests", () => {
      // Current behaviour: the getter returns the constructor's range only.
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed();
      v.receives(size(), rows(0, 20));
      v.setRange(20, 30);
      expect(v.viewport.clientRange).toEqual({ from: 0, to: 10 });
    });
  });

  describe("suspend and resume, grouped", () => {
    it("resends cached group rows as tree rows on resume", async () => {
      const t = await serverProxyHarness();
      t.client.config({ groupBy: ["col-4"] });
      t.server.acks("CHANGE_VP");
      t.server.sends(groupRows());
      t.discard();

      t.client.suspend("client-vp-1", { escalateToDisable: false });
      t.client.resume();
      t.expectClient(viewportUpdate({ size: 4, rows: groupClientRows(0, 4) }));
    });
  });

  describe("data window", () => {
    it("reports the first and last cached row indices", () => {
      const v = viewportHarness();
      v.subscribed();
      v.receives(size(), rows(0, 10));
      const dataWindow = v.viewport["dataWindow"];
      expect(dataWindow.getCurrentDataRange()).toEqual([0, 9]);
      // data is the internal array, sized to the full buffered range
      expect(dataWindow.data).toBe(dataWindow["internalData"]);
      expect(dataWindow.data).toHaveLength(50);
    });

    it("skips gaps at either end of the cache", () => {
      const v = viewportHarness();
      v.subscribed();
      v.receives(size(), rows(2, 5));
      expect(v.viewport["dataWindow"].getCurrentDataRange()).toEqual([2, 4]);
    });

    it("returns [-1, -1] when nothing is cached", () => {
      const v = viewportHarness();
      v.subscribed();
      expect(v.viewport["dataWindow"].getCurrentDataRange()).toEqual([-1, -1]);
    });
  });
});
