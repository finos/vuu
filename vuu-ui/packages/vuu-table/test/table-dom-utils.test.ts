import { describe, expect, it } from "vitest";
import { getLevelUp } from "../src/table-dom-utils";

// Rows are deliberately inserted out of row order, as Table renders them in
// renderIndex (recycled key) order.
const createTable = (
  rows: Array<[ariaRowIndex: number, ariaLevel: number]>,
) => {
  const container = document.createElement("div");
  container.innerHTML = `<div class="vuuTable-table">${rows
    .map(
      ([rowIdx, level]) =>
        `<div class="vuuTableRow" aria-rowindex="${rowIdx}" aria-level="${level}"><div aria-colindex="1"></div><div aria-colindex="2"></div></div>`,
    )
    .join("")}</div>`;
  return { current: container };
};

describe("getLevelUp", () => {
  it("finds the parent group row regardless of DOM order", () => {
    const containerRef = createTable([
      [5, 3],
      [2, 1],
      [6, 2],
      [3, 2],
      [4, 3],
    ]);
    expect(getLevelUp(containerRef, [5, 2])).toEqual([3, 1]);
    expect(getLevelUp(containerRef, [4, 2])).toEqual([3, 1]);
    expect(getLevelUp(containerRef, [6, 2])).toEqual([2, 1]);
    expect(getLevelUp(containerRef, [3, 2])).toEqual([2, 1]);
  });

  it("returns cellPos unchanged for a top level row", () => {
    const containerRef = createTable([
      [3, 2],
      [2, 1],
    ]);
    expect(getLevelUp(containerRef, [2, 2])).toEqual([2, 2]);
  });

  it("returns cellPos unchanged when parent is not rendered", () => {
    const containerRef = createTable([
      [4, 3],
      [3, 3],
    ]);
    expect(getLevelUp(containerRef, [4, 2])).toEqual([4, 2]);
  });
});
