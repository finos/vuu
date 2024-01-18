import { describe, expect, it } from "vitest";
import { getFullRange, rangeNewItems } from "../src/range-utils";

describe("range-utils", () => {
  describe("rangeNewItems", () => {
    it("returns new range when ranges do not overlap", () => {
      // prettier-ignore
      expect(
          rangeNewItems({from: 0, to: 10},{from: 20, to: 30})
      ).toEqual({from: 20, to: 30});
      // prettier-ignore
      expect(
          rangeNewItems({from: 0, to: 10},{from: 10, to: 20})
      ).toEqual({from: 10, to: 20});
      // prettier-ignore
      expect(
          rangeNewItems({from: 20, to: 30},{from: 0, to: 10})
      ).toEqual({from: 0, to: 10});
      // prettier-ignore
      expect(
          rangeNewItems({from: 20, to: 30},{from: 10, to: 20})
      ).toEqual({from: 10, to: 20});
    });
    it("returns items when new range overlaps end of existing range", () => {
      // prettier-ignore
      expect(
          rangeNewItems({from: 0, to: 10},{from: 1, to: 11})
      ).toEqual({from: 10, to: 11});
      // prettier-ignore
      expect(
          rangeNewItems({from: 0, to: 10},{from: 3, to: 13})
      ).toEqual({from: 10, to: 13});
    });
    it("returns items when new range overlaps start of existing range", () => {
      // prettier-ignore
      expect(
          rangeNewItems({from: 10, to: 20},{from: 2, to: 12})
      ).toEqual({from: 2, to: 10});
      // prettier-ignore
      expect(
          rangeNewItems({from: 5, to: 15},{from: 0, to: 10})
      ).toEqual({from: 0, to: 5});
    });
    it("returns items when new range extends existing range", () => {
      // prettier-ignore
      expect(
          rangeNewItems({from: 0, to: 10},{from: 0, to: 12})
      ).toEqual({from: 10, to: 12});
      // prettier-ignore
      expect(
          rangeNewItems({from: 0, to: 10},{from: 0, to: 20})
      ).toEqual({from: 10, to: 20});
      // prettier-ignore
      expect(
          rangeNewItems({from: 5, to: 15},{from: 0, to: 15})
      ).toEqual({from: 0, to: 5});
    });
    it("returns new range when original range is subset", () => {
      // prettier-ignore
      expect(
          rangeNewItems({from: 5, to: 15},{from: 0, to: 20})
      ).toEqual({from: 0, to: 20});
      // prettier-ignore
    });
  });

  describe("getFullRange", () => {
    describe("WHEN passed the null range", () => {
      it("THEN it returns a null range", () => {
        expect(getFullRange({ from: 0, to: 0 })).toEqual({ from: 0, to: 0 });
      });
    });
    describe("WHEN a buffersize is provided", () => {
      describe("WHEN range starts from 0", () => {
        it("THEN buffer is applied to range end", () => {
          expect(getFullRange({ from: 0, to: 30 }, 10)).toEqual({
            from: 0,
            to: 40,
          });
        });
      });
      describe("WHEN range starts from a value less than bufferSize", () => {
        it("THEN  range start will be 0", () => {
          expect(getFullRange({ from: 5, to: 35 }, 10)).toEqual({
            from: 0,
            to: 45,
          });
        });
      });
      describe("WHEN away from start end of range", () => {
        it("THEN  bufferSize will be applied to each end of range", () => {
          expect(getFullRange({ from: 20, to: 50 }, 10)).toEqual({
            from: 10,
            to: 60,
          });
        });
      });
      describe("WHEN close to end of dataset", () => {
        it("THEN range will be clipped to dataset size", () => {
          expect(getFullRange({ from: 65, to: 95 }, 10, 100)).toEqual({
            from: 55,
            to: 100,
          });
          expect(getFullRange({ from: 70, to: 100 }, 10, 100)).toEqual({
            from: 60,
            to: 100,
          });
        });
      });
      describe("WHEN range spans full rowcount", () => {
        it("THEN bufferSize is irrelevant", () => {
          expect(getFullRange({ from: 0, to: 8 }, 10, 8)).toEqual({
            from: 0,
            to: 8,
          });
        });
      });
    });
  });
});
