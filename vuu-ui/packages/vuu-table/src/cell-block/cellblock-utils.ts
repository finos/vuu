import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import {
  queryClosest,
  getAriaColIndex,
  getAriaRowIndex,
} from "@vuu-ui/vuu-utils";
import { getAriaCellPos } from "../table-dom-utils";

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

export const isNullCellBox = ({ bottom, left, right, top }: CellBox) => {
  return bottom === -1 && left === -1 && right === -1 && top === -1;
};

const Hi = Number.MAX_SAFE_INTEGER;

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

const getRowIndex = (cell: HTMLDivElement) =>
  getAriaRowIndex(queryClosest<HTMLDivElement>(cell, ".vuuTableRow"));

export const getTableCellBlock = (
  startCell: HTMLDivElement,
  endCell: HTMLDivElement,
): TableCellBlock => {
  const colStart = getAriaColIndex(startCell);
  const colEnd = getAriaColIndex(endCell);
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

export type RefState = {
  dragState: "pending" | "active";
  cellBlock: HTMLDivElement | null;
  cellBlockClassName: string;
  endBox: CellBox;
  endCell: HTMLDivElement | null;
  endPos: PosTuple; // used during keyboard operation
  mousePosX: number;
  mousePosY: number;
  mouseStartX: number;
  mouseStartY: number;
  startCell: HTMLDivElement | null;
  startBox: CellBox;
  startPos: PosTuple; // used during keyboard operation
};

export type PosTuple = [number, number];

export const refState: RefState = {
  cellBlock: null,
  cellBlockClassName: "",
  dragState: "pending",
  endBox: { bottom: -1, left: Hi, right: -1, top: Hi },
  endCell: null,
  endPos: [-1, -1],
  mousePosX: -1,
  mousePosY: -1,
  mouseStartX: -1,
  mouseStartY: -1,
  startBox: { bottom: -1, left: -1, right: -1, top: -1 },
  startCell: null,
  startPos: [-1, -1],
} as const;

export const updateCellBlockClassName = (state: RefState) => {
  const { cellBlock, cellBlockClassName, startBox, endBox } = state;
  const endBlockDirection = getEndCellDirection(startBox, endBox);
  const newCellBlockClassName = `cellblock-direction-${endBlockDirection}`;
  if (newCellBlockClassName !== cellBlockClassName) {
    if (cellBlockClassName) {
      cellBlock?.classList.replace(cellBlockClassName, newCellBlockClassName);
    } else {
      cellBlock?.classList.add(newCellBlockClassName);
    }
    state.cellBlockClassName = newCellBlockClassName;
  }
};

export const getTextFromCells = (
  startCell: HTMLDivElement,
  endCell: HTMLDivElement,
) => {
  const tableBody = queryClosest<HTMLDivElement>(
    startCell,
    ".vuuTable-body",
    true,
  );
  const [startRow, startCol] = getAriaCellPos(startCell);
  const [endRow, endCol] = getAriaCellPos(endCell);

  const rowRange = {
    from: Math.min(startRow, endRow),
    to: Math.max(startRow, endRow),
  };

  const colRange = {
    from: Math.min(startCol, endCol),
    to: Math.max(startCol, endCol),
  };

  const results: string[][] = [];
  for (let rowIdx = rowRange.from; rowIdx <= rowRange.to; rowIdx++) {
    const row = tableBody.querySelector(
      `.vuuTableRow[aria-rowindex='${rowIdx}']`,
    );
    const rowData = [];
    for (let colIdx = colRange.from; colIdx <= colRange.to; colIdx++) {
      const cell = row?.querySelector(
        `.vuuTableCell[aria-colindex='${colIdx}']`,
      );
      if (cell) {
        rowData.push(cell.textContent ?? "");
      }
    }
    results.push(rowData);
  }
  return results.map((r) => r.join("\t")).join("\n");
};
