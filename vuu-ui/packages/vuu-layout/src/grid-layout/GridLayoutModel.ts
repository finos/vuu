import {
  AdjacentItems,
  collectItemsByColumnPosition,
  collectItemsByRowPosition,
  occupySameTrack,
} from "./grid-layout-utils";

export type GridLayoutModelPosition = {
  end: number;
  start: number;
};

export interface IGridLayoutModelItem {
  column: GridLayoutModelPosition;
  id: string;
  row: GridLayoutModelPosition;
}

export type GridLayoutResizeOperation = "contract" | "expand";
export type SplitterAlign = "start" | "end";
export type GridLayoutResizeDirection = "vertical" | "horizontal";
export type GridLayoutRelativePosition =
  | "aboveInSameColumn"
  | "belowInSameColumn"
  | "rightInSameRow"
  | "leftInSameRow";
export type GridLayoutTrack = "column" | "row";

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
    colFrom: number,
    colTo: number,
    rowFrom: number,
    rowTo: number
  ) {
    this.id = id;
    this.column = { start: colFrom, end: colTo };
    this.row = { start: rowFrom, end: rowTo };
  }
}

type GridItemIndex = Map<string, IGridLayoutModelItem>;
type GridItemMap = Map<number, IGridLayoutModelItem[]>;
type GridItemMaps = {
  end: GridItemMap;
  start: GridItemMap;
};

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
  columnCount: number;
  gridItems: IGridLayoutModelItem[] = [];
  rowCount: number;

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

  // TODO sort out the use of position here, its all messed up
  private getNextSibling(
    gridItem: IGridLayoutModelItem,
    position: GridLayoutRelativePosition
  ) {
    if (position === "belowInSameColumn") {
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
    } else if (position === "aboveInSameColumn") {
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
    } else if (position === "rightInSameRow") {
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
    } else if (position === "leftInSameRow") {
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
  }: IGridLayoutModelItem) => [id, { start, end: end + 1 }];

  private setColContracted = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem) => [id, { start, end: end - 1 }];

  private setRowExpanded = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem) => [id, { start, end: end + 1 }];

  private setRowContracted = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem) => [id, { start, end: end - 1 }];

  private setShiftColForward = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem) => [id, { start: start + 1, end: end + 1 }];

  private setShiftRowForward = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem) => [id, { start: start + 1, end: end + 1 }];

  private setShiftColBackward = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem) => [id, { start: start - 1, end: end - 1 }];

  private setShiftRowBackward = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem) => [id, { start: start - 1, end: end - 1 }];

  //TODO we only check one sibling away, need to do this in a loop
  private findMatchingContras(
    gridItem: IGridLayoutModelItem,
    contraItems: IGridLayoutModelItem[],
    resizeDirection: GridLayoutResizeDirection = "horizontal"
  ): [number, number] | undefined {
    const [track, position, contraPosition]: [
      GridLayoutTrack,
      GridLayoutRelativePosition,
      GridLayoutRelativePosition
    ] =
      resizeDirection === "horizontal"
        ? ["row", "belowInSameColumn", "aboveInSameColumn"]
        : ["column", "rightInSameRow", "leftInSameRow"];
    const fullSpan = getFullPosition(contraItems, track);
    if (fullSpan[0] === gridItem[track].start) {
      const siblings = [gridItem];
      // add sibling(s) below until we have a match with fullSpan
      // need to review the position, this feels counter intuitive
      const nextSibling =
        this.getNextSibling(gridItem, position) ||
        this.getNextSibling(gridItem, contraPosition);
      if (nextSibling) {
        siblings.push(nextSibling);
        const fullSiblingPos = getFullPosition(siblings, track);
        if (fullSiblingPos[1] === fullSpan[1]) {
          return fullSpan;
        }
      }
    } else if (fullSpan[1] === gridItem[track].end) {
      const siblings = [gridItem];
      const nextSibling = this.getNextSibling(gridItem, contraPosition);
      if (nextSibling) {
        siblings.push(nextSibling);
        const fullSiblingPos = getFullPosition(siblings, track);
        if (fullSiblingPos[0] === fullSpan[0]) {
          return fullSpan;
        }
      }
    }
  }

  constructor(columns: number, rows: number) {
    this.columnCount = columns;
    this.rowCount = rows;
  }

  addGridItem(gridItem: IGridLayoutModelItem) {
    // TODO assert that item is within current columns, rows or extend these
    this.gridItems.push(gridItem);
    const { column, row } = gridItem;
    this.index.set(gridItem.id, gridItem);
    this.storeItem(this.columnMaps, column, gridItem);
    this.storeItem(this.rowMaps, row, gridItem);
  }

  getGridItem(gridItemId: string) {
    return this.index.get(gridItemId);
  }

  getSplitterPositions(): ISplitter[] {
    const splitterPositions: ISplitter[] = [];
    for (const gridItem of this.gridItems) {
      const { column, id, row } = gridItem;

      // First a horizontal resize
      const [contraItemsLeft, contraItemsRight] = this.getContraItems(
        gridItem,
        "horizontal"
      );

      if (column.start > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsLeft,
          "row"
        );

        if (contraFillSameTrack) {
          splitterPositions.push({
            align: "start",
            column,
            controls: id,
            id: `${id}-splitter-h`,
            orientation: "horizontal",
            row,
          });
        } else if (contraItemsLeft.length === 1) {
          console.log(`${id} 1 contra, does not fill same track, ignore`);
        } else if (contraItemsLeft.length > 1) {
          const fullSpan = this.findMatchingContras(
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
        } else {
          throw Error(`no contraItems for ${id}`);
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

          const fullSpan = this.findMatchingContras(
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

      // ...then vertical resize
      const [contraItemsAbove, contraItemsBelow] = this.getContraItems(
        gridItem,
        "vertical"
      );

      if (row.start > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsAbove,
          "column"
        );

        if (contraFillSameTrack) {
          splitterPositions.push({
            align: "start",
            column,
            controls: id,
            id: `${id}-splitter-v`,
            orientation: "vertical",
            row,
          });
        } else if (contraItemsAbove.length === 1) {
          console.log(`${id} 1 contra, does not fill same track, ignore`);
        } else if (contraItemsAbove.length > 1) {
          const fullSpan = this.findMatchingContras(
            gridItem,
            contraItemsAbove,
            "vertical"
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
              id: `${id}-splitter-v`,
              orientation: "vertical",
              row,
            });
          }
        } else {
          throw Error(`no contraItems for ${id}`);
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
            id: `${id}-splitter-v`,
            orientation: "vertical",
            row,
          });
        } else {
          // TODO why do columns shift slightly when we do this ?
          const fullSpan = this.findMatchingContras(
            gridItem,
            contraItemsBelow,
            "vertical"
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
                id: `${id}-splitter-v`,
                orientation: "vertical",
                row,
              });
            }
          }
        }
      }
    }

    return splitterPositions;
  }

  getGridItemsAdjoiningTrack(
    resizeGridItemId: string,
    resizeOrientation: GridLayoutResizeDirection,
    splitterAlign: SplitterAlign
  ): AdjacentItems {
    const items: AdjacentItems = {
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

    if (items.contraMaybe.length === 1) {
      console.log(`where do we put a single maybe contra ?`);
    } else if (items.contraMaybe.length > 1) {
      if (
        occupySameTrack(resizeGridItem, items.contraMaybe, resizeOrientation)
      ) {
        items.contra.push(
          ...items.contraMaybe.splice(0, items.contraMaybe.length)
        );
      }
    }

    // if (Array.isArray(contraItemsMaybe) && contraItemsMaybe.length > 0) {
    //   // if  contraItemsMaybe together fill the track, they go into contraItems
    //   contraItemsOtherTrack?.push(...contraItemsMaybe);
    // }

    return items;
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
    console.log(`restoreGridItemPositions `, {
      anulledResizeOperation,
      resizeItem,
      adjacentItems,
      resizeDirection,
    });

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

  toDebugString() {
    return `
      ${this.gridItems.map(
        ({ id, column, row }) =>
          `\n${id}\t\tcol ${column.start}/${column.end}\t row ${row.start}/${row.end}`
      )}
    `;
  }
}
