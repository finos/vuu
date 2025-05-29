import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { describe, expect, it } from "vitest";
import { actualRowPositioning, virtualRowPositioning } from "../src/row-utils";

const dataRow = (rowIdx: number): DataSourceRow => [
  rowIdx,
  0,
  true,
  false,
  0,
  0,
  "",
  0,
];

describe("actualRowPositioning", () => {
  describe("calculate row offset", () => {
    it("calculates row offset", () => {
      const [rowOffset] = actualRowPositioning(20);
      expect(rowOffset(dataRow(0))).toEqual(0);
      expect(rowOffset(dataRow(5))).toEqual(100);
    });
  });

  describe("calculate row at position", () => {
    it("calculate the index of row at given position", () => {
      const [, rowPosition] = actualRowPositioning(20);
      expect(rowPosition(0)).toEqual(0);
      expect(rowPosition(100)).toEqual(5);
    });
  });
});

describe("virtualRowPositioning", () => {
  describe("calculate row offset", () => {
    it("behaves like actualRowPositioning when no virtualizedSpace exists", () => {
      const [rowOffset] = virtualRowPositioning(20, 0, { current: 0 });
      expect(rowOffset(dataRow(0))).toEqual(0);
      expect(rowOffset(dataRow(5))).toEqual(100);
    });

    it("applies zero offset when scroll position is zero", () => {
      const [rowOffset] = virtualRowPositioning(20, 100, { current: 0 });
      expect(rowOffset(dataRow(0))).toEqual(0);
      expect(rowOffset(dataRow(5))).toEqual(100);
    });

    it("applies half the offset when scroll position is 50%", () => {
      const [rowOffset] = virtualRowPositioning(20, 100, { current: 0.5 });
      expect(rowOffset(dataRow(0))).toEqual(-50);
      expect(rowOffset(dataRow(5))).toEqual(50);
    });

    it("applies maximum offset when scroll position is 100%", () => {
      const [rowOffset] = virtualRowPositioning(20, 100, { current: 1 });
      expect(rowOffset(dataRow(0))).toEqual(-100);
      expect(rowOffset(dataRow(5))).toEqual(0);
    });
  });

  describe("calculate row at position", () => {
    it("behaves like actualRowPositioning when no virtualizedSpace exists", () => {
      const [, rowPosition] = virtualRowPositioning(20, 0, { current: 0 });
      expect(rowPosition(0)).toEqual(0);
      expect(rowPosition(100)).toEqual(5);
    });

    it("applies a zero offset adjustment when scroll position is zero", () => {
      const [, rowPosition] = virtualRowPositioning(20, 100, { current: 0 });
      expect(rowPosition(0)).toEqual(0);
      expect(rowPosition(100)).toEqual(5);
    });

    it("applies an adjustment of half the offset when scroll position is 50%", () => {
      const [, rowPosition] = virtualRowPositioning(20, 100, { current: 0.5 });
      expect(rowPosition(-50)).toEqual(0);
      expect(rowPosition(50)).toEqual(5);
    });

    it("applies the maximum offset when scroll position is 100%", () => {
      const [, rowPosition] = virtualRowPositioning(20, 100, { current: 1 });
      expect(rowPosition(-100)).toEqual(0);
      expect(rowPosition(0)).toEqual(5);
    });
  });
});
