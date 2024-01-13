import { getColumns, getRows } from "./grid-dom-utils";
import {
  AdjacentItems,
  collectItemsByColumnPosition,
  collectItemsByRowPosition,
  occupySameTrack,
} from "./grid-layout-utils";
import { getEmptyExtents, getGridMatrix } from "./grid-matrix";

export type GridLayoutModelPosition = {
  end: number;
  start: number;
};

export type ResizeState = {
  adjacentItems: AdjacentItems;
  cols: number[];
  simpleResize: boolean;
  grid: HTMLElement;
  indexOfPrimaryResizeTrack: number;
  indexOfSecondaryResizeTrack: number;
  mousePos: number;
  resizeOperation: GridLayoutResizeOperation | null;
  resizeElement: HTMLElement;
  resizeDirection: GridLayoutResizeDirection;
  resizeItem: IGridLayoutModelItem;
  rows: number[];
  splitterAlign: SplitterAlign;
  splitterElement: HTMLElement;
};

export type GridLayoutResizeOperation = "contract" | "expand";
export type SplitterAlign = "start" | "end";
export type GridLayoutResizeDirection = "vertical" | "horizontal";
export type GridLayoutRelativePosition =
  | "aboveInSameColumn"
  | "belowInSameColumn"
  | "rightInSameRow"
  | "leftInSameRow";
export type GridLayoutTrack = "column" | "row";
export type GridLayoutModelItemResizeable = "h" | "v" | "vh";

export interface IGridLayoutModelItem {
  closeable?: boolean;
  column: GridLayoutModelPosition;
  id: string;
  resizeable?: GridLayoutModelItemResizeable;
  row: GridLayoutModelPosition;
}

export interface ISplitter extends IGridLayoutModelItem {
  align: SplitterAlign;
  controls: string;
  orientation: GridLayoutResizeDirection;
}

export class GridLayoutModelItem implements IGridLayoutModelItem {
  column: GridLayoutModelPosition;
  id: string;
  row: GridLayoutModelPosition;
  constructor(
    id: string,
    column: GridLayoutModelPosition,
    row: GridLayoutModelPosition
  ) {
    this.id = id;
    this.column = column;
    this.row = row;
  }
}

type GridItemIndex = Map<string, IGridLayoutModelItem>;
type GridItemMap = Map<number, IGridLayoutModelItem[]>;
type GridItemMaps = {
  end: GridItemMap;
  start: GridItemMap;
};

type GridItemUpdate = [string, GridLayoutModelPosition];

const flipDirection = (resizeDirection: GridLayoutResizeDirection) =>
  resizeDirection === "horizontal" ? "vertical" : "horizontal";

const storeMapValue = (
  map: GridItemMap,
  key: number,
  value: IGridLayoutModelItem
) => {
  const values = map.get(key);
  if (values) {
    values.push(value);
  } else {
    map.set(key, [value]);
  }
};

const clearMapValue = (
  map: GridItemMap,
  key: number,
  value: IGridLayoutModelItem
) => {
  const values = map.get(key);
  if (values && values.includes(value)) {
    if (values.length === 1) {
      map.delete(key);
    } else {
      map.set(
        key,
        values.filter((v) => v !== value)
      );
    }
    values.push(value);
  } else {
    throw Error("GridLayoutModel.clearMapValue, map does not include value");
  }
};

const removeMapValue = (
  map: GridItemMap,
  key: number,
  value: IGridLayoutModelItem
) => {
  const values = map.get(key);
  if (values?.includes(value)) {
    if (values.length === 1) {
      map.delete(key);
    } else {
      map.set(
        key,
        values.filter((i) => i !== value)
      );
    }
  }
};

const getFullPosition = (
  items: IGridLayoutModelItem[],
  track: GridLayoutTrack
): [number, number] => {
  return [
    Math.min(...items.map((i) => i[track].start)),
    Math.max(...items.map((i) => i[track].end)),
  ];
};

