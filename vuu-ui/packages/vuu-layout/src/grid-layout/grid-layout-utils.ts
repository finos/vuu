import {
  GridLayoutModelItem,
  GridLayoutModelPosition,
  IGridLayoutModelItem,
  ISplitter,
} from "./GridLayoutModel";

/**
 * Given an array of track sizes, split the value at the indicated
 * index position by inserting a new value.  If the new value has
 * a non zero size, reduce the original value by same amount, so
 * combined size remains the same.
 * @param tracks ,
 * @param trackIndex
 * @param size
 */
export const insertTrack = (tracks: number[], trackIndex: number, size = 0) => {
  if (tracks[trackIndex] < size) {
    throw Error(
      `insertTrack target track ${tracks[trackIndex]} is not large enough to accommodate new track ${size}`
    );
  }
  return tracks.reduce((list, track, i) => {
    if (i === trackIndex) {
      list.push(size);
      track -= size;
    }
    list.push(track);
    return list;
  }, [] as number[]);
};

export const splitTrack = (tracks: number[], trackIndex: number) => {
  const sizeOfNewTrack = Math.floor(tracks[trackIndex] / 2);
  return insertTrack(tracks, trackIndex, sizeOfNewTrack);
};

export const removeTrackFromTracks = (
  tracks: number[],
  trackIndex: number,
  assignDirection: "bwd" | "fwd" = "fwd"
) => {
  if (trackIndex === tracks.length - 1) {
    const lastValue = tracks.at(-1) as number;
    const penultimateValue = tracks.at(-2) as number;
    const newTracks = tracks.slice(0, -1);
    newTracks[newTracks.length - 1] = penultimateValue + lastValue;
    return newTracks;
  } else if (trackIndex === 0) {
    const [firstValue, secondValue] = tracks;
    const newTracks = tracks.slice(1);
    newTracks[0] = firstValue + secondValue;
    return newTracks;
  } else {
    const value1 = tracks.at(trackIndex) as number;
    const newTracks = tracks.filter((_track, index) => index !== trackIndex);
    if (assignDirection === "fwd") {
      const value2 = tracks.at(trackIndex + 1) as number;
      newTracks[trackIndex] = value1 + value2;
    } else {
      const value2 = tracks.at(trackIndex - 1) as number;
      newTracks[trackIndex - 1] = value1 + value2;
    }
    return newTracks;
  }
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
 * @param startLine the start grid Line (column line or row Line)
 * @param endLine the end grid Line (column line or row Line)
 * @returns
 */
export const getBisectingGridLine = (
  tracks: number[],
  startLine: number,
  endLine: number
) => {
  if (endLine - startLine > 1) {
    // Total the sizes between start and end
    // find the half way point
    // see if an existing edge occurs at that point (or wiuthin .5 pixesl, if decimal)
  }
  let size = 0;
  for (let i = startLine - 1; i < endLine - 1; i++) {
    size += tracks[i];
  }
  const halfSize = size / 2;

  size = 0;
  for (let i = startLine - 1; i < endLine - 1; i++) {
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

  const contrasOut: IGridLayoutModelItem[] = [];
  const siblingsOut: IGridLayoutModelItem[] = [];

  const targetAndSiblings = [gridItem].concat(siblings);

  while (
    siblingIndex < targetAndSiblings.length &&
    contraIndex < contras.length
  ) {
    // gridItem may span multiple rows, and may have no siblings
    const sibling = targetAndSiblings[siblingIndex];
    const contra = contras[contraIndex];
    const end = Math.max(contra.row.end, sibling.row.end);

    if (contra.row.end === end && sibling.row.end === end) {
      contrasOut.push(contras[contraIndex]);
      return {
        contras: contrasOut,
        position: { start: startRow, end: end },
        siblings: siblingsOut,
      };
    } else if (contra.row.end < end) {
      contrasOut.push(contras[contraIndex]);
      contraIndex += 1;
    } else {
      siblingsOut.push(siblings[siblingIndex]);
      siblingIndex += 1;
    }
  }
};

/**
 * Resize requires new track if the splitter being used for resize is on the same
 * trackEdge as another splitter
 *
 * @param splitters
 * @param splitter
 * @returns
 */
export const doesResizeRequireNewTrack = (
  splitters: ISplitter[],
  splitter: ISplitter
) => {
  const potentialCandidates = splitters.filter(
    ({ id, orientation }) =>
      orientation === splitter.orientation && id !== splitter.id
  );

  if (potentialCandidates.length > 0) {
    const track = splitter.orientation === "horizontal" ? "column" : "row";
    const {
      [track]: { start: splitterStart },
    } = splitter;
    return potentialCandidates.some(
      ({ [track]: { start } }) => start === splitterStart
    );
  }
  return false;
};

/**
 *
 * @param moveBy positive or negative number
 * @param adjustmentAmount positive number, never greater than abs(moveBy)
 * @returns
 */
export const adjustDistance = (moveBy: number, adjustmentAmount: number) => {
  if (moveBy < 0) {
    return moveBy + adjustmentAmount;
  } else {
    return moveBy - adjustmentAmount;
  }
};

export const byColumnStart = (
  item1: GridLayoutModelItem,
  item2: GridLayoutModelItem
) => {
  return item1.column.start - item2.column.start;
};

export const byRowStart = (
  item1: GridLayoutModelItem,
  item2: GridLayoutModelItem
) => {
  return item1.row.start - item2.row.start;
};
