import { SplitterAlign } from "packages/vuu-layout/src";
import {
  ContraItem,
  ContraItemOtherColumn,
  GridItem,
  GridPos,
  NonAdjacentItem,
  SiblingItemOtherColumn,
} from "./grid-layout-types";

export const classNameLayoutItem = "vuuGridLayoutItem";

export type ResizeDirection = "shrink" | "expand";

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

export const getRowIndex = (el: HTMLElement) => {
  const [from] = getRow(el);
  return from - 1;
};

const collectColItems = (
  colPosition: GridPos,
  rowPosition: GridPos,
  element: HTMLElement,
  splitterAlign: SplitterAlign,
  contraItems: GridItem[],
  contraItemsMaybe: GridItem[],
  contraItemsOtherTrack: GridItem[],
  siblingItemsOtherTrack: GridItem[],
  nonAdjacentItems: GridItem[]
) => {
  const { id } = element;
  const row = getRow(element);
  const col = getColumn(element);

  console.log(
    `related item  (${id}) at row ${row} column ${col} splitter align ${splitterAlign}`
  );
  // A splitter with align start (the default) operates at the leading edge of the track, end splitters
  // operate at the trailing track edge.
  const positionIndex = splitterAlign === "start" ? 0 : 1;
  if (col.includes(colPosition[positionIndex])) {
    if (occupiesSameTrack(rowPosition, row)) {
      console.log(`${id} is contra-resize item`);
      contraItems.push({ id, col: new ContraItem(col) });
    } else if (withinSameTrack(rowPosition, row)) {
      if (row[0] === row[1]) {
        if (itemOnOtherSideOfSplitter(colPosition, col)) {
          console.log(`${id} is a splitter on the other side`);
          contraItemsOtherTrack.push({
            id,
            col: new ContraItemOtherColumn(col),
          });
        } else {
          console.log(`${id} is a sibling item splitter`);
          siblingItemsOtherTrack.push({
            id,
            col: new SiblingItemOtherColumn(col),
          });
        }
      } else {
        console.log(`${id} is maybe a contra-resize item`);
        contraItemsMaybe.push({ id, col: new ContraItem(col) });
      }
    } else if (itemIsSiblingSplitter(colPosition, col)) {
      console.log(`${id} is a splitter sibling`);
      siblingItemsOtherTrack.push({
        id,
        col: new SiblingItemOtherColumn(col),
      });
    } else if (itemOnOtherSideOfSplitter(colPosition, col)) {
      console.log(
        `${id} is on the other side of the splitter but in another row`
      );
      contraItemsOtherTrack.push({
        id,
        col: new ContraItemOtherColumn(col),
      });
    } else {
      console.log(`${id} is a column sibling`);
      siblingItemsOtherTrack.push({
        id,
        col: new SiblingItemOtherColumn(col),
      });
    }
  } else {
    console.log(`${id} is a non adjacent item`);
    nonAdjacentItems.push({
      id,
      col: new NonAdjacentItem(col),
    });
  }
};

const collectRowItems = (
  colPosition: GridPos,
  rowPosition: GridPos,
  element: HTMLElement,
  splitterAlign: SplitterAlign,
  contraItems: GridItem[],
  contraItemsMaybe: GridItem[],
  contraItemsOtherTrack: GridItem[],
  siblingItemsOtherTrack: GridItem[],
  nonAdjacentItems: GridItem[]
) => {
  const { id } = element;
  const row = getRow(element);
  const col = getColumn(element);
  console.log(`related item  (${id}) at row ${row} column ${col}`);
  // The splitter always operates at the leading row
  if (row.includes(rowPosition[0])) {
    if (occupiesSameTrack(colPosition, col)) {
      console.log(`${id} is contra-resize item`);
      contraItems.push({ id, row: new ContraItem(row) });
    } else if (withinSameTrack(colPosition, col)) {
      console.log(`${id} is maybe a contra-resize item`);
      contraItemsMaybe.push({ id, row: new ContraItem(row) });
    } else if (itemOnOtherSideOfSplitter(rowPosition, row)) {
      console.log(
        `${id} is on the other side of the splitter but in another column`
      );
      contraItemsOtherTrack.push({
        id,
        row: new ContraItemOtherColumn(row),
      });
    } else {
      console.log(`${id} is a row sibling`);
      siblingItemsOtherTrack.push({
        id,
        row: new SiblingItemOtherColumn(row),
      });
    }
  } else {
    console.log(`${id} is a non adjacent item`);
    nonAdjacentItems.push({
      id,
      row: new NonAdjacentItem(row),
    });
  }
};

export const getGridItemsAdjoiningTrack = (
  grid: HTMLElement,
  gridItemId: HTMLElement,
  resizeOrientation: ResizeOrientation,
  splitterAlign: SplitterAlign
):
  | [GridItem[], GridItem[], GridItem[], GridItem[], GridItem[]]
  | [GridItem[]] => {
  const contraItems: GridItem[] = [];
  const contraItemsMaybe: GridItem[] = [];
  const contraItemsOtherTrack: GridItem[] = [];
  const siblingItemsOtherTrack: GridItem[] = [];
  const nonAdjacentItems: GridItem[] = [];

  const rowPosition = getRow(targetElement);
  const colPosition = getColumn(targetElement);

  const collectItems =
    resizeOrientation === "vertical" ? collectRowItems : collectColItems;

  for (const node of grid.childNodes) {
    const element = node as HTMLElement;
    if (element !== targetElement && !isSplitter(element)) {
      collectItems(
        colPosition,
        rowPosition,
        element,
        splitterAlign,
        contraItems,
        contraItemsMaybe,
        contraItemsOtherTrack,
        siblingItemsOtherTrack,
        nonAdjacentItems
      );
    }
  }
  if (contraItemsOtherTrack.length === 0) {
    // Single Track resize
    return [contraItems];
  } else {
    return [
      contraItems,
      contraItemsMaybe,
      contraItemsOtherTrack,
      siblingItemsOtherTrack,
      nonAdjacentItems,
    ];
  }
};

const occupiesSameTrack = (
  [sourceFrom, sourceTo]: GridPos,
  [targetFrom, targetTo]: GridPos
) => targetFrom === sourceFrom && targetTo === sourceTo;

const withinSameTrack = (
  [sourceFrom, sourceTo]: GridPos,
  [targetFrom, targetTo]: GridPos
) => targetFrom >= sourceFrom && targetTo <= sourceTo;

const itemIsSiblingSplitter = (
  [sourceFrom]: GridPos,
  [targetFrom, targetTo]: GridPos
) => targetFrom === targetTo && targetTo === sourceFrom;

const itemOnOtherSideOfSplitter = (
  [sourceFrom]: GridPos,
  [, targetTo]: GridPos
) => targetTo === sourceFrom;

export const setGridColumn = (
  target: string | HTMLElement,
  [from, to]: GridPos
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el.style.setProperty("grid-column", `${from}/${to}`);
};

export const setGridRow = (
  target: string | HTMLElement,
  [from, to]: GridPos
) => {
  const el =
    typeof target === "string"
      ? (document.getElementById(target) as HTMLElement)
      : target;
  el.style.setProperty("grid-row", `${from}/${to}`);
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
