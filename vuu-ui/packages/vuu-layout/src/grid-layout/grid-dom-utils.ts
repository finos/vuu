import {
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
  IGridLayoutModelItem,
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

export const getRowIndex = (el: HTMLElement) => {
  const [from] = getRow(el);
  return from - 1;
};

export const setGridColumn = (
  target: string | HTMLElement,
  { start, end }: GridLayoutModelPosition,
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el?.style.setProperty("grid-column", `${start}/${end}`);
};

export const setGridRow = (
  target: string | HTMLElement,
  { start, end }: GridLayoutModelPosition,
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el?.style.setProperty("grid-row", `${start}/${end}`);
};

export const spansMultipleTracks = (
  gridItem: IGridLayoutModelItem,
  direction: GridLayoutResizeDirection,
) => {
  const track = direction === "horizontal" ? "column" : "row";
  const { start, end } = gridItem[track];
  return end - start > 1;
};
