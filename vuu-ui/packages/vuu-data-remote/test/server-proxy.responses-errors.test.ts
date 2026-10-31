import "./global-mocks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  changeRange,
  clientRows,
  disableVp,
  enableVp,
  rows,
  serverProxyHarness,
  size,
  viewportUpdate,
} from "./server-proxy-dsl";

/** Messages a console method was called with, as one string each. */
const calls = (spy: { mock: { calls: unknown[][] } }) =>
  spy.mock.calls.map((args) => args.join(" "));

describe("ServerProxy", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  let consoleWarn: ReturnType<typeof vi.spyOn>;
  let consoleLog: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("rejects and errors", () => {
    it("keeps a rejected range request pending, so the same range is not requested again", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      t.server.sends(size(), rows(0, 20));
      t.discard();

      t.client.setRange(50, 60);
      t.expectServer(changeRange(40, 70));
      t.expectClient();

      t.server.receives(
        {
          type: "CHANGE_VP_RANGE_REJECT",
          viewPortId: "server-vp-1",
          msg: "no",
        },
        t.requestIdOf("CHANGE_VP_RANGE", "server-vp-1"),
      );
      t.expectClient();
      expect(calls(consoleError)).toEqual([]);
      // the request is marked nacked but stays in the pending list
      expect(t.viewportState().pendingRangeCount).toEqual(1);

      // Current behaviour: nothing reads the nacked flag, so the rejected
      // request still counts as covering 50..60 and no new request is sent.
      t.client.setRange(51, 61);
      t.expectServer();
    });

    it("logs and ignores a range reject with an unknown request id", async () => {
      const t = await serverProxyHarness({ bufferSize: 10 });
      t.server.receives(
        {
          type: "CHANGE_VP_RANGE_REJECT",
          viewPortId: "server-vp-1",
          msg: "no",
        },
        "999",
      );
      t.expectClient();
      t.expectServer();
      expect(calls(consoleError)).toEqual([
        "[Viewport] no matching operation found to reject for requestId 999",
      ]);
    });

    it("ignores a range reject for an unknown viewport", async () => {
      const t = await serverProxyHarness();
      t.server.receives(
        {
          type: "CHANGE_VP_RANGE_REJECT",
          viewPortId: "server-vp-9",
          msg: "no",
        },
        "999",
      );
      t.expectClient();
      expect(calls(consoleError)).toEqual([]);
    });

    it("logs and ignores an ack with an unknown request id", async () => {
      const t = await serverProxyHarness();
      t.server.receives(
        { type: "DISABLE_VP_SUCCESS", viewPortId: "server-vp-1" },
        "999",
      );
      t.expectClient();
      expect(t.viewportState().disabled).toBe(false);
      expect(calls(consoleError)).toEqual([
        "[Viewport] no matching operation found to complete for requestId 999",
      ]);
    });

    it("logs an ERROR message from the server", async () => {
      const t = await serverProxyHarness();
      t.server.receives({ type: "ERROR", msg: "something failed" });
      t.expectClient();
      t.expectServer();
      expect(calls(consoleError)).toEqual(["[ServerProxy] something failed"]);
    });

    it("ignores a server message of an unknown type", async () => {
      const t = await serverProxyHarness();
      t.server.receives({ type: "NOT_A_MESSAGE" });
      t.expectClient();
      t.expectServer();
      expect(calls(consoleError)).toEqual([]);
    });

    it("warns and sends nothing for a select request without a requestId", async () => {
      const t = await serverProxyHarness();
      t.client.send({
        preserveExistingSelection: false,
        rowKey: "key-01",
        type: "SELECT_ROW",
        vpId: "client-vp-1",
      });
      t.expectServer();
      t.expectClient();
      expect(calls(consoleWarn)).toEqual(["selectRequest must have requestId"]);
    });

    it("throws for a select request before the server has acked the subscription", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      t.startSubscription();
      t.discard();
      expect(() => t.client.select("key-01")).toThrow(
        "[Viewport] cannot process SELECT_ROW before serverViewportId has been set",
      );
      t.expectServer();
    });

    it("throws for a viewport message to an unknown client viewport", async () => {
      const t = await serverProxyHarness();
      expect(() => t.client.setRange(0, 10, "client-vp-9")).toThrow(
        "Viewport server id not found for client viewport client-vp-9",
      );
      t.expectServer();
      t.expectClient();
    });

    it("ignores disable for an unknown client viewport", async () => {
      const t = await serverProxyHarness();
      t.client.disable("client-vp-9");
      t.expectServer();
      t.expectClient();
      expect(calls(consoleError)).toEqual([]);
    });

    it("logs an unexpected client message", async () => {
      const t = await serverProxyHarness();
      t.client.send({ type: "NOT_A_MESSAGE" });
      t.expectServer();
      t.expectClient();
      expect(calls(consoleError)).toEqual([
        '[ServerProxy] Vuu ServerProxy Unexpected message from client {"type":"NOT_A_MESSAGE"}',
      ]);
    });
  });

  describe("selection responses", () => {
    it.each([
      "SELECT_ALL_SUCCESS",
      "SELECT_ROW_SUCCESS",
      "SELECT_ROW_RANGE_SUCCESS",
      "DESELECT_ROW_SUCCESS",
    ])("posts %s with the selected row count", async (type) => {
      const t = await serverProxyHarness();
      t.server.receives(
        { type, vpId: "server-vp-1", selectedRowCount: 3 },
        "client-request-1",
      );
      t.expectClient({
        requestId: "client-request-1",
        type,
        selectedRowCount: 3,
      });
      t.expectServer();
    });

    it("posts DESELECT_ALL_SUCCESS with a selected row count of 0", async () => {
      const t = await serverProxyHarness();
      t.server.receives(
        { type: "DESELECT_ALL_SUCCESS", vpId: "server-vp-1" },
        "client-request-1",
      );
      t.expectClient({
        requestId: "client-request-1",
        type: "DESELECT_ALL_SUCCESS",
        selectedRowCount: 0,
      });
    });

    it.each([
      "SELECT_ROW_REJECT",
      "DESELECT_ROW_REJECT",
      "SELECT_ROW_RANGE_REJECT",
      "SELECT_ALL_REJECT",
      "DESELECT_ALL_REJECT",
    ])("warns on %s and posts nothing", async (type) => {
      const t = await serverProxyHarness();
      t.server.receives(
        { type, vpId: "server-vp-1", errorMsg: "not allowed" },
        "client-request-1",
      );
      t.expectClient();
      t.expectServer();
      expect(calls(consoleWarn)).toEqual([`select error ${type} not allowed`]);
    });
  });

  describe("disable-all-active and enable-all-active", () => {
    /**
     * Three viewports: vp-1 active, vp-2 disabled by the client, vp-3
     * suspended (without escalation to disable).
     */
    const threeViewports = async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      await t.subscribe({ key: "3" });
      t.client.disable("client-vp-2");
      t.server.acks("DISABLE_VP", {}, "server-vp-2");
      t.client.suspend("client-vp-3", { escalateToDisable: false });
      t.discard();
      return t;
    };

    it("disables only the active viewports", async () => {
      const t = await threeViewports();

      t.client.disableAllActive();
      t.expectServer(disableVp({ vp: "server-vp-1" }));
      t.expectClient();
      expect(calls(consoleLog)).toEqual([
        "[ServerProxy] disableAllActiveViewports",
      ]);

      t.server.acks("DISABLE_VP", {}, "server-vp-1");
      t.expectClient({ type: "disabled", clientViewportId: "client-vp-1" });
      expect(t.viewportState("server-vp-1")).toMatchObject({ disabled: true });
      expect(t.viewportState("server-vp-3")).toMatchObject({
        disabled: false,
        suspended: true,
      });
    });

    it("re-enables only the viewports disabled by disable-all-active", async () => {
      const t = await threeViewports();
      t.server.sends(size(), rows(0, 10));
      t.client.disableAllActive();
      t.server.acks("DISABLE_VP", {}, "server-vp-1");
      t.discard();

      t.client.enableAllActive();
      // vp-2 was disabled by the client itself, so it stays disabled
      t.expectServer(enableVp({ vp: "server-vp-1" }));
      t.expectClient();

      t.server.acks("ENABLE_VP", {}, "server-vp-1");
      t.expectClient(
        { type: "enabled", clientViewportId: "client-vp-1" },
        viewportUpdate({ size: 100, rows: clientRows(0, 10) }),
      );
      expect(t.viewportState("server-vp-1")).toMatchObject({ disabled: false });
      expect(t.viewportState("server-vp-2")).toMatchObject({ disabled: true });
    });

    it("enable-all-active does nothing when no viewport was disabled by disable-all-active", async () => {
      const t = await threeViewports();
      t.client.enableAllActive();
      t.expectServer();
      t.expectClient();
    });
  });
});
