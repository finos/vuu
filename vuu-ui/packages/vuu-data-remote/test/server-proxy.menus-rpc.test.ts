import "./global-mocks";
import { afterEach, describe, expect, it, vi } from "vitest";
import { serverProxyHarness, serverRequest } from "./server-proxy-dsl";
import { testSchema } from "./test-utils";

/* Local helpers ---------------------------------------------------- */

const TEST_TABLE = { module: "TEST", table: "test-table" };
const OTHER_TABLE = { module: "TEST", table: "other-table" };
const SESSION_TABLE = { module: "TEST", table: "session-123" };

const menu = { name: "ROOT", menus: [] };

/** TABLE_META_RESP body for a table with two string columns. */
const tableMetaResponse = (table: { module: string; table: string }) => ({
  type: "TABLE_META_RESP",
  table,
  columns: ["id", "name"],
  dataTypes: ["string", "string"],
  key: "id",
  editableColumns: [],
  maxRangeEnd: 1_000_000,
  maxRangeWidth: 1_000,
});

/** The TableSchema the proxy builds from tableMetaResponse(table). */
const schemaFor = (table: { module: string; table: string }) => ({
  table,
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "name", serverDataType: "string" },
  ],
  key: "id",
  rangeLimits: { maxRangeEnd: 1_000_000, maxRangeWidth: 1_000 },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ServerProxy", () => {
  describe("viewport menus", () => {
    it("posts the viewport's menu to the client when the server sends it", async () => {
      const t = await serverProxyHarness();
      t.server.receives(
        { type: "VIEW_PORT_MENUS_RESP", vpId: "server-vp-1", menu },
        t.requestIdOf("GET_VIEW_PORT_MENUS"),
      );
      t.expectClient({
        type: "vuu-menu",
        menu,
        clientViewportId: "client-vp-1",
      });
      t.expectServer();
    });

    it("ignores a menus response with no menu name", async () => {
      const t = await serverProxyHarness();
      t.server.receives({
        type: "VIEW_PORT_MENUS_RESP",
        vpId: "server-vp-1",
        menu: { name: "", menus: [] },
      });
      t.expectClient();
    });

    it("ignores a menus response for an unknown viewport", async () => {
      const t = await serverProxyHarness();
      t.server.receives({
        type: "VIEW_PORT_MENUS_RESP",
        vpId: "server-vp-99",
        menu,
      });
      t.expectClient();
    });
  });

  describe("menu RPC requests", () => {
    it.each([
      "VIEW_PORT_MENUS_SELECT_RPC",
      "VIEW_PORT_MENU_TABLE_RPC",
      "VIEW_PORT_MENU_ROW_RPC",
      "VIEW_PORT_MENU_CELL_RPC",
    ])(
      "sends %s with the server viewport id and the client's requestId",
      async (type) => {
        const t = await serverProxyHarness();
        t.client.send({
          type,
          rpcName: "doSomething",
          vpId: "client-vp-1",
          requestId: "menu-1",
        });
        t.expectServer(
          serverRequest(
            { type, rpcName: "doSomething", vpId: "server-vp-1" },
            "menu-1",
          ),
        );
        t.expectClient();
      },
    );

    it("sends nothing for an unknown viewport", async () => {
      const t = await serverProxyHarness();
      t.client.send({
        type: "VIEW_PORT_MENU_ROW_RPC",
        rpcName: "doSomething",
        vpId: "client-vp-99",
        requestId: "menu-1",
      });
      t.expectServer();
      t.expectClient();
    });
  });

  describe("menu RPC responses", () => {
    it("posts a plain action to the client, tableAlreadyOpen false", async () => {
      const t = await serverProxyHarness();
      const action = { type: "NO_ACTION" };
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_RESP",
          action,
          rpcName: "doSomething",
          vpId: "server-vp-1",
        },
        "menu-1",
      );
      t.expectClient({
        action,
        rpcName: "doSomething",
        requestId: "menu-1",
        tableAlreadyOpen: false,
        type: "VIEW_PORT_MENU_RESP",
      });
    });

    it("sets tableAlreadyOpen when an open-dialog action targets a table that is open", async () => {
      const t = await serverProxyHarness();
      const action = { type: "OPEN_DIALOG_ACTION", table: TEST_TABLE };
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_RESP",
          action,
          rpcName: "openIt",
          vpId: "server-vp-1",
        },
        "menu-1",
      );
      t.expectClient({
        action,
        rpcName: "openIt",
        requestId: "menu-1",
        tableAlreadyOpen: true,
        type: "VIEW_PORT_MENU_RESP",
      });
    });

    it("does not count a suspended viewport's table as open", async () => {
      const t = await serverProxyHarness();
      t.client.suspend("client-vp-1", { escalateToDisable: false });
      const action = { type: "OPEN_DIALOG_ACTION", table: TEST_TABLE };
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_RESP",
          action,
          rpcName: "openIt",
          vpId: "server-vp-1",
        },
        "menu-1",
      );
      const message = {
        action,
        rpcName: "openIt",
        requestId: "menu-1",
        type: "VIEW_PORT_MENU_RESP",
      };
      t.expectClient(message);
    });

    it("leaves tableAlreadyOpen undefined, not false, when the dialog's table is not open", async () => {
      // current behaviour: isTableOpen returns undefined rather than false
      const t = await serverProxyHarness();
      const action = { type: "OPEN_DIALOG_ACTION", table: OTHER_TABLE };
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_RESP",
          action,
          rpcName: "openIt",
          vpId: "server-vp-1",
        },
        "menu-1",
      );
      t.expectClient({
        action,
        rpcName: "openIt",
        requestId: "menu-1",
        type: "VIEW_PORT_MENU_RESP",
      });
      expect(t.proxy.isTableOpen(OTHER_TABLE)).toBeUndefined();
    });

    it.each(["inline-form", "grid"])(
      "fetches the schema of a session table (%s) before posting the action",
      async (renderComponent) => {
        const t = await serverProxyHarness();
        const action = {
          type: "OPEN_DIALOG_ACTION",
          table: SESSION_TABLE,
          renderComponent,
        };
        t.server.receives(
          {
            type: "VIEW_PORT_MENU_RESP",
            action,
            rpcName: "openSession",
            vpId: "server-vp-1",
          },
          "menu-1",
        );
        t.expectServer(
          serverRequest({ type: "GET_TABLE_META", table: SESSION_TABLE }),
        );
        t.expectClient();

        t.server.replies("GET_TABLE_META", tableMetaResponse(SESSION_TABLE));
        await t.flush();
        t.expectClient({
          rpcName: "openSession",
          type: "VIEW_PORT_MENU_RESP",
          action: { ...action, tableSchema: schemaFor(SESSION_TABLE) },
          requestId: "menu-1",
        });
      },
    );

    it("posts a session table action without fetching its schema when renderComponent is neither inline-form nor grid", async () => {
      const t = await serverProxyHarness();
      const action = {
        type: "OPEN_DIALOG_ACTION",
        table: SESSION_TABLE,
        renderComponent: "dialog",
      };
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_RESP",
          action,
          rpcName: "openSession",
          vpId: "server-vp-1",
        },
        "menu-1",
      );
      t.expectServer();
      t.expectClient({
        action,
        rpcName: "openSession",
        requestId: "menu-1",
        type: "VIEW_PORT_MENU_RESP",
      });
    });

    it("posts a menu RPC rejection to the client", async () => {
      const t = await serverProxyHarness();
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_REJ",
          error: "not allowed",
          rpcName: "doSomething",
          vpId: "server-vp-1",
        },
        "menu-1",
      );
      t.expectClient({
        clientViewportId: "client-vp-1",
        error: "not allowed",
        rpcName: "doSomething",
        type: "VIEW_PORT_MENU_REJ",
        requestId: "menu-1",
      });
    });

    it("ignores a menu RPC rejection for an unknown viewport", async () => {
      const t = await serverProxyHarness();
      t.server.receives(
        {
          type: "VIEW_PORT_MENU_REJ",
          error: "not allowed",
          rpcName: "doSomething",
          vpId: "server-vp-99",
        },
        "menu-1",
      );
      t.expectClient();
    });
  });

  describe("RPC service requests", () => {
    it("sends a viewport-context RPC with the server viewport id", async () => {
      const t = await serverProxyHarness();
      t.client.send({
        type: "RPC_REQUEST",
        rpcName: "addRow",
        params: { a: 1 },
        context: { type: "VIEWPORT_CONTEXT", viewPortId: "client-vp-1" },
        requestId: "rpc-1",
      });
      t.expectServer(
        serverRequest(
          {
            type: "RPC_REQUEST",
            rpcName: "addRow",
            params: { a: 1 },
            context: { type: "VIEWPORT_CONTEXT", viewPortId: "server-vp-1" },
          },
          "rpc-1",
        ),
      );
    });

    it("sends nothing when the context viewport is unknown", async () => {
      const t = await serverProxyHarness();
      t.client.send({
        type: "RPC_REQUEST",
        rpcName: "addRow",
        params: {},
        context: { type: "VIEWPORT_CONTEXT", viewPortId: "client-vp-99" },
        requestId: "rpc-1",
      });
      t.expectServer();
    });

    it("throws for any context other than VIEWPORT_CONTEXT", async () => {
      const t = await serverProxyHarness();
      expect(() =>
        t.client.send({
          type: "RPC_REQUEST",
          rpcName: "doGlobal",
          params: {},
          context: { type: "GLOBAL_CONTEXT" },
          requestId: "rpc-1",
        }),
      ).toThrow("rpcRequest only supports VIEWPORT_CONTEXT at present");
      t.expectServer();
    });

    it("posts RPC_RESPONSE to the client with the response's requestId", async () => {
      const t = await serverProxyHarness();
      const action = { type: "NO_ACTION" };
      t.server.receives(
        {
          type: "RPC_RESPONSE",
          action,
          error: null,
          result: { type: "SUCCESS_RESULT", data: 42 },
          rpcName: "addRow",
        },
        "rpc-1",
      );
      t.expectClient({
        action,
        type: "RPC_RESPONSE",
        error: null,
        result: { type: "SUCCESS_RESULT", data: 42 },
        requestId: "rpc-1",
      });
    });
  });

  describe("table list", () => {
    it("requests the table list once and answers each client request from it", async () => {
      const t = await serverProxyHarness();
      const tables = [TEST_TABLE, OTHER_TABLE];

      t.client.getTableList("client-request-1");
      t.expectServer(
        serverRequest({ type: "GET_TABLE_LIST" }, "client-request-1"),
      );

      t.server.replies("GET_TABLE_LIST", { type: "TABLE_LIST_RESP", tables });
      await t.flush();
      t.expectClient({
        type: "TABLE_LIST_RESP",
        tables,
        requestId: "client-request-1",
      });

      // second request reuses the cached response
      t.client.getTableList("client-request-2");
      await t.flush();
      t.expectServer();
      t.expectClient({
        type: "TABLE_LIST_RESP",
        tables,
        requestId: "client-request-2",
      });
    });
  });

  describe("table metadata", () => {
    it("answers a request for a subscribed table from the cache", async () => {
      const t = await serverProxyHarness();
      t.client.getTableMeta(TEST_TABLE, "client-request-1");
      await t.flush();
      t.expectServer();
      t.expectClient({
        type: "TABLE_META_RESP",
        tableSchema: testSchema,
        requestId: "client-request-1",
      });
    });

    it("requests metadata for a new table once, then serves it from the cache", async () => {
      const t = await serverProxyHarness();
      t.client.getTableMeta(OTHER_TABLE, "client-request-1");
      t.expectServer(
        serverRequest(
          { type: "GET_TABLE_META", table: OTHER_TABLE },
          "client-request-1",
        ),
      );

      t.server.replies("GET_TABLE_META", tableMetaResponse(OTHER_TABLE));
      await t.flush();
      t.expectClient({
        type: "TABLE_META_RESP",
        tableSchema: schemaFor(OTHER_TABLE),
        requestId: "client-request-1",
      });

      t.client.getTableMeta(OTHER_TABLE, "client-request-2");
      await t.flush();
      t.expectServer();
      t.expectClient({
        type: "TABLE_META_RESP",
        tableSchema: schemaFor(OTHER_TABLE),
        requestId: "client-request-2",
      });
    });

    it("serves the same schema object to every request for a table", async () => {
      const t = await serverProxyHarness();
      t.client.getTableMeta(OTHER_TABLE, "client-request-1");
      t.client.getTableMeta(OTHER_TABLE, "client-request-2");
      t.server.replies("GET_TABLE_META", tableMetaResponse(OTHER_TABLE));
      await t.flush();
      const [first, second] = t.takeClient() as Array<{ tableSchema: object }>;
      expect(first.tableSchema).toEqual(schemaFor(OTHER_TABLE));
      expect(second.tableSchema).toBe(first.tableSchema);
    });

    it("does not cache session table metadata", async () => {
      const t = await serverProxyHarness();
      t.client.getTableMeta(SESSION_TABLE, "client-request-1");
      t.expectServer(
        serverRequest(
          { type: "GET_TABLE_META", table: SESSION_TABLE },
          "client-request-1",
        ),
      );
      t.server.replies("GET_TABLE_META", tableMetaResponse(SESSION_TABLE));
      await t.flush();
      t.expectClient({
        type: "TABLE_META_RESP",
        tableSchema: schemaFor(SESSION_TABLE),
        requestId: "client-request-1",
      });

      t.client.getTableMeta(SESSION_TABLE, "client-request-2");
      t.expectServer(
        serverRequest(
          { type: "GET_TABLE_META", table: SESSION_TABLE },
          "client-request-2",
        ),
      );
    });

    it("posts nothing when the server answers with an error, and keeps the error cached", async () => {
      // current behaviour: the failed request stays cached, so the table's
      // metadata is never requested again
      const t = await serverProxyHarness();
      t.client.getTableMeta(OTHER_TABLE, "client-request-1");
      t.discard();
      t.server.replies("GET_TABLE_META", { type: "ERROR", msg: "no table" });
      await t.flush();
      t.expectClient();

      t.client.getTableMeta(OTHER_TABLE, "client-request-2");
      await t.flush();
      t.expectServer();
      t.expectClient();
    });

    it("posts nothing when the server answers a session table request with an error", async () => {
      const t = await serverProxyHarness();
      t.client.getTableMeta(SESSION_TABLE, "client-request-1");
      t.discard();
      t.server.replies("GET_TABLE_META", { type: "ERROR", msg: "no table" });
      await t.flush();
      t.expectClient();
    });
  });

  describe("unexpected client messages", () => {
    it("logs an error for a message type it does not handle", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const t = await serverProxyHarness();
      t.client.send({ type: "NOT_A_MESSAGE", requestId: "x" });
      t.expectServer();
      t.expectClient();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected message from client"),
      );
    });

    it("logs an error for a viewport message type it does not handle", async () => {
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      const t = await serverProxyHarness();
      t.client.send({ type: "NOT_A_MESSAGE", viewport: "client-vp-1" });
      t.expectServer();
      t.expectClient();
      expect(consoleError).toHaveBeenCalledWith(
        expect.stringContaining("Unexpected message from client"),
      );
    });
  });
});
