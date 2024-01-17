import {
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
  IGridLayoutModelItem,
  SplitterAlign,
} from "./GridLayoutModel";

export type AdjacentItems = {
  contra: IGridLayoutModelItem[];
  contraOtherTrack: IGridLayoutModelItem[];
  siblingsOtherTrack: IGridLayoutModelItem[];
  nonAdjacent: IGridLayoutModelItem[];
};

export const NO_ADJACENT_ITEMS: AdjacentItems = {
  contra: [],
  contraOtherTrack: [],
  siblingsOtherTrack: [],
  nonAdjacent: [],
};

// Test if two positions occupy exactly the same track
const occupiesSameTrack = (
  { start: sourceStart, end: sourceEnd }: GridLayoutModelPosition,
  { start: targetStart, end: targetEnd }: GridLayoutModelPosition
) => targetStart === sourceStart && targetEnd === sourceEnd;

// Test if multiple items occupy exactly the same track as a single item
export const occupySameTrack = (
  resizeItem: IGridLayoutModelItem,
  items: IGridLayoutModelItem[],
  resizeOrientation: GridLayoutResizeDirection
) => {
  const position = resizeOrientation === "horizontal" ? "row" : "column";
  const resizePosition = resizeItem[position];
  const start = Math.min(...items.map((item) => item[position].start));
  const end = Math.max(...items.map((item) => item[position].end));
  return start === resizePosition.start && end === resizePosition.end;
};

// Test if target position falls entirely within source position,
// possibly filling source, but no extending beyond.
const withinSameTrack = (
  { start: sourceStart, end: sourceEnd }: GridLayoutModelPosition,
  { start: targetStart, end: targetEnd }: GridLayoutModelPosition
) => targetStart >= sourceStart && targetEnd <= sourceEnd;

// Test if target directly abuts source
const inAdjacentTrack = (
  { start: sourceStart }: GridLayoutModelPosition,
  { end: targetEnd }: GridLayoutModelPosition
) => sourceStart === targetEnd;

export const collectItemsByColumnPosition = (
  resizeGridItem: IGridLayoutModelItem,
  gridItem: IGridLayoutModelItem,
  splitterAlign: SplitterAlign,
  items: AdjacentItems & { contraMaybe: IGridLayoutModelItem[] }
) => {
  const { column: colPosition, row: rowPosition } = resizeGridItem;
  const { column: col, row } = gridItem;

  // A splitter with align start (the default) operates at the leading edge of the track, end splitters
  // operate at the trailing track edge.
  if ([col.start, col.end].includes(colPosition[splitterAlign])) {
    if (occupiesSameTrack(rowPosition, row)) {
      items.contra.push(gridItem);
    } else if (withinSameTrack(rowPosition, row)) {
      items.contraMaybe.push(gridItem);
    } else if (inAdjacentTrack(colPosition, col)) {
      items.contraOtherTrack.push(gridItem);
    } else {
      items.siblingsOtherTrack.push(gridItem);
    }
  } else {
    items.nonAdjacent.push(gridItem);
  }
};

export const collectItemsByRowPosition = (
  resizeGridItem: IGridLayoutModelItem,
  gridItem: IGridLayoutModelItem,
  splitterAlign: SplitterAlign,
  items: AdjacentItems & { contraMaybe: IGridLayoutModelItem[] }
) => {
  const { column: colPosition, row: rowPosition } = resizeGridItem;
  const { column: col, row } = gridItem;

  // A splitter with align start (the default) operates at the leading edge of the track, end splitters
  // operate at the trailing track edge.
  if ([row.start, row.end].includes(rowPosition[splitterAlign])) {
    if (occupiesSameTrack(colPosition, col)) {
      items.contra.push(gridItem);
    } else if (withinSameTrack(colPosition, col)) {
      items.contraMaybe.push(gridItem);
    } else if (inAdjacentTrack(rowPosition, row)) {
      items.contraOtherTrack.push(gridItem);
    } else {
      items.siblingsOtherTrack.push(gridItem);
    }
  } else {
    items.nonAdjacent.push(gridItem);
  }
};
