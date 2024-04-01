import { uuid } from "@finos/vuu-utils";
import { IGridLayoutModelItem } from "./GridLayoutModel";

export type GridMatrix = number[][];

function addGridItemToGrid(
  grid: GridMatrix,
  {
    column: { start: colStart, end: colEnd },
    row: { start: rowStart, end: rowEnd },
  }: IGridLayoutModelItem
) {
  for (let row = rowStart - 1; row < rowEnd - 1; row++) {
    for (let col = colStart - 1; col < colEnd - 1; col++) {
      grid[row][col] += 1;
    }
  }
}

const fillGridMatrix = (
  grid: GridMatrix,
  gridItems: IGridLayoutModelItem[]
) => {
  for (const gridItem of gridItems) {
    addGridItemToGrid(grid, gridItem);
  }
};

export const getGridMatrix = (
  gridItems: IGridLayoutModelItem[],
  rowCount: number,
  colCount: number
): GridMatrix => {
  const grid = new Array(rowCount);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = new Array(colCount).fill(0);
  }
  fillGridMatrix(grid, gridItems);
  return grid;
};

export const printGrid = (grid: number[][]) => {
  for (let i = 0; i < grid.length; i++) {
    const cols = grid[i];
    console.log(` row ${i + 1} [${cols.join(", ")}]`);
  }
};

const cloneGridMatrix = (grid: GridMatrix) => grid.map((row) => row.slice());

function rowCellsAllEmpty(fromIndex: number, toIndex: number, row?: number[]) {
  if (row) {
    for (let i = fromIndex; i < toIndex; i++) {
      if (row[i] !== 0) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function markCellsAsFilled(fromIndex: number, toIndex: number, row: number[]) {
  for (let i = fromIndex; i < toIndex; i++) {
    row[i] = 1;
  }
}

export function getEmptyExtents(grid: GridMatrix) {
  const emptyExtents: IGridLayoutModelItem[] = [];
  const rows = cloneGridMatrix(grid);
  for (let i = 0; i < rows.length; i++) {
    const cols = rows[i];
    for (let j = 0; j < cols.length; j++) {
      if (cols[j] === 0) {
        cols[j] = 1;
        let nextRow = i + 1;
        let nextCol = j + 1;
        // span as many columns as we find empty cells horizontally
        while (cols[nextCol] === 0) {
          cols[nextCol] = 1;
          nextCol += 1;
        }
        // span multiple rows as well as columns, but only
        // if we can span the same number of columns
        // found above.
        while (rowCellsAllEmpty(j, nextCol, rows[nextRow])) {
          markCellsAsFilled(j, nextCol, rows[nextRow]);
          nextRow += 1;
        }

        emptyExtents.push({
          column: { start: j + 1, end: nextCol + 1 },
          id: uuid(),
          resizeable: "vh",
          row: { start: i + 1, end: nextRow + 1 },
          type: "placeholder",
        });
      }
    }
  }

  return emptyExtents;
}
