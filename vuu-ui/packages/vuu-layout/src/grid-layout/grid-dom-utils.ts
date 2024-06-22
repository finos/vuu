import {
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
  IGridLayoutModelItem,
  ResizeState,
} from "./GridLayoutModel";

export const classNameLayoutItem = "vuuGridLayoutItem";

export type ResizeOrientation = "horizontal" | "vertical";

// TODO cobvert these to GridLayoutPosition
type GridPos = [number, number];

export const isSplitter = (element: HTMLElement) =>
  element.classList.contains("vuuGridSplitter");
export const isVerticalSplitter = (element: HTMLElement) =>
  element.classList.contains("vuuGridSplitter-vertical");
export const isHorizontalSplitter = (element: HTMLElement) =>
  element.classList.contains("vuuGridSplitter-horizontal");

export const getGridLayoutItem = (el: HTMLElement) => {
  if (el.classList.contains(classNameLayoutItem)) {
    return el;
  } else {
    return el.closest(`.${classNameLayoutItem}`) as HTMLElement;
  }
};

export const getColumns = (el: HTMLElement) =>
  getComputedStyle(el)
    .getPropertyValue("grid-template-columns")
    .split(" ")
    .map((value) => parseInt(value, 10));

export const setColumns = (el: HTMLElement, cols: number[]) => {
  const trackTemplate = cols.map((r) => `${r}px`).join(" ");
  el.style.gridTemplateColumns = trackTemplate;
};

export const getRows = (el: HTMLElement) =>
  getComputedStyle(el)
    .getPropertyValue("grid-template-rows")
    .split(" ")
    .map((value) => parseInt(value, 10));

export const setRows = (el: HTMLElement, rows: number[]) => {
  const trackTemplate = rows.map((r) => `${r}px`).join(" ");
  el.style.gridTemplateRows = trackTemplate;
};

const NO_POSITION: GridPos = [-1, -1];

export const getColumn = (el: HTMLElement): GridPos => {
  const value = getComputedStyle(el)
    .getPropertyValue("grid-column")
    .split("/")
    .map((value) => parseInt(value, 10));
  if (value.length === 2) {
    return value as GridPos;
  } else if (value.length === 1) {
    return [value[0], value[0]];
  } else {
    return NO_POSITION;
  }
};

export const getRow = (el: HTMLElement | undefined): GridPos => {
  if (el === undefined) {
    throw Error("getRow invoked with null element");
  }
  const value = getComputedStyle(el)
    .getPropertyValue("grid-row")
    .split("/")
    .map((value) => parseInt(value, 10));
  if (value.length === 2) {
    return value as GridPos;
  } else if (value.length === 1) {
    return [value[0], value[0]];
  } else {
    return NO_POSITION;
  }
};

export const getGridItemProps = (el: HTMLElement): IGridLayoutModelItem => {
  const col = getColumn(el);
  const row = getRow(el);
  const resizeable = el.classList.contains("vuuGridLayoutItem-resizeable-v")
    ? "v"
    : el.classList.contains("vuuGridLayoutItem-resizeable-h")
    ? "h"
    : el.classList.contains("vuuGridLayoutItem-resizeable-vh")
    ? "vh"
    : undefined;
  return {
    column: { start: col[0], end: col[1] },
    id: el.id,
    resizeable,
    row: { start: row[0], end: row[1] },
    type: "content",
  };
};

export const getRowIndex = (el: HTMLElement) => {
  const [from] = getRow(el);
  return from - 1;
};

export const setGridColumn = (
  target: string | HTMLElement,
  { start, end }: GridLayoutModelPosition
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el?.style.setProperty("grid-column", `${start}/${end}`);
};

export const setGridRow = (
  target: string | HTMLElement,
  { start, end }: GridLayoutModelPosition
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el?.style.setProperty("grid-row", `${start}/${end}`);
};

export const spansMultipleTracks = (
  gridItem: IGridLayoutModelItem,
  direction: GridLayoutResizeDirection
) => {
  const track = direction === "horizontal" ? "column" : "row";
  const { start, end } = gridItem[track];
  return end - start > 1;
};

export const setGridTrackTemplate = (
  { grid, resizeDirection }: Pick<ResizeState, "grid" | "resizeDirection">,
  tracks: number[]
) => {
  const trackTemplate = tracks.map((r) => `${r}px`).join(" ");
  if (grid && resizeDirection === "vertical") {
    grid.style.gridTemplateRows = trackTemplate;
  } else if (grid && resizeDirection === "horizontal") {
    grid.style.gridTemplateColumns = trackTemplate;
  }
};

export const getTrackIndex = (grid: HTMLElement, x: number, y: number) => {
  const { left, top } = grid.getBoundingClientRect();
  const columns = getColumns(grid);
  const rows = getRows(grid);

  let columnIndex = 0;
  let rowIndex = 0;

  let posLeft = left;
  let posTop = top;

  for (let i = 0; i < columns.length; i++) {
    posLeft += columns[i];
    if (posLeft > x) {
      columnIndex = i;
      break;
    }
  }

  for (let i = 0; i < rows.length; i++) {
    posTop += rows[i];
    if (posTop > y) {
      rowIndex = i;
      break;
    }
  }

  return { columnIndex, rowIndex };
};