const fillSameTrack = (
  { column, row }: IGridLayoutModelItem,
  contraItems: IGridLayoutModelItem[],
  track: GridLayoutTrack
) => {
  const [start, end] = getFullPosition(contraItems, track);
  if (track === "row") {
    return start === row.start && end === row.end;
  } else {
    return start === column.start && end === column.end;
  }
};

// Filter function factory for GridItems
const occupiesSameTrack =
  (
    { column, row }: IGridLayoutModelItem,
    direction: GridLayoutResizeDirection
  ) =>
  (item: IGridLayoutModelItem) => {
    if (direction === "vertical") {
      return (
        (item.column.start >= column.start && item.column.start < column.end) ||
        (item.column.end > column.start && item.column.end <= column.end)
      );
    } else {
      return (
        (item.row.start >= row.start && item.row.start < row.end) ||
        (item.row.end > row.start && item.row.end <= row.end)
      );
    }
  };

export class GridLayoutModel {
  gridItems: IGridLayoutModelItem[] = [];

  private index: GridItemIndex = new Map();

  private columnMaps: GridItemMaps = {
    start: new Map(),
    end: new Map(),
  };
  private rowMaps: GridItemMaps = {
    start: new Map(),
    end: new Map(),
  };

  private storeItem(
    maps: GridItemMaps,
    { end, start }: GridLayoutModelPosition,
    item: IGridLayoutModelItem
  ) {
    storeMapValue(maps.start, start, item);
    storeMapValue(maps.end, end, item);
  }

  private clearItemFromStore(
    maps: GridItemMaps,
    { end, start }: GridLayoutModelPosition,
    item: IGridLayoutModelItem
  ) {
    clearMapValue(maps.start, start, item);
    clearMapValue(maps.end, end, item);
  }

  private getContraItems(
    gridItem: IGridLayoutModelItem,
    direction: GridLayoutResizeDirection
  ) {
    const contraItemsBefore =
      direction === "vertical"
        ? this.rowMaps.end
            .get(gridItem.row.start)
            ?.filter(occupiesSameTrack(gridItem, direction))
        : this.columnMaps.end
            .get(gridItem.column.start)
            ?.filter(occupiesSameTrack(gridItem, direction));
    const contraItemsAfter =
      direction === "vertical"
        ? this.rowMaps.start
            .get(gridItem.row.end)
            ?.filter(occupiesSameTrack(gridItem, direction))
        : this.columnMaps.start
            .get(gridItem.column.end)
            ?.filter(occupiesSameTrack(gridItem, direction));

    return [contraItemsBefore ?? [], contraItemsAfter ?? []];
  }

  private getNextSibling(
    gridItem: IGridLayoutModelItem,
    resizeDirection: GridLayoutResizeDirection,
    position: "before" | "after"
  ) {
    const isH = resizeDirection === "horizontal";
    const isV = resizeDirection === "vertical";

    if (isV && position === "after") {
      // get column sibling(s) that start where this row ends
      const nextSiblings = this.rowMaps.start
        .get(gridItem.row.end)
        ?.filter(
          (item) =>
            item.column.start >= gridItem.column.start &&
            item.column.end <= gridItem.column.end
        );
      if (nextSiblings?.length === 1) {
        return nextSiblings[0];
      }
    } else if (isV && position === "before") {
      // get column sibling(s) that end where this row starts
      const nextSiblings = this.rowMaps.end
        .get(gridItem.row.start)
        ?.filter(
          (item) =>
            item.column.start >= gridItem.column.start &&
            item.column.end <= gridItem.column.end
        );
      if (nextSiblings?.length === 1) {
        return nextSiblings[0];
      }
    } else if (isH && position === "after") {
      // get row sibling(s) that end where this row starts
      const nextSiblings = this.columnMaps.start
        .get(gridItem.column.end)
        ?.filter(
          (item) =>
            item.row.start >= gridItem.row.start &&
            item.row.end <= gridItem.row.end
        );
      if (nextSiblings?.length === 1) {
        return nextSiblings[0];
      }
    } else if (isH && position === "before") {
      // get row sibling(s) that end where this row starts
      const nextSiblings = this.columnMaps.end
        .get(gridItem.column.start)
        ?.filter(
          (item) =>
            item.row.start >= gridItem.row.start &&
            item.row.end <= gridItem.row.end
        );
      if (nextSiblings?.length === 1) {
        return nextSiblings[0];
      }
    }
  }

