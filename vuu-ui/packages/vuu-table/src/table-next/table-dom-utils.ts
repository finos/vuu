import { RefObject } from "react";

export type CellPos = [number, number];

export const headerCellQuery = (colIdx: number) =>
  `.vuuTableNext-col-headers .vuuTableNextHeaderCell:nth-child(${colIdx})`;

export const dataCellQuery = (rowIdx: number, colIdx: number) =>
  `.vuuTableNext-body > [aria-rowindex='${rowIdx}'] > [role='cell']:nth-child(${
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
  cell.classList.contains("vuuTableNextCell-editable");

export const cellIsTextInput = (cell: HTMLElement) =>
  cell.querySelector(".vuuTableInputCell") !== null;
