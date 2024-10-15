import { RefObject } from "react";
import { ScrollDirection } from "./useTableScroll";
import type { ArrowKey, PageKey } from "@finos/vuu-utils";
import type { CellPos } from "@finos/vuu-table-types";

const NULL_CELL_POS: CellPos = [-1, -1];

export type NavigationKey = PageKey | ArrowKey;

export const headerCellQuery = (colIdx: number) =>
  `.vuuTable-col-headers .vuuTableHeaderCell[aria-colindex='${colIdx + 1}']`;

export const dataCellQuery = (rowIdx: number, colIdx: number) =>
  `.vuuTable-body > [aria-rowindex='${rowIdx + 1}'] > [aria-colindex='${colIdx + 1}']`;

export const getTableCell = (
  containerRef: RefObject<HTMLElement>,
  [rowIdx, colIdx]: CellPos,
) => {
  const cssQuery =
    rowIdx === -1 ? headerCellQuery(colIdx) : dataCellQuery(rowIdx, colIdx);
  const cell = containerRef.current?.querySelector(
    cssQuery,
  ) as HTMLTableCellElement;

  if (cellIsEditable(cell)) {
    // Dropdown gets focus, Input does not
    const focusableContent = cell.querySelector("button") as HTMLElement;
    return focusableContent || cell;
  } else {
    return cell;
  }
};

export const cellIsEditable = (cell: HTMLDivElement | null) =>
  cell?.classList.contains("vuuTableCell-editable");

export const cellDropdownShowing = (cell: HTMLDivElement | null) => {
  if (cellIsEditable(cell)) {
    return cell?.querySelector('.saltDropdown[aria-expanded="true"]') !== null;
  }
  return false;
};

export const cellIsTextInput = (cell: HTMLElement) =>
  cell.querySelector(".vuuTableInputCell") !== null;

export const getIndexFromRowElement = (rowElement: HTMLElement | null) => {
  const rowIndex = rowElement?.ariaRowIndex;
  if (rowIndex != null) {
    const index = parseInt(rowIndex) - 1;
    if (!isNaN(index)) {
      return index;
    }
  }
  return -1;
};

export const getIndexFromCellElement = (cellElement: HTMLElement | null) => {
  const colIndex = cellElement?.ariaColIndex;
  if (colIndex != null) {
    const index = parseInt(colIndex) - 1;
    if (!isNaN(index)) {
      return index;
    }
  }
  return -1;
};

export const getTableCellPos = (tableCell: HTMLDivElement): CellPos => {
  const colIdx = getIndexFromCellElement(tableCell);
  if (tableCell.role === "columnHeader") {
    return [-1, colIdx];
  } else {
    const focusedRow = tableCell.closest("[role='row']") as HTMLElement;
    if (focusedRow) {
      return [getIndexFromRowElement(focusedRow), colIdx];
    }
  }
  return NULL_CELL_POS;
};

const closestRow = (el: HTMLElement) =>
  el.closest('[role="row"]') as HTMLElement;

export const closestRowIndex = (el: HTMLElement) =>
  getIndexFromRowElement(closestRow(el));

export function getNextCellPos(
  key: ArrowKey,
  [rowIdx, colIdx]: CellPos,
  columnCount: number,
  rowCount: number,
): CellPos {
  if (key === "ArrowUp") {
    if (rowIdx > -1) {
      return [rowIdx - 1, colIdx];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === "ArrowDown") {
    if (rowIdx === -1) {
      return [0, colIdx];
    } else if (rowIdx === rowCount - 1) {
      return [rowIdx, colIdx];
    } else {
      return [rowIdx + 1, colIdx];
    }
  } else if (key === "ArrowRight") {
    if (colIdx < columnCount - 1) {
      return [rowIdx, colIdx + 1];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === "ArrowLeft") {
    if (colIdx > 0) {
      return [rowIdx, colIdx - 1];
    } else {
      return [rowIdx, colIdx];
    }
  }
  return [rowIdx, colIdx];
}

const NO_SCROLL_NECESSARY = [undefined, undefined] as const;

export const howFarIsRowOutsideViewport = (
  rowEl: HTMLElement,
  totalHeaderHeight: number,
  contentContainer = rowEl.closest(".vuuTable-contentContainer"),
): readonly [ScrollDirection | undefined, number | undefined] => {
  //TODO lots of scope for optimisation here
  if (contentContainer) {
    // TODO take totalHeaderHeight into consideration
    const viewport = contentContainer?.getBoundingClientRect();
    const upperBoundary = viewport.top + totalHeaderHeight;
    const row = rowEl.getBoundingClientRect();
    if (row) {
      if (row.bottom > viewport.bottom) {
        return ["down", row.bottom - viewport.bottom];
      } else if (row.top < upperBoundary) {
        return ["up", row.top - upperBoundary];
      } else {
        return NO_SCROLL_NECESSARY;
      }
    } else {
      throw Error("Whats going on, row not found");
    }
  } else {
    throw Error("Whats going on, scrollbar container not found");
  }
};
