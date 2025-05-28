import {
  GridLayoutDropPosition,
  GridLayoutSplitDirection,
} from "@finos/vuu-utils";
import {
  GridItemUpdate,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
} from "./GridLayoutModel";
import {
  GridLayoutChildItemDescriptor,
  GridLayoutModelCoordinates,
  GridModelChildItem,
  GridModelCoordinates,
  ISplitter,
  TrackType,
} from "./GridModel";

/**
 * Given an array of track sizes, split the value at the indicated
 * index position by inserting a new value.  If the new value has
 * a non zero size, reduce the original value by same amount, so
 * combined size remains the same.
 * @param tracks ,
 * @param trackIndex
 * @param size
 */
const insertTrack = (tracks: number[], trackIndex: number, size = 0) => {
  if (tracks[trackIndex] < size) {
    throw Error(
      `insertTrack target track ${tracks[trackIndex]} is not large enough to accommodate new track ${size}`,
    );
  }
  return tracks.reduce<number[]>((list, track, i) => {
    if (i === trackIndex) {
      list.push(size);
      track -= size;
    }
    list.push(track);
    return list;
  }, []);
};

export const splitTrack = (tracks: number[], trackIndex: number) => {
  const sizeOfNewTrack = Math.floor(tracks[trackIndex] / 2);
  return insertTrack(tracks, trackIndex, sizeOfNewTrack);
};

