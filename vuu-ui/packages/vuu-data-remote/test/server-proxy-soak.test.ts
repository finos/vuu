import "./global-mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_setRequestId } from "../src/server-proxy/server-proxy";
import {
  COMMON_ATTRS,
  COMMON_TABLE_ROW_ATTRS,
  createFixtures,
  createTableRows,
  sizeRow,
  TABLE_ROW,
} from "./test-utils";

describe("Soak testing - drip feed records to the UI, each size ", () => {
  beforeEach(() => {
    TEST_setRequestId(1);
  });

  it(`
      1) sends zero count to client when table is initially empty
      2) sends each rowcount and row when rows arrive individually, 
          sending a) SIZE record b) data record each time new row added  
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

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => {
      const rowIdx = i - 1;
      const strIdx = `${rowIdx}`.padStart(2, "0");
      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            sizeRow("server-vp-1", i),
            ...createTableRows("server-vp-1", rowIdx, i, i),
          ],
        },
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [rowIdx,rowIdx,true,false,0,0,`key-${strIdx}`,0,1, false, `key-${strIdx}`, `name ${strIdx}`,1000 + rowIdx,true],
        ],
        size: i,
      });
    });
  });
  it(`
      1) sends zero count to client when table is initially empty
      2) sends each rowcount and row when rows arrive individually, 
          sending  a) data record b) SIZE record each time new row added  
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

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach((i) => {
      const rowIdx = i - 1;
      const strIdx = `${rowIdx}`.padStart(2, "0");
      postMessageToClient.mockClear();
      serverProxy.handleMessageFromServer({
        ...COMMON_ATTRS,
        body: {
          ...COMMON_TABLE_ROW_ATTRS,
          rows: [
            ...createTableRows("server-vp-1", rowIdx, i, i),
            sizeRow("server-vp-1", i),
          ],
        },
      });
      // prettier-ignore
      expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [rowIdx,rowIdx,true,false,0,0,`key-${strIdx}`,0,1, false, `key-${strIdx}`, `name ${strIdx}`,1000 + rowIdx,true],
        ],
        size: i,
      });
    });
  });

  it(`
    1) sends size and data rows to client until full client range is satisfied, 
      multiple size rows arrive ahead of data rows `, async () => {
    const [serverProxy, postMessageToClient] = await createFixtures({
      bufferSize: 10,
    });

    postMessageToClient.mockClear();

    serverProxy.handleMessageFromServer(TABLE_ROW([sizeRow("server-vp-1", 0)]));

    postMessageToClient.mockClear();
    serverProxy.handleMessageFromServer(
      TABLE_ROW([
        ...createTableRows("server-vp-1", 0, 1, 1),
        sizeRow("server-vp-1", 1),
      ]),
    );
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

    // Receive two successive size rows, ahead of data rows
    serverProxy.handleMessageFromServer(
      TABLE_ROW([sizeRow("server-vp-1", 2), sizeRow("server-vp-1", 3)]),
    );

    expect(postMessageToClient).toHaveBeenCalledWith({
      mode: "size-only",
      type: "viewport-update",
      clientViewportId: "client-vp-1",
      size: 3,
    });

    postMessageToClient.mockClear();
    serverProxy.handleMessageFromServer(
      TABLE_ROW([...createTableRows("server-vp-1", 1, 2, 3)]),
    );
    // prettier-ignore
    expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [1,1,true,false,0,0,'key-01',0,1, false, 'key-01', 'name 01',1001,true],
        ],
      });

    postMessageToClient.mockClear();
    serverProxy.handleMessageFromServer(
      TABLE_ROW([...createTableRows("server-vp-1", 2, 3, 3)]),
    );
    // prettier-ignore
    expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [2,2,true,false,0,0,'key-02',0,1, false, 'key-02', 'name 02',1002,true],
        ],
      });
  });

  it(`1) sends size rows beyond client range, then data rows one at a time`, async () => {
    const [serverProxy, postMessageToClient] = await createFixtures({
      bufferSize: 10,
    });

    postMessageToClient.mockClear();

    // Time will stand still for the duration of this next piece, so we won't trigger the size update throttling
    vi.useFakeTimers();

    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((i) => {
      serverProxy.handleMessageFromServer(
        TABLE_ROW([sizeRow("server-vp-1", i)]),
      );
    });
    expect(postMessageToClient).toHaveBeenCalledTimes(12);

    vi.clearAllTimers();

    postMessageToClient.mockClear();
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].forEach((i) => {
      serverProxy.handleMessageFromServer(
        TABLE_ROW(createTableRows("server-vp-1", i - 1, i, 12)),
      );
    });
    expect(postMessageToClient).toHaveBeenCalledTimes(10);
  });

  it(`1) sends size rows beyond client range, then data rows in two batches`, async () => {
    const [serverProxy, postMessageToClient] = await createFixtures({
      bufferSize: 10,
    });

    postMessageToClient.mockClear();

    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((i) => {
      serverProxy.handleMessageFromServer(
        TABLE_ROW([sizeRow("server-vp-1", i)]),
      );
    });

    postMessageToClient.mockClear();
    serverProxy.handleMessageFromServer(
      TABLE_ROW(createTableRows("server-vp-1", 0, 5, 12)),
    );
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
        ],
    });

    postMessageToClient.mockClear();
    serverProxy.handleMessageFromServer(
      TABLE_ROW(createTableRows("server-vp-1", 5, 12, 12)),
    );
    expect(postMessageToClient).toHaveBeenCalledTimes(1);
    // prettier-ignore
    expect(postMessageToClient).toHaveBeenCalledWith({
        mode: "update",
        type: "viewport-update",
        clientViewportId: "client-vp-1",
        rows: [
          [5,5,true,false,0,0,"key-05",0,1,false,"key-05","name 05",1005,true],
          [6,6,true,false,0,0,"key-06",0,1,false,"key-06","name 06",1006,true],
          [7,7,true,false,0,0,"key-07",0,1,false,"key-07","name 07",1007,true],
          [8,8,true,false,0,0,"key-08",0,1,false,"key-08","name 08",1008,true],
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true],
        ],
    });
  });
  it(`1) sends size rows beyond client range, then data rows in a single batch`, async () => {
    const [serverProxy, postMessageToClient] = await createFixtures({
      bufferSize: 10,
    });

    postMessageToClient.mockClear();

    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].forEach((i) => {
      serverProxy.handleMessageFromServer(
        TABLE_ROW([sizeRow("server-vp-1", i)]),
      );
    });

    postMessageToClient.mockClear();
    serverProxy.handleMessageFromServer(
      TABLE_ROW(createTableRows("server-vp-1", 0, 12, 12)),
    );
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
          [9,9,true,false,0,0,"key-09",0,1,false,"key-09","name 09",1009,true],
        ],
    });
  });
  it("throttles size only updates, after three messages, 100ms delay kicks in", async () => {
    const [serverProxy, postMessageToClient] = await createFixtures({
      bufferSize: 10,
    });

    postMessageToClient.mockClear();

    vi.useFakeTimers();
    vi.setSystemTime("2025-01-01T09:00:00.000Z");
    [
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
    ].forEach((i) => {
      vi.advanceTimersByTime(1);
      serverProxy.handleMessageFromServer(
        TABLE_ROW([sizeRow("server-vp-1", i)]),
      );
    });
    expect(postMessageToClient).toHaveBeenCalledTimes(3);

    postMessageToClient.mockClear();
    vi.advanceTimersByTime(100);
    expect(postMessageToClient).toHaveBeenCalledTimes(1);
    expect(postMessageToClient).toHaveBeenCalledWith({
      clientViewportId: "client-vp-1",
      mode: "size-only",
      size: 20,
      type: "viewport-update",
    });

    vi.clearAllTimers();
  });
});
