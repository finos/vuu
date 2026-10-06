import { describe, expect, it } from "vitest";
import type { DataRow } from "@vuu-ui/vuu-table-types";
import { getRowsInRenderOrder } from "../src/render-order";

const row = (index: number, renderIndex: number, isSelected = false) =>
  ({ index, renderIndex, isSelected }) as DataRow;

const renderIndices = (dataRows: DataRow[]) =>
  getRowsInRenderOrder(dataRows).map((e) => e.dataRow.renderIndex);

const flagsByRowIndex = (dataRows: DataRow[]) =>
  Object.fromEntries(
    getRowsInRenderOrder(dataRows).map(
      ({ dataRow, precedesSelection, selectionEnd, selectionStart }) => [
        dataRow.index,
        [precedesSelection, selectionStart, selectionEnd]
          .map((flag, i) => (flag ? ["p", "s", "e"][i] : "-"))
          .join(""),
      ],
    ),
  );

describe("getRowsInRenderOrder", () => {
  it("returns empty array for empty input", () => {
    expect(getRowsInRenderOrder([])).toEqual([]);
  });

  it("returns rows in renderIndex order", () => {
    const rows = [row(10, 2), row(11, 3), row(12, 0), row(13, 1)];
    expect(renderIndices(rows)).toEqual([0, 1, 2, 3]);
  });

  it("produces identical key order whichever way keys have rotated", () => {
    // simulate scrolling: same keys assigned to different row indices
    const forward = [row(10, 0), row(11, 1), row(12, 2), row(13, 3)];
    const scrolledFwd = [row(11, 1), row(12, 2), row(13, 3), row(14, 0)];
    const scrolledBwd = [row(9, 3), row(10, 0), row(11, 1), row(12, 2)];
    expect(renderIndices(forward)).toEqual([0, 1, 2, 3]);
    expect(renderIndices(scrolledFwd)).toEqual([0, 1, 2, 3]);
    expect(renderIndices(scrolledBwd)).toEqual([0, 1, 2, 3]);
  });

  it("skips holes in a sparse dataRows array", () => {
    const rows: DataRow[] = [];
    rows[0] = row(0, 4);
    rows[2] = row(2, 1);
    rows[5] = row(5, 0);
    expect(renderIndices(rows)).toEqual([0, 1, 4]);
  });

  it("handles gaps in renderIndex values", () => {
    const rows = [row(0, 7), row(1, 2), row(2, 5)];
    expect(renderIndices(rows)).toEqual([2, 5, 7]);
  });

  it("falls back to sort when renderIndex values are very sparse", () => {
    const rows = [row(0, 10000), row(1, 3), row(2, 500)];
    expect(renderIndices(rows)).toEqual([3, 500, 10000]);
  });

  it("falls back to stable sort on duplicate renderIndex", () => {
    const rows = [row(0, 1), row(1, 0), row(2, 1)];
    expect(
      getRowsInRenderOrder(rows).map(({ dataRow }) => dataRow.index),
    ).toEqual([1, 0, 2]);
  });

  describe("selection flags (computed from row order, not render order)", () => {
    it("single selected row in the middle", () => {
      const rows = [row(0, 2), row(1, 0, true), row(2, 1)];
      expect(flagsByRowIndex(rows)).toEqual({
        0: "p--",
        1: "-se",
        2: "---",
      });
    });

    it("selection block of several rows", () => {
      const rows = [
        row(0, 4),
        row(1, 3, true),
        row(2, 2, true),
        row(3, 1, true),
        row(4, 0),
      ];
      expect(flagsByRowIndex(rows)).toEqual({
        0: "p--",
        1: "-s-",
        2: "---",
        3: "--e",
        4: "---",
      });
    });

    it("multiple selection blocks", () => {
      const rows = [
        row(0, 0, true),
        row(1, 1),
        row(2, 2, true),
        row(3, 3),
        row(4, 4, true),
      ];
      expect(flagsByRowIndex(rows)).toEqual({
        0: "--e",
        1: "p--",
        2: "-se",
        3: "p--",
        4: "-s-",
      });
    });

    it("no flags at the edges of the rendered window", () => {
      // first and last rendered rows have no rendered neighbour on one side
      const rows = [row(20, 1, true), row(21, 0, true)];
      expect(flagsByRowIndex(rows)).toEqual({ 20: "---", 21: "---" });
    });

    it("accepts numeric (0 | 1) isSelected values", () => {
      const rows = [
        { index: 0, renderIndex: 1, isSelected: 0 },
        { index: 1, renderIndex: 0, isSelected: 1 },
        { index: 2, renderIndex: 2, isSelected: 0 },
      ] as unknown as DataRow[];
      expect(flagsByRowIndex(rows)).toEqual({ 0: "p--", 1: "-se", 2: "---" });
    });

    it("rows either side of a hole are treated as neighbours (as DOM siblings were)", () => {
      const rows: DataRow[] = [];
      rows[0] = row(0, 0);
      rows[2] = row(2, 1, true);
      expect(flagsByRowIndex(rows)).toEqual({ 0: "p--", 2: "-s-" });
    });
  });
});
