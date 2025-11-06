import "./global-mocks";
import { describe, expect, vi, it } from "vitest";
import { TEST_setRequestId } from "../src/server-proxy/server-proxy";
import {
  COMMON_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createFixtures,
  createTableRows,
  sizeRow,
  updateTableRow,
} from "./test-utils";

describe("suspend and resume", () => {
  it("suspend does not send message to server", async () => {
    const [serverProxy, , connection] = await createFixtures();
    connection.send.mockClear();
    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });
    expect(serverProxy["viewports"].get("server-vp-1")?.suspended).toBe(true);
    expect(connection.send).not.toHaveBeenCalled();
  });

  it("no updates sent to client whilst suspended", async () => {
    const [serverProxy, postMessageToClient, connection] =
      await createFixtures();
    postMessageToClient.mockClear();
    connection.send.mockClear();
    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });

    serverProxy.handleMessageFromServer({
      ...COMMON_ATTRS,
      body: {
        ...COMMON_TABLE_ROW_ATTRS,
        rows: [
          updateTableRow("server-vp-1", 3, 2004),
          updateTableRow("server-vp-1", 5, 2004),
        ],
      },
    });
    expect(postMessageToClient).not.toHaveBeenCalled();
  });

  it("cached data IS updated whilst suspended", async () => {
    const [serverProxy] = await createFixtures();
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

    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });

    serverProxy.handleMessageFromServer({
      ...COMMON_ATTRS,
      body: {
        ...COMMON_TABLE_ROW_ATTRS,
        rows: [
          updateTableRow("server-vp-1", 3, 2004),
          updateTableRow("server-vp-1", 5, 2004),
        ],
      },
    });

    const viewport = serverProxy["viewports"].get("server-vp-1");
    // prettier-ignore
    expect(viewport["dataWindow"].getAtIndex(3).data).toEqual(["key-03","name 03",2004, true]);
    // prettier-ignore
    expect(viewport["dataWindow"].getAtIndex(5).data).toEqual(["key-05","name 05",2004, true]);
  });

  it("suspend is escalated to disable if not resumed within time threshold", async () => {
    const [serverProxy, , connection] = await createFixtures();
    connection.send.mockClear();

    vi.useFakeTimers();

    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });
    expect(serverProxy["viewports"].get("server-vp-1")?.suspended).toBe(true);
    expect(connection.send).not.toHaveBeenCalled();

    TEST_setRequestId(1);

    // roll forward time, 3000 is default escalateDelay
    vi.advanceTimersByTime(3000);

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

    vi.useRealTimers();
  });

  it("suspend escalation can be prevented", async () => {
    const [serverProxy, , connection] = await createFixtures();
    connection.send.mockClear();

    vi.useFakeTimers();

    serverProxy.handleMessageFromClient({
      escalateToDisable: false,
      type: "suspend",
      viewport: "client-vp-1",
    });
    expect(serverProxy["viewports"].get("server-vp-1")?.suspended).toBe(true);
    expect(connection.send).not.toHaveBeenCalled();

    TEST_setRequestId(1);

    // roll forward time, 3000 is default escalateDelay
    vi.advanceTimersByTime(3000);

    expect(connection.send).not.toHaveBeenCalled();

    vi.useRealTimers();
  });

  it("suspend escalation delay can be configured", async () => {
    const [serverProxy, , connection] = await createFixtures();
    connection.send.mockClear();

    vi.useFakeTimers();

    serverProxy.handleMessageFromClient({
      escalateDelay: 5000,
      escalateToDisable: true,
      type: "suspend",
      viewport: "client-vp-1",
    });
    expect(serverProxy["viewports"].get("server-vp-1")?.suspended).toBe(true);
    expect(connection.send).not.toHaveBeenCalled();

    TEST_setRequestId(1);

    vi.advanceTimersByTime(3000);

    expect(connection.send).not.toHaveBeenCalled();

    vi.advanceTimersByTime(3000);

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

    vi.useRealTimers();
  });

  it("resume does not send message to server", async () => {
    const [serverProxy, , connection] = await createFixtures();
    connection.send.mockClear();
    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });
    serverProxy.handleMessageFromClient({
      type: "resume",
      viewport: "client-vp-1",
    });
    expect(serverProxy["viewports"].get("server-vp-1")?.suspended).toBe(false);
    expect(connection.send).not.toHaveBeenCalled();
  });

  it("resume re-sends current data to client even if no updated have been received", async () => {
    const [serverProxy, postMessageToClient] = await createFixtures();

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

    postMessageToClient.mockClear();

    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });

    serverProxy.handleMessageFromClient({
      type: "resume",
      viewport: "client-vp-1",
    });

    expect(postMessageToClient).toHaveBeenCalledTimes(1);
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

  it("any updates received whilst suspended will be included in refresh on resume", async () => {
    const [serverProxy, postMessageToClient] = await createFixtures();

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

    postMessageToClient.mockClear();

    serverProxy.handleMessageFromClient({
      type: "suspend",
      viewport: "client-vp-1",
    });

    serverProxy.handleMessageFromServer({
      ...COMMON_ATTRS,
      body: {
        ...COMMON_TABLE_ROW_ATTRS,
        rows: [
          updateTableRow("server-vp-1", 3, 2004),
          updateTableRow("server-vp-1", 5, 2004),
        ],
      },
    });

    serverProxy.handleMessageFromClient({
      type: "resume",
      viewport: "client-vp-1",
    });

    expect(postMessageToClient).toHaveBeenCalledTimes(1);
    expect(postMessageToClient).toHaveBeenLastCalledWith({
      clientViewportId: "client-vp-1",
      mode: "update",
      // prettier-ignore
      rows: [
            [0,0,true,false,0,0,'key-00',0,1,false,'key-00','name 00',1000,true],
            [1,1,true,false,0,0,"key-01",0,1,false,"key-01","name 01",1001,true],
            [2,2,true,false,0,0,"key-02",0,1,false,"key-02","name 02",1002,true],
            [3,3,true,false,0,0,"key-03",0,2,false,"key-03","name 03",2004,true],
            [4,4,true,false,0,0,"key-04",0,1,false,"key-04","name 04",1004,true],
            [5,5,true,false,0,0,"key-05",0,2,false,"key-05","name 05",2004,true],
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
