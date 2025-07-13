import { describe, expect, it } from "vitest";
import { NullRange, ViewportCache } from "../ViewportCache";
import { makeVuuRows, RowBuilder } from "./makeRows";
import { Clock } from "@vuu-ui/vuu-utils";

describe("ViewportCache", () => {
  describe("with ZERO bufferSize", () => {
    it("starts empty", () => {
      const cache = new ViewportCache();
      expect(cache.clientRange).toBe(NullRange);
      expect(cache.range).toBe(NullRange);
      expect(cache.status).toBe("empty");
      expect(cache.rows.length).toBe(0);
      expect(cache.clientRangeCount).toBe(0);
    });
    it("clientRange is stored correctly", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      expect(cache.clientRange).toEqual(range);
      expect(cache.range).toEqual(range);
      expect(cache.status).toBe("empty");
      expect(cache.rows.length).toBe(0);
      expect(cache.hasAllRows(range)).toEqual(false);
      expect(cache.clientRangeCount).toBe(0);
    });

    it("adding rows for full range to an empty cache changes status to full", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 10));
      expect(cache.hasAllRows(range)).toEqual(true);
      expect(cache.rows.length).toBe(10);
      expect(cache.clientRangeCount).toBe(10);
      expect(cache.status).toEqual("full");
    });

    it("adding rows for subset of range to an empty cache changes status to partially-filled", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 5));
      expect(cache.hasAllRows(range)).toEqual(false);
      expect(cache.rows.length).toBe(5);
      expect(cache.clientRangeCount).toBe(5);
      expect(cache.status).toEqual("partially-filled");
    });
    it("adding remaining rows needed to fill range changes status to filled", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 5));
      cache.addRows(makeVuuRows(5, 10));
      expect(cache.hasAllRows(range)).toEqual(true);
      expect(cache.rows.length).toBe(10);
      expect(cache.clientRangeCount).toBe(10);
      expect(cache.status).toEqual("full");
    });
    it("a partial range move partially empties cache", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 10));
      const newRange = { from: 2, to: 12 };
      cache.clientRange = newRange;
      expect(cache.hasAllRows(newRange)).toEqual(false);
      expect(cache.rows.length).toBe(8);
      expect(cache.clientRangeCount).toBe(8);
      expect(cache.status).toEqual("partially-filled");
    });

    it("when cache is overfilled, surplus rows are ignored", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 10));
      const newRange = { from: 2, to: 12 };
      cache.clientRange = newRange;
      cache.addRows(makeVuuRows(10, 20));
      expect(cache.hasAllRows(newRange)).toEqual(true);
      expect(cache.rows.length).toBe(10);
      expect(cache.clientRangeCount).toBe(10);
      expect(cache.status).toEqual("full");
    });

    it("a non-overlapping range move empties cache", () => {
      const cache = new ViewportCache();
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 10));
      const newRange = { from: 20, to: 30 };
      cache.clientRange = newRange;
      expect(cache.hasAllRows(newRange)).toEqual(false);
      expect(cache.rows.length).toBe(0);
      expect(cache.clientRangeCount).toBe(0);
      expect(cache.status).toEqual("empty");
    });
  });
  describe("with bufferSize 10", () => {
    it("starts empty", () => {
      const cache = new ViewportCache(10);
      expect(cache.clientRange).toBe(NullRange);
      expect(cache.range).toEqual({ from: 0, to: 9 });
      expect(cache.status).toBe("empty");
      expect(cache.rows.length).toBe(0);
      expect(cache.clientRangeCount).toBe(0);
    });
    it("clientRange is stored correctly", () => {
      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      expect(cache.clientRange).toEqual(range);
      expect(cache.range).toEqual({ from: 0, to: 20 });
      expect(cache.status).toBe("empty");
      expect(cache.rows.length).toBe(0);
      expect(cache.hasAllRows(range)).toEqual(false);
      expect(cache.clientRangeCount).toBe(0);
    });

    it("adding rows for full range to an empty cache changes status to full", () => {
      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 10));
      expect(cache.hasAllRows(range)).toEqual(true);
      expect(cache.rows.length).toBe(10);
      expect(cache.clientRangeCount).toBe(10);
      expect(cache.status).toEqual("full");
    });

    it("adding rows for subset of range to an empty cache changes status to partially-filled", () => {
      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 5));
      expect(cache.hasAllRows(range)).toEqual(false);
      expect(cache.rows.length).toBe(5);
      expect(cache.clientRangeCount).toBe(5);
      expect(cache.status).toEqual("partially-filled");
    });
    it("adding remaining rows needed to fill range changes status to filled", () => {
      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 5));
      cache.addRows(makeVuuRows(5, 10));
      expect(cache.hasAllRows(range)).toEqual(true);
      expect(cache.rows.length).toBe(10);
      expect(cache.clientRangeCount).toBe(10);
      expect(cache.status).toEqual("full");
    });
    it("a partial range move partially empties cache, if buffer is not yet filled", () => {
      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 10));
      const newRange = { from: 2, to: 12 };
      cache.clientRange = newRange;
      expect(cache.hasAllRows(newRange)).toEqual(false);
      expect(cache.rows.length).toBe(10);
      expect(cache.clientRangeCount).toBe(8);
      expect(cache.status).toEqual("partially-filled");
    });

    it("cache is still full after a partial range move if buffer covers new range and has been filled", () => {
      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(makeVuuRows(0, 20));
      const newRange = { from: 2, to: 12 };
      cache.clientRange = newRange;
      expect(cache.hasAllRows(newRange)).toEqual(true);
      expect(cache.rows.length).toBe(20);
      expect(cache.clientRangeCount).toBe(10);
      expect(cache.status).toEqual("full");
    });
  });

  describe("inserted rows", () => {
    it("flags a new row correctly", () => {
      let rowBuilder = new RowBuilder(
        new Clock({ year: 2025, month: 4, day: 15, hours: 9 }),
      );

      const cache = new ViewportCache(10);
      const range = { from: 0, to: 10 };
      cache.clientRange = range;
      cache.addRows(
        rowBuilder.makeVuuRows(0, 20, [{ column: "created", sortType: "D" }]),
      );
      // console.table(cache.rows);

      rowBuilder = new RowBuilder(
        new Clock({ year: 2025, month: 4, day: 15, hours: 9 }),
      );

      cache.addRows(
        rowBuilder.makeVuuRows(0, 30, [{ column: "created", sortType: "D" }]),
      );
      // console.table(cache.rows);
    });
  });
});
