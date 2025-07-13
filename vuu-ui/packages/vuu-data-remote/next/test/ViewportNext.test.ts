import { describe, expect, it } from "vitest";
import {
  PendingRangeRequests,
  rangePosition,
  ViewportNext,
} from "../ViewportNext";
import { makeDataSourceRows, makeVuuRows, makeVuuSizeRow } from "./makeRows";
import { LoopingKeySet } from "./MockKeySet";
import { Range } from "@vuu-ui/vuu-utils";

function expectServerRequest(response: unknown, from: number, to: number) {
  expect(response).toEqual({
    type: "CHANGE_VP_RANGE",
    from,
    to,
    viewPortId: "",
  });
}

describe("rangePosition", () => {
  it("identifies before", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 0, to: 5 })).toEqual(
      "before",
    );
  });

  it("identifies adjoin-before", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 0, to: 10 })).toEqual(
      "adjoin-before",
    );
  });

  it("identifies overlap-before", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 5, to: 15 })).toEqual(
      "overlap-before",
    );
  });
  it("identifies match", () => {
    expect(rangePosition({ from: 0, to: 10 }, { from: 0, to: 10 })).toEqual(
      "match",
    );
  });
  it("identifies overlap-before", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 15, to: 25 })).toEqual(
      "overlap-after",
    );
  });
  it("identifies adjoin-before", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 20, to: 30 })).toEqual(
      "adjoin-after",
    );
  });
  it("identifies after", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 21, to: 30 })).toEqual(
      "after",
    );
  });
  it("identifies encloses-before", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 5, to: 20 })).toEqual(
      "encloses-before",
    );
  });
  it("identifies encloses", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 5, to: 30 })).toEqual(
      "encloses",
    );
  });
  it("identifies encloses-after", () => {
    expect(rangePosition({ from: 10, to: 20 }, { from: 10, to: 21 })).toEqual(
      "encloses-after",
    );
  });
});

describe("PendingRangeRequests", () => {
  it("is initially empty", () => {
    const rr = new PendingRangeRequests();
    expect(rr.length).toEqual(0);
  });

  it("stores first request unchanged", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 0, to: 20 });
    expect(rr.length).toEqual(1);
    expect(rr.ranges[0]).toEqual({ from: 0, to: 20 });
  });

  it("stores a discrete lower range before target", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 20, to: 30 });
    rr.add({ from: 5, to: 15 });
    expect(rr.length).toEqual(2);
    expect(rr.ranges).toEqual([
      { from: 5, to: 15 },
      { from: 20, to: 30 },
    ]);
  });

  it("stores a discrete higher range after target", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 20, to: 30 });
    rr.add({ from: 35, to: 45 });
    expect(rr.length).toEqual(2);
    expect(rr.ranges).toEqual([
      { from: 20, to: 30 },
      { from: 35, to: 45 },
    ]);
  });

  it("merges adjoining ranges, before", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 10, to: 20 });
    rr.add({ from: 0, to: 10 });
    expect(rr.ranges).toEqual([{ from: 0, to: 20 }]);
  });
  it("merges adjoining ranges, after", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 10, to: 20 });
    rr.add({ from: 20, to: 30 });
    expect(rr.ranges).toEqual([{ from: 10, to: 30 }]);
  });

  it("merges overlapping ranges, before", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 10, to: 20 });
    rr.add({ from: 5, to: 15 });
    expect(rr.ranges).toEqual([{ from: 5, to: 20 }]);
  });
  it("merges overlapping ranges, after", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 10, to: 20 });
    rr.add({ from: 15, to: 25 });
    expect(rr.ranges).toEqual([{ from: 10, to: 25 }]);
  });

  it("replaces enclosed range", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 10, to: 20 });
    rr.add({ from: 5, to: 25 });
    expect(rr.ranges).toEqual([{ from: 5, to: 25 }]);
  });

  it("ignores an enclosing range", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 10, to: 20 });
    rr.add({ from: 12, to: 18 });
    expect(rr.ranges).toEqual([{ from: 10, to: 20 }]);
  });

  it("removes range when completed", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 0, to: 20 });
    rr.remove({ from: 0, to: 20 });
    expect(rr.length).toEqual(0);
  });

  it("removes partially completed range", () => {
    const rr = new PendingRangeRequests();
    rr.add({ from: 0, to: 20 });
    rr.remove({ from: 0, to: 10 });
    expect(rr.ranges).toEqual([{ from: 10, to: 20 }]);
  });

  describe("has", () => {
    it("confirms when an exact range match is present", () => {
      const rr = new PendingRangeRequests();
      rr.add({ from: 0, to: 20 });
      expect(rr.has({ from: 0, to: 20 })).toEqual(true);
    });
    it("confirms when a tested range falls within a stored range", () => {
      const rr = new PendingRangeRequests();
      rr.add({ from: 0, to: 20 });
      expect(rr.has({ from: 0, to: 5 })).toEqual(true);
      expect(rr.has({ from: 6, to: 15 })).toEqual(true);
      expect(rr.has({ from: 10, to: 20 })).toEqual(true);
    });
    it("rejects a tested range that falls only partially within a stored range", () => {
      const rr = new PendingRangeRequests();
      rr.add({ from: 10, to: 20 });
      expect(rr.has({ from: 0, to: 11 })).toEqual(false);
      expect(rr.has({ from: 6, to: 25 })).toEqual(false);
    });
  });
});

