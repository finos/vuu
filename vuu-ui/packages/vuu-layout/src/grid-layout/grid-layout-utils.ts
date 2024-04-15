import {
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
  IGridLayoutModelItem,
  SplitterAlign,
} from "./GridLayoutModel";

export type AdjacentItems = {
  contra: IGridLayoutModelItem[];
  contraOtherTrack: IGridLayoutModelItem[];
  siblings: IGridLayoutModelItem[];
};

export const NO_ADJACENT_ITEMS: AdjacentItems = {
  contra: [],
  contraOtherTrack: [],
  siblings: [],
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
      items.siblings.push(gridItem);
    }
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
      items.siblings.push(gridItem);
    }
  }
};

export const splitTrack = (tracks: number[], trackIndex: number) => {
  const size = tracks[trackIndex];
  const newTracks = tracks.slice();
  newTracks.splice(trackIndex, 0, 0);
  newTracks[trackIndex] = Math.floor(size / 2);
  newTracks[trackIndex + 1] = Math.ceil(size / 2);
  return newTracks;
};

/**
 *
 * @param tracks Create a new track such that we have a trackEdge that bisects
 * the two trackEdges provided. The start and end trackEdges should not be contiguous
 * otherwise splitTrack should be used instead.
 * @param start the leading trackEdge of the range
 * @param end the trailing trackEdge of range
 */
//TODO what if there is an existing track that bisects range
export const splitTracks = (tracks: number[], start: number, end: number) => {
  let size = 0;
  for (let i = start - 1; i < end - 1; i++) {
    size += tracks[i];
  }
  let halfTrack = Math.floor(size / 2);
  let newTrackIndex = 0;

  const newTracks = [];
  for (let i = 0; i < tracks.length; i++) {
    if (i < start - 1) {
      newTracks.push(tracks[i]);
    } else if (i < end - 1) {
      if (tracks[i] < halfTrack) {
        newTracks.push(tracks[i]);
        halfTrack -= tracks[i];
      } else if (halfTrack) {
        newTrackIndex = newTracks.length;
        newTracks.push(halfTrack);
        newTracks.push(tracks[i] - halfTrack);
        halfTrack = 0;
      } else {
        newTracks.push(tracks[i]);
      }
    } else {
      newTracks.push(tracks[i]);
    }
  }

  return { newTrackIndex, newTracks };
};

/**
 *
 * @param tracks the track sizes
 * @param start the start track Edge (1 based)
 * @param end the end track edge (1 based)
 * @returns
 */
export const getBisectingTrackEdge = (
  tracks: number[],
  start: number,
  end: number
) => {
  if (end - start > 1) {
    // Total the sizes between start and end
    // find the half way point
    // see if an existing edge occurs at that point (or wiuthin .5 pixesl, if decimal)
  }
  let size = 0;
  for (let i = start - 1; i < end - 1; i++) {
    size += tracks[i];
  }
  const halfSize = size / 2;

  size = 0;
  for (let i = start - 1; i < end - 1; i++) {
    size += tracks[i];
    if (Math.abs(halfSize - size) < 1) {
      return i + 2;
    }
  }
  return -1;
};

export type ContrasAndSiblings = {
  contras: IGridLayoutModelItem[];
  position: GridLayoutModelPosition;
  siblings: IGridLayoutModelItem[];
};

/**
 * Siblings are gridLayoutItem(s) starting on same trackEdge as
 * gridItem. Contras are gridLayoutItems ending on same trackEdge
 * as gridItem.
 * We are measuring here for a horizontal splitter,siblings are
 * gridItems to the immediate right of gridItem, contras are
 * gridItems ending in the row immediately above gridItem.
 * @param gridLayoutItem
 * @param siblings 0 or more siblings
 * @param contras 1 or more contras
 * @returns
 */
export const getMatchingColspan = (
  targetGridItem: IGridLayoutModelItem,
  siblings: IGridLayoutModelItem[],
  contras: IGridLayoutModelItem[]
): ContrasAndSiblings | undefined => {
  const { column } = targetGridItem;
  const startCol = column.start;

  let siblingIndex = 0;
  let contraIndex = 0;

  const contrasOut: IGridLayoutModelItem[] = [];
  const siblingsOut: IGridLayoutModelItem[] = [];

  const targetAndSiblings = [targetGridItem].concat(siblings);

  while (
    siblingIndex < targetAndSiblings.length &&
    contraIndex < contras.length
  ) {
    // gridItem may span multiple columns, and may have no siblings
    const sibling = targetAndSiblings[siblingIndex];
    const contra = contras[contraIndex];
    const end = Math.max(contra.column.end, sibling.column.end);

    if (contra.column.end === end && sibling.column.end === end) {
      contrasOut.push(contras[contraIndex]);
      return {
        contras: contrasOut,
        position: { start: startCol, end },
        siblings: siblingsOut,
      };
    } else if (contra.column.end < end) {
      contrasOut.push(contras[contraIndex]);
      contraIndex += 1;
    } else {
      siblingsOut.push(siblings[siblingIndex]);
      siblingIndex += 1;
    }
  }
};

/**
 * Siblings are gridLayoutItem(s) starting on same trackEdge as
 * gridItem. Contras are gridLayoutItems ending on same trackEdge
 * as gridItem.
 * We are measuring here for a vertical splitter,siblings are
 * gridItems immediately below gridItem, contras are
 * gridItems ending in the col immediately left of gridItem.
 * @param gridLayoutItem
 * @param siblings 0 or more siblings
 * @param contras 1 or more contras
 * @returns
 */
export const getMatchingRowspan = (
  gridItem: IGridLayoutModelItem,
  siblings: IGridLayoutModelItem[],
  contras: IGridLayoutModelItem[]
): ContrasAndSiblings | undefined => {
  const { row } = gridItem;
  const startRow = row.start;

  let siblingIndex = 0;
  let contraIndex = 0;

  const allSiblings = [gridItem].concat(siblings);

  while (siblingIndex < allSiblings.length && contraIndex < contras.length) {
    // gridItem may span multiple columns, and may have no siblings
    const sibling = allSiblings[siblingIndex];
    const contra = contras[contraIndex];
    const end = Math.max(contra.row.end, sibling.row.end);

    if (contra.row.end === end && sibling.row.end === end) {
      return { position: { start: startRow, end: end } };
    } else if (contra.row.end < end) {
      contraIndex += 1;
    } else {
      siblingIndex += 1;
    }
  }
};
