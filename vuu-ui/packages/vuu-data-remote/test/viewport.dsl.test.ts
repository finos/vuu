import "./global-mocks";
import { describe, expect, it } from "vitest";
import {
  changeRangeBody,
  createVpBody,
  rows,
  size,
  subscribedMessage,
  viewportHarness,
} from "./server-proxy-dsl";

describe("Viewport", () => {
  describe("constructor", () => {
    it("initial status is empty", () => {
      expect(viewportHarness().status).toEqual("");
    });
  });

  describe("subscribe", () => {
    it("uses constructor params to construct subscribe message", () => {
      // default bufferSize is 50
      const v = viewportHarness({ range: [0, 0] });
      expect(v.subscribe()).toEqual(createVpBody({ range: [0, 0] }));
    });

    it("sets status to subscribing", () => {
      const v = viewportHarness();
      v.subscribe();
      expect(v.status).toEqual("subscribing");
    });

    it("uses bufferSize when constructing range", () => {
      const v = viewportHarness({ bufferSize: 100, range: [0, 0] });
      expect(v.subscribe()).toEqual(createVpBody({ range: [0, 0] }));
    });

    it("applies bufferSize to existing range", () => {
      const v = viewportHarness({ bufferSize: 100, range: [0, 100] });
      expect(v.subscribe()).toEqual(createVpBody({ range: [0, 200] }));
    });

    it("splits bufferSize around existing range", () => {
      const v = viewportHarness({ bufferSize: 100, range: [100, 200] });
      expect(v.subscribe()).toEqual(createVpBody({ range: [0, 300] }));
    });
  });

  describe("subscribed", () => {
    it("sets status to subscribed", () => {
      const v = viewportHarness();
      v.subscribed({ ackRange: [0, 50] });
      expect(v.status).toEqual("subscribed");
    });

    it("echos back subscription details, enriching values sent by server", () => {
      const v = viewportHarness();
      expect(v.subscribed({ ackRange: [0, 50] })).toEqual(
        subscribedMessage({ range: [0, 50] }),
      );
    });
  });

  describe("pending range requests", () => {
    it("holds requests in pending queue, marking them when acked, until first rows received", () => {
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed();
      v.receives(size(), rows(0, 20));

      v.setRange(50, 60);
      expect(v.state().pendingRanges).toEqual([
        { from: 40, to: 70, acked: undefined },
      ]);

      v.acksRange(50, 60);
      expect(v.state().pendingRanges).toEqual([
        { from: 40, to: 70, acked: true },
      ]);

      v.receives(rows(50, 60));
      expect(v.state().pendingRanges).toEqual([]);
    });
  });

  describe("maxRangeEnd", () => {
    it("caps CHANGE_VP_RANGE to maxRangeEnd from tableSchema", () => {
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed({ ackRange: [0, 20], maxRangeEnd: 60 });

      expect(v.setRange(55, 65).serverRequest).toEqual(changeRangeBody(45, 60));
    });

    it("applies maxRangeEnd even when rowCount is not yet known", () => {
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed({ ackRange: [0, 20], maxRangeEnd: 80 });

      expect(v.setRange(75, 85).serverRequest).toEqual(changeRangeBody(65, 80));
    });
  });

  describe("rangeRequestAlreadyPending", () => {
    it("tests range requests against last pending server request", () => {
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed();
      v.receives(size(), rows(0, 20));
      // bufferSize 10 expands 50..60 to 40..70
      v.setRange(50, 60);

      expect(
        v.alreadyPending(
          [0, 10],
          [0, 50],
          [50, 60],
          [52, 62],
          [52, 63],
          [60, 70],
        ),
      ).toEqual({
        "0:10": false,
        "0:50": false,
        "50:60": true,
        "52:62": true,
        "52:63": true,
        "60:70": false,
      });
    });

    it("tests range requests against multiple pending server requests", () => {
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed();
      v.receives(size(), rows(0, 20));
      v.setRange(50, 60);
      v.acksRange(50, 60);
      v.setRange(60, 70);
      v.acksRange(60, 70);

      expect(
        v.alreadyPending(
          [50, 60],
          [52, 62],
          [52, 63],
          [50, 70],
          [50, 72],
          [50, 73],
          [70, 80],
        ),
      ).toEqual({
        "50:60": true,
        "52:62": true,
        "52:63": true,
        "50:70": true,
        "50:72": true,
        "50:73": true,
        "70:80": false,
      });
    });
  });

  describe("groupBy", () => {
    it("clears dataWindow when a config request with groupBy is received on a non grouped viewport", () => {
      const v = viewportHarness({ bufferSize: 10 });
      v.subscribed();
      v.receives(size(), rows(0, 20));

      v.config({ groupBy: ["col-4"] });

      expect(v.state()).toMatchObject({ rowCount: 0, cachedRowCount: 0 });
    });
  });
});
