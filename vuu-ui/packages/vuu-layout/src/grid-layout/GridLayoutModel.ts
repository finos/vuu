export type GridLayoutModelPosition = {
  end: number;
  start: number;
};

export interface IGridLayoutModelItem {
  column: GridLayoutModelPosition;
  id: string;
  row: GridLayoutModelPosition;
}

export type SplitterAlign = "start" | "end";
export type GridLayoutResizeDirection = "vertical" | "horizontal";
export type GridLayoutResizePosition = "before" | "after" | "above" | "below";

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

export type AdjacentItems = {
  contraItems: IGridLayoutModelItem[];
  contraItemsOtherTrack: IGridLayoutModelItem[];
  resizeItems: IGridLayoutModelItem[];
  siblingItemsOtherTrack: IGridLayoutModelItem[];
};

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

const getFullPosition = (
  items: IGridLayoutModelItem[],
  position: GridLayoutResizePosition
): [number, number] => {
  if (position === "before" || position === "after") {
    return [
      Math.min(...items.map((i) => i.row.start)),
      Math.max(...items.map((i) => i.row.end)),
    ];
  } else {
    return [
      Math.min(...items.map((i) => i.column.start)),
      Math.max(...items.map((i) => i.column.end)),
    ];
  }
};

const fillSameTrack = (
  { column, row }: IGridLayoutModelItem,
  contraItems: IGridLayoutModelItem[],
  position: GridLayoutResizePosition
) => {
  const [start, end] = getFullPosition(contraItems, position);
  if (position === "before" || position === "after") {
    return start === row.start && end === row.end;
  } else {
    return start === column.start && end === column.end;
  }
};

// FIlter function factory for GridItems
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
  adjacentItems?: AdjacentItems;
  columnCount: number;
  gridItems: IGridLayoutModelItem[] = [];
  rowCount: number;

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

  private getNextSibling(
    gridItem: IGridLayoutModelItem,
    position: GridLayoutResizePosition
  ) {
    if (position === "after") {
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
    } else if (position === "before") {
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
    }
  }

  //TODO we only check one sibling away, need to do this in a loop
  private findMatchingContras(
    gridItem: IGridLayoutModelItem,
    contraItems: IGridLayoutModelItem[]
  ): [number, number] | undefined {
    const fullSpan = getFullPosition(contraItems, "after");
    if (fullSpan[0] === gridItem.row.start) {
      const siblings = [gridItem];
      // add sibling(s) below until we have a match with fullSpan
      // need to review the position, this feels counter intuitive
      const nextSibling = this.getNextSibling(gridItem, "after");
      if (nextSibling) {
        siblings.push(nextSibling);
        const fullSiblingPos = getFullPosition(siblings, "after");
        if (fullSiblingPos[1] === fullSpan[1]) {
          return fullSpan;
        }
      }
    } else if (fullSpan[1] === gridItem.row.end) {
      const siblings = [gridItem];
      const nextSibling = this.getNextSibling(gridItem, "before");
      if (nextSibling) {
        siblings.push(nextSibling);
        const fullSiblingPos = getFullPosition(siblings, "after");
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
    this.storeItem(this.columnMaps, column, gridItem);
    this.storeItem(this.rowMaps, row, gridItem);
  }

  getSplitterPositions(): ISplitter[] {
    const splitterPositions: ISplitter[] = [];
    for (const gridItem of this.gridItems) {
      const { column, id, row } = gridItem;

      // First the horizontal tracks
      const [contraItemsLeft, contraItemsRight] = this.getContraItems(
        gridItem,
        "horizontal"
      );
      if (contraItemsRight.length > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsRight,
          "after"
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
        }
      } else if (column.start > 1) {
        if (fillSameTrack(gridItem, contraItemsLeft, "before")) {
          splitterPositions.push({
            align: "start",
            column,
            controls: id,
            id: `${id}-splitter-h`,
            orientation: "horizontal",
            row,
          });
        } else if (contraItemsLeft.length === 1) {
          console.log(`${id} 1 contra, does not fill same track`);
        } else if (contraItemsLeft.length > 1) {
          const fullSpan = this.findMatchingContras(gridItem, contraItemsLeft);
          if (fullSpan) {
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
      }

      // ...then the vertical tracks
      const [contraItemsAbove, contraItemsBelow] = this.getContraItems(
        gridItem,
        "vertical"
      );

      if (contraItemsBelow.length > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsBelow,
          "below"
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
        }
      } else if (row.start > 1) {
        const contraFillSameTrack = fillSameTrack(
          gridItem,
          contraItemsAbove,
          "above"
        );

        if (contraItemsAbove.length === 1) {
          if (contraFillSameTrack) {
            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: `${id}-splitter-v`,
              orientation: "vertical",
              row,
            });
          } else {
            console.log(`1 contra, does not fill same track`);
          }
        } else if (contraItemsAbove.length > 1) {
          if (contraFillSameTrack) {
            splitterPositions.push({
              align: "start",
              column,
              controls: id,
              id: `${id}-splitter-v`,
              orientation: "vertical",
              row,
            });
          } else {
            console.log("mismatched contras");
          }
        } else {
          throw Error(`no contraItems for ${id}`);
        }
      }
    }

    return splitterPositions;
  }

  getGridItemsAdjoiningTrack(
    gridItemId: string,
    resizeOrientation: GridLayoutResizeDirection,
    splitterAlign: SplitterAlign
  ):
    | [
        IGridLayoutModelItem[],
        IGridLayoutModelItem[],
        IGridLayoutModelItem[],
        IGridLayoutModelItem[],
        IGridLayoutModelItem[]
      ]
    | [IGridLayoutModelItem[]] {
    const contraItems: IGridLayoutModelItem[] = [];
    const contraItemsMaybe: IGridLayoutModelItem[] = [];
    const contraItemsOtherTrack: IGridLayoutModelItem[] = [];
    const siblingItemsOtherTrack: IGridLayoutModelItem[] = [];
    const nonAdjacentItems: IGridLayoutModelItem[] = [];

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
  }

  prepareToResize(itemId: string) {
    console.log("prepare to resize");
  }
}