export type ContrasAndSiblings = {
  contras: GridModelChildItem[];
  position: GridLayoutModelPosition;
  siblings: GridModelChildItem[];
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
  targetGridItem: GridModelChildItem,
  siblings: GridModelChildItem[],
  contras: GridModelChildItem[],
): ContrasAndSiblings | undefined => {
  const { column } = targetGridItem;
  const startCol = column.start;

  let siblingIndex = 0;
  let contraIndex = 0;

  const contrasOut: GridModelChildItem[] = [];
  const siblingsOut: GridModelChildItem[] = [targetGridItem];

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
  gridItem: GridModelChildItem,
  siblings: GridModelChildItem[],
  contras: GridModelChildItem[],
): ContrasAndSiblings | undefined => {
  const { row } = gridItem;
  const startRow = row.start;

  let siblingIndex = 0;
  let contraIndex = 0;

  const contrasOut: GridModelChildItem[] = [];
  const siblingsOut: GridModelChildItem[] = [gridItem];

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
  splitter: ISplitter,
) => {
  const potentialCandidates = splitters.filter(
    ({ id, orientation }) =>
      orientation === splitter.orientation && id !== splitter.id,
  );

  if (potentialCandidates.length > 0) {
    const track = splitter.orientation === "horizontal" ? "column" : "row";
    const {
      [track]: { start: splitterStart },
    } = splitter;
    return potentialCandidates.some(
      ({ [track]: { start } }) => start === splitterStart,
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
  item1: GridModelChildItem,
  item2: GridModelChildItem,
) => {
  return item1.column.start - item2.column.start;
};

export const byRowStart = (
  item1: GridModelChildItem,
  item2: GridModelChildItem,
) => {
  return item1.row.start - item2.row.start;
};

export const gridResizeDirectionFromDropPosition = (
  dropPosition: GridLayoutDropPosition,
): GridLayoutResizeDirection =>
  dropPosition === "north" || dropPosition === "south"
    ? "vertical"
    : "horizontal";

const gridLayoutPositionComparator = (
  p1: GridLayoutModelPosition,
  p2: GridLayoutModelPosition,
) => {
  if (p1.start < p2.start) {
    return -1;
  } else if (p1.start > p2.start) {
    return 1;
  } else if (p1.end < p2.end) {
    return -1;
  } else if (p1.end > p2.end) {
    return 1;
  }
  return 0;
};
export const byColumnPosition = (
  { column: pos1 }: GridModelChildItem,
  { column: pos2 }: GridModelChildItem,
) => gridLayoutPositionComparator(pos1, pos2);

export const byRowPosition = (
  { row: pos1 }: GridModelChildItem,
  { row: pos2 }: GridModelChildItem,
) => gridLayoutPositionComparator(pos1, pos2);

export const itemsFillColumn = (
  items: GridModelChildItem[],
  pos: GridLayoutModelPosition,
) => {
  const sortedItems = items.sort(byColumnPosition);
  const firstItem = sortedItems.at(0);
  const lastItem = sortedItems.at(-1);
  if (firstItem && lastItem) {
    const {
      column: { start },
    } = firstItem;
    const {
      column: { end },
    } = lastItem;
    if (start === pos.start && end === pos.end) {
      for (let i = 1; i < sortedItems.length; i++) {
        const prevItem = sortedItems[i - 1];
        const currentItem = sortedItems[i];
        if (prevItem.column.end !== currentItem.column.start) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
};
export const itemsFillRow = (
  items: GridModelChildItem[],
  row: GridLayoutModelPosition,
) => {
  const sortedItems = items.sort(byRowPosition);
  const firstItem = sortedItems.at(0);
  const lastItem = sortedItems.at(-1);
  if (firstItem && lastItem) {
    const {
      row: { start },
    } = firstItem;
    const {
      row: { end },
    } = lastItem;
    if (start === row.start && end === row.end) {
      for (let i = 1; i < sortedItems.length; i++) {
        const prevItem = sortedItems[i - 1];
        const currentItem = sortedItems[i];
        if (prevItem.row.end !== currentItem.row.start) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
};

/**
 * This assumes that tracks have already been prepared, such that 'position'
 * spans at least two tracks in the split direction
 *
 * @param position
 * @param splitDirection
 * @returns [droppedItemPosition, targetPosition]
 */
export const splitGridChildPosition = (
  {
    column: { start: colStart, end: colEnd },
    row: { start: rowStart, end: rowEnd },
  }: GridLayoutModelCoordinates,
  splitDirection: GridLayoutSplitDirection,
  splitTrackIndex: number,
): [GridLayoutModelCoordinates, GridLayoutModelCoordinates] => {
  const droppedPosition = {
    column: { start: colStart, end: colEnd },
    row: { start: rowStart, end: rowEnd },
  };
  const targetPosition = {
    column: { start: colStart, end: colEnd },
    row: { start: rowStart, end: rowEnd },
  };

  console.log(`split at ${splitTrackIndex}`);

  switch (splitDirection) {
    case "north":
      return [
        {
          ...droppedPosition,
          row: {
            start: rowStart,
            end: splitTrackIndex,
          },
        },
        {
          ...targetPosition,
          row: {
            start: splitTrackIndex,
            end: rowEnd,
          },
        },
      ];
    case "east":
      return [
        {
          ...droppedPosition,
          column: {
            start: splitTrackIndex,
            end: colEnd,
          },
        },
        {
          ...targetPosition,
          column: {
            start: colStart,
            end: splitTrackIndex,
          },
        },
      ];
    case "south":
      return [
        {
          ...droppedPosition,
          row: {
            start: splitTrackIndex,
            end: rowEnd,
          },
        },
        {
          ...targetPosition,
          row: {
            start: rowStart,
            end: splitTrackIndex,
          },
        },
      ];
    case "west":
      return [
        {
          ...droppedPosition,
          column: {
            start: colStart,
            end: splitTrackIndex,
          },
        },
        {
          ...targetPosition,
          column: {
            start: splitTrackIndex,
            end: colEnd,
          },
        },
      ];
  }
};

export const isFixedHeightChildItem = (item: GridModelChildItem) =>
  item.resizeable === false || item.resizeable === "h";
export const isFixedWidthChildItem = (item: GridModelChildItem) =>
  item.resizeable === false || item.resizeable === "v";

export const getGridArea = ({ column, row }: GridLayoutModelCoordinates) =>
  `${row.start}/${column.start}/${row.end}/${column.end}`;

export const getActiveIndex = (childItems: GridModelChildItem[]) => {
  const index = childItems.findIndex((item) => item.contentVisible);
  if (childItems.length === 0) {
    return -1;
  } else if (index === -1) {
    return 0;
  } else {
    return index;
  }
};

export const getSharedGridPosition = (
  childItems: GridModelChildItem[],
): GridLayoutModelCoordinates => {
  const [{ column, row }, ...rest] = childItems;
  if (rest.length > 0) {
    if (
      rest.some(
        ({ column: c, row: r }) =>
          c.start !== column.start ||
          c.end !== column.end ||
          r.start !== row.start ||
          r.end !== row.end,
      )
    ) {
      throw Error(
        "grid-layout-utils] getSharedGridPosition not all child grid items hae same GridLayoutModelCoordinates",
      );
    }
  }
  return { column, row };
};

export const getGridPosition = (
  gridArea: GridLayoutChildItemDescriptor["gridArea"],
): GridModelCoordinates => {
  if (typeof gridArea === "string") {
    const [rowStart, colStart, rowEnd, colEnd] = gridArea
      .split("/")
      .map((val) => parseInt(val, 10));
    return {
      column: { start: colStart, end: colEnd },
      row: { start: rowStart, end: rowEnd },
    };
  } else {
    throw Error(`[grid-layout-utils] getGridPosition gridArea  must be valid`);
  }
};

export const getTrackType = (splitter: ISplitter): TrackType =>
  splitter.orientation === "vertical" ? "row" : "column";

export const setTrackStart = (
  trackType: TrackType,
  gridItem: GridModelChildItem,
  adjustment = 1,
): GridItemUpdate => {
  const {
    id,
    [trackType]: { start, end },
  } = gridItem;
  return [
    id,
    {
      [trackType]: { start: start + adjustment, end },
    },
  ];
};

export const setTrackEnd = (
  trackType: TrackType,
  gridItem: GridModelChildItem,
  adjustment = 1,
): GridItemUpdate => {
  const {
    id,
    [trackType]: { start, end },
  } = gridItem;
  return [
    id,
    {
      [trackType]: { start, end: end + adjustment },
    },
  ];
};

export const setColumnEnd = (gridItem: GridModelChildItem): GridItemUpdate =>
  setTrackEnd("column", gridItem);

export const setRowEnd = (gridItem: GridModelChildItem): GridItemUpdate =>
  setTrackEnd("row", gridItem);

export const moveColumn = ({
  id,
  column: { start, end },
}: GridModelChildItem): GridItemUpdate => [
  id,
  { column: { start: start + 1, end: end + 1 } },
];

export const moveRow = ({
  id,
  row: { start, end },
}: GridModelChildItem): GridItemUpdate => [
  id,
  { row: { start: start + 1, end: end + 1 } },
];