  private getSiblings(
    gridItem: IGridLayoutModelItem,
    resizeDirection: GridLayoutResizeDirection
  ) {
    const preceedingSiblings = [];
    const followingSiblings = [];

    const track: GridLayoutTrack =
      resizeDirection === "horizontal" ? "column" : "row";

    if (gridItem[track].start > 1) {
      let sibling = this.getNextSibling(gridItem, resizeDirection, "before");
      while (sibling) {
        preceedingSiblings.push(sibling);
        sibling = this.getNextSibling(sibling, resizeDirection, "before");
      }
    }
    let sibling = this.getNextSibling(gridItem, resizeDirection, "after");
    while (sibling) {
      followingSiblings.push(sibling);
      sibling = this.getNextSibling(sibling, resizeDirection, "after");
    }
    return [preceedingSiblings, followingSiblings];
  }

  private setGridRow = (
    gridItemId: string,
    { start, end }: GridLayoutModelPosition
  ) => {
    const gridItem = this.index.get(gridItemId);
    if (gridItem) {
      const { start: previousStart, end: previousEnd } = gridItem.row;
      if (start !== previousStart) {
        gridItem.row.start = start;
        removeMapValue(this.rowMaps.start, previousStart, gridItem);
        storeMapValue(this.rowMaps.start, start, gridItem);
      }
      if (end !== previousEnd) {
        gridItem.row.end = end;
        removeMapValue(this.rowMaps.end, previousEnd, gridItem);
        storeMapValue(this.rowMaps.end, end, gridItem);
      }
    } else {
      throw Error(`setGridRow gridItem #${gridItemId} not found`);
    }
  };

  private setGridColumn = (
    gridItemId: string,
    { start, end }: GridLayoutModelPosition
  ) => {
    const gridItem = this.index.get(gridItemId);
    if (gridItem) {
      const { start: previousStart, end: previousEnd } = gridItem.column;

      if (start !== previousStart) {
        gridItem.column.start = start;
        removeMapValue(this.columnMaps.start, previousStart, gridItem);
        storeMapValue(this.columnMaps.start, start, gridItem);
      }
      if (end !== previousEnd) {
        gridItem.column.end = end;
        removeMapValue(this.columnMaps.end, previousEnd, gridItem);
        storeMapValue(this.columnMaps.end, end, gridItem);
      }
    } else {
      throw Error(`setGridColumn gridItem #${gridItemId} not found`);
    }
  };

