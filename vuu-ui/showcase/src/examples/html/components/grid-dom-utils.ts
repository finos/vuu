import { GridLayoutModelPosition } from "@finos/vuu-layout";
import { GridItem, GridPos } from "./grid-layout-types";

export const classNameLayoutItem = "vuuGridLayoutItem";

export type ResizeOrientation = "horizontal" | "vertical";

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

export const getGridItemProps = (el: HTMLElement) => {
  const col = getColumn(el);
  const row = getRow(el);
  return {
    column: { start: col[0], end: col[1] },
    id: el.id,
    row: { start: row[0], end: row[1] },
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
  el.style.setProperty("grid-column", `${start}/${end}`);
};

export const setGridRow = (
  target: string | HTMLElement,
  { start, end }: GridLayoutModelPosition
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el.style.setProperty("grid-row", `${start}/${end}`);
};

export const spansMultipleTracks = (gridItem: GridItem) => {
  const { col, row: track = col } = gridItem;
  if (track) {
    return track.span > 1;
  }
  throw Error("spanMultipleLines, invalid GridItem");
};

export const trackRemoved = (
  el: HTMLElement,
  targetTrack: number,
  orientation: ResizeOrientation | null
) => {
  if (orientation === null) {
    throw Error("trackRemoved called with no resizeOrientation");
  }
  const [getTrack, setTrack] =
    orientation === "vertical"
      ? [getRow, setGridRow]
      : [getColumn, setGridColumn];

  const track = getTrack(el);
  const [from, to] = track;
  const changeFrom = from > targetTrack;
  const changeTo = to > targetTrack;

  if (changeFrom) {
    track[0] -= 1;
  }
  if (changeTo) {
    track[1] -= 1;
  }
  if (changeFrom || changeTo) {
    setTrack(el, track);
  }
};

const equalsGridPos = ([from1, to1]: GridPos, [from2, to2]: GridPos) =>
  from1 === from2 && to1 === to2;

const immediatelyPrecedesGridPos = ([from1]: GridPos, [, to2]: GridPos) =>
  from1 === to2;

const immediatelyFollowsGridPos = ([, to1]: GridPos, [from2]: GridPos) =>
  from2 === to1;

const followsGridPos = (pos1: GridPos, pos2: GridPos) => {
  return false;
};
const overlapsGridPos = (pos1: GridPos, pos2: GridPos) => {
  return false;
};

export const splitGridTracks = (
  grid: HTMLElement | null,
  gridPos: GridPos,
  orientation: ResizeOrientation
): [GridPos, GridPos] | undefined => {
  if (grid === null) {
    throw Error("splitGridRows called on null grid");
  }

  const [getTracks, setTracks, getTrack, setTrack] =
    orientation === "vertical"
      ? [getRows, setRows, getRow, setGridRow]
      : [getColumns, setColumns, getColumn, setGridColumn];

  const [from, to] = gridPos;
  const tracks = getTracks(grid);
  const trackCount = to - from;
  let size = 0;
  const startIndex = from - 1;
  for (let i = startIndex; i < to - 1; i++) {
    size += tracks[i];
  }

  for (const node of grid.childNodes) {
    const element = node as HTMLElement;
    const track = getTrack(element);
    const [colFrom, colTo] = track;
    if (equalsGridPos(gridPos, track)) {
      console.log(`col ${track} equals gridPos ${gridPos}`);
      const newPos = [colFrom, colTo + 1] as GridPos;
      setTrack(element, newPos);
    } else if (immediatelyPrecedesGridPos(gridPos, track)) {
      console.log(`col ${track} precedes gridPos ${gridPos}`);
    } else if (immediatelyFollowsGridPos(gridPos, track)) {
      console.log(`col ${track} follows gridPos ${gridPos}`);
      const newPos = [colFrom + 1, colTo + 1] as GridPos;
      setTrack(element, newPos);
    } else if (followsGridPos(gridPos, track)) {
      console.log(`col ${track} follows gridPos ${gridPos}`);
    } else if (overlapsGridPos(gridPos, track)) {
      console.log(`col ${track} overlaps gridPos ${gridPos}`);
    } else {
      console.log(`col ${track} can be ignored, precedes  gridPos ${gridPos}`);
    }
  }

  if (trackCount === 1) {
    const newSize = size / 2;
    tracks.splice(startIndex, 1, newSize, newSize);
    setTracks(grid, tracks);
    return [
      [from, to],
      [to, to + 1],
    ];
  }
};
