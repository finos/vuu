import { describe, expect, vi, it } from "vitest";
import {
  ServerProxy,
  TEST_setRequestId,
} from "../src/server-proxy/server-proxy";
import { Viewport } from "../src/server-proxy/viewport";
import {
  COMMON_ATTRS,
  COMMON_ROW_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createServerProxyAndSubscribeToViewport,
  createTableRows,
  createTableGroupRows,
  createSubscription,
  sizeRow,
  updateTableRow,
} from "./test-utils";

const mockConnection = {
  send: vi.fn(),
  status: "ready" as const,
};

const noop = () => undefined;

describe("ServerProxy", () => {
  describe("subscription", () => {
    it("creates Viewport on client subscribe", () => {
      const [clientSubscription] = createSubscription();
      const serverProxy = new ServerProxy(mockConnection, noop);
      serverProxy.subscribe(clientSubscription);
      expect(serverProxy["viewports"].size).toEqual(1);
      const { clientViewportId, status } = serverProxy["viewports"].get(
        "client-vp-1"
      ) as Viewport;
      expect(clientViewportId).toEqual("client-vp-1");
      expect(status).toEqual("subscribing");
    });

    it("initialises Viewport when server ACKS subscription", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      expect(serverProxy["viewports"].size).toEqual(1);
      expect(
        serverProxy["mapClientToServerViewport"].get("client-vp-1")
      ).toEqual("server-vp-1");
      const { clientViewportId, serverViewportId, status } = serverProxy[
        "viewports"
      ].get("server-vp-1") as Viewport;
      expect(clientViewportId).toEqual("client-vp-1");
      expect(serverViewportId).toEqual("server-vp-1");
      expect(status).toEqual("subscribed");
    });

    it("sends message to client once subscribed", () => {
      const callback = vi.fn();
      const [clientSubscription, serverSubscription] = createSubscription();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription);
      serverProxy.handleMessageFromServer(serverSubscription);
      //TODO cover tableMeta in test
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        aggregations: [],
        clientViewportId: "client-vp-1",
        columns: ["col-1", "col-2", "col-3", "col-4"],
        filter: { filter: "" },
        groupBy: [],
        range: {
          from: 0,
          to: 10,
        },
        sort: {
          sortDefs: [],
        },
        tableMeta: null,
        type: "subscribed",
      });
    });
  });

  describe("Data Handling", () => {
    it("sends data to client when initial full dataset is received", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith(
        {
          mode: "batch",
          rows: [
            [0,0,true,null,null,0,'key-00', 0,'key-00', 'name 00',1000,true],
            [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
            [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
            [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
            [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
            [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
            [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
            [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
            [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
            [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true]
        ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
    });

    it("only sends data to client once all data for client range is available", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 5)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 100,
        rows: undefined,
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: createTableRows("server-vp-1", 5, 10, 100, 2 /* ts */),
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith(
        {
          mode: "batch",
          rows: [
            [0,0,true,null,null,0,'key-00', 0,'key-00', 'name 00',1000,true],
            [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
            [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
            [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
            [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
            [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
            [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
            [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
            [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
            [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true]
        ],
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
    });
  });

  describe("Scrolling, no buffer", () => {
    it("scrolls forward, partial viewport", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      postMessageToClient.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 2, to: 12 },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 2,
          to: 12,
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: createTableRows("server-vp-1", 10, 12),
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true],
          [10,1,true,null,null,0,"key-10",0,"key-10","name 10",1010,true],
          [11,0,true,null,null,0,"key-11",0,"key-11","name 11",1011,true],
        ],
      });
    });

    it("scrolls forward, discrete viewport", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      postMessageToClient.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 20, to: 30 },
      });
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 20,
          to: 30,
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: createTableRows("server-vp-1", 20, 30),
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [20,9,true,null,null,0,"key-20",0,"key-20","name 20",1020,true,],
          [21,8,true,null,null,0,"key-21",0,"key-21","name 21",1021,true],
          [22,7,true,null,null,0,"key-22",0,"key-22","name 22",1022,true],
          [23,6,true,null,null,0,"key-23",0,"key-23","name 23",1023,true],
          [24,5,true,null,null,0,"key-24",0,"key-24","name 24",1024,true],
          [25,4,true,null,null,0,"key-25",0,"key-25","name 25",1025,true],
          [26,3,true,null,null,0,"key-26",0,"key-26","name 26",1026,true],
          [27,2,true,null,null,0,"key-27",0,"key-27","name 27",1027,true],
          [28,1,true,null,null,0,"key-28",0,"key-28","name 28",1028,true],
          [29,0,true,null,null,0,"key-29",0,"key-29","name 29",1029,true,],
        ],
      });
    });
  });

  describe("Updates", () => {
    it("Updates, no scrolling, only sends updated rows to client", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [updateTableRow("server-vp-1", 3, 2003)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-1",
        rows: [
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",2003, true],
        ],
      });
    });
  });

  describe("Buffering data", () => {
    it("buffers 10 rows, server sends entire buffer set", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        bufferSize: 10,
      });

      const postMessageToClient = vi.fn();

      const serverProxy = new ServerProxy(mockConnection, postMessageToClient);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      mockConnection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.subscribe(clientSubscription1);

      expect(mockConnection.send).toBeCalledTimes(2);

      const messageConstants = {
        module: "CORE",
        sessionId: "dsdsd",
        token: "test",
        user: "user",
      };

      expect(mockConnection.send).toHaveBeenNthCalledWith(1, {
        body: {
          table: clientSubscription1.table,
          type: "GET_TABLE_META",
        },
        requestId: "1",
        ...messageConstants,
      });

      expect(mockConnection.send).toHaveBeenNthCalledWith(2, {
        body: {
          aggregations: [],
          columns: ["col-1"],
          type: "CREATE_VP",
          table: { module: "TEST", table: "test-table" },
          range: { from: 0, to: 20 },
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: [],
        },
        requestId: "client-vp-1",
        ...messageConstants,
      });

      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,null,null,0,"key-00",0,"key-00","name 00",1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true,],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true],
        ],
        size: 100,
      });
    });

    it("10 rows in grid, so 11 requested, (render buffer 0), 10 rows in Viewport buffer, page down, narrowing of range by 1 row", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        bufferSize: 10,
        to: 11,
      });

      const postMessageToClient = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, postMessageToClient);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        body: {
          aggregations: [],
          columns: ["col-1"],
          type: "CREATE_VP",
          table: { module: "TEST", table: "test-table" },
          range: { from: 0, to: 21 },
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: [],
        },
        module: "CORE",
        requestId: "client-vp-1",
        sessionId: "dsdsd",
        token: "test",
        user: "user",
      });

      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 21)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,null,null,0,"key-00",0,"key-00","name 00",1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true,],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true],
          [10,10,true,null,null,0,"key-10",0,"key-10","name 10",1010,true],
        ],
        size: 100,
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 10, to: 20 },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [11,8,true,null,null,0,"key-11",0,"key-11","name 11",1011,true],
          [12,7,true,null,null,0,"key-12",0,"key-12","name 12",1012,true],
          [13,6,true,null,null,0,"key-13",0,"key-13","name 13",1013,true],
          [14,5,true,null,null,0,"key-14",0,"key-14","name 14",1014,true],
          [15,4,true,null,null,0,"key-15",0,"key-15","name 15",1015,true,],
          [16,3,true,null,null,0,"key-16",0,"key-16","name 16",1016,true],
          [17,2,true,null,null,0,"key-17",0,"key-17","name 17",1017,true],
          [18,1,true,null,null,0,"key-18",0,"key-18","name 18",1018,true],
          [19,0,true,null,null,0,"key-19",0,"key-19","name 19",1019,true],
        ],
      });
    });

    it("buffers 10 rows, server sends partial buffer set, enough to fulfill client request, followed by rest", () => {
      const postMessageToClient = vi.fn();
      const serverProxy = createServerProxyAndSubscribeToViewport(
        postMessageToClient,
        {
          bufferSize: 10,
        }
      );

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,null,null,0,"key-00",0,"key-00","name 00",1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true,],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true,],
        ],
        size: 100,
      });

      postMessageToClient.mockClear();

      // This will be a buffer top-up only, so no postMessageToClient
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 10, 20)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(0);
    });

    it("buffers 10 rows, server sends partial buffer set, not enough to fulfill client request, followed by rest", () => {
      const postMessageToClient = vi.fn();
      const serverProxy = createServerProxyAndSubscribeToViewport(
        postMessageToClient,
        {
          bufferSize: 10,
        }
      );

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 9)],
        },
      });

      // First call will be size only
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 100,
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 9, 15, 100, 2)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,null,null,0,"key-00",0,"key-00","name 00",1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true],
        ],
    });

      postMessageToClient.mockClear();

      // This will be a buffer top-up only, so no callback
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 15, 20)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
    });
  });

  describe("scrolling, with buffer", () => {
    it("scroll to end", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        to: 20,
        bufferSize: 100,
      });

      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 5000),
            ...createTableRows("server-vp-1", 0, 120, 5000),
          ],
        },
      });

      callback.mockClear();
      mockConnection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 4975, to: 5000 },
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(mockConnection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 4875,
          to: 5000,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
        user: "user",
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 4975,
          to: 5000,
        },
      });

      expect(callback).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: createTableRows("server-vp-1", 4975, 5000, 5000),
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [4975,19,true,null,null,0,"key-75",0,"key-75","name 75",5975,true],
          [4976,18,true,null,null,0,"key-76",0,"key-76","name 76",5976,true],
          [4977,17,true,null,null,0,"key-77",0,"key-77","name 77",5977,true],
          [4978,16,true,null,null,0,"key-78",0,"key-78","name 78",5978,true],
          [4979,15,true,null,null,0,"key-79",0,"key-79","name 79",5979,true],
          [4980,14,true,null,null,0,"key-80",0,"key-80","name 80",5980,true],
          [4981,13,true,null,null,0,"key-81",0,"key-81","name 81",5981,true],
          [4982,12,true,null,null,0,"key-82",0,"key-82","name 82",5982,true],
          [4983,11,true,null,null,0,"key-83",0,"key-83","name 83",5983,true],
          [4984,10,true,null,null,0,"key-84",0,"key-84","name 84",5984,true],
          [4985,9,true,null,null,0,"key-85",0,"key-85","name 85",5985,true],
          [4986,8,true,null,null,0,"key-86",0,"key-86","name 86",5986,true],
          [4987,7,true,null,null,0,"key-87",0,"key-87","name 87",5987,true],
          [4988,6,true,null,null,0,"key-88",0,"key-88","name 88",5988,true],
          [4989,5,true,null,null,0,"key-89",0,"key-89","name 89",5989,true],
          [4990,4,true,null,null,0,"key-90",0,"key-90","name 90",5990,true],
          [4991,3,true,null,null,0,"key-91",0,"key-91","name 91",5991,true],
          [4992,2,true,null,null,0,"key-92",0,"key-92","name 92",5992,true],
          [4993,1,true,null,null,0,"key-93",0,"key-93","name 93",5993,true],
          [4994,0,true,null,null,0,"key-94",0,"key-94","name 94",5994,true],
          [4995,20,true,null,null,0,"key-95",0,"key-95","name 95",5995,true],
          [4996,21,true,null,null,0,"key-96",0,"key-96","name 96",5996,true],
          [4997,22,true,null,null,0,"key-97",0,"key-97","name 97",5997,true],
          [4998,23,true,null,null,0,"key-98",0,"key-98","name 98",5998,true],
          [4999,24,true,null,null,0,"key-99",0,"key-99","name 99",5999,true],
        ],
      });
    });

    it("returns client range requests from buffer, if available. Calls server when end of buffer is approached", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        bufferSize: 10,
      });
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 2, to: 12 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [10,1,true,null,null,0,"key-10",0,"key-10","name 10",1010,true],
          [11,0,true,null,null,0,"key-11",0,"key-11","name 11",1011,true],
        ],
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 5, to: 15 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [12,4,true,null,null,0,"key-12",0,"key-12","name 12",1012,true],
          [13,3,true,null,null,0,"key-13",0,"key-13","name 13",1013,true],
          [14,2,true,null,null,0,"key-14",0,"key-14","name 14",1014,true],
        ],
      });

      callback.mockClear();
      mockConnection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 8, to: 18 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [15,7,true,null,null,0,"key-15",0,"key-15","name 15",1015,true],
          [16,6,true,null,null,0,"key-16",0,"key-16","name 16",1016,true],
          [17,5,true,null,null,0,"key-17",0,"key-17","name 17",1017,true],
        ],
      });

      expect(mockConnection.send).toHaveBeenCalledWith({
        user: "user",
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 3,
          to: 23,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });
    });

    it("records sent to client when enough data available, client scrolls before initial rows rendered", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        bufferSize: 10,
      });

      // 1) subscribe for rows [0,10]
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      callback.mockClear();

      // 2) server with responds with just rows [0 ... 4]
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 5)],
        },
      });

      // 3) Do not have entire set requested by user, so only size is initially returned
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 100,
      });

      callback.mockClear();

      // 4) now client scrolls, before initial data sent
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 2, to: 12 },
      });

      expect(callback).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 5, 10, 100, 2)],
        },
      });

      expect(callback).toHaveBeenCalledTimes(0);

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 10, 15, 100, 3)],
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true],
          [10,1,true,null,null,0,"key-10",0,"key-10","name 10",1010,true],
          [11,0,true,null,null,0,"key-11",0,"key-11","name 11",1011,true],
        ],
      });
    });

    it("data sequence is correct when scrolling backward, data arrives from server in multiple batches", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        bufferSize: 10,
      });
      // Client requests rows 0..10 with viewport buffersize of 10
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);

      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      // This translates into server call for rows 0..20 these are all stored in Viewport cache
      // and rows 0..10 returned to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      callback.mockClear();

      // Client now requests 20..30, with the buffer this translates to 15..35.
      // We have 0..20 in Viewport cache, so 0..15 will be discarded and 20..30
      // retained. We can expect server to send us  20 .. 35
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 20, to: 30 },
      });
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 15,
          to: 35,
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 20, 35, 100, 2)],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);

      callback.mockClear();

      // Client now requests 12..22 (scrolled backwards) which expands to 7..27 Viewport cache
      // contains 15..35 so we discard 27..35 and keep 15..27. We can expect 7..15 from server.
      // Of the 12 rows we keep, 7 (15..22) are in the clientRange, so we put them in the holding
      // pen until we get the remaining 3 rows from the server

      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 12, to: 22 },
      });
      expect(callback).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 7,
          to: 27,
        },
      });

      // In this batch, the server only sends 2 of the 8 rows we're awaiting (7..15). These are both in
      // the client range but we still don't have the full client range, so these are added
      // to the holding pen
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 13, 15, 100, 3)],
        },
      });
      expect(callback).toHaveBeenCalledTimes(0);

      callback.mockClear();

      // We get the remaining rows we requested. Viewport cache now contains full 7..27
      // and we have all the rows from the client range, so we can take this together with
      // the rows in holding pen and dispatch the full requested set (12..22) to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 7, 13, 100, 4)],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [12,0,true,null,null,0,"key-12",0,"key-12","name 12",1012,true],
          [13,1,true,null,null,0,"key-13",0,"key-13","name 13",1013,true],
          [14,2,true,null,null,0,"key-14",0,"key-14","name 14",1014,true],
          [15,3,true,null,null,0,"key-15",0,"key-15","name 15",1015,true],
          [16,4,true,null,null,0,"key-16",0,"key-16","name 16",1016,true],
          [17,5,true,null,null,0,"key-17",0,"key-17","name 17",1017,true],
          [18,6,true,null,null,0,"key-18",0,"key-18","name 18",1018,true],
          [19,7,true,null,null,0,"key-19",0,"key-19","name 19",1019,true],
          [20,9,true,null,null,0,"key-20",0,"key-20","name 20",1020,true],
          [21,8,true,null,null,0,"key-21",0,"key-21","name 21",1021,true],
        ],
      });
    });

    it("Scrolling with large buffer. Keys are recomputed on each scroll. Calls server when end of buffer is approached", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        bufferSize: 100,
      });

      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 1000),
            ...createTableRows("server-vp-1", 0, 110, 1000),
          ],
        },
      });

      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ]
      ).toHaveLength(110);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.clientRange
      ).toEqual({
        from: 0,
        to: 10,
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 12, to: 23 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [12,9,true,null,null,0,"key-12",0,"key-12","name 12",1012,true],
          [13,8,true,null,null,0,"key-13",0,"key-13","name 13",1013,true],
          [14,7,true,null,null,0,"key-14",0,"key-14","name 14",1014,true],
          [15,6,true,null,null,0,"key-15",0,"key-15","name 15",1015,true],
          [16,5,true,null,null,0,"key-16",0,"key-16","name 16",1016,true],
          [17,4,true,null,null,0,"key-17",0,"key-17","name 17",1017,true],
          [18,3,true,null,null,0,"key-18",0,"key-18","name 18",1018,true],
          [19,2,true,null,null,0,"key-19",0,"key-19","name 19",1019,true],
          [20,1,true,null,null,0,"key-20",0,"key-20","name 20",1020,true],
          [21,0,true,null,null,0,"key-21",0,"key-21","name 21",1021,true],
          [22,10,true,null,null,0,"key-22",0,"key-22","name 22",1022,true],
        ],
      });

      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 30, to: 40 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(callback).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [30,0,true,null,null,0,"key-30",0,"key-30","name 30",1030,true],
          [31,1,true,null,null,0,"key-31",0,"key-31","name 31",1031,true],
          [32,2,true,null,null,0,"key-32",0,"key-32","name 32",1032,true],
          [33,3,true,null,null,0,"key-33",0,"key-33","name 33",1033,true],
          [34,4,true,null,null,0,"key-34",0,"key-34","name 34",1034,true],
          [35,5,true,null,null,0,"key-35",0,"key-35","name 35",1035,true],
          [36,6,true,null,null,0,"key-36",0,"key-36","name 36",1036,true],
          [37,7,true,null,null,0,"key-37",0,"key-37","name 37",1037,true],
          [38,8,true,null,null,0,"key-38",0,"key-38","name 38",1038,true],
          [39,9,true,null,null,0,"key-39",0,"key-39","name 39",1039,true],
        ],
      });
    });
  });

  describe("synchronising with server", () => {
    it("does not spam server when buffer limit reached and server request already in-flight", () => {
      TEST_setRequestId(1);
      const postMessageToClient = vi.fn();
      // prettier-ignore
      const serverProxy = createServerProxyAndSubscribeToViewport( 
        postMessageToClient,
        { bufferSize: 20, connection: mockConnection }
      );

      TEST_setRequestId(1);

      // 1) server sends initial set of rows
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 30)],
        },
      });

      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      // 2) Client requests rows 16..26 . although non-contiguous with previous request, we already have
      // full client range in viewport buffer. We need to read ahead from server, because we're close to
      // the end of our buffer. We can also respond directly to client request
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 16, to: 26 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // TODO test for the call to get nmetadata as well
      expect(mockConnection.send).toHaveBeenCalledWith({
        user: "user",
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 6,
          to: 36,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });

      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      // Client requests 17..27 before we have received response to previous request. The
      // request in-flight already covers this range. We have the data in cache to satisfy
      // user request,
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 17, to: 27 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      // client requests 18..28 same deal as above
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 18, to: 28 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
    });

    it("re-requests data from server even before receiving results", () => {
      TEST_setRequestId(1);
      const postMessageToClient = vi.fn();
      const serverProxy = createServerProxyAndSubscribeToViewport(
        postMessageToClient,
        {
          bufferSize: 20,
          connection: mockConnection,
        }
      );

      // 1) server sends initial set of rows
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 30)],
        },
      });

      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      TEST_setRequestId(1);

      // 2) client scrolls forward. We have all these rows in cache , so we return them to client, but we
      // also request more rows from server, as we are close to edge of buffer.
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 16, to: 26 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // buffer size is 20 so we will have requested +/- 10 around the client range
      expect(mockConnection.send).toHaveBeenCalledWith({
        user: "user",
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 6,
          to: 36,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });

      // 3) Server ACKs range change
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 6,
          to: 36,
        },
      });

      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      // 4) client scrolls forward again, before we have received previously requested rows. We already have
      // a request in flight, so we don't send another. We have all rows client needs.
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 17, to: 27 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      TEST_setRequestId(1);

      // 5) We're still waiting for previously requested rows and client scrolls forward again, this time
      // beyond our current cache.
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 24, to: 34 },
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      expect(mockConnection.send).toHaveBeenCalledWith({
        user: "user",
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 14,
          to: 44,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });
    });
  });

  describe("growing and shrinking rowset (Orders)", () => {
    it("initializes with rowset that does not fill client viewport", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        to: 20,
        bufferSize: 100,
      });
      const postMessageToClient = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, postMessageToClient);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 10),
            ...createTableRows("server-vp-1", 0, 10, 10),
          ],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 10,
        rows: [
          [0,0,true,null,null,0,"key-00",0,"key-00","name 00",1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true],
        ],
      });
    });

    it("gradually reduces, then grows viewport", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        to: 20,
        bufferSize: 100,
      });
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 10),
            ...createTableRows("server-vp-1", 0, 10, 10),
          ],
        },
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            {
              ...COMMON_ROW_ATTRS,
              data: [],
              viewPortId: "server-vp-1",
              vpSize: 9,
              rowIndex: -1,
              rowKey: "SIZE",
              updateType: "SIZE",
              ts: 1,
            },
          ],
        },
      });

      // callbacks will be size only
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 9,
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 8)],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        type: "viewport-update",
        mode: "size-only",
        clientViewportId: "client-vp-1",
        size: 8,
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 1)],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 1,
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 0)],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 0,
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 1),
            ...createTableRows("server-vp-1", 0, 1, 1),
          ],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "update", // WRONG
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 1,
        rows: [
          [0,0,true,null,null,0,"key-00",0,"key-00","name 00",1000,true],
        ],
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 2),
            ...createTableRows("server-vp-1", 1, 2, 2),
          ],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "update", // WRONG
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 2,
        rows: [
          // [0,0,true,null,null,1,"key-00",0,"key-00","name 00",1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
        ],
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 6),
            ...createTableRows("server-vp-1", 2, 6, 6),
          ],
        },
      });
      expect(callback).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "update", // WRONG
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 6,
        rows: [
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
        ],
      });
    });
  });

  describe("selection", () => {
    it("single select", () => {
      const [clientSubscription1, serverSubscriptionAck1] = createSubscription({
        to: 20,
      });
      const postMessageToClient = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, postMessageToClient);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 10),
            ...createTableRows("server-vp-1", 0, 10, 10),
          ],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      // prettier-ignore
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "select",
        selected: [1],
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(mockConnection.send).toHaveBeenCalledWith({
        body: {
          vpId: "server-vp-1",
          type: "SET_SELECTION",
          selection: [1],
        },
        module: "CORE",
        user: "user",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      mockConnection.send.mockClear();

      // prettier-ignore
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "select",
        selected: [4],
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        body: {
          vpId: "server-vp-1",
          type: "SET_SELECTION",
          selection: [4],
        },
        module: "CORE",
        user: "user",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });
    });
  });

  describe("GroupBy", () => {
    const [clientSubscription1, serverSubscriptionAck1] = createSubscription();

    it("sets viewport isTree when groupby in place", () => {
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "groupBy",
        groupBy: ["col-4"],
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);

      expect(mockConnection.send).toHaveBeenCalledWith({
        body: {
          aggregations: [],
          viewPortId: "server-vp-1",
          type: "CHANGE_VP",
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
        },
        module: "CORE",
        user: "user",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      expect(serverProxy["viewports"].get("server-vp-1")?.isTree).toBe(true);
    });

    it("on changing group, sends grouped records as batch", () => {
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "groupBy",
        groupBy: ["col-4"],
      });

      expect(callback).toHaveBeenCalledTimes(0);
      expect(mockConnection.send).toHaveBeenCalledTimes(1);
      expect(mockConnection.send).toHaveBeenCalledWith({
        body: {
          aggregations: [],
          viewPortId: "server-vp-1",
          type: "CHANGE_VP",
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
        },
        module: "CORE",
        user: "user",
        requestId: "1",
        sessionId: "dsdsd",
        token: "test",
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      callback.mockClear();
      serverProxy.handleMessageFromServer(createTableGroupRows());
      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ]
      ).toHaveLength(4);
      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,false,false,1,43714,"$root|USD",0,"","USD","","","","",""],
          [1,1,false,false,1,43941,"$root|EUR",0,"","EUR","","","","",""],
          [2,2,false,false,1,43997,"$root|GBX",0,"","GBX","","","","",""],
          [3,3,false,false,1,44108,"$root|CAD",0,"","CAD","","","","",""],
        ],
        size: 4,
      });
    });

    it("ignores regular row updates after grouping is in place", () => {
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "groupBy",
        groupBy: ["col-4"],
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 0, 10)],
        },
      });

      expect(callback).toHaveBeenCalledTimes(0);
    });

    it("processes group row updates", () => {
      const callback = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, callback);
      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      callback.mockClear();
      mockConnection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "groupBy",
        groupBy: ["col-4"],
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      callback.mockClear();

      serverProxy.handleMessageFromServer(createTableGroupRows());

      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ]
      ).toHaveLength(4);
      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,false,false,1,43714,"$root|USD",0,"","USD","","","","",""],
          [1,1,false,false,1,43941,"$root|EUR",0,"","EUR","","","","",""],
          [2,2,false,false,1,43997,"$root|GBX",0,"","GBX","","","","",""],
          [3,3,false,false,1,44108,"$root|CAD",0,"","CAD","","","","",""],
        ],
        size: 4,
      });

      callback.mockClear();

      // prettier-ignore
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            {
              ...COMMON_ROW_ATTRS,
              viewPortId: "server-vp-1",
              vpSize: 4,
              rowIndex: 1,
              rowKey: "$root|EUR",
              updateType: "U",
              data: [1,false,"$root|EUR",false,"EUR",43942,"","EUR","","","","",""],
            },
          ],
        },
      });

      expect(callback).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ]
      ).toHaveLength(4);
      // prettier-ignore
      expect(callback).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,false,false,1,43942,"$root|EUR",0,"","EUR","","","","",""],
        ],
      });
    });
  });

  describe("SIZE records", () => {
    const [clientSubscription1, serverSubscriptionAck1] = createSubscription();

    it("subscribe whilst table is loading", () => {
      const postMessageToClient = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, postMessageToClient);
      //TODO we shouldn't be able to bypass checks like this
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 1)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
              mode: "size-only",
              type: "viewport-update",
              clientViewportId: "client-vp-1",
              size: 1,
            });
      postMessageToClient.mockClear();

      // prettier-ignore
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            ...createTableRows("server-vp-1", 0,1),
            sizeRow("server-vp-1", 293),
            ...createTableRows("server-vp-1", 1,10),
          ],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "batch",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 293,
        rows: [
          [0,0,true,null,null,0,'key-00', 0,'key-00', 'name 00',1000,true],
          [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
          [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
          [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
          [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
          [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
          [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
          [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
          [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
          [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true]
        ]

      });
      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 850)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 880)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 880,
      });
      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 921)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 921,
      });
      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 948)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 948,
      });
    });
  });

  describe("on single row selection, visual linking", () => {
    it("returns selected row and link table rows", () => {
      const [clientSubscription1, serverSubscriptionAck1] =
        createSubscription();
      const [clientSubscription2, serverSubscriptionAck2] = createSubscription({
        key: "2",
      });

      const postMessageToClient = vi.fn();
      const serverProxy = new ServerProxy(mockConnection, postMessageToClient);
      //TODO we shouldn't be able to bypass checks like this
      serverProxy["sessionId"] = "dsdsd";
      serverProxy["authToken"] = "test";

      serverProxy.subscribe(clientSubscription1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck1);

      serverProxy.subscribe(clientSubscription2);
      serverProxy.handleMessageFromServer(serverSubscriptionAck2);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-2"),
            ...createTableRows("server-vp-2", 0, 10),
          ],
        },
      });

      serverProxy.handleMessageFromClient({
        type: "createLink",
        parentClientVpId: "client-vp-1",
        parentColumnName: "col-1",
        childColumnName: "col-1",
        viewport: "client-vp-2",
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            ...createTableRows("server-vp-1", 0, 1, 100, 1, 1),
            sizeRow("server-vp-2", 20),
            ...createTableRows("server-vp-2", 0, 10),
          ],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(2);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith(1,
          {
            mode: "update",
            rows: [
              [0,0,true,null,null,0,'key-00', 1,'key-00', 'name 00',1000,true],
          ],
            type: 'viewport-update',
            clientViewportId: 'client-vp-1'
          },
        );
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith(2,
          {
            mode: "batch",
            rows: [
              [0,0,true,null,null,0,'key-00', 0,'key-00', 'name 00',1000,true],
              [1,1,true,null,null,0,"key-01",0,"key-01","name 01",1001,true],
              [2,2,true,null,null,0,"key-02",0,"key-02","name 02",1002,true],
              [3,3,true,null,null,0,"key-03",0,"key-03","name 03",1003,true],
              [4,4,true,null,null,0,"key-04",0,"key-04","name 04",1004,true],
              [5,5,true,null,null,0,"key-05",0,"key-05","name 05",1005,true],
              [6,6,true,null,null,0,"key-06",0,"key-06","name 06",1006,true],
              [7,7,true,null,null,0,"key-07",0,"key-07","name 07",1007,true],
              [8,8,true,null,null,0,"key-08",0,"key-08","name 08",1008,true],
              [9,9,true,null,null,0,"key-09",0,"key-09","name 09",1009,true]
          ],
            size: 20,
            type: 'viewport-update',
            clientViewportId: 'client-vp-2'
          }
        );
    });
  });

  describe("debounce mode", () => {
    it("clears pending range request when request is filled", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      const viewport = serverProxy["viewports"].get("server-vp-1") as Viewport;
      expect(viewport["pendingRangeRequests"]).toHaveLength(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 24, to: 34 },
      });

      expect(viewport["pendingRangeRequests"]).toHaveLength(1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 24,
          to: 34,
        },
      });

      expect(viewport["pendingRangeRequests"]).toHaveLength(1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 24, 34)],
        },
      });
      expect(viewport["pendingRangeRequests"]).toHaveLength(0);
    });

    it("clears pending range request when only partial set of rows received", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      const viewport = serverProxy["viewports"].get("server-vp-1") as Viewport;
      expect(viewport["pendingRangeRequests"]).toHaveLength(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 24, to: 34 },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 24,
          to: 34,
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 24, 28)],
        },
      });
      expect(viewport["pendingRangeRequests"]).toHaveLength(0);
    });

    it("queues pending range requests, until filled, no message to client until current client range filled", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      const viewport = serverProxy["viewports"].get("server-vp-1") as Viewport;
      expect(viewport["pendingRangeRequests"]).toHaveLength(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      postMessageToClient.mockClear();

      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 24, to: 34 },
      });

      expect(viewport["pendingRangeRequests"]).toHaveLength(1);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 24,
          to: 34,
        },
      });

      TEST_setRequestId(2);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 44, to: 54 },
      });

      expect(viewport["pendingRangeRequests"]).toHaveLength(2);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "2",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 44,
          to: 54,
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      expect(viewport["pendingRangeRequests"]).toHaveLength(2);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 24, 34)],
        },
      });
      expect(viewport["pendingRangeRequests"]).toHaveLength(1);

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 44, 54)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(viewport["pendingRangeRequests"]).toHaveLength(0);
    });

    it("sends debounce request to client when rows requested before previous request acked", () => {
      const postMessageToClient = vi.fn();
      const serverProxy =
        createServerProxyAndSubscribeToViewport(postMessageToClient);

      // prettier-ignore
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            {
              ...COMMON_ROW_ATTRS,
              data: [], viewPortId: "server-vp-2", vpSize: 100, rowIndex: -1, rowKey: "SIZE", updateType: "SIZE" },
            ...createTableRows("server-vp-1", 0, 10),
          ],
        },
      });

      postMessageToClient.mockClear();

      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 24, to: 34 },
      });

      TEST_setRequestId(2);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 44, to: 54 },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenLastCalledWith({
        clientViewportId: "client-vp-1",
        type: "debounce-begin",
      });
    });
  });
});
