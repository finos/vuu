import {
  ContraItem,
  ContraItemOtherColumn,
  GridItem,
  GridPos,
  SiblingItemOtherColumn,
} from "./grid-layout-types";

export type ResizeDirection = "shrink" | "expand";

export type ResizeOrientation = "horizontal" | "vertical";

export const getColumns = (el: HTMLElement) =>
  getComputedStyle(el)
    .getPropertyValue("grid-template-columns")
    .split(" ")
    .map((value) => parseInt(value, 10));

export const getRows = (el: HTMLElement) =>
  getComputedStyle(el)
    .getPropertyValue("grid-template-rows")
    .split(" ")
    .map((value) => parseInt(value, 10));

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

export const getRow = (el: HTMLElement): GridPos => {
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
  contraItems: GridItem[],
  contraItemsMaybe: GridItem[],
  contraItemsOtherTrack: GridItem[],
  siblingItemsOtherTrack: GridItem[]
) => {
  const { id } = element;
  const row = getRow(element);
  const col = getColumn(element);

  console.log(`related item  (${id}) at row ${row} column ${col}`);
  // The splitter always operates at the leading column
  if (col.includes(colPosition[0])) {
    if (occupiesSameTrack(rowPosition, row)) {
      console.log(`${id} is contra-resize item`);
      contraItems.push({ id, col: new ContraItem(col) });
    } else if (withinSameTrack(rowPosition, row)) {
      console.log(`${id} is maybe a contra-resize item`);
      contraItemsMaybe.push({ id, col: new ContraItem(col) });
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
  }
};

const collectRowItems = (
  colPosition: GridPos,
  rowPosition: GridPos,
  element: HTMLElement,
  contraItems: GridItem[],
  contraItemsMaybe: GridItem[],
  contraItemsOtherTrack: GridItem[],
  siblingItemsOtherTrack: GridItem[]
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
  }
};

export const getGridItemsAdjoiningTrack = (
  grid: HTMLElement,
  targetElement: HTMLElement,
  resizeOrientation: ResizeOrientation
): [GridItem[], GridItem[], GridItem[], GridItem[]] | [GridItem[]] => {
  const contraItems: GridItem[] = [];
  const contraItemsMaybe: GridItem[] = [];
  const contraItemsOtherTrack: GridItem[] = [];
  const siblingItemsOtherTrack: GridItem[] = [];

  const rowPosition = getRow(targetElement);
  const colPosition = getColumn(targetElement);

  const collectItems =
    resizeOrientation === "vertical" ? collectRowItems : collectColItems;

  for (const node of grid.childNodes) {
    if (node !== targetElement) {
      collectItems(
        colPosition,
        rowPosition,
        node as HTMLElement,
        contraItems,
        contraItemsMaybe,
        contraItemsOtherTrack,
        siblingItemsOtherTrack
      );
    }
  }
  if (contraItemsOtherTrack.length === 0) {
    return [contraItems];
  } else {
    return [
      contraItems,
      contraItemsMaybe,
      contraItemsOtherTrack,
      siblingItemsOtherTrack,
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
