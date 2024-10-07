import { VuuRange } from "@finos/vuu-protocol-types";
import { queryClosest } from "@finos/vuu-utils";

export type TableCellBlock = {
  columnRange: VuuRange;
  rowRange: VuuRange;
};

export type CellBox = {
  bottom: number;
  left: number;
  right: number;
  top: number;
};

type EndCellDirection =
  | "self"
  | "n"
  | "ne"
  | "e"
  | "se"
  | "s"
  | "sw"
  | "w"
  | "nw";

export const getEndCellDirection = (
  startBox: CellBox,
  endBox: CellBox,
): EndCellDirection => {
  const { bottom: sBottom, left: sLeft, right: sRight, top: sTop } = startBox;
  const { bottom: eBottom, left: eLeft, right: eRight, top: eTop } = endBox;
  const north = eTop < sTop;
  const east = eRight > sRight;
  const south = eBottom > sBottom;
  const west = eLeft < sLeft;

  if (north && east) return "ne";
  else if (south && east) return "se";
  else if (south && west) return "sw";
  else if (north && west) return "nw";
  else if (north) return "n";
  else if (east) return "e";
  else if (south) return "s";
  else if (west) return "w";
  else return "self";
};

export const setElementBox = (el: HTMLElement, box: CellBox) => {
  const { bottom, left, right, top } = el.getBoundingClientRect();
  box.bottom = bottom;
  box.left = left;
  box.right = right;
  box.top = top;
};

export const outsideBox = (
  { bottom, left, right, top }: CellBox,
  x: number,
  y: number,
) => x < left || x > right || y < top || y > bottom;

const getColIndex = ({ ariaColIndex }: HTMLDivElement) => {
  if (ariaColIndex !== null) {
    return parseInt(ariaColIndex);
  }
  throw Error("invalid aria-colindex in table cell");
};

const getRowIndex = (cell: HTMLDivElement) => {
  const row = queryClosest<HTMLDivElement>(cell, ".vuuTableRow");
  if (row) {
    const { ariaRowIndex } = row;
    if (ariaRowIndex !== null) {
      return parseInt(ariaRowIndex);
    }
  }
  throw Error("invalid aria-rowindex in table row");
};

export const getTableCellBlock = (
  startCell: HTMLDivElement,
  endCell: HTMLDivElement,
): TableCellBlock => {
  const colStart = getColIndex(startCell);
  const colEnd = getColIndex(endCell);
  const rowStart = getRowIndex(startCell);
  const rowEnd = getRowIndex(endCell);

  const columnRange = {
    from: Math.min(colStart, colEnd),
    to: Math.max(colStart, colEnd),
  };
  const rowRange = {
    from: Math.min(rowStart, rowEnd),
    to: Math.max(rowStart, rowEnd),
  };

  return {
    columnRange,
    rowRange,
  };
};
