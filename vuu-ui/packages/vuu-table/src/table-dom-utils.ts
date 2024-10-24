import { RefObject } from "react";
import { ScrollDirection } from "./useTableScroll";
import type { ArrowKey, PageKey } from "@finos/vuu-utils";
import type { CellPos } from "@finos/vuu-table-types";

const NULL_CELL_POS: CellPos = [-1, -1];

export type NavigationKey = PageKey | ArrowKey;

export const headerCellQuery = (colIdx: number) =>
  `.vuuTable-col-headers .vuuTableHeaderCell[aria-colindex='${colIdx}']`;

export const dataCellQuery = (rowIdx: number, colIdx: number) =>
  `.vuuTable-table [aria-rowindex='${rowIdx}'] > [aria-colindex='${colIdx}']`;

export const getTableCell = (
  containerRef: RefObject<HTMLElement>,
  [rowIdx, colIdx]: CellPos,
) => {
  const cssQuery = dataCellQuery(rowIdx, colIdx);
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

export const getAriaRowIndex = (rowElement: HTMLElement | null) => {
  const rowIndex = rowElement?.ariaRowIndex;
  if (rowIndex != null) {
    const index = parseInt(rowIndex);
    if (!isNaN(index)) {
      return index;
    }
  }
  return -1;
};

export const getAriaColIndex = (rowElement: HTMLElement | null) => {
  const colIndex = rowElement?.ariaColIndex;
  if (colIndex != null) {
    const index = parseInt(colIndex);
    if (!isNaN(index)) {
      return index;
    }
  }
  return -1;
};

export const getRowElementByAriaIndex = (
  container: HTMLDivElement | EventTarget,
  rowIndex: number,
) => {
  if (rowIndex === -1) {
    return null;
  } else {
    const activeRow = (container as HTMLElement).querySelector(
      `[aria-rowindex="${rowIndex}"]`,
    ) as HTMLElement;

    if (activeRow) {
      return activeRow;
    } else {
      throw Error(
        `getRowElementAtIndex no row found for index index ${rowIndex}`,
      );
    }
  }
};

export const getIndexFromRowElement = (rowElement: HTMLElement | null) => {
  const ariaRowIndex = getAriaRowIndex(rowElement);
  return ariaRowIndex === -1 ? -1 : ariaRowIndex - 1;
};

export const getIndexFromCellElement = (cellElement: HTMLElement | null) =>
  getAriaColIndex(cellElement);

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

export const getAriaCellPos = (tableCell: HTMLDivElement): CellPos => {
  const focusedRow = tableCell.closest("[role='row']") as HTMLElement;
  return [getAriaRowIndex(focusedRow), getAriaColIndex(tableCell)];
};

const closestRow = (el: HTMLElement) =>
  el.closest('[role="row"]') as HTMLElement;

export const closestRowIndex = (el: HTMLElement) =>
  getIndexFromRowElement(closestRow(el));

export function getNextCellPos(
  key: ArrowKey,
  [rowIdx, colIdx]: CellPos,
  columnCount: number,
  maxRowIndex: number,
): CellPos {
  if (key === "ArrowUp") {
    if (rowIdx > -1) {
      return [rowIdx - 1, colIdx];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === "ArrowDown") {
    if (rowIdx === -1) {
      return [1, colIdx];
    } else if (rowIdx === maxRowIndex) {
      return [rowIdx, colIdx];
    } else {
      return [rowIdx + 1, colIdx];
    }
  } else if (key === "ArrowRight") {
    if (colIdx < columnCount) {
      return [rowIdx, colIdx + 1];
    } else {
      return [rowIdx, colIdx];
    }
  } else if (key === "ArrowLeft") {
    if (colIdx > 1) {
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