  private setColExpanded = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start, end: end + 1 }];

  private setColContracted = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start, end: end - 1 }];

  private setRowExpanded = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start, end: end + 1 }];

  private setRowContracted = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start, end: end - 1 }];

  private setShiftColForward = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { start: start + 1, end: end + 1 },
  ];

  private setShiftRowForward = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { start: start + 1, end: end + 1 },
  ];

  private setShiftColBackward = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { start: start - 1, end: end - 1 },
  ];

  private setShiftRowBackward = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { start: start - 1, end: end - 1 },
  ];
  private setShiftColStartBackward = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start: start - 1, end }];

  private setShiftRowStartBackward = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start: start - 1, end }];

  //TODO we only check one sibling away, need to do this in a loop
  private findSpanOfMatchedContrasAndSiblings(
    gridItem: IGridLayoutModelItem,
    contraItems: IGridLayoutModelItem[],
    resizeDirection: GridLayoutResizeDirection = "horizontal"
  ): [number, number] | undefined {
    const track: GridLayoutTrack =
      resizeDirection === "horizontal" ? "row" : "column";
    const siblingDirection = flipDirection(resizeDirection);
    const fullSpan = getFullPosition(contraItems, track);
    if (fullSpan[0] === gridItem[track].start) {
      const siblings = [gridItem];
      // add sibling(s) below until we have a match with fullSpan
      // need to review the position, this feels counter intuitive
      const nextSibling =
        this.getNextSibling(gridItem, siblingDirection, "after") ||
        this.getNextSibling(gridItem, siblingDirection, "before");
      if (nextSibling) {
        siblings.push(nextSibling);
        const fullSiblingPos = getFullPosition(siblings, track);
        if (fullSiblingPos[1] === fullSpan[1]) {
          return fullSpan;
        }
      }
    } else if (fullSpan[1] === gridItem[track].end) {
      const siblings = [gridItem];
      const nextSibling = this.getNextSibling(
        gridItem,
        siblingDirection,
        "before"
      );
      if (nextSibling) {
        siblings.push(nextSibling);
        const fullSiblingPos = getFullPosition(siblings, track);
        if (fullSiblingPos[0] === fullSpan[0]) {
          return fullSpan;
        }
      }
    }
  }

  addGridItem(gridItem: IGridLayoutModelItem) {
    // TODO assert that item is within current columns, rows or extend these
    this.gridItems.push(gridItem);
    const { column, row } = gridItem;
    this.index.set(gridItem.id, gridItem);
    this.storeItem(this.columnMaps, column, gridItem);
    this.storeItem(this.rowMaps, row, gridItem);
  }

  removeGridItem(gridItemId: string) {
    console.log(`remove GridItem #${gridItemId}`);

    const gridItem = this.getGridItem(gridItemId);
    if (gridItem) {
      const { column, row } = gridItem;
      const indexOfDoomedItem = this.gridItems.indexOf(gridItem);
      this.gridItems.splice(indexOfDoomedItem, 1);
      this.index.delete(gridItemId);
      this.clearItemFromStore(this.columnMaps, column, gridItem);
      this.clearItemFromStore(this.rowMaps, row, gridItem);
    }

    return [[], []];
  }

  getGridItem(gridItemId: string) {
    return this.index.get(gridItemId);
  }

  fillEmptyAreas() {
    console.log("fillEmptyAreas");
    const { gridItems } = this;

    const grid = getGridMatrix(gridItems);
    const emptyExtents = getEmptyExtents(grid);
    emptyExtents.forEach((gridItem) => this.addGridItem(gridItem));
  }

  getSplitterPositions(): ISplitter[] {
    const start = performance.now();
    const splitterPositions: ISplitter[] = [];
    for (const gridItem of this.gridItems) {
      const { column, id, resizeable = "", row } = gridItem;

      // 1) Horizontal resizing - the vertically aligned splitters
      const [leftSiblings, rightSiblings] = this.getSiblings(
        gridItem,
        "horizontal"
      );

      const [contraItemsLeft, contraItemsRight] = this.getContraItems(
        gridItem,
        "horizontal"
      );
      const isResizeable = resizeable.indexOf("h") !== -1;

      if (column.start > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsLeft,
          "row"
        );

        if (contraItemsLeft.length === 0) {
          splitterPositions.push({
            align: "start",
            column,
            controls: id,
            id: `${id}-splitter-h`,
            orientation: "horizontal",
            row,
          });
        } else if (contraFillSameTrack) {
          // If we have only a single contra left and that contra is not resizeable, skip
          const { length: resizeableItemsLeft } = leftSiblings.filter(
            ({ resizeable = "" }) => resizeable.indexOf("h") !== -1
          );
          const { length: resizeableItemsRight } = rightSiblings.filter((i) =>
            i.resizeable?.match(/h/)
          );

          //TODO multipls contras need to be rolled into resizeableItemsLeft
          if (contraItemsLeft.length > 1) {
            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: `${id}-splitter-h`,
              orientation: "horizontal",
              row,
            });
          } else if (
            resizeableItemsLeft >= 1 &&
            (isResizeable || resizeableItemsRight >= 1)
          ) {
            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: `${id}-splitter-h`,
              orientation: "horizontal",
              row,
            });
          }
        } else if (contraItemsLeft.length === 1) {
          console.log(`${id} 1 contra, does not fill same track, ignore`);
        } else if (contraItemsLeft.length > 1) {
          const fullSpan = this.findSpanOfMatchedContrasAndSiblings(
            gridItem,
            contraItemsLeft,
            "horizontal"
          );
          if (fullSpan) {
            const doomedIndex = splitterPositions.findIndex(
              (s) =>
                s.align === "end" &&
                s.row.start === fullSpan[0] &&
                s.row.end === fullSpan[1]
            );
            if (doomedIndex !== -1) {
              splitterPositions.splice(doomedIndex, 1);
            }

            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: `${id}-splitter-h`,
              orientation: "horizontal",
              row: { start: fullSpan[0], end: fullSpan[1] },
            });
          }
        }
      } else if (contraItemsRight.length > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsRight,
          "row"
        );
        if (contraFillSameTrack) {
          splitterPositions.push({
            align: "end",
            column,
            controls: id,
            id: `${id}-splitter-h`,
            orientation: "horizontal",
            row,
          });
        } else {
          // TODO why do columns shift slightly when we do this ?

          const fullSpan = this.findSpanOfMatchedContrasAndSiblings(
            gridItem,
            contraItemsRight,
            "horizontal"
          );
          if (fullSpan) {
            const existingFullSpan = splitterPositions.find(
              (s) =>
                s.align === "start" &&
                s.row.start === fullSpan[0] &&
                s.row.end === fullSpan[1]
            );
            if (!existingFullSpan) {
              splitterPositions.push({
                align: "end",
                column,
                controls: id,
                id: `${id}-splitter-h`,
                orientation: "horizontal",
                row: { start: fullSpan[0], end: fullSpan[1] },
              });
            } else {
              console.log(`got one already`);
            }
          }
        }
      }

      // 2) Vertical resizing - the horizontally aligned splitters

      const [splitterId, orientation]: [string, GridLayoutResizeDirection] = [
        `${id}-splitter-v`,
        "vertical",
      ];

      const [topSiblings, bottomSiblings] = this.getSiblings(
        gridItem,
        orientation
      );

      const [contraItemsAbove, contraItemsBelow] = this.getContraItems(
        gridItem,
        orientation
      );

      const isResizeableV = resizeable.indexOf("v") !== -1;

      if (row.start > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsAbove,
          "column"
        );

        if (contraItemsAbove.length === 0) {
          splitterPositions.push({
            align: "start",
            column,
            controls: id,
            id: splitterId,
            orientation,
            row,
          });
        } else if (contraFillSameTrack) {
          // If we have only a single contra left and that contra is not resizeable, skip
          const { length: resizeableItemsAbove } = topSiblings.filter(
            ({ resizeable = "" }) => resizeable.indexOf("v") !== -1
          );
          const { length: resizeableItemsBelow } = bottomSiblings.filter((i) =>
            i.resizeable?.match(/v/)
          );
          //TODO multipls contras need to be rolled into resizeableItemsLeft
          if (contraItemsAbove.length > 1) {
            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: splitterId,
              orientation,
              row,
            });
          } else if (
            resizeableItemsAbove >= 1 &&
            (isResizeableV || resizeableItemsBelow >= 1)
          ) {
            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: splitterId,
              orientation,
              row,
            });
          }
        } else if (contraItemsAbove.length === 1) {
          console.log(`${id} 1 contra, does not fill same track, ignore`);
        } else if (contraItemsAbove.length > 1) {
          const fullSpan = this.findSpanOfMatchedContrasAndSiblings(
            gridItem,
            contraItemsAbove,
            orientation
          );
          if (fullSpan) {
            const doomedIndex = splitterPositions.findIndex(
              (s) =>
                s.align === "end" &&
                s.column.start === fullSpan[0] &&
                s.column.end === fullSpan[1]
            );
            if (doomedIndex !== -1) {
              splitterPositions.splice(doomedIndex, 1);
            }

            splitterPositions.push({
              align: "start",
              column: { start: fullSpan[0], end: fullSpan[1] },
              controls: id,
              id: splitterId,
              orientation,
              row,
            });
          }
        } else {
          console.log(`no contraItems for ${id}`);
          // throw Error(`no contraItems for ${id}`);
        }
      } else if (contraItemsBelow.length > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsBelow,
          "column"
        );
        if (contraFillSameTrack) {
          splitterPositions.push({
            align: "end",
            column,
            controls: id,
            id: splitterId,
            orientation,
            row,
          });
        } else {
          // TODO why do columns shift slightly when we do this ?
          const fullSpan = this.findSpanOfMatchedContrasAndSiblings(
            gridItem,
            contraItemsBelow,
            orientation
          );
          if (fullSpan) {
            const existingFullSpan = splitterPositions.find(
              (s) =>
                s.align === "start" &&
                s.column.start === fullSpan[0] &&
                s.column.end === fullSpan[1]
            );
            if (!existingFullSpan) {
              splitterPositions.push({
                align: "end",
                column: { start: fullSpan[0], end: fullSpan[1] },
                controls: id,
                id: splitterId,
                orientation,
                row,
              });
            }
          }
        }
      }
    }
    const end = performance.now();
    console.log(`getSplitterPositions took ${end - start}ms`, {
      splitterPositions,
    });

    return splitterPositions;
  }

  getGridItemsAdjoiningTrack(
    resizeGridItemId: string,
    resizeOrientation: GridLayoutResizeDirection,
    splitterAlign: SplitterAlign
  ): AdjacentItems {
    const items: AdjacentItems & { contraMaybe: IGridLayoutModelItem[] } = {
      contra: [],
      contraMaybe: [],
      contraOtherTrack: [],
      siblingsOtherTrack: [],
      nonAdjacent: [],
    };

    const resizeGridItem = this.gridItems.find(
      ({ id }) => id === resizeGridItemId
    );
    if (resizeGridItem === undefined) {
      throw Error("getGridItemsAdjoiningTrack gridItem not found");
    }

    const collectItems =
      resizeOrientation === "vertical"
        ? collectItemsByRowPosition
        : collectItemsByColumnPosition;

    for (const gridItem of this.gridItems) {
      if (gridItem !== resizeGridItem) {
        collectItems(resizeGridItem, gridItem, splitterAlign, items);
      }
    }

    const { contraMaybe, ...adjacentItems } = items;
    if (contraMaybe.length === 1) {
      console.log(`where do we put a single maybe contra ?`);
    } else if (contraMaybe.length > 1) {
      if (occupySameTrack(resizeGridItem, contraMaybe, resizeOrientation)) {
        items.contra.push(...contraMaybe.splice(0, contraMaybe.length));
      }
    }

    // if (Array.isArray(contraItemsMaybe) && contraItemsMaybe.length > 0) {
    //   // if  contraItemsMaybe together fill the track, they go into contraItems
    //   contraItemsOtherTrack?.push(...contraItemsMaybe);
    // }

    return adjacentItems;
  }

  repositionGridItemsforResize(
    // TODO we only need one
    resizeItem: IGridLayoutModelItem,
    adjacentItems: AdjacentItems,
    resizeDirection: GridLayoutResizeDirection,
    resizeOperation: GridLayoutResizeOperation,
    operationFlipped = false
  ): [string, GridLayoutModelPosition][] {
    // TODO is thgis dependent in splitterAlign ?
    const indexOfResizedItem =
      resizeDirection === "vertical"
        ? resizeItem.row.start - 1
        : resizeItem.column.start - 1;

    let restorativeUpdates: [string, GridLayoutModelPosition][] = [];
    const updates: [string, GridLayoutModelPosition][] = [];

    if (operationFlipped) {
      // If we're flipping directly from contract to expand
      // or vice versa, we first revert the previous operation.
      restorativeUpdates = this.restoreGridItemPositions(
        resizeItem,
        adjacentItems,
        resizeDirection,
        resizeOperation === "expand" ? "contract" : "expand"
      );
    }

    const [setExpanded, setShiftForward, setTrack]: any =
      resizeDirection === "vertical"
        ? [this.setRowExpanded, this.setShiftRowForward, this.setGridRow]
        : [this.setColExpanded, this.setShiftColForward, this.setGridColumn];

    if (resizeOperation === "expand") {
      if (adjacentItems.nonAdjacent.length > 0) {
        const targetEdge = indexOfResizedItem + 1;
        for (const item of adjacentItems.nonAdjacent) {
          const { id, column, row: gridPosition = column } = item;
          const { start, end } = gridPosition;

          if ([start, end].includes(targetEdge)) {
            updates.push([id, { start, end: end + 1 }]);
          } else if (start > targetEdge) {
            updates.push([id, { start: start + 1, end: end + 1 }]);
          }
        }
      }

      updates.push(setExpanded(resizeItem));
      adjacentItems.contraOtherTrack.forEach((item) => {
        updates.push(setExpanded(item));
      });
      adjacentItems.siblingsOtherTrack.forEach((item) => {
        updates.push(setShiftForward(item));
      });

      updates.forEach(([id, position]) => {
        setTrack(id, position);
      });
    } else {
      const [setExpanded, setShiftForward]: any =
        resizeDirection === "vertical"
          ? [this.setRowExpanded, this.setShiftRowForward]
          : [this.setColExpanded, this.setShiftColForward];

      adjacentItems.contra.forEach((item) => {
        updates.push(setExpanded(item));
      });
      updates.push(setShiftForward(resizeItem));
      adjacentItems.siblingsOtherTrack.forEach((item) => {
        updates.push(setExpanded(item));
      });
      updates.forEach(([id, position]) => {
        setTrack(id, position);
      });
    }

    if (restorativeUpdates.length > 0) {
      updates.splice(
        updates.length,
        0,
        ...restorativeUpdates.filter(
          ([id]) => updates.findIndex(([updateId]) => updateId === id) === -1
        )
      );
    }
    return updates;
  }

  restoreGridItemPositions(
    resizeItem: IGridLayoutModelItem,
    adjacentItems: AdjacentItems,
    resizeDirection: GridLayoutResizeDirection,
    anulledResizeOperation: GridLayoutResizeOperation
  ) {
    const [setContracted, setShiftBackward, setTrack]: any =
      resizeDirection === "vertical"
        ? [this.setRowContracted, this.setShiftRowBackward, this.setGridRow]
        : [this.setColContracted, this.setShiftColBackward, this.setGridColumn];

    const updates: [string, GridLayoutModelPosition][] = [];

    if (anulledResizeOperation === "contract") {
      updates.push(setShiftBackward(resizeItem));
      adjacentItems.contra.forEach((item) => {
        updates.push(setContracted(item));
      });
      adjacentItems.siblingsOtherTrack.forEach((item) => {
        updates.push(setContracted(item));
      });
    } else {
      updates.push(setContracted(resizeItem));
      adjacentItems.contraOtherTrack.forEach((item) => {
        updates.push(setContracted(item));
      });
      adjacentItems.siblingsOtherTrack.forEach((item) => {
        updates.push(setShiftBackward(item));
      });
    }

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    return updates;
  }

  /*
 When we remove a track edge, all following track edges will be reduced by 1.
 Any gridItem bound to an edge greater than the one being removed must be
 adjusted.
 */
  removeTrack(trackIndex: number, resizeDirection: GridLayoutResizeDirection) {
    const gridPosition = trackIndex + 1;
    const updates: GridItemUpdate[] = [];

    const [
      { end: endMap, start: startMap },
      setContracted,
      setShiftStartBackward,
      setTrack,
    ] =
      resizeDirection === "vertical"
        ? [
            this.rowMaps,
            this.setRowContracted,
            this.setShiftRowStartBackward,
            this.setGridRow,
          ]
        : [
            this.columnMaps,
            this.setColContracted,
            this.setShiftColStartBackward,
            this.setGridColumn,
          ];

    for (const [position, gridItems] of startMap) {
      if (position > gridPosition) {
        gridItems.forEach((item) => {
          const existingUpdate = updates.find(([id]) => id === item.id);
          if (existingUpdate) {
            existingUpdate[1].start -= 1;
          } else {
            updates.push(setShiftStartBackward(item));
          }
        });
      }
    }

    for (const [position, gridItems] of endMap) {
      if (position > gridPosition) {
        gridItems.forEach((item) => {
          const existingUpdate = updates.find(([id]) => id === item.id);
          if (existingUpdate) {
            existingUpdate[1].end -= 1;
          } else {
            updates.push(setContracted(item));
          }
        });
      }
    }

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    return updates;
  }

  flipResizeTracks(
    trackIndex: number,
    resizeDirection: GridLayoutResizeDirection
  ) {
    const trackStart = trackIndex + 1;
    const trackEnd = trackIndex + 2;
    const updates: GridItemUpdate[] = [];

    const track: GridLayoutTrack =
      resizeDirection === "vertical" ? "row" : "column";

    const [{ end: endMap, start: startMap }, setTrack] =
      resizeDirection === "vertical"
        ? [this.rowMaps, this.setGridRow]
        : [this.columnMaps, this.setGridColumn];

    for (const [position, gridItems] of startMap) {
      if (position === trackStart) {
        gridItems.forEach((item) => {
          updates.push([item.id, { start: trackEnd, end: item[track].end }]);
        });
      } else if (position === trackEnd) {
        gridItems.forEach((item) => {
          updates.push([item.id, { start: trackStart, end: item[track].end }]);
        });
      }
    }

    for (const [position, gridItems] of endMap) {
      if (position === trackEnd) {
        gridItems.forEach((item) => {
          updates.push([
            item.id,
            { start: item[track].start, end: trackStart },
          ]);
        });
      } else if (position === trackStart) {
        gridItems.forEach((item) => {
          updates.push([item.id, { start: item[track].start, end: trackEnd }]);
        });
      }
    }

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    return updates;
  }

  measureGridItemDetails({
    grid,
    cols = getColumns(grid),
    rows = getRows(grid),
    resizeElement,
    resizeDirection,
    resizeItem,
    splitterAlign = "start",
    ...rest
  }: Omit<
    ResizeState,
    | "adjacentItems"
    | "cols"
    | "indexOfPrimaryResizeTrack"
    | "indexOfSecondaryResizeTrack"
    | "resizeOperation"
    | "rows"
    | "simpleResize"
  > & {
    cols?: number[];
    rows?: number[];
  }): ResizeState {
    const adjacentItems = this.getGridItemsAdjoiningTrack(
      resizeElement.id,
      resizeDirection,
      splitterAlign
    );

    const track: GridLayoutTrack =
      resizeDirection === "horizontal" ? "column" : "row";

    const [indexOfPrimaryResizeTrack, indexOfSecondaryResizeTrack] =
      splitterAlign === "start"
        ? [resizeItem[track].start - 1, resizeItem[track].start - 2]
        : [resizeItem[track].end - 2, resizeItem[track].end - 1];

    console.log(
      `
    indexOfPrimaryResizeTrack = ${indexOfPrimaryResizeTrack}
    indexOfSecondaryResizeTrack = ${indexOfSecondaryResizeTrack},
    `,
      {
        contraItems: adjacentItems.contra,
      }
    );

    const simpleResize =
      adjacentItems.contraOtherTrack.length === 0 ||
      (adjacentItems.contra.length === 0 &&
        adjacentItems.contraOtherTrack.length > 0);

    return {
      ...rest,
      adjacentItems,
      cols,
      grid,
      indexOfPrimaryResizeTrack,
      indexOfSecondaryResizeTrack,
      resizeElement,
      resizeItem,
      resizeDirection,
      resizeOperation: null,
      rows,
      simpleResize,
      splitterAlign,
    };

    console.log({ adjacentItems, simpleResize });
  }

  toDebugString() {
    return `
      ${this.gridItems
        .map(
          ({ id, column, resizeable = "", row }) =>
            `\n${id}\t\tcol ${column.start}/${column.end}\t row ${row.start}/${row.end}\t${resizeable}`
        )
        .join("")}
    `;
  }
}