describe("Viewport", () => {
  const keySet = new LoopingKeySet(10);

  describe("initial state", () => {
    it("initial status is empty", () => {
      const vp = new ViewportNext();
      expect(vp.cache.rows).toEqual([]);
    });
  });

  describe("with zero buffer", () => {
    describe("WHEN a range request is received", () => {
      it("THEN range requests are forwarded as-is to server", () => {
        const vp = new ViewportNext({ bufferSize: 0 });
        const [clientRows, response] = vp.setClientRange({ from: 0, to: 50 });
        expect(clientRows).toBeUndefined();
        expectServerRequest(response, 0, 50);
      });

      it("THEN duplicate range requests are ignored", () => {
        // TODO
      });

      it("THEN every new range requests is directed to server", () => {
        const vp = new ViewportNext({ bufferSize: 0 });
        let [clientRows, serverReq] = vp.setClientRange({ from: 0, to: 50 });
        expect(clientRows).toBeUndefined();
        expectServerRequest(serverReq, 0, 50);

        [clientRows, serverReq] = vp.setClientRange({ from: 10, to: 60 });
        expect(clientRows).toBeUndefined();
        expectServerRequest(serverReq, 10, 60);

        [clientRows, serverReq] = vp.setClientRange({ from: 20, to: 70 });
        expect(clientRows).toBeUndefined();
        expectServerRequest(serverReq, 20, 70);
      });
    });

    describe("WHEN data is received from the server", () => {
      describe("AND server response includes all rows for pending client request", () => {
        it("THEN data is returned to client", () => {
          const vp = new ViewportNext({ bufferSize: 0 });
          vp.setClientRange({ from: 0, to: 10 });
          const [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(0, 10));
          expect(clientRows).toEqual(makeDataSourceRows(0, 10));
        });
      });

      describe("AND rows in client range are spread across multiple server responses", () => {
        it("THEN data is returned to client only when all rows are available", () => {
          const vp = new ViewportNext({ bufferSize: 0 });
          vp.setClientRange({ from: 0, to: 10 });
          let [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(0, 5));
          expect(clientRows).toBeUndefined();
          expect(vp.cache.rows).toEqual(makeVuuRows(0, 5));

          [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(5, 10));
          expect(clientRows).toEqual(makeDataSourceRows(0, 10));
        });
      });
    });

    describe("WHEN data received from the server is out of range", () => {
      it("THEN it is ignored", () => {
        const vp = new ViewportNext({ bufferSize: 0 });
        vp.setClientRange({ from: 0, to: 10 });
        const [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(10, 20));
        expect(clientRows).toBeUndefined();
      });
    });

    describe("WHEN clientRange has been updated by time data received from the server", () => {
      it("THEN it is ignored", () => {
        const vp = new ViewportNext({ bufferSize: 0 });
        vp.setClientRange({ from: 0, to: 10 });
        vp.setClientRange({ from: 10, to: 20 });
        const [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(0, 10));
        expect(clientRows).toBeUndefined();
      });

      describe("WHEN correct data is then received", () => {
        it("THEN data is sent to client", () => {
          const vp = new ViewportNext({ bufferSize: 0 });
          vp.setClientRange({ from: 0, to: 10 });
          vp.setClientRange({ from: 10, to: 20 });
          vp.receiveRowsFromServer(makeVuuRows(0, 10));

          const [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(10, 20));
          expect(clientRows).toEqual(makeDataSourceRows(10, 20, keySet));
        });
      });
    });

    describe("WHEN 2 overlapping requests are received in quick succession", () => {
      it("THEN requests are forwarded to server", () => {
        const vp = new ViewportNext({ bufferSize: 0 });
        const [, response1] = vp.setClientRange({ from: 0, to: 10 });
        const [, response2] = vp.setClientRange({ from: 5, to: 15 });
        expectServerRequest(response1, 0, 10);
        expectServerRequest(response2, 5, 15);
      });

      describe("WHEN server responds with 1) full and 2) partial responses", () => {
        it("THEN out-of-range rows are ignored and in-range rows returned to client", () => {
          const vp = new ViewportNext({ bufferSize: 0 });
          vp.setClientRange({ from: 0, to: 10 });
          vp.setClientRange({ from: 5, to: 15 });
          let [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(0, 10));
          expect(clientRows).toBeUndefined();
          [, clientRows] = vp.receiveRowsFromServer(makeVuuRows(10, 15));
          expect(clientRows).toEqual(makeDataSourceRows(5, 15, keySet));
        });
      });
    });
  });

  describe("with buffer", () => {
    describe("WHEN a range request is received, starting zero", () => {
      it("THEN range is expanded forward", () => {
        const vp = new ViewportNext({ bufferSize: 10 });
        const [, response] = vp.setClientRange({ from: 0, to: 10 });
        expectServerRequest(response, 0, 20);
      });
      describe("WHEN data is then received for the full range", () => {
        it("THEN cache is filled and data sent to client", () => {
          const vp = new ViewportNext({ bufferSize: 10 });
          vp.setClientRange({ from: 0, to: 10 });
          const rows = makeVuuRows(0, 20);
          const [, clientRows] = vp.receiveRowsFromServer(rows);
          expect(clientRows).toEqual(makeDataSourceRows(0, 10));
          expect(vp.cache.rows).toEqual(rows);
        });
      });
      describe("AND WHEN a subsequent client request that falls within the cache is received", () => {
        it("THEN response is filled from cache", () => {
          const vp = new ViewportNext({ bufferSize: 10 });
          vp.setClientRange({ from: 0, to: 10 });
          const [, clientRows1] = vp.receiveRowsFromServer(makeVuuRows(0, 20));
          expect(clientRows1).toEqual(makeDataSourceRows(0, 10));
          const [client, server] = vp.setClientRange({ from: 5, to: 15 });
          // no server request
          expect(server).toBeUndefined();
          expect(client).toEqual(makeDataSourceRows(10, 15, keySet));
        });
      });
      describe("WHEN client request moves beyond cache", () => {
        it("THEN new server request is created", () => {
          const vp = new ViewportNext({ bufferSize: 10 });
          vp.setClientRange({ from: 0, to: 10 });
          let server;
          let [, client] = vp.receiveRowsFromServer(makeVuuRows(0, 20));
          expect(client).toEqual(makeDataSourceRows(0, 10));
          [client, server] = vp.setClientRange({ from: 5, to: 15 });
          expect(server).toBeUndefined();
          expect(client).toEqual(makeDataSourceRows(10, 15, keySet));
          [client, server] = vp.setClientRange({ from: 15, to: 25 });
          expect(client).toBeUndefined();
          expectServerRequest(server, 5, 35);
          expect(vp.cache.rows).toEqual(makeVuuRows(5, 20));
        });

        describe("WHEN further client requests arrive before server response", () => {
          describe("AND client requests are within buffered range request", () => {
            it("THEN no additional server requests are made, when server response arrives, data is sent to client", () => {
              const vp = new ViewportNext({ bufferSize: 10 });
              vp.setClientRange({ from: 0, to: 10 });
              vp.receiveRowsFromServer(makeVuuRows(0, 20));
              vp.setClientRange({ from: 5, to: 15 });
              vp.setClientRange({ from: 15, to: 25 }); // ==> (5:35)
              // not in cache (0:20) but covered by the pending request for (5:35)
              let [client, server] = vp.setClientRange({ from: 18, to: 28 });
              expect(client).toBeUndefined();
              expect(server).toBeUndefined();
              // not in cache but covered by the pending request for (5:35)
              [client, server] = vp.setClientRange({ from: 20, to: 30 });
              expect(client).toBeUndefined();
              expect(server).toBeUndefined();
              // here comes the data we've been waiting for
              const [, clientRows] = vp.receiveRowsFromServer(
                makeVuuRows(20, 35),
              );
              expect(clientRows).toEqual(makeDataSourceRows(20, 30, keySet));
            });
          });

          describe("WHEN further client requests arrive before server response", () => {
            describe("AND final client request is partially outside cached rows.", () => {
              it("THEN no additional server requests are made, when server response arrives, data is sent to client", () => {
                const vp = new ViewportNext({ bufferSize: 10 });
                // initial client range request (0:10), cache is empty so we will make a request to server for client range plus buffer (0:20)
                let [client, server] = vp.setClientRange({ from: 0, to: 10 });
                expect(client).toBeUndefined();
                expectServerRequest(server, 0, 20);

                // receive initial set of rows from server ...
                [, client] = vp.receiveRowsFromServer(makeVuuRows(0, 20));
                // ... cache now contains [0...19]
                expect(client).toEqual(makeDataSourceRows(0, 10));

                // client scrolls steadily, until we reach just beyond the cache limits . Each request is fulfulled from cache
                // until the last one, which we can't fill in full so we don't fill at all
                [client, server] = vp.setClientRange({ from: 3, to: 13 });
                expect(client).toEqual(makeDataSourceRows(10, 13, keySet));
                expect(server).toBeUndefined();

                [client, server] = vp.setClientRange({ from: 5, to: 15 });
                expect(client).toEqual(makeDataSourceRows(13, 15, keySet));
                expect(server).toBeUndefined();

                [client, server] = vp.setClientRange({ from: 8, to: 18 });
                expect(client).toEqual(makeDataSourceRows(15, 18, keySet));
                expect(server).toBeUndefined();

                // now we go beyond cache limit, we send new server request
                [client, server] = vp.setClientRange({ from: 12, to: 22 });
                expect(client).toBeUndefined();
                expectServerRequest(server, 2, 32);

                // when we get the server response, we will fulfill the outstanding client request
                [, client] = vp.receiveRowsFromServer(makeVuuRows(20, 32));
                expect(client).toEqual(makeDataSourceRows(18, 22, keySet));
              });
            });
          });

          describe("AND client requests go beyond  buffered range request", () => {
            it("THEN an additional server request is issued, when server response arrives, data is sent to client", () => {
              const vp = new ViewportNext({ bufferSize: 10 });
              // initial client range request (0:10)
              vp.setClientRange({ from: 0, to: 10 });

              // server sends 20 rows requested (client range plus buffer), cache now holds [0...19]
              vp.receiveRowsFromServer(makeVuuRows(0, 20));

              // client scrolls to (5,15), all rows are available in cache
              let [client, server] = vp.setClientRange({ from: 5, to: 15 });
              // .. return the rows not already provided in earlier call
              expect(client).toEqual(makeDataSourceRows(10, 15, keySet));

              // client scrolls to (15,25), first 5 rows only in cache (already sent to client), request new range from server and wait
              [client, server] = vp.setClientRange({ from: 15, to: 25 }); // ==> (5:35)
              expect(client).toBeUndefined();
              expectServerRequest(server, 5, 35);

              // client continues scrolling, but new range can be fulfilled when in-flight server request completes, so no need for further request
              [client, server] = vp.setClientRange({ from: 18, to: 28 });
              expect(client).toBeUndefined();
              expect(server).toBeUndefined();

              // client continues scrolling, now beyond the pending range of rows already requested from server, new server request required
              [client, server] = vp.setClientRange({ from: 20, to: 40 }); // ==> (10:50)
              expect(client).toBeUndefined();
              expectServerRequest(server, 10, 50);

              // We now have 2 server requests in flight, here they come ...

              // this request has been superceded, it doesn't provide enough rows to fulfill current client range.
              // It should probably be ignored completely, but is currently being processed
              const [, clientRows1] = vp.receiveRowsFromServer(
                makeVuuRows(20, 35),
              );
              expect(clientRows1).toBeUndefined();

              // Now we get the second request, we have all the data to fulfill out current client range
              const [, clientRows2] = vp.receiveRowsFromServer(
                makeVuuRows(35, 40),
              );
              expect(clientRows2).toEqual(
                makeDataSourceRows(20, 40, new LoopingKeySet(20)),
              );

              // The final server rows,
              const [, noRows] = vp.receiveRowsFromServer(makeVuuRows(40, 50));
              expect(noRows).toBeUndefined();
              expect(vp.cache.rows).toEqual(makeVuuRows(10, 50));
            });
          });

          describe("AND client requests go beyond buffered range request", () => {
            it("THEN an additional server request is , when server response arrives, data is sent to client", () => {
              const vp = new ViewportNext({ bufferSize: 10 });
              vp.setClientRange({ from: 0, to: 10 }); // ==> (0:20)
              vp.receiveRowsFromServer(makeVuuRows(0, 20));
              // client range request, all rows are already in cache
              vp.setClientRange({ from: 5, to: 15 });

              // new client range request, not all rows in cache, server request will be issued
              vp.setClientRange({ from: 15, to: 25 }); // ==> (5:35)
              // not in cache (0:20) but covered by the pending request for (5:35)
              let [client, server] = vp.setClientRange({ from: 18, to: 28 });
              expect(client).toBeUndefined();
              expect(server).toBeUndefined();
              // not in cache but covered by the pending request for (5:35)
              [client, server] = vp.setClientRange({ from: 20, to: 40 }); // ==> (10:50)
              expect(client).toBeUndefined();
              expectServerRequest(server, 10, 50);
              // here comes the data we've been waiting for
              const [, clientRows1] = vp.receiveRowsFromServer(
                makeVuuRows(20, 35),
              );
              const [, clientRows2] = vp.receiveRowsFromServer(
                makeVuuRows(35, 40),
              );
              expect(clientRows1).toBeUndefined();
              expect(clientRows2).toEqual(
                makeDataSourceRows(20, 40, new LoopingKeySet(20)),
              );
            });
          });
        });
      });
    });
  });

  describe("WHEN a table is loading", () => {
    it("THEN SIZE only messages will be processed", () => {
      const vp = new ViewportNext({ bufferSize: 10 });
      vp.subscribe({ range: Range(0, 0) });
      const [size, clientRows] = vp.receiveRowsFromServer([makeVuuSizeRow(1)]);
      expect(size).toEqual(1);
      expect(clientRows).toBeUndefined();
    });
    it("THEN all SIZE only messages will be processed", () => {
      const vp = new ViewportNext({ bufferSize: 10 });
      vp.subscribe({ range: Range(0, 0) });
      const sizeValues: (number | undefined)[] = [];
      for (let i = 1; i < 101; i++) {
        const [size] = vp.receiveRowsFromServer([makeVuuSizeRow(i)]);
        sizeValues.push(size);
      }
      expect(sizeValues.length).toEqual(100);
      expect(sizeValues.every((val) => typeof val === "number")).toEqual(true);
    });
  });
});
