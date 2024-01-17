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
  gridItems: IGridLayoutModelItem[]
): GridMatrix => {
  const maxCol = gridItems.reduce(
    (max, { column: { end } }) => Math.max(max, end),
    0
  );
  const maxRow = gridItems.reduce(
    (max, { row: { end } }) => Math.max(max, end),
    0
  );

  const grid = new Array(maxRow - 1);
  for (let i = 0; i < grid.length; i++) {
    grid[i] = new Array(maxCol - 1).fill(0);
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

export function getEmptyExtents(grid: GridMatrix) {
  const emptyExtents: IGridLayoutModelItem[] = [];
  const rows = cloneGridMatrix(grid);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    for (let j = 0; j < row.length; j++) {
      if (row[j] === 0) {
        console.log(`empty cell at ${i}, ${j}`);
        if (row[j + 1] === 0) {
          console.log("mighjt have a big one");
        } else if (rows[0 + 1]?.[j] === 0) {
          console.log("might span multiple rows");
        } else {
          row[j] = 1;
          emptyExtents.push({
            column: { start: j + 1, end: j + 2 },
            id: "placeholder",
            resizeable: "vh",
            row: { start: i + 1, end: i + 2 },
          });
        }
      }
    }
  }

  return emptyExtents;
}
