import "./global-mocks";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSubscription } from "./test-utils";
import {
  createVpBody,
  rows,
  serverProxyHarness,
  serverRequest,
  size,
  type ServerProxyHarness,
} from "./server-proxy-dsl";

/* Local helpers ---------------------------------------------------- */

const ALL_COLUMNS = ["col-1", "col-2", "col-3", "col-4"];

/** A server message with a sessionId, which server.receives does not set. */
const fromServer = (
  t: ServerProxyHarness,
  body: object,
  {
    requestId = "",
    sessionId,
  }: { requestId?: string; sessionId?: string } = {},
) =>
  t.proxy.handleMessageFromServer({
    module: "CORE",
    requestId,
    sessionId,
    token: "",
    user: "",
    body,
  } as Parameters<ServerProxyHarness["proxy"]["handleMessageFromServer"]>[0]);

const heartbeat = (t: ServerProxyHarness) =>
  t.server.receives({ type: "HB", ts: 1 });

const heartbeatResponse = (sessionId?: string) => ({
  module: "CORE",
  requestId: "NA",
  sessionId,
  body: { type: "HB_RESP", ts: expect.any(Number) },
});

const removeVp = (vp = "server-vp-1") =>
  serverRequest({ type: "REMOVE_VP", viewPortId: vp });

/** CREATE_VP the proxy sends when it resubscribes a viewport on reconnect. */
const resubscribe = (clientVp: string) =>
  serverRequest(
    createVpBody({ range: [0, 10], columns: ALL_COLUMNS }),
    clientVp,
  );

/** CREATE_VP_SUCCESS for a resubscribed client viewport. */
const createVpSuccess = (key: string, serverVp: string) => ({
  ...createSubscription({ key })[1].body,
  viewPortId: serverVp,
});

