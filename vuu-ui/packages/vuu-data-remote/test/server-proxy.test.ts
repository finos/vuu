import "./global-mocks";
import { beforeEach, describe, expect, vi, it } from "vitest";
import {
  ServerProxy,
  TEST_setRequestId,
} from "../src/server-proxy/server-proxy";
import { Viewport } from "../src/server-proxy/viewport";
import {
  COMMON_ATTRS,
  COMMON_ROW_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createFixtures,
  createTableRows,
  createTableGroupRows,
  sizeRow,
  subscribe,
  testSchema,
  updateTableRow,
  createSubscription,
  createConnection,
  serverAPI,
} from "./test-utils";
import { VuuRow } from "@vuu-ui/vuu-protocol-types";
import {
  DataSourceDataMessage,
  DataSourceEnabledMessage,
} from "@vuu-ui/vuu-data-types";

const SERVER_MESSAGE_CONSTANTS = {
  module: "CORE",
  sessionId: "dsdsd",
};

describe("ServerProxy", () => {
  beforeEach(() => {
    TEST_setRequestId(1);
  });

  describe("subscription", () => {
    it("sends server requests for metadata, links and menus along with subscription", async () => {
      const [, , connection] = await createFixtures();
      expect(connection.send).toBeCalledTimes(4);

      expect(connection.send).toHaveBeenNthCalledWith(1, {
        body: {
          table: { module: "TEST", table: "test-table" },
          type: "GET_TABLE_META",
        },
        requestId: "1",
        ...SERVER_MESSAGE_CONSTANTS,
      });

      expect(connection.send).toHaveBeenNthCalledWith(2, {
        body: {
          aggregations: [],
          columns: ["col-1"],
          type: "CREATE_VP",
          table: { module: "TEST", table: "test-table" },
          range: { from: 0, to: 10 },
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: [],
        },
        requestId: "client-vp-1",
        ...SERVER_MESSAGE_CONSTANTS,
      });

      expect(connection.send).toHaveBeenNthCalledWith(3, {
        body: {
          type: "GET_VP_VISUAL_LINKS",
          vpId: "server-vp-1",
        },
        requestId: "2",
        ...SERVER_MESSAGE_CONSTANTS,
      });
      expect(connection.send).toHaveBeenNthCalledWith(4, {
        body: {
          type: "GET_VIEW_PORT_MENUS",
          vpId: "server-vp-1",
        },
        requestId: "3",
        ...SERVER_MESSAGE_CONSTANTS,
      });
    });

    it("initialises Viewport when server ACKS subscription", async () => {
      const [serverProxy] = await createFixtures();

      expect(serverProxy["viewports"].size).toEqual(1);
      expect(
        serverProxy["mapClientToServerViewport"].get("client-vp-1"),
      ).toEqual("server-vp-1");
      const { clientViewportId, serverViewportId, status } = serverProxy[
        "viewports"
      ].get("server-vp-1") as Viewport;
      expect(clientViewportId).toEqual("client-vp-1");
      expect(serverViewportId).toEqual("server-vp-1");
      expect(status).toEqual("subscribed");
    });

    it("sends message to client once subscribed", async () => {
      const [, postMessageToClient] = await createFixtures();

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        aggregations: [],
        clientViewportId: "client-vp-1",
        columns: ["col-1", "col-2", "col-3", "col-4"],
        filterSpec: { filter: "" },
        groupBy: [],
        range: {
          from: 0,
          to: 10,
        },
        sort: {
          sortDefs: [],
        },
        tableSchema: testSchema,
        type: "subscribed",
      });
    });
  });

  describe("Data Handling", () => {
    it("sends data to client when initial full dataset is received", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      postMessageToClient.mockClear();

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
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00', 0,1, false,'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1, false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1, false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1, false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1, false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1, false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1, false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1, false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1, false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1, false,"key-09","name 09",1009,true]
        ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
    });

    it("sends data to client once all data for client range is available", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      postMessageToClient.mockClear();

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
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00', 0,1, false, 'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,2,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,2,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,2,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,2,false,"key-09","name 09",1009,true]
        ],
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
    });

    it(`
      1) sends data to client when initial full dataset is received
      2) sets rowcount to 0
      3) sends fresh data to client in 2 batches, SIZE record at end of first batch, which is enough to fill client range`, async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      postMessageToClient.mockClear();

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
          rows: [sizeRow("server-vp-1", 0)],
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 0, 10), sizeRow()],
        },
      });

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith(
        {
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00',0,1, false, 'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
          ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 10, 20)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
    });

    it(`
      1) sends zero count to client when table is initially empty
      2) sends each rowcount and row when rows arrive individually, 
      does not wait for full range when all rows are available`, async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 0)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 0,
      });

      postMessageToClient.mockClear();
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
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,false,0,0,'key-00',0,1, false, 'key-00', 'name 00',1000,true],
        ],
        size: 1,
      });

      postMessageToClient.mockClear();
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
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,true,false,0,0,'key-01',0,1, false, 'key-01', 'name 01',1001,true],
        ],
        size: 2,
      });
      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            ...createTableRows("server-vp-1", 2, 3, 3),
            sizeRow("server-vp-1", 3),
          ],
        },
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [2,2,true,false,0,0,'key-02',0,1, false, 'key-02', 'name 02',1002,true],
        ],
        size: 3,
      });
    });

    it(`
      1) sends data to client when initial full dataset is received
      2) sets rowcount to 0
      3) sends fresh data to client in 2 batches, SIZE record at end of first batch, which is NOT enough to fill client range`, async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

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
          rows: [sizeRow("server-vp-1", 0)],
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 0, 7), sizeRow()],
        },
      });

      // Size update only
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        size: 100,
        type: "viewport-update",
        clientViewportId: "client-vp-1",
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 7, 20)],
        },
      });

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith(
        {
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00',0,1, false, 'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
          ],
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
    });
  });

  describe("Scrolling, no buffer", () => {
    it("scrolls forward, partial viewport", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();
      const server = serverAPI(serverProxy);

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

      server.ackRangeRequest(2, 12);

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
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [10,0,true,false,0,0,"key-10",0,1,false,"key-10","name 10",1010,true],
          [11,1,true,false,0,0,"key-11",0,1,false,"key-11","name 11",1011,true],
        ],
      });
    });

    it("scrolls forward, discrete viewport", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();
      const server = serverAPI(serverProxy);

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

      server.ackRangeRequest(20, 30);

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
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [20,0,true,false,0,0,"key-20",0,1,false,"key-20","name 20",1020,true,],
          [21,1,true,false,0,0,"key-21",0,1,false,"key-21","name 21",1021,true],
          [22,2,true,false,0,0,"key-22",0,1,false,"key-22","name 22",1022,true],
          [23,3,true,false,0,0,"key-23",0,1,false,"key-23","name 23",1023,true],
          [24,4,true,false,0,0,"key-24",0,1,false,"key-24","name 24",1024,true],
          [25,5,true,false,0,0,"key-25",0,1,false,"key-25","name 25",1025,true],
          [26,6,true,false,0,0,"key-26",0,1,false,"key-26","name 26",1026,true],
          [27,7,true,false,0,0,"key-27",0,1,false,"key-27","name 27",1027,true],
          [28,8,true,false,0,0,"key-28",0,1,false,"key-28","name 28",1028,true],
          [29,9,true,false,0,0,"key-29",0,1,false,"key-29","name 29",1029,true,],
        ],
      });
    });
  });

  describe("Updates", () => {
    it("Updates, no scrolling, only sends updated rows to client", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

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
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2003, true],
        ],
      });
    });
  });

  describe("Buffering data", () => {
    it("buffers 10 rows, server sends entire buffer set", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 10,
        });

      expect(connection.send).toHaveBeenNthCalledWith(2, {
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
        ...SERVER_MESSAGE_CONSTANTS,
      });

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
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,false,0,0,"key-00",0,1,false,"key-00","name 00",1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true,],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true],
        ],
        size: 100,
      });
    });

    it("10 rows in grid, so 11 requested, (render buffer 0), 10 rows in Viewport buffer, page down, narrowing of range by 1 row", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 10,
          to: 11,
        });

      expect(connection.send).toHaveBeenNthCalledWith(2, {
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
      });

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
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,false,0,0,"key-00",0,1,false,"key-00","name 00",1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true,],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true],
          [10,10,true,false,0,0,"key-10",0,1,false,"key-10","name 10",1010,true],
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
        mode: "update",
        range: { from: 10, to: 20 },
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [11,1,true,false,0,0,"key-11",0,1,false,"key-11","name 11",1011,true],
          [12,2,true,false,0,0,"key-12",0,1,false,"key-12","name 12",1012,true],
          [13,3,true,false,0,0,"key-13",0,1,false,"key-13","name 13",1013,true],
          [14,4,true,false,0,0,"key-14",0,1,false,"key-14","name 14",1014,true],
          [15,5,true,false,0,0,"key-15",0,1,false,"key-15","name 15",1015,true,],
          [16,6,true,false,0,0,"key-16",0,1,false,"key-16","name 16",1016,true],
          [17,7,true,false,0,0,"key-17",0,1,false,"key-17","name 17",1017,true],
          [18,8,true,false,0,0,"key-18",0,1,false,"key-18","name 18",1018,true],
          [19,9,true,false,0,0,"key-19",0,1,false,"key-19","name 19",1019,true],
        ],
      });
    });

    it("buffers 10 rows, server sends partial buffer set, enough to fulfill client request, followed by rest", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      postMessageToClient.mockClear();

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
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,false,0,0,"key-00",0,1,false,"key-00","name 00",1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true,],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true,],
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

    it("buffers 10 rows, server sends partial buffer set, not enough to fulfill client request, followed by rest", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      postMessageToClient.mockClear();

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
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,true,false,0,0,"key-00",0,1,false,"key-00","name 00",1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,2,false,"key-09","name 09",1009,true],
        ],
    });

      postMessageToClient.mockClear();

      // This will be a buffer top-up only, so no postMessageToClient
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
    it("scroll to end", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 100,
          to: 20,
        });

      postMessageToClient.mockClear();

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

      postMessageToClient.mockClear();
      connection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 4975, to: 5000 },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(connection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 4875,
          to: 5000,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
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

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: createTableRows("server-vp-1", 4975, 5000, 5000),
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [4975,0,true,false,0,0,"key-75",0,1,false,"key-75","name 75",5975,true],
          [4976,1,true,false,0,0,"key-76",0,1,false,"key-76","name 76",5976,true],
          [4977,2,true,false,0,0,"key-77",0,1,false,"key-77","name 77",5977,true],
          [4978,3,true,false,0,0,"key-78",0,1,false,"key-78","name 78",5978,true],
          [4979,4,true,false,0,0,"key-79",0,1,false,"key-79","name 79",5979,true],
          [4980,5,true,false,0,0,"key-80",0,1,false,"key-80","name 80",5980,true],
          [4981,6,true,false,0,0,"key-81",0,1,false,"key-81","name 81",5981,true],
          [4982,7,true,false,0,0,"key-82",0,1,false,"key-82","name 82",5982,true],
          [4983,8,true,false,0,0,"key-83",0,1,false,"key-83","name 83",5983,true],
          [4984,9,true,false,0,0,"key-84",0,1,false,"key-84","name 84",5984,true],
          [4985,10,true,false,0,0,"key-85",0,1,false,"key-85","name 85",5985,true],
          [4986,11,true,false,0,0,"key-86",0,1,false,"key-86","name 86",5986,true],
          [4987,12,true,false,0,0,"key-87",0,1,false,"key-87","name 87",5987,true],
          [4988,13,true,false,0,0,"key-88",0,1,false,"key-88","name 88",5988,true],
          [4989,14,true,false,0,0,"key-89",0,1,false,"key-89","name 89",5989,true],
          [4990,15,true,false,0,0,"key-90",0,1,false,"key-90","name 90",5990,true],
          [4991,16,true,false,0,0,"key-91",0,1,false,"key-91","name 91",5991,true],
          [4992,17,true,false,0,0,"key-92",0,1,false,"key-92","name 92",5992,true],
          [4993,18,true,false,0,0,"key-93",0,1,false,"key-93","name 93",5993,true],
          [4994,19,true,false,0,0,"key-94",0,1,false,"key-94","name 94",5994,true],
          [4995,20,true,false,0,0,"key-95",0,1,false,"key-95","name 95",5995,true],
          [4996,21,true,false,0,0,"key-96",0,1,false,"key-96","name 96",5996,true],
          [4997,22,true,false,0,0,"key-97",0,1,false,"key-97","name 97",5997,true],
          [4998,23,true,false,0,0,"key-98",0,1,false,"key-98","name 98",5998,true],
          [4999,24,true,false,0,0,"key-99",0,1,false,"key-99","name 99",5999,true],
        ],
      });
    });

    it("returns client range requests from buffer, if available. Calls server when end of buffer is approached", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 10,
        });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 2, to: 12 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: {from: 2, to: 12},
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [10,0,true,false,0,0,"key-10",0,1,false,"key-10","name 10",1010,true],
          [11,1,true,false,0,0,"key-11",0,1,false,"key-11","name 11",1011,true],
        ],
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 5, to: 15 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: { from: 5, to: 15 },
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [12,2,true,false,0,0,"key-12",0,1,false,"key-12","name 12",1012,true],
          [13,3,true,false,0,0,"key-13",0,1,false,"key-13","name 13",1013,true],
          [14,4,true,false,0,0,"key-14",0,1,false,"key-14","name 14",1014,true],
        ],
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();
      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 8, to: 18 },
      });

      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: { from: 8, to: 18 },
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [15,5,true,false,0,0,"key-15",0,1,false,"key-15","name 15",1015,true],
          [16,6,true,false,0,0,"key-16",0,1,false,"key-16","name 16",1016,true],
          [17,7,true,false,0,0,"key-17",0,1,false,"key-17","name 17",1017,true],
        ],
      });

      expect(connection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 0,
          to: 28,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
      });
    });

    it("returns client range requests from buffer, if available. Final request is only partially available in cache. Resolved when next server data received", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 10,
        });

      const server = serverAPI(serverProxy);

      postMessageToClient.mockClear();

      // Server responds to fullRange (0:20) with full set of initial rows
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      // client request for (2:12) still within cache ...
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 2, to: 12 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: {from: 2, to: 12},
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [10,0,true,false,0,0,"key-10",0,1,false,"key-10","name 10",1010,true],
          [11,1,true,false,0,0,"key-11",0,1,false,"key-11","name 11",1011,true],
        ],
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      // client request for (5:15) still within cache ...
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 5, to: 15 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: { from: 5, to: 15 },
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [12,2,true,false,0,0,"key-12",0,1,false,"key-12","name 12",1012,true],
          [13,3,true,false,0,0,"key-13",0,1,false,"key-13","name 13",1013,true],
          [14,4,true,false,0,0,"key-14",0,1,false,"key-14","name 14",1014,true],
        ],
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      TEST_setRequestId(1);
      // client request for (8:18) still within cache, but close enough to cache edge to trigger range reset ...
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 8, to: 18 },
      });

      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: { from: 8, to: 18 },
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [15,5,true,false,0,0,"key-15",0,1,false,"key-15","name 15",1015,true],
          [16,6,true,false,0,0,"key-16",0,1,false,"key-16","name 16",1016,true],
          [17,7,true,false,0,0,"key-17",0,1,false,"key-17","name 17",1017,true],
        ],
      });

      expect(connection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 0,
          to: 28,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
      });

      postMessageToClient.mockClear();

      server.ackRangeRequest(0, 28);

      TEST_setRequestId(1);

      // run out of cache - nothing returned
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 12, to: 22 },
      });

      expect(postMessageToClient).not.toHaveBeenCalled();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 20, 28)],
        },
      });

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        // range: { from: 12, to: 22 },
        size: 100,
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [18,8,true,false,0,0,"key-18",0,1,false,"key-18","name 18",1018,true],
          [19,9,true,false,0,0,"key-19",0,1,false,"key-19","name 19",1019,true],
          [20,0,true,false,0,0,"key-20",0,1,false,"key-20","name 20",1020,true],
          [21,1,true,false,0,0,"key-21",0,1,false,"key-21","name 21",1021,true],
        ],
      });
    });

    it("records sent to client when enough data available, client scrolls before initial rows rendered", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      postMessageToClient.mockClear();

      // 2) server with responds with just rows [0 ... 4]
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 5)],
        },
      });

      // 3) Do not have entire set requested by user, so only size is initially returned
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 100,
      });

      postMessageToClient.mockClear();

      // 4) now client scrolls, before initial data sent
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 2, to: 12 },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 5, 10, 100, 2)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 10, 15, 100, 3)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,2,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,2,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,2,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,2,false,"key-09","name 09",1009,true],
          [10,0,true,false,0,0,"key-10",0,3,false,"key-10","name 10",1010,true],
          [11,1,true,false,0,0,"key-11",0,3,false,"key-11","name 11",1011,true],
        ],
      });
    });

    it("data sequence is correct when scrolling backward, data arrives from server in multiple batches", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      postMessageToClient.mockClear();

      // This translates into server call for rows 0..20 these are all stored in Viewport cache
      // and rows 0..10 returned to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      postMessageToClient.mockClear();

      // Client now requests 20..30, with the buffer this translates to 10..40.
      // We have 0..20 in Viewport cache, so 0..10 will be discarded and 10...20 retained
      // retained. We can expect server to send us  20 .. 40
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
          from: 10,
          to: 40,
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 20, 40, 100, 2)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [20,0,true,false,0,0,"key-20",0,2,false,"key-20","name 20",1020,true],
          [21,1,true,false,0,0,"key-21",0,2,false,"key-21","name 21",1021,true],
          [22,2,true,false,0,0,"key-22",0,2,false,"key-22","name 22",1022,true],
          [23,3,true,false,0,0,"key-23",0,2,false,"key-23","name 23",1023,true],
          [24,4,true,false,0,0,"key-24",0,2,false,"key-24","name 24",1024,true],
          [25,5,true,false,0,0,"key-25",0,2,false,"key-25","name 25",1025,true],
          [26,6,true,false,0,0,"key-26",0,2,false,"key-26","name 26",1026,true],
          [27,7,true,false,0,0,"key-27",0,2,false,"key-27","name 27",1027,true],
          [28,8,true,false,0,0,"key-28",0,2,false,"key-28","name 28",1028,true],
          [29,9,true,false,0,0,"key-29",0,2,false,"key-29","name 29",1029,true],

        ],
      });

      postMessageToClient.mockClear();

      // Client now requests 12..22 (scrolled backwards) which expands to 2..32 Viewport cache
      // contains 10..40 so we discard 32..40 and keep 10..32. We can expect 2..10 from server.
      // We have all rows needed to return to client.
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 12, to: 22 },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        range: { from: 12, to: 22 },
        clientViewportId: "client-vp-1",
        rows: [
          [12,2,true,false,0,0,"key-12",0,1,false,"key-12","name 12",1012,true],
          [13,3,true,false,0,0,"key-13",0,1,false,"key-13","name 13",1013,true],
          [14,4,true,false,0,0,"key-14",0,1,false,"key-14","name 14",1014,true],
          [15,5,true,false,0,0,"key-15",0,1,false,"key-15","name 15",1015,true],
          [16,6,true,false,0,0,"key-16",0,1,false,"key-16","name 16",1016,true],
          [17,7,true,false,0,0,"key-17",0,1,false,"key-17","name 17",1017,true],
          [18,8,true,false,0,0,"key-18",0,1,false,"key-18","name 18",1018,true],
          [19,9,true,false,0,0,"key-19",0,1,false,"key-19","name 19",1019,true],
        ],
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 2,
          to: 32,
        },
      });

      // In this batch, the server only sends 2 of the 8 rows we're awaiting (7..15). These are both in
      // the client range but we still don't have the full client range, so these are added
      // to the holding pen
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 8, 10, 100, 3)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      postMessageToClient.mockClear();

      // We get the remaining rows we requested. Viewport cache now contains full 7..27
      // and we have all the rows from the client range, so we can take this together with
      // the rows in holding pen and dispatch the full requested set (12..22) to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 2, 8, 100, 4)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(0);
    });

    it(`
      Data sequence is correct when ... 
        scrolling backward 
        user scrolls faster than cache replenished
        data arrives from server in multiple batches`, async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 10,
      });

      const server = serverAPI(serverProxy);

      postMessageToClient.mockClear();

      // This translates into server call for rows 0..20 these are all stored in Viewport cache
      // and rows 0..10 returned to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      postMessageToClient.mockClear();

      // Client now requests 20..30, with the buffer this translates to 10..40.
      // We have 0..20 in Viewport cache, so 0..10 will be discarded and 10...20 retained
      // retained. We can expect server to send us  20 .. 40
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 20, to: 30 },
      });

      server.ackRangeRequest(10, 40);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 20, 40, 100, 2)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [20,0,true,false,0,0,"key-20",0,2,false,"key-20","name 20",1020,true],
          [21,1,true,false,0,0,"key-21",0,2,false,"key-21","name 21",1021,true],
          [22,2,true,false,0,0,"key-22",0,2,false,"key-22","name 22",1022,true],
          [23,3,true,false,0,0,"key-23",0,2,false,"key-23","name 23",1023,true],
          [24,4,true,false,0,0,"key-24",0,2,false,"key-24","name 24",1024,true],
          [25,5,true,false,0,0,"key-25",0,2,false,"key-25","name 25",1025,true],
          [26,6,true,false,0,0,"key-26",0,2,false,"key-26","name 26",1026,true],
          [27,7,true,false,0,0,"key-27",0,2,false,"key-27","name 27",1027,true],
          [28,8,true,false,0,0,"key-28",0,2,false,"key-28","name 28",1028,true],
          [29,9,true,false,0,0,"key-29",0,2,false,"key-29","name 29",1029,true],

        ],
      });

      postMessageToClient.mockClear();

      // Client now requests 5..15 (scrolled backwards) which expands to 0..25 Viewport cache
      // contains 10..40 so we discard 25..40 and keep 10..25. We can expect 0..10 from server.
      // We do not have have all rows needed to return to client.
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 5, to: 15 },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      postMessageToClient.mockClear();

      server.ackRangeRequest(0, 25);

      // In this batch, the server only sends 2 of the 10 rows we're awaiting (0..10). These are both in
      // the client range but we still don't have the full client range, so nothing returned to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 8, 10, 100, 3)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      postMessageToClient.mockClear();

      // We get the remaining rows we requested. Viewport cache now contains full 7..27
      // and we have all the rows from the client range, so we can take this together with
      // the rows in holding pen and dispatch the full requested set (12..22) to client
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 0, 8, 100, 4)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        // range: { from: 5, to: 15 },
        clientViewportId: "client-vp-1",
        rows: [
          [5,0,true,false,0,0,"key-05",0,4,false,"key-05","name 05",1005,true],
          [6,1,true,false,0,0,"key-06",0,4,false,"key-06","name 06",1006,true],
          [7,2,true,false,0,0,"key-07",0,4,false,"key-07","name 07",1007,true],
          [8,3,true,false,0,0,"key-08",0,3,false,"key-08","name 08",1008,true],
          [9,4,true,false,0,0,"key-09",0,3,false,"key-09","name 09",1009,true],
          [10,5,true,false,0,0,"key-10",0,1,false,"key-10","name 10",1010,true],
          [11,6,true,false,0,0,"key-11",0,1,false,"key-11","name 11",1011,true],
          [12,7,true,false,0,0,"key-12",0,1,false,"key-12","name 12",1012,true],
          [13,8,true,false,0,0,"key-13",0,1,false,"key-13","name 13",1013,true],
          [14,9,true,false,0,0,"key-14",0,1,false,"key-14","name 14",1014,true],
        ],
      });
    });

    it("Scrolling with large buffer. Keys are recomputed on each scroll. Calls server when end of buffer is approached", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 100,
        });

      postMessageToClient.mockClear();

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
        ],
      ).toHaveLength(110);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]
          ?.clientRange,
      ).toEqual({
        from: 0,
        to: 10,
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 12, to: 23 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: {from:12, to: 23},
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [12,0,true,false,0,0,"key-12",0,1,false,"key-12","name 12",1012,true],
          [13,1,true,false,0,0,"key-13",0,1,false,"key-13","name 13",1013,true],
          [14,2,true,false,0,0,"key-14",0,1,false,"key-14","name 14",1014,true],
          [15,3,true,false,0,0,"key-15",0,1,false,"key-15","name 15",1015,true],
          [16,4,true,false,0,0,"key-16",0,1,false,"key-16","name 16",1016,true],
          [17,5,true,false,0,0,"key-17",0,1,false,"key-17","name 17",1017,true],
          [18,6,true,false,0,0,"key-18",0,1,false,"key-18","name 18",1018,true],
          [19,7,true,false,0,0,"key-19",0,1,false,"key-19","name 19",1019,true],
          [20,8,true,false,0,0,"key-20",0,1,false,"key-20","name 20",1020,true],
          [21,9,true,false,0,0,"key-21",0,1,false,"key-21","name 21",1021,true],
          [22,10,true,false,0,0,"key-22",0,1,false,"key-22","name 22",1022,true],
        ],
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 30, to: 40 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        range: {from:30, to:40},
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [30,0,true,false,0,0,"key-30",0,1,false,"key-30","name 30",1030,true],
          [31,1,true,false,0,0,"key-31",0,1,false,"key-31","name 31",1031,true],
          [32,2,true,false,0,0,"key-32",0,1,false,"key-32","name 32",1032,true],
          [33,3,true,false,0,0,"key-33",0,1,false,"key-33","name 33",1033,true],
          [34,4,true,false,0,0,"key-34",0,1,false,"key-34","name 34",1034,true],
          [35,5,true,false,0,0,"key-35",0,1,false,"key-35","name 35",1035,true],
          [36,6,true,false,0,0,"key-36",0,1,false,"key-36","name 36",1036,true],
          [37,7,true,false,0,0,"key-37",0,1,false,"key-37","name 37",1037,true],
          [38,8,true,false,0,0,"key-38",0,1,false,"key-38","name 38",1038,true],
          [39,9,true,false,0,0,"key-39",0,1,false,"key-39","name 39",1039,true],
        ],
      });
    });
  });

  describe("synchronising with server", () => {
    it("does not spam server when buffer limit reached and server request already in-flight", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 20,
        });

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
      connection.send.mockClear();

      // 2) Client requests rows 16..26 . although non-contiguous with previous request, we already have
      // full client range in viewport buffer. We need to read ahead from server, because we're close to
      // the end of our buffer. We can also respond directly to client request
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 16, to: 26 },
      });

      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // TODO test for the call to get nmetadata as well
      expect(connection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 0,
          to: 46,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      // Client requests 17..27 before we have received response to previous request. The
      // request in-flight already covers this range. We have the data in cache to satisfy
      // user request,
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 17, to: 27 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      postMessageToClient.mockClear();
      connection.send.mockClear();

      // client requests 18..28 same deal as above
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 18, to: 28 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
    });

    it("re-requests data from server even before receiving results", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 20,
        });

      // 1) server sends initial set of rows
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 30)],
        },
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      TEST_setRequestId(1);

      // 2) client scrolls forward. We have all these rows in cache , so we return them to client, but we
      // also request more rows from server, as we are close to edge of buffer.
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 16, to: 26 },
      });

      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      // buffer size is 20 so we will have requested +/- 10 around the client range
      expect(connection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "CHANGE_VP_RANGE",
          from: 0,
          to: 46,
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
      });

      // 3) Server ACKs range change
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "CHANGE_VP_RANGE_SUCCESS",
          viewPortId: "server-vp-1",
          from: 0,
          to: 46,
        },
      });

      postMessageToClient.mockClear();
      connection.send.mockClear();

      // 4) client scrolls forward again, before we have received previously requested rows. We already have
      // a request in flight, so we don't send another. We have all rows client needs.
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 17, to: 27 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      postMessageToClient.mockClear();
      connection.send.mockClear();

      TEST_setRequestId(1);

      // 5) We're still waiting for previously requested rows and client scrolls forward again, this time
      // beyond our current cache.
      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "setViewRange",
        range: { from: 24, to: 34 },
      });

      expect(connection.send).toHaveBeenCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      // expect(connection.send).toHaveBeenCalledWith({
      //   body: {
      //     viewPortId: "server-vp-1",
      //     type: "CHANGE_VP_RANGE",
      //     from: 14,
      //     to: 44,
      //   },
      //   module: "CORE",
      //   requestId: "1",
      //   sessionId: "dsdsd",
      // });
    });
  });

  describe("growing and shrinking rowset (Orders)", () => {
    it("initializes with rowset that does not fill client viewport", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 100,
        to: 20,
      });
      const server = serverAPI(serverProxy);

      postMessageToClient.mockClear();

      server.receiveWebsocketData([
        sizeRow("server-vp-1", 10),
        ...createTableRows("server-vp-1", 0, 10, 10),
      ]);

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 10,
        rows: [
          [0,0,true,false,0,0,"key-00",0,1,false,"key-00","name 00",1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true],
        ],
      });
    });

    it("gradually reduces, then grows viewport", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures({
        bufferSize: 100,
        to: 20,
      });

      postMessageToClient.mockClear();

      const timeNow = Date.now();
      console.log(`time now ${timeNow}`);
      vi.setSystemTime(timeNow);

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

      postMessageToClient.mockClear();

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

      // postMessageToClients will be size only
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 9,
      });

      vi.setSystemTime(timeNow + 10);

      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 8)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        type: "viewport-update",
        mode: "size-only",
        clientViewportId: "client-vp-1",
        size: 8,
      });

      vi.setSystemTime(timeNow + 20);

      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 1)],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 1,
      });

      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1", 0)],
        },
      });
      // fails intermittent;y with 0
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 0,
      });

      postMessageToClient.mockClear();
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
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update", // WRONG
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 1,
        rows: [
          [0,0,true,false,0,0,"key-00",0,1,false,"key-00","name 00",1000,true],
        ],
      });

      postMessageToClient.mockClear();
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
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update", // WRONG
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 2,
        rows: [
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
        ],
      });

      postMessageToClient.mockClear();
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
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update", // WRONG
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 6,
        rows: [
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
        ],
      });
    });
  });

  describe("selection", () => {
    it("single select", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          to: 20,
        });

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

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      // prettier-ignore
      serverProxy.handleMessageFromClient({
        preserveExistingSelection: false,
        requestId: 'client-request-1',
        rowKey: 'key-01',
        type: "SELECT_ROW",
        vpId: "client-vp-1",
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(connection.send).toHaveBeenCalledWith({
        body: {
          preserveExistingSelection: false,
          rowKey: "key-01",
          type: "SELECT_ROW",
          vpId: "server-vp-1",
        },
        module: "CORE",
        requestId: "client-request-1",
        sessionId: "dsdsd",
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      // prettier-ignore
      serverProxy.handleMessageFromClient({
        preserveExistingSelection: false,
        requestId: 'client-request-2',
        rowKey: 'key-02',
        type: "SELECT_ROW",
        vpId: "client-vp-1",
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);

      expect(connection.send).toHaveBeenCalledWith({
        body: {
          preserveExistingSelection: false,
          rowKey: "key-02",
          type: "SELECT_ROW",
          vpId: "server-vp-1",
        },
        module: "CORE",
        requestId: "client-request-2",
        sessionId: "dsdsd",
      });
    });
  });

  describe("filtering", () => {
    it("invokes filter on viewport, which stores current filter criteria", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      expect(serverProxy["viewports"].get("server-vp-1")?.["filter"]).toEqual({
        filter: 'ccy = "EUR"',
      });
    });

    it("sets batch mode when a filter has been applied", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 43),
            updateTableRow("server-vp-1", 0, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 1, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 2, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 3, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 4, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 5, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 6, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 7, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 8, 1234, { vpSize: 43 }),
            updateTableRow("server-vp-1", 9, 1234, { vpSize: 43 }),
          ],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1, {
            type: "viewport-update",
            mode: "update",
            clientViewportId: "client-vp-1",
            rows: [
              [0,0,true,false,0,0,"key-00",0,2,false,"key-00","name 00",1234, true],
              [1,1,true,false,0,0,"key-01",0,2,false,"key-01","name 01",1234, true],
              [2,2,true,false,0,0,"key-02",0,2,false,"key-02","name 02",1234, true],
              [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",1234, true],
              [4,4,true,false,0,0,"key-04",0,2,false,"key-04","name 04",1234, true],
              [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",1234, true],
              [6,6,true,false,0,0,"key-06",0,2,false,"key-06","name 06",1234, true],
              [7,7,true,false,0,0,"key-07",0,2,false,"key-07","name 07",1234, true],
              [8,8,true,false,0,0,"key-08",0,2,false,"key-08","name 08",1234, true],
              [9,9,true,false,0,0,"key-09",0,2,false,"key-09","name 09",1234, true],
            ],
            size: 43
          });
    });

    it("handles TABLE_ROWS that precede filter request together with filtered rows, in same batch", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            updateTableRow("server-vp-1", 0, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 1, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 2, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 3, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 4, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 5, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 6, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 7, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 8, 1234, { vpSize: 100 }),
            updateTableRow("server-vp-1", 9, 1234, { vpSize: 100 }),
            sizeRow("server-vp-1", 43),
            updateTableRow("server-vp-1", 0, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 1, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 2, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 3, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 4, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 5, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 6, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 7, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 8, 2004, { vpSize: 43 }),
            updateTableRow("server-vp-1", 9, 2004, { vpSize: 43 }),
          ],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1, {
            type: "viewport-update",
            mode: "update",
            clientViewportId: "client-vp-1",
            rows: [
              [0,0,true,false,0,0,"key-00",0,2,false,"key-00","name 00",2004, true],
              [1,1,true,false,0,0,"key-01",0,2,false,"key-01","name 01",2004, true],
              [2,2,true,false,0,0,"key-02",0,2,false,"key-02","name 02",2004, true],
              [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2004, true],
              [4,4,true,false,0,0,"key-04",0,2,false,"key-04","name 04",2004, true],
              [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",2004, true],
              [6,6,true,false,0,0,"key-06",0,2,false,"key-06","name 06",2004, true],
              [7,7,true,false,0,0,"key-07",0,2,false,"key-07","name 07",2004, true],
              [8,8,true,false,0,0,"key-08",0,2,false,"key-08","name 08",2004, true],
              [9,9,true,false,0,0,"key-09",0,2,false,"key-09","name 09",2004, true],
            ],
            size: 43
          });
    });

    it(`
      1) applies filter that sets rowsize to 1, 
      2) removes filter, all rows refreshed`, async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 10,
        });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 1),
            updateTableRow("server-vp-1", 0, 1234, { vpSize: 1 }),
          ],
        },
      });

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20, 100, 3)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1, {
            type: "viewport-update",
            mode: "update",
            clientViewportId: "client-vp-1",
            rows: [
              [0,0,true,false,0,0,"key-00",0,3,false,"key-00","name 00",1000, true],
              [1,1,true,false,0,0,"key-01",0,3,false,"key-01","name 01",1001, true],
              [2,2,true,false,0,0,"key-02",0,3,false,"key-02","name 02",1002, true],
              [3,3,true,false,0,0,"key-03",0,3,false,"key-03","name 03",1003, true],
              [4,4,true,false,0,0,"key-04",0,3,false,"key-04","name 04",1004, true],
              [5,5,true,false,0,0,"key-05",0,3,false,"key-05","name 05",1005, true],
              [6,6,true,false,0,0,"key-06",0,3,false,"key-06","name 06",1006, true],
              [7,7,true,false,0,0,"key-07",0,3,false,"key-07","name 07",1007, true],
              [8,8,true,false,0,0,"key-08",0,3,false,"key-08","name 08",1008, true],
              [9,9,true,false,0,0,"key-09",0,3,false,"key-09","name 09",1009, true],
            ],
            size: 100
          });
    });
    it(`
      1) applies filter that sets rowsize to 1, 
      2) removes filter, all rows refreshed, in multiple batches`, async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 10,
        });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 20)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: 'ccy = "EUR"' },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 1),
            updateTableRow("server-vp-1", 0, 1234, { key: "abc", vpSize: 1 }),
          ],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [] },
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          sort: { sortDefs: [] },
          filterSpec: { filter: "" },
          groupBy: [],
          type: "CHANGE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 5, 100, 3)],
        },
      });
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 5, 20, 100, 3)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(2);
      expect(postMessageToClient).toHaveBeenNthCalledWith<
        [DataSourceDataMessage]
      >(1, {
        type: "viewport-update",
        mode: "size-only",
        clientViewportId: "client-vp-1",
        size: 100,
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(2, {
            type: "viewport-update",
            mode: "update",
            clientViewportId: "client-vp-1",
            rows: [
              [0,0,true,false,0,0,"key-00",0,3,false,"key-00","name 00",1000, true],
              [1,1,true,false,0,0,"key-01",0,3,false,"key-01","name 01",1001, true],
              [2,2,true,false,0,0,"key-02",0,3,false,"key-02","name 02",1002, true],
              [3,3,true,false,0,0,"key-03",0,3,false,"key-03","name 03",1003, true],
              [4,4,true,false,0,0,"key-04",0,3,false,"key-04","name 04",1004, true],
              [5,5,true,false,0,0,"key-05",0,3,false,"key-05","name 05",1005, true],
              [6,6,true,false,0,0,"key-06",0,3,false,"key-06","name 06",1006, true],
              [7,7,true,false,0,0,"key-07",0,3,false,"key-07","name 07",1007, true],
              [8,8,true,false,0,0,"key-08",0,3,false,"key-08","name 08",1008, true],
              [9,9,true,false,0,0,"key-09",0,3,false,"key-09","name 09",1009, true],
            ],
            size: 100
          });
    });
  });

  describe("GroupBy", () => {
    it("sets viewport isTree when groupby in place", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);

      expect(connection.send).toHaveBeenCalledWith({
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
        requestId: "1",
        sessionId: "dsdsd",
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

    it("on changing group, sends grouped records as batch, with SIZE record", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(connection.send).toHaveBeenCalledWith({
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
        requestId: "1",
        sessionId: "dsdsd",
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

      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer(createTableGroupRows());
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ],
      ).toHaveLength(4);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,false,false,1,43714,"$root|USD",0,1,false,"","USD","","","","",""],
          [1,1,false,false,1,43941,"$root|EUR",0,1,false,"","EUR","","","","",""],
          [2,2,false,false,1,43997,"$root|GBX",0,1,false,"","GBX","","","","",""],
          [3,3,false,false,1,44108,"$root|CAD",0,1,false,"","CAD","","","","",""],
        ],
        size: 4,
      });
    });

    it("on changing group, sends grouped records as batch, without SIZE record", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(connection.send).toHaveBeenCalledWith({
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
        requestId: "1",
        sessionId: "dsdsd",
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

      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer(createTableGroupRows(false));
      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ],
      ).toHaveLength(4);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,false,false,1,43714,"$root|USD",0,1,false,"","USD","","","","",""],
          [1,1,false,false,1,43941,"$root|EUR",0,1,false,"","EUR","","","","",""],
          [2,2,false,false,1,43997,"$root|GBX",0,1,false,"","GBX","","","","",""],
          [3,3,false,false,1,44108,"$root|CAD",0,1,false,"","CAD","","","","",""],
        ],
        size: 4,
      });
    });

    it("on changing group, it may receive group records in multiple batches", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 100,
        });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 110)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(connection.send).toHaveBeenCalledWith({
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
        requestId: "1",
        sessionId: "dsdsd",
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

      postMessageToClient.mockClear();

      const groupRows = createTableGroupRows(false);
      const group1 = {
        ...groupRows,
        requestId: "2",

        body: {
          ...groupRows.body,
          timeStamp: 1,
          rows: groupRows.body.rows.slice(0, 2),
        },
      };
      const group2 = {
        ...groupRows,
        requestId: "3",
        body: {
          ...groupRows.body,
          timeStamp: 2,
          rows: groupRows.body.rows.slice(2),
        },
      };

      // Because not all the rows are available when we receive the first batch,
      // we will see a size-only message after the first batch, followed by the
      // actual grouped rows when we receive the second and final batch.
      serverProxy.handleMessageFromServer(group1);
      serverProxy.handleMessageFromServer(group2);

      expect(postMessageToClient).toHaveBeenCalledTimes(2);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ],
      ).toHaveLength(4);
      // prettier-ignore

      expect(postMessageToClient).toHaveBeenNthCalledWith(1, {
        mode: "size-only",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 4,
      })

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith(2, {
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,false,false,1,43714,"$root|USD",0,1,false,"","USD","","","","",""],
          [1,1,false,false,1,43941,"$root|EUR",0,1,false,"","EUR","","","","",""],
          [2,2,false,false,1,43997,"$root|GBX",0,1,false,"","GBX","","","","",""],
          [3,3,false,false,1,44108,"$root|CAD",0,1,false,"","CAD","","","","",""],
        ],
      });
    });

    it("ignores regular row updates after grouping is in place", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
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

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [...createTableRows("server-vp-1", 0, 10)],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
    });

    it("processes group row updates", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures({
          bufferSize: 100,
        });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
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

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer(createTableGroupRows());

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ],
      ).toHaveLength(4);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [0,0,false,false,1,43714,"$root|USD",0,1,false,"","USD","","","","",""],
          [1,1,false,false,1,43941,"$root|EUR",0,1,false,"","EUR","","","","",""],
          [2,2,false,false,1,43997,"$root|GBX",0,1,false,"","GBX","","","","",""],
          [3,3,false,false,1,44108,"$root|CAD",0,1,false,"","CAD","","","","",""],
        ],
        size: 4,
      });

      postMessageToClient.mockClear();

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

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      expect(
        serverProxy["viewports"].get("server-vp-1")?.["dataWindow"]?.[
          "internalData"
        ],
      ).toHaveLength(4);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,false,false,1,43942,"$root|EUR",0,1,false,"","EUR","","","","",""],
        ],
      });
    });
  });

  describe("SIZE records", () => {
    it("subscribe whilst table is loading", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

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
            ...createTableRows("server-vp-1", 1,10, 293),
          ],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(1);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        size: 293,
        rows: [
          [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
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

  describe("on visual linking", async () => {
    it("returns link table rows", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      await subscribe(serverProxy, { key: "2" });

      postMessageToClient.mockClear();

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
        requestId: "req1",
        type: "CREATE_VISUAL_LINK",
        parentVpId: "client-vp-1",
        parentColumnName: "col-1",
        childColumnName: "col-1",
        childVpId: "client-vp-2",
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            ...createTableRows("server-vp-1", 0, 1, 100, 1, 1, 2000),
            sizeRow("server-vp-2", 20),
            ...createTableRows("server-vp-2", 0, 10, 100, 2, 0, 2000),
          ],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(2);
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith(1,
          {
            mode: "update",
            rows: [
              [0,0,true,false,0,0,'key-00',1,1,false,'key-00', 'name 00',2000,true],
          ],
            type: 'viewport-update',
            clientViewportId: 'client-vp-1'
          },
        );
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith(2,
          {
            mode: "update",
            rows: [
              [0,0,true,false,0,0,'key-00',0,2,false,'key-00', 'name 00',2000,true],
              [1,1,true,false,0,0,"key-01",0,2,false,"key-01","name 01",2001,true],
              [2,2,true,false,0,0,"key-02",0,2,false,"key-02","name 02",2002,true],
              [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2003,true],
              [4,4,true,false,0,0,"key-04",0,2,false,"key-04","name 04",2004,true],
              [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",2005,true],
              [6,6,true,false,0,0,"key-06",0,2,false,"key-06","name 06",2006,true],
              [7,7,true,false,0,0,"key-07",0,2,false,"key-07","name 07",2007,true],
              [8,8,true,false,0,0,"key-08",0,2,false,"key-08","name 08",2008,true],
              [9,9,true,false,0,0,"key-09",0,2,false,"key-09","name 09",2009,true]
          ],
            size: 100,
            type: 'viewport-update',
            clientViewportId: 'client-vp-2'
          }
        );
    });
  });

  describe("debounce mode", () => {
    it("clears pending range request when request is filled", async () => {
      const [serverProxy] = await createFixtures();

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

    it("clears pending range request when only partial set of rows received", async () => {
      const [serverProxy] = await createFixtures();

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

    it("queues pending range requests, until filled, no message to client until current client range filled", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

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

    it("sends debounce request to client when rows requested before previous request acked", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

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

  describe("config", () => {
    it("sets viewport isTree when config includes groupby", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);
      postMessageToClient.mockClear();
      connection.send.mockClear();

      serverProxy.handleMessageFromClient({
        viewport: "client-vp-1",
        type: "config",
        config: {
          aggregations: [],
          columns: ["col-1", "col-2", "col-3", "col-4"],
          filterSpec: { filter: "" },
          groupBy: ["col-4"],
          sort: { sortDefs: [] },
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(0);
      expect(connection.send).toHaveBeenCalledTimes(1);

      expect(connection.send).toHaveBeenCalledWith({
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
        requestId: "1",
        sessionId: "dsdsd",
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
  });

  describe("multiple subscriptions", () => {
    it("sends messages to correct clients once subscribed", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      await subscribe(serverProxy, { key: "2" });

      expect(postMessageToClient).toHaveBeenCalledTimes(2);
      expect(postMessageToClient).toHaveBeenNthCalledWith(1, {
        aggregations: [],
        clientViewportId: "client-vp-1",
        columns: ["col-1", "col-2", "col-3", "col-4"],
        filterSpec: { filter: "" },
        groupBy: [],
        range: {
          from: 0,
          to: 10,
        },
        sort: {
          sortDefs: [],
        },
        tableSchema: testSchema,
        type: "subscribed",
      });
      expect(postMessageToClient).toHaveBeenNthCalledWith(2, {
        aggregations: [],
        clientViewportId: "client-vp-2",
        columns: ["col-1", "col-2", "col-3", "col-4"],
        filterSpec: { filter: "" },
        groupBy: [],
        range: {
          from: 0,
          to: 10,
        },
        sort: {
          sortDefs: [],
        },
        tableSchema: testSchema,
        type: "subscribed",
      });
      expect(serverProxy["viewports"].size).toEqual(2);
    });

    it("sends data to each client when initial full datasets are received as separate batches", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      await subscribe(serverProxy, { key: "2" });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1"),
            ...createTableRows("server-vp-1", 0, 10),
          ],
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

      expect(postMessageToClient).toHaveBeenCalledTimes(2);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1,
        {
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
        ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(2,
        {
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
        ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-2'
        }
      );
    });

    it("sends data to each client when initial full datasets are received interleaved", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      await subscribe(serverProxy, { key: "2" });

      postMessageToClient.mockClear();

      const clientRows1 = createTableRows("server-vp-1", 0, 10);
      const clientRows2 = createTableRows("server-vp-2", 0, 10);
      const clientRows: VuuRow[] = [];
      clientRows1.forEach((row, i) => {
        clientRows.push(row, clientRows2[i]);
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow("server-vp-1"), sizeRow("server-vp-2"), ...clientRows],
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(2);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1,
        {
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
        ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-1'
        }
      );
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(2,
        {
          mode: "update",
          rows: [
            [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
            [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
            [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
            [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
            [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
        ],
          size: 100,
          type: 'viewport-update',
          clientViewportId: 'client-vp-2'
        }
      );
    });

    it("sends data to each client followed by mixed updates", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      await subscribe(serverProxy, { key: "2" });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 100),
            ...createTableRows("server-vp-1", 0, 10),
          ],
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-2", 200),
            ...createTableRows("server-vp-2", 0, 10, 200),
          ],
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            updateTableRow("server-vp-1", 3, 2003),
            updateTableRow("server-vp-2", 3, 2003, { vpSize: 200 }),
            updateTableRow("server-vp-1", 1, 2003),
            updateTableRow("server-vp-2", 5, 2003, { vpSize: 200 }),
            updateTableRow("server-vp-2", 4, 2003, { vpSize: 200 }),
          ],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(2);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1, {
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,true,false,0,0,"key-01",0,2,false,"key-01","name 01",2003, true],
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2003, true],
        ],
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(2, {
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-2",
        rows: [
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2003, true],
          [4,4,true,false,0,0,"key-04",0,2,false,"key-04","name 04",2003, true],
          [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",2003, true],
        ],
      });
    });

    it("sends mixed updates, including size change for one vp", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      await subscribe(serverProxy, { key: "2" });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 100),
            ...createTableRows("server-vp-1", 0, 10),
          ],
        },
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-2", 200),
            ...createTableRows("server-vp-2", 0, 10, 200),
          ],
        },
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 50),
            updateTableRow("server-vp-1", 3, 2003, { vpSize: 50 }),
            updateTableRow("server-vp-2", 3, 2003, { vpSize: 200 }),
            updateTableRow("server-vp-1", 1, 2003, { vpSize: 50 }),
            updateTableRow("server-vp-2", 5, 2003, { vpSize: 200 }),
            updateTableRow("server-vp-2", 4, 2003, { vpSize: 200 }),
          ],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(2);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1, {
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,true,false,0,0,"key-01",0,2,false,"key-01","name 01",2003, true],
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2003, true],
        ],
        size: 50
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(2, {
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-2",
        rows: [
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2003, true],
          [4,4,true,false,0,0,"key-04",0,2,false,"key-04","name 04",2003, true],
          [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",2003, true],
        ],
        size: undefined
      });

      postMessageToClient.mockClear();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-2", 75),
            updateTableRow("server-vp-1", 3, 2004, { vpSize: 50 }),
            updateTableRow("server-vp-2", 3, 2004, { vpSize: 75 }),
            updateTableRow("server-vp-1", 1, 2004, { vpSize: 50 }),
            updateTableRow("server-vp-2", 5, 2004, { vpSize: 75 }),
            updateTableRow("server-vp-2", 4, 2004, { vpSize: 75 }),
          ],
        },
      });
      expect(postMessageToClient).toHaveBeenCalledTimes(2);

      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(1, {
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,true,false,0,0,"key-01",0,2,false,"key-01","name 01",2004, true],
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2004, true],
        ],
        size: undefined
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<[DataSourceDataMessage]>(2, {
        type: "viewport-update",
        mode: "update",
        clientViewportId: "client-vp-2",
        rows: [
          [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2004, true],
          [4,4,true,false,0,0,"key-04",0,2,false,"key-04","name 04",2004, true],
          [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",2004, true],
        ],
        size: 75
      });
    });
  });

  describe("disable and enable", () => {
    it("sends a message to server when client calls disable", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();
      // prettier-ignore
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      connection.send.mockClear();
      postMessageToClient.mockClear();

      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(false);

      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        type: "disable",
        viewport: "client-vp-1",
      });
      expect(connection.send).toBeCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      expect(connection.send).toHaveBeenCalledWith({
        body: {
          type: "DISABLE_VP",
          viewPortId: "server-vp-1",
        },
        requestId: "1",
        ...SERVER_MESSAGE_CONSTANTS,
      });

      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(false);

      // Viewport disabled status only set once server sends ACK
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "DISABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });
      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(true);
    });

    it("sends a message to server when client calls enable, re-sends data from cache to client", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();
      // prettier-ignore
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        type: "disable",
        viewport: "client-vp-1",
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "DISABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      connection.send.mockClear();
      postMessageToClient.mockClear();

      TEST_setRequestId(1);

      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(true);

      serverProxy.handleMessageFromClient({
        type: "enable",
        viewport: "client-vp-1",
      });
      expect(connection.send).toBeCalledTimes(1);
      expect(postMessageToClient).toHaveBeenCalledTimes(0);

      expect(connection.send).toHaveBeenCalledWith({
        body: {
          type: "ENABLE_VP",
          viewPortId: "server-vp-1",
        },
        requestId: "1",
        ...SERVER_MESSAGE_CONSTANTS,
      });
      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(true);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "ENABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(false);

      expect(postMessageToClient).toHaveBeenCalledTimes(2);

      expect(postMessageToClient).toHaveBeenNthCalledWith<
        [DataSourceEnabledMessage]
      >(1, {
        type: "enabled",
        clientViewportId: "client-vp-1",
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenNthCalledWith<
        [DataSourceDataMessage]
      >(2, {
        mode: "update",
        rows: [
          [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
      ],
      size: 100,
      type: 'viewport-update',
      clientViewportId: 'client-vp-1'
      });
    });

    it("does nothing if client calls enable for a viewport which has not been disabled", async () => {
      const [serverProxy, postMessageToClient, connection] =
        await createFixtures();
      // prettier-ignore
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [sizeRow(), ...createTableRows("server-vp-1", 0, 10)],
        },
      });

      connection.send.mockClear();
      postMessageToClient.mockClear();

      TEST_setRequestId(1);

      serverProxy.handleMessageFromClient({
        type: "enable",
        viewport: "client-vp-1",
      });
      expect(connection.send).toBeCalledTimes(0);
      expect(postMessageToClient).toHaveBeenCalledTimes(0);
    });
  });

  describe("disable and enable", () => {
    it("disable sends message to server", async () => {
      const [serverProxy, , connection] = await createFixtures();
      connection.send.mockClear();
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        type: "disable",
        viewport: "client-vp-1",
      });

      // viewport isn't disabled until requesty ACKED
      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(false);

      expect(connection.send).toHaveBeenCalledTimes(1);
      expect(connection.send).toHaveBeenCalledWith({
        body: {
          viewPortId: "server-vp-1",
          type: "DISABLE_VP",
        },
        module: "CORE",
        requestId: "1",
        sessionId: "dsdsd",
      });
    });

    it("viewport is disabled when disable request is ACKed", async () => {
      const [serverProxy, , connection] = await createFixtures();
      connection.send.mockClear();
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        type: "disable",
        viewport: "client-vp-1",
      });

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "DISABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(true);
    });

    it("viewport is enabled when enable request is ACKed", async () => {
      const [serverProxy, , connection] = await createFixtures();
      connection.send.mockClear();
      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        type: "disable",
        viewport: "client-vp-1",
      });
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "DISABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      TEST_setRequestId(1);
      serverProxy.handleMessageFromClient({
        type: "enable",
        viewport: "client-vp-1",
      });
      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(true);

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "ENABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });
      expect(serverProxy["viewports"].get("server-vp-1")?.disabled).toBe(false);
    });

    it("full data update is sent to client once enable is ACKed", async () => {
      const [serverProxy, postMessageToClient] = await createFixtures();

      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", 100),
            ...createTableRows("server-vp-1", 0, 10),
          ],
        },
      });

      postMessageToClient.mockClear();
      TEST_setRequestId(1);
      // prettier-ignore
      serverProxy.handleMessageFromClient({type: "disable", viewport: "client-vp-1" });
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "1",
        body: {
          type: "DISABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });
      // prettier-ignore
      serverProxy.handleMessageFromClient({ type: "enable", viewport: "client-vp-1" });
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        requestId: "2",
        body: {
          type: "ENABLE_VP_SUCCESS",
          viewPortId: "server-vp-1",
        },
      });

      expect(postMessageToClient).toHaveBeenCalledTimes(3);
      expect(postMessageToClient).toHaveBeenLastCalledWith({
        clientViewportId: "client-vp-1",
        mode: "update",
        // prettier-ignore
        rows: [
          [0,0,true,false,0,0,'key-00',0,1,false,'key-00', 'name 00',1000,true],
          [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
          [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
          [3,3,true,false,0,0,"key-03",0,1,false,"key-03","name 03",1003,true],
          [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true]
        ],
        size: 100,
        type: "viewport-update",
      });
    });
  });

  describe("request queuing", () => {
    it("queue is empty in normal operation", async () => {
      const [serverProxy] = await createFixtures();
      expect(serverProxy["queuedRequests"].length).toEqual(0);
    });

    it("queues range requests sent before subscription completes, sends to server after subscription completes", async () => {
      const connection = createConnection();
      const postMessageToClient = vi.fn();
      const serverProxy = new ServerProxy(connection, postMessageToClient);
      serverProxy["authToken"] = "test";
      serverProxy["sessionId"] = "dsdsd";

      const [clientSubscription, serverSubscriptionAck, tableMetaResponse] =
        createSubscription();
      serverProxy.subscribe(clientSubscription);
      // send a range request before the subscription is ACKed
      serverProxy.handleMessageFromClient({
        type: "setViewRange",
        viewport: "client-vp-1",
        range: { from: 0, to: 20 },
      });
      expect(serverProxy["queuedRequests"].length).toEqual(1);
      connection.send.mockClear();
      TEST_setRequestId(1);
      serverProxy.handleMessageFromServer(serverSubscriptionAck);
      serverProxy.handleMessageFromServer(tableMetaResponse);
      // allow the promises pending for the subscription and metadata to resolve
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      expect(serverProxy["queuedRequests"].length).toEqual(0);
      expect(connection.send).toHaveBeenCalledTimes(3);
      expect(connection.send).toHaveBeenNthCalledWith(1, {
        body: {
          from: 0,
          to: 20,
          type: "CHANGE_VP_RANGE",
          viewPortId: "server-vp-1",
        },
        requestId: "2",
        ...SERVER_MESSAGE_CONSTANTS,
      });
    });
  });
});
