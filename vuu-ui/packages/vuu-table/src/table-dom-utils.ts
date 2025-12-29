import { RefObject } from "react";
import { ScrollDirection } from "./useTableScroll";
import {
  getAriaColIndex,
  getAriaRowIndex,
  type ArrowKey,
  type PageKey,
} from "@vuu-ui/vuu-utils";
import type { CellPos } from "@vuu-ui/vuu-table-types";

export type NavigationKey = PageKey | ArrowKey;

export const headerCellQuery = (colIdx: number) =>
  `.vuuTable-col-headers .vuuTableHeaderCell[aria-colindex='${colIdx}']`;

export const dataCellQuery = (ariaRowIdx: number, ariaColIdx: number) =>
  `.vuuTable-table [aria-rowindex='${ariaRowIdx}'] > [aria-colindex='${ariaColIdx}']`;

export const getLevelUp = (
  containerRef: RefObject<HTMLElement | null>,
  cellPos: CellPos,
): CellPos => {
  const cell = getTableCell(containerRef, cellPos);
  let row = cell?.parentElement;
  const level = parseInt(row?.ariaLevel ?? "1");
  if (level > 1) {
    const targetLevel = `${level - 1}`;
    while (row !== null && row.ariaLevel !== targetLevel) {
      row = row.previousElementSibling as HTMLElement;
    }
    if (row) {
      const nextRowIndex = parseInt(row.ariaRowIndex ?? "- 1");
      if (nextRowIndex !== -1) {
        return [nextRowIndex, 1];
      }
    }
  }
  return cellPos;
};
export const getTableCell = (
  containerRef: RefObject<HTMLElement | null>,
  [rowIdx, colIdx]: CellPos,
) => {
  const cssQuery = dataCellQuery(rowIdx, colIdx);
  const cell = containerRef.current?.querySelector(cssQuery) as HTMLDivElement;

  if (cellIsEditable(cell)) {
    // Dropdown gets focus, Input does not
    const focusableContent = cell.querySelector(
      `button,input[type="checkbox"]`,
    ) as HTMLElement;
    return focusableContent || cell;
  } else {
    return cell;
  }
};

export const getHeaderCell = (
  containerRef: RefObject<HTMLElement | null>,
  columnName: string,
) =>
  containerRef.current?.querySelector(
    `.vuuTableHeaderCell[data-column-name="${columnName}"]`,
  ) as HTMLDivElement | null;

export const getFocusedCell = (el: HTMLElement | Element | null) => {
  if (el?.role == "cell" || el?.role === "columnheader") {
    return el as HTMLDivElement;
  } else {
    return el?.closest(
      "[role='columnHeader'],[role='cell']",
    ) as HTMLDivElement | null;
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

const cellIsGroupCell = (cell: HTMLElement | null) =>
  cell?.classList.contains("vuuTableGroupCell");

const rowIsExpanded = (cell: HTMLElement) => {
  switch (cell.parentElement?.ariaExpanded) {
    case "true":
      return true;
    case "false":
      return false;
    default:
      return undefined;
  }
};

export const cellIsTextInput = (cell: HTMLElement) =>
  cell.querySelector(".vuuTableInputCell") !== null;

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

export const getIndexFromCellElement = (cellElement: HTMLElement | null) =>
  getAriaColIndex(cellElement);

export const getAriaCellPos = (tableCell: HTMLDivElement): CellPos => {
  const focusedRow = tableCell.closest("[role='row']") as HTMLElement;
  return [getAriaRowIndex(focusedRow), getAriaColIndex(tableCell)];
};

const closestRow = (el: HTMLElement) =>
  el.closest('[role="row"]') as HTMLElement;

export const closestRowIndex = (el: HTMLElement) =>
  getAriaRowIndex(closestRow(el));

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

export type TreeNodeOperation = "expand" | "collapse" | "level-up";

export const getTreeNodeOperation = (
  containerRef: RefObject<HTMLElement | null>,
  navigationStyle: "cell" | "tree",
  cellPos: CellPos,
  key: NavigationKey,
  shiftKey: boolean,
): TreeNodeOperation | undefined => {
  const cell = getTableCell(containerRef, cellPos);
  if (navigationStyle === "cell" && !cellIsGroupCell(cell)) {
    return undefined;
  }
  if (navigationStyle == "cell" && !shiftKey) {
    return undefined;
  }
  if (cellIsGroupCell(cell)) {
    const isExpanded = rowIsExpanded(cell);
    if (isExpanded === true) {
      if (key === "ArrowLeft") {
        return "collapse";
      }
    } else if (isExpanded === false) {
      if (key === "ArrowRight") {
        return "expand";
      } else if (key === "ArrowLeft") {
        return "level-up";
      }
    } else if (key === "ArrowLeft") {
      return "level-up";
    }
  }
};

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
