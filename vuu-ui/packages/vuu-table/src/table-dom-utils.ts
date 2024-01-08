import { RefObject } from "react";

/**
 * [rowIndex, colIndex
 */
export type CellPos = [number, number];

export const headerCellQuery = (colIdx: number) =>
  `.vuuTable-col-headers .vuuTableHeaderCell:nth-child(${colIdx})`;

export const dataCellQuery = (rowIdx: number, colIdx: number) =>
  `.vuuTable-body > [aria-rowindex='${rowIdx}'] > [role='cell']:nth-child(${
    colIdx + 1
  })`;

export const getTableCell = (
  containerRef: RefObject<HTMLElement>,

  [rowIdx, colIdx]: CellPos
) => {
  const cssQuery =
    rowIdx === -1 ? headerCellQuery(colIdx) : dataCellQuery(rowIdx, colIdx);
  const cell = containerRef.current?.querySelector(
    cssQuery
  ) as HTMLTableCellElement;

  if (cellIsEditable(cell)) {
    // Dropdown gets focus, Input does not
    const focusableContent = cell.querySelector("button") as HTMLElement;
    return focusableContent || cell;
  } else {
    return cell;
  }
};

export const cellIsEditable = (cell: HTMLDivElement) =>
  cell.classList.contains("vuuTableCell-editable");

export const cellIsTextInput = (cell: HTMLElement) =>
  cell.querySelector(".vuuTableInputCell") !== null;

export function getRowIndex(rowEl?: HTMLElement) {
  if (rowEl) {
    const idx: string | null = rowEl.ariaRowIndex;
    if (idx !== null) {
      return parseInt(idx, 10) - 1;
    }
  }
  return -1;
}

const closestRow = (el: HTMLElement) =>
  el.closest('[role="row"]') as HTMLElement;

export const closestRowIndex = (el: HTMLElement) => getRowIndex(closestRow(el));