const linkTo = (parentVpId: string) => ({
  parentVpId,
  link: { fromColumn: "col-1", toTable: "test-table", toColumn: "col-1" },
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe("ServerProxy connection lifecycle", () => {
  describe("login", () => {
    it("sends LOGIN with the token and resolves with the session id from LOGIN_SUCCESS", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      const login = t.proxy.login("token-1");

      t.expectServer({
        module: "CORE",
        requestId: "",
        sessionId: "dsdsd",
        body: { type: "LOGIN", token: "token-1" },
      });

      fromServer(
        t,
        { type: "LOGIN_SUCCESS", token: "token-1", vuuServerId: "server-1" },
        { sessionId: "session-1" },
      );

      await expect(login).resolves.toEqual("session-1");
      t.expectClient({
        type: "LOGIN_SUCCESS",
        token: "token-1",
        vuuServerId: "server-1",
        sessionId: "session-1",
      });

      // later requests carry the new session id
      heartbeat(t);
      t.expectServer(heartbeatResponse("session-1"));
    });

    it("throws if LOGIN_SUCCESS has no sessionId", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      t.proxy.login("token-1");
      t.discard();

      expect(() =>
        fromServer(t, { type: "LOGIN_SUCCESS", token: "token-1" }),
      ).toThrow("LOGIN_SUCCESS did not provide sessionId");
      t.expectClient();
    });

    it("rejects the login with the reason from LOGIN_REJECTED and clears the auth token", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      const login = t.proxy.login("bad-token");
      t.discard();

      t.proxy.handleMessageFromServer({
        type: "LOGIN_REJECTED",
        reason: "Invalid token",
      });

      await expect(login).rejects.toEqual("Invalid token");
      t.expectClient();

      // with no auth token, nothing more is sent to the server
      heartbeat(t);
      t.expectServer();
    });

    it("ignores LOGIN_REJECTED when no login is pending", async () => {
      const t = await serverProxyHarness({ subscribe: false });

      t.proxy.handleMessageFromServer({
        type: "LOGIN_REJECTED",
        reason: "Invalid token",
      });
      t.expectClient();

      // auth token is kept, so the heartbeat is still answered
      heartbeat(t);
      t.expectServer(heartbeatResponse("dsdsd"));
    });

    it("logs an error when login is called without a token and none has been obtained", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const t = await serverProxyHarness({ subscribe: false });
      const login = t.proxy.login("bad-token");
      t.proxy.handleMessageFromServer({
        type: "LOGIN_REJECTED",
        reason: "Invalid token",
      });
      await expect(login).rejects.toEqual("Invalid token");
      t.discard();

      await expect(t.proxy.login()).resolves.toBeUndefined();

      expect(consoleError).toHaveBeenCalledWith(
        "[ServerProxy] login, cannot login until auth token has been obtained",
      );
      t.expectServer();
    });

    it("does nothing when login is called without a token and one is already held", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const t = await serverProxyHarness({ subscribe: false });

      await expect(t.proxy.login()).resolves.toBeUndefined();

      expect(consoleError).not.toHaveBeenCalled();
      t.expectServer();
    });
  });

  describe("heartbeat", () => {
    it("answers HB with HB_RESP, request id NA", async () => {
      const t = await serverProxyHarness();
      heartbeat(t);
      t.expectServer(heartbeatResponse("dsdsd"));
      t.expectClient();
    });
  });

  describe("connection status", () => {
    it("on disconnected, clears the session id and every viewport's cache", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.server.sends(size(), rows(0, 10));
      t.server.sends(
        size(50, "server-vp-2"),
        rows(0, 10, { vp: "server-vp-2" }),
      );
      t.discard();

      t.connection.status("disconnected");

      t.expectClient(
        { clientViewportId: "client-vp-1", type: "viewport-clear" },
        { clientViewportId: "client-vp-2", type: "viewport-clear" },
      );
      t.expectServer();
      expect(t.cachedRow(0)).toBeUndefined();
      expect(t.cachedRow(0, "server-vp-2")).toBeUndefined();
      // viewports are kept, ready to be resubscribed
      expect(t.proxyState().viewportCount).toEqual(2);

      // requests now go out with no session id
      heartbeat(t);
      t.expectServer(heartbeatResponse(undefined));
    });

    it("ignores other connection statuses", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.connection.status("connected");

      t.expectClient();
      t.expectServer();
      expect(t.cachedRow(0)).toBeDefined();
    });

    it("on reconnected, resubscribes each viewport using its client id as request id and restores the id mapping", async () => {
      const t = await serverProxyHarness();
      t.server.sends(size(), rows(0, 10));
      t.discard();

      t.connection.status("reconnected");

      // viewports are cleared until the server acks the new CREATE_VP
      expect(t.proxyState().viewportCount).toEqual(0);
      expect(t.proxyState().serverViewportFor("client-vp-1")).toBeUndefined();
      t.expectServer(resubscribe("client-vp-1"));

      t.server.replies("CREATE_VP", createVpSuccess("1", "server-vp-9"));
      await t.flush();

      expect(t.proxyState().viewportCount).toEqual(1);
      expect(t.proxyState().serverViewportFor("client-vp-1")).toEqual(
        "server-vp-9",
      );
      expect(t.viewportState("server-vp-9")).toMatchObject({
        status: "subscribed",
        clientViewportId: "client-vp-1",
        serverViewportId: "server-vp-9",
      });
      // links and menus are not requested again after a reconnect
      t.expectServer();
      t.expectClient();
    });

    it("on reconnected, resubscribes active viewports at once and inactive (disabled or suspended) viewports after 2s", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      await t.subscribe({ key: "3" });
      t.client.disable("client-vp-2");
      t.server.acks("DISABLE_VP", {}, "server-vp-2");
      t.client.suspend("client-vp-3", { escalateToDisable: false });
      t.discard();

      vi.useFakeTimers();
      t.connection.status("reconnected");
      t.expectServer(resubscribe("client-vp-1"));

      vi.advanceTimersByTime(1999);
      t.expectServer();

      vi.advanceTimersByTime(1);
      t.expectServer(resubscribe("client-vp-2"), resubscribe("client-vp-3"));
      vi.useRealTimers();

      t.server.receives(createVpSuccess("1", "server-vp-1"), "client-vp-1");
      await t.flush();
      t.server.receives(createVpSuccess("2", "server-vp-2"), "client-vp-2");
      await t.flush();
      t.server.receives(createVpSuccess("3", "server-vp-3"), "client-vp-3");
      await t.flush();

      expect(t.proxyState().viewportCount).toEqual(3);
      expect(t.viewportState("server-vp-2")).toMatchObject({
        status: "subscribed",
        disabled: true,
      });
      expect(t.viewportState("server-vp-3")).toMatchObject({
        status: "subscribed",
        suspended: true,
      });
      // Current behaviour: a disabled viewport is not disabled again on the
      // server after reconnect. subscribe() does this for a resubscribed
      // disabled viewport, but reconnect() does not go through subscribe().
      t.expectServer();
      t.expectClient();
    });

    it("on reconnected, drops a viewport whose CREATE_VP is rejected", async () => {
      const t = await serverProxyHarness();
      t.discard();

      t.connection.status("reconnected");
      t.discard();

      // Current behaviour: the reject is ignored ("handle reject" is empty),
      // the viewport is not restored and the client is not told.
      t.server.replies("CREATE_VP", {
        type: "CREATE_VP_REJECT",
        msg: "no such table",
      });
      await t.flush();

      expect(t.proxyState().viewportCount).toEqual(0);
      expect(t.proxyState().serverViewportFor("client-vp-1")).toBeUndefined();
      t.expectClient();
      t.expectServer();
    });
  });

  describe("disconnect", () => {
    it("sends REMOVE_VP and posts viewport-clear for each viewport", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.discard();

      t.client.disconnect();

      t.expectServer(removeVp("server-vp-1"), removeVp("server-vp-2"));
      t.expectClient(
        { clientViewportId: "client-vp-1", type: "viewport-clear" },
        { clientViewportId: "client-vp-2", type: "viewport-clear" },
      );
      // viewports stay until the server acks REMOVE_VP
      expect(t.proxyState().viewportCount).toEqual(2);
    });
  });

  describe("unsubscribe", () => {
    it("sends REMOVE_VP for the viewport", async () => {
      const t = await serverProxyHarness();

      t.client.unsubscribe();

      t.expectServer(removeVp("server-vp-1"));
      t.expectClient();
      expect(t.proxyState().viewportCount).toEqual(1);
    });

    it("logs an error and sends nothing for an unknown viewport", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const t = await serverProxyHarness();

      t.client.unsubscribe("client-vp-9");

      t.expectServer();
      expect(consoleError).toHaveBeenCalledWith(
        "[ServerProxy] failed to unsubscribe client viewport client-vp-9, viewport not found",
      );
    });

    it("REMOVE_VP_SUCCESS removes the viewport and its client id mapping", async () => {
      const t = await serverProxyHarness();
      t.client.unsubscribe();
      t.discard();

      t.server.acks("REMOVE_VP");

      expect(t.proxyState().viewportCount).toEqual(0);
      expect(t.proxyState().serverViewportFor("client-vp-1")).toBeUndefined();
      t.expectClient();
      t.expectServer();
      expect(() => t.client.setRange(0, 5)).toThrow(
        "Viewport server id not found for client viewport client-vp-1",
      );
    });

    it("REMOVE_VP_SUCCESS for an unknown viewport is ignored", async () => {
      const t = await serverProxyHarness();

      t.server.receives({
        type: "REMOVE_VP_SUCCESS",
        viewPortId: "server-vp-9",
      });

      expect(t.proxyState().viewportCount).toEqual(1);
      t.expectClient();
      t.expectServer();
    });

    it("REMOVE_VP_SUCCESS removes links to the removed viewport from other viewports", async () => {
      const t = await serverProxyHarness();
      await t.subscribe({ key: "2" });
      t.server.receives({
        type: "VP_VISUAL_LINKS_RESP",
        vpId: "server-vp-2",
        links: [linkTo("server-vp-1")],
      });
      t.client.unsubscribe("client-vp-1");
      t.discard();

      t.server.acks("REMOVE_VP");

      t.expectClient({
        type: "vuu-links",
        links: [],
        clientViewportId: "client-vp-2",
      });
      expect(t.viewportState("server-vp-2").links).toEqual([]);
      expect(t.proxyState().viewportCount).toEqual(1);
    });
  });

  describe("subscribe", () => {
    it("logs an error and sends nothing when the client viewport is already subscribed", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const t = await serverProxyHarness();

      const [request] = createSubscription();
      await t.proxy.subscribe(request);

      t.expectServer();
      t.expectClient();
      expect(consoleError).toHaveBeenCalledWith(
        "[ServerProxy] spurious subscribe call client-vp-1",
      );
    });

    it("posts subscribe-failed when the server rejects CREATE_VP", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      const [request, , tableMeta] = createSubscription();
      const subscribed = t.proxy.subscribe(request);

      t.server.replies("CREATE_VP", {
        type: "CREATE_VP_REJECT",
        msg: "no such table",
      });
      t.server.replies("GET_TABLE_META", tableMeta.body);
      await subscribed;

      t.expectClient({
        clientViewportId: "client-vp-1",
        type: "subscribe-failed",
        msg: "failed to open subscription on table test-table: no such table",
      });
      // Current behaviour: the rejected viewport stays in the viewports map,
      // still keyed by its client id.
      expect(t.proxyState().viewportCount).toEqual(1);
      expect(t.proxyState().serverViewportFor("client-vp-1")).toBeUndefined();
    });

    it("posts subscribe-failed when the table metadata request fails", async () => {
      const t = await serverProxyHarness({ subscribe: false });
      const [request, createVpAck] = createSubscription();
      const subscribed = t.proxy.subscribe(request);

      t.server.replies("CREATE_VP", createVpAck.body);
      t.server.replies("GET_TABLE_META", { type: "ERROR", msg: "no meta" });
      await subscribed;

      t.expectClient({
        clientViewportId: "client-vp-1",
        type: "subscribe-failed",
        msg: "failed to fetch schema for table test-table: no meta",
      });
    });
  });
});
