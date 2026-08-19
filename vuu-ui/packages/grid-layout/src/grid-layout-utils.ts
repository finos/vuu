import type {
  GridLayoutChildItemDescriptor,
  GridLayoutModelCoordinates,
  GridModelChildItem,
  GridModelCoordinates,
  ISplitter,
  TrackType,
} from "./GridModel";

/**
 * Geometry and track algorithms live in GridGeometry, which is pure and
 * immutable. The helpers here bridge the runtime (React/DOM) layer to the
 * mutable model instances.
 */

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
