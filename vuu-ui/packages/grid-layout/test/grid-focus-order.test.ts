import { describe, expect, it } from "vitest";
import { computeFocusOrder } from "../src/grid-focus-order";
import { computeSplitters, type GridGeometryItem } from "../src/GridGeometry";
import type { GridItemSnapshot, GridStackSnapshot } from "../src/GridSnapshot";

const item = (
  id: string,
  row: number,
  column: number,
  rowSpan = 1,
  columnSpan = 1,
): GridItemSnapshot => ({
  column: { span: columnSpan, start: column },
  id,
  row: { span: rowSpan, start: row },
});

/** Splitters as the grid computes them for resizable items. */
const splittersFor = (
  items: GridItemSnapshot[],
  columns: number,
  rows: number,
) =>
  computeSplitters({
    columns: Array.from({ length: columns }, () => "1fr" as const),
    items: items.map(
      ({ column, id, row }): GridGeometryItem => ({
        column: { end: column.start + column.span, start: column.start },
        id,
        resizeable: "hv",
        row: { end: row.start + row.span, start: row.start },
        type: "content",
      }),
    ),
    rows: Array.from({ length: rows }, () => "1fr" as const),
  }).splitters;

describe("computeFocusOrder", () => {
  it("orders a 2x2 grid row by row, each splitter before the item after it", () => {
    const items = [
      item("d", 2, 2),
      item("c", 2, 1),
      item("b", 1, 2),
      item("a", 1, 1),
    ];
    expect(
      computeFocusOrder({ items, stacks: [] }, splittersFor(items, 2, 2)),
    ).toEqual([
      "a",
      "b-splitter-h",
      "b",
      "c-splitter-v",
      "c",
      "d-splitter-h",
      "d-splitter-v",
      "d",
    ]);
  });

  it("orders spanning items by the cell they start in", () => {
    const items = [
      item("left", 1, 1, 2),
      item("top", 1, 2),
      item("bottom", 2, 2),
    ];
    expect(
      computeFocusOrder({ items, stacks: [] }, splittersFor(items, 2, 2)),
    ).toEqual(["left", "top-splitter-h", "top", "bottom-splitter-v", "bottom"]);
  });

  it("puts a stack's tab strip before its selected item and leaves out the others", () => {
    const stack: GridStackSnapshot = {
      id: "stack",
      itemIds: ["one", "two"],
      selectedItemId: "two",
    };
    const items = [item("one", 1, 2), item("two", 1, 2), item("first", 1, 1)];
    expect(computeFocusOrder({ items, stacks: [stack] }, [])).toEqual([
      "first",
      "stack",
      "two",
    ]);
  });

  it("returns no regions for an empty grid", () => {
    expect(computeFocusOrder({ items: [], stacks: [] }, [])).toEqual([]);
  });
});
