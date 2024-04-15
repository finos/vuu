import { getColumns, getRows } from "./grid-dom-utils";
import {
  AdjacentItems,
  collectItemsByColumnPosition,
  collectItemsByRowPosition,
  getBisectingTrackEdge,
  getMatchingColspan,
  getMatchingRowspan,
  occupySameTrack,
  splitTrack,
  splitTracks,
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

export type GridLayoutModelItemType = "content" | "placeholder" | "splitter";
export interface IGridLayoutModelItem {
  closeable?: boolean;
  column: GridLayoutModelPosition;
  id: string;
  resizeable?: GridLayoutModelItemResizeable;
  row: GridLayoutModelPosition;
  type: GridLayoutModelItemType;
}

export interface IPlaceholder extends IGridLayoutModelItem {
  type: "placeholder";
}

const isPlaceholder = (item: IGridLayoutModelItem): item is IPlaceholder =>
  item.type === "placeholder";

export interface ISplitter extends IGridLayoutModelItem {
  align: SplitterAlign;
  controls: string;
  orientation: GridLayoutResizeDirection;
  type: "splitter";
}

export class GridLayoutModelItem implements IGridLayoutModelItem {
  column: GridLayoutModelPosition;
  id: string;
  row: GridLayoutModelPosition;
  type: GridLayoutModelItemType;

  constructor(
    id: string,
    column: GridLayoutModelPosition,
    row: GridLayoutModelPosition,
    type: GridLayoutModelItemType = "content"
  ) {
    this.id = id;
    this.column = column;
    this.row = row;
    this.type = type;
  }
}

type GridItemIndex = Map<string, IGridLayoutModelItem>;
type GridItemMap = Map<number, IGridLayoutModelItem[]>;
type GridItemMaps = {
  end: GridItemMap;
  start: GridItemMap;
};

export type GridItemUpdate = [string, GridLayoutModelPosition];

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
  colCount: number;
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

  constructor(colCount: number, rowCount: number) {
    this.colCount = colCount;
    this.rowCount = rowCount;
  }

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

  private getContrasAbove({ column, row }: IGridLayoutModelItem) {
    const allContrasAbove = this.rowMaps.end.get(row.start);
    if (allContrasAbove) {
      const indexOfAlignedContra = allContrasAbove.findIndex(
        (item) => item.column.start === column.start
      );
      if (indexOfAlignedContra !== -1) {
        return allContrasAbove.slice(indexOfAlignedContra);
      }
    }
    return [];
  }

  private getContrasLeft({ column, row }: IGridLayoutModelItem) {
    const allContrasLeft = this.columnMaps.end.get(column.start);
    if (allContrasLeft) {
      const indexOfAlignedContra = allContrasLeft.findIndex(
        (item) => item.row.start === row.start
      );
      if (indexOfAlignedContra !== -1) {
        return allContrasLeft.slice(indexOfAlignedContra);
      }
    }
    return [];
  }

  private getSiblingsRight({ column, row }: IGridLayoutModelItem) {
    return (
      this.rowMaps.start
        .get(row.start)
        ?.filter((item) => item.column.start > column.start) ?? []
    );
  }

  private getSiblingsBelow({ column, row }: IGridLayoutModelItem) {
    return (
      this.columnMaps.start
        .get(column.start)
        ?.filter((item) => item.row.start > row.start) ?? []
    );
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

  // private findContrasAndSiblings(
  //   gridItem: IGridLayoutModelItem,
  //   resizeDirection: GridLayoutResizeDirection = "horizontal"
  // ) {
  //   let contras: IGridLayoutModelItem[] | undefined;
  //   let siblings: IGridLayoutModelItem[] | undefined;

  //   if (resizeDirection === "vertical") {
  //     contras = this.getContrasAbove(gridItem);
  //     if (contras.length > 0) {
  //       siblings = this.getSiblingsRight(gridItem);
  //     }
  //   } else {
  //     contras = this.getContrasLeft(gridItem);
  //     if (contras.length > 0) {
  //       siblings = this.getSiblingsBelow(gridItem);
  //     }
  //   }

  //   return {
  //     contras: contras ?? [],
  //     siblings: siblings ?? [],
  //   };
  // }

  private findContrasAndSiblings(
    gridItem: IGridLayoutModelItem,
    resizeDirection: GridLayoutResizeDirection = "horizontal"
  ) {
    if (resizeDirection === "vertical") {
      const contrasAbove = this.getContrasAbove(gridItem);
      if (contrasAbove.length > 0) {
        const siblingsRight = this.getSiblingsRight(gridItem);
        return getMatchingColspan(gridItem, siblingsRight, contrasAbove);
      }
    } else {
      const contrasLeft = this.getContrasLeft(gridItem);
      if (contrasLeft.length > 0) {
        const siblingsBelow = this.getSiblingsBelow(gridItem);
        return getMatchingRowspan(gridItem, siblingsBelow, contrasLeft);
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

  removeGridItem(gridItemId: string, updatePlaceholders = true) {
    const gridItem = this.getGridItem(gridItemId);
    if (gridItem) {
      const { column, row } = gridItem;
      const indexOfDoomedItem = this.gridItems.indexOf(gridItem);
      this.gridItems.splice(indexOfDoomedItem, 1);
      this.index.delete(gridItemId);
      this.clearItemFromStore(this.columnMaps, column, gridItem);
      this.clearItemFromStore(this.rowMaps, row, gridItem);

      if (updatePlaceholders) {
        this.createPlaceholders();
      }
    }

    return [[], []];
  }

  getGridItem(gridItemId: string) {
    return this.index.get(gridItemId);
  }

  clearPlaceholders() {
    const placeHolders = this.getPlaceholders();
    placeHolders.forEach((placeholder) =>
      this.removeGridItem(placeholder.id, false)
    );
  }
  /*
  Placeholders are created to represent any empty areas on the grid
  */
  createPlaceholders() {
    const { colCount, gridItems, rowCount } = this;

    this.clearPlaceholders();

    const grid = getGridMatrix(gridItems, rowCount, colCount);
    const emptyExtents = getEmptyExtents(grid);
    emptyExtents.forEach((gridItem) => this.addGridItem(gridItem));
  }

  getPlaceholders() {
    return this.gridItems.filter(isPlaceholder);
  }

  getSplitterPositions(): ISplitter[] {
    const splitterPositions: ISplitter[] = [];
    for (const gridItem of this.gridItems) {
      const { column, id, resizeable = "", row } = gridItem;

      // 1) Horizontal resizing - the vertically aligned splitters

      const rowSpan = this.findContrasAndSiblings(gridItem, "horizontal");

      if (rowSpan) {
        splitterPositions.push({
          align: "start",
          column,
          controls: id,
          id: `${id}-splitter-h`,
          orientation: "horizontal",
          row: rowSpan.position,
          type: "splitter",
        });
      }

      // 2) Vertical resizing - the horizontally aligned splitters

      const columnSpan = this.findContrasAndSiblings(gridItem, "vertical");

      if (columnSpan) {
        splitterPositions.push({
          align: "start",
          column: columnSpan.position,
          controls: id,
          id: `${id}-splitter-v`,
          orientation: "vertical",
          row,
          type: "splitter",
        });
      }
    }

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
      siblings: [],
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
      updates.push(setExpanded(resizeItem));
      adjacentItems.contraOtherTrack.forEach((item) => {
        updates.push(setExpanded(item));
      });
      adjacentItems.siblings.forEach((item) => {
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
      adjacentItems.siblings.forEach((item) => {
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

    const updates: GridItemUpdate[] = [];

    if (anulledResizeOperation === "contract") {
      updates.push(setShiftBackward(resizeItem));
      adjacentItems.contra.forEach((item) => {
        updates.push(setContracted(item));
      });
      adjacentItems.siblings.forEach((item) => {
        updates.push(setContracted(item));
      });
    } else {
      updates.push(setContracted(resizeItem));
      adjacentItems.contraOtherTrack.forEach((item) => {
        updates.push(setContracted(item));
      });
      adjacentItems.siblings.forEach((item) => {
        updates.push(setShiftBackward(item));
      });
    }

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    return updates;
  }

  splitGridItem(
    gridItemId: string,
    resizeDirection: GridLayoutResizeDirection,
    tracks: number[]
  ): {
    updates: GridItemUpdate[];
    tracks: number[];
  } {
    const gridItem = this.getGridItem(gridItemId);
    if (gridItem) {
      let updates: GridItemUpdate[] | undefined = undefined;
      let newTracks = tracks;
      const isVertical = resizeDirection === "vertical";
      const track = isVertical ? "row" : "column";
      const {
        [track]: { start, end },
      } = gridItem;

      let newTrackIndex = start - 1;

      if (end - start === 1) {
        newTracks = splitTrack(tracks, newTrackIndex);
        updates = this.addTrack(newTrackIndex, resizeDirection);

        const [, position] = updates.find(
          ([id]) => id === gridItemId
        ) as GridItemUpdate;
        position.end -= 1;
      } else {
        // If there is already a trackEdge that bisects this gridItem ,
        // we just have to realign the gridItem
        const bisectingTrackEdge = getBisectingTrackEdge(tracks, start, end);
        if (bisectingTrackEdge !== -1) {
          updates = [[gridItemId, { start, end: bisectingTrackEdge }]];
        } else {
          // this will calculate sizes of the new tracks
          ({ newTracks, newTrackIndex } = splitTracks(tracks, start, end));
          // this will apply trackEdge changes to gridLayoutItems
          updates = this.addTrack(newTrackIndex, resizeDirection);

          const [, position] = updates.find(
            ([id]) => id === gridItemId
          ) as GridItemUpdate;
          position.end -= 1;
        }
      }

      const setTrack =
        resizeDirection === "vertical" ? this.setGridRow : this.setGridColumn;

      updates.forEach(([id, position]) => {
        setTrack(id, position);
      });

      return {
        updates: updates ?? [],
        tracks: newTracks,
      };
    } else {
      throw Error(
        `GridLayoutModel splitGridItem: no gridItem with id ${gridItemId}`
      );
    }
  }

  /*
  When we add a track, all current track edges will be increased by 1.
  Any gridItem bound to an edge equal to or greater than the one being
  added must be adjusted.
 */
  addTrack(trackIndex: number, resizeDirection: GridLayoutResizeDirection) {
    const gridPosition = trackIndex + 1;
    const updates: GridItemUpdate[] = [];

    const [
      { end: endMap, start: startMap },
      setExpanded,
      setShiftForward,
      setTrack,
    ] =
      resizeDirection === "vertical"
        ? [
            this.rowMaps,
            this.setRowExpanded,
            this.setShiftRowForward,
            this.setGridRow,
          ]
        : [
            this.columnMaps,
            this.setColExpanded,
            this.setShiftColForward,
            this.setGridColumn,
          ];

    for (const [position, gridItems] of startMap) {
      if (position > gridPosition) {
        gridItems.forEach((item) => {
          updates.push(setShiftForward(item));
        });
      }
    }

    for (const [position, gridItems] of endMap) {
      if (position > gridPosition) {
        gridItems.forEach((item) => {
          const existingUpdate = updates.find(([id]) => id === item.id);
          if (!existingUpdate) {
            updates.push(setExpanded(item));
          }
        });
      }
    }

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    if (resizeDirection === "horizontal") {
      this.colCount += 1;
    } else {
      this.rowCount += 1;
    }

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

  splitSharedTrack(
    tracks: number[],
    newTrackSize: number,
    {
      indexOfPrimaryResizeTrack,
      indexOfSecondaryResizeTrack,
      resizeDirection,
    }: ResizeState
  ) {
    const newTracks = tracks.slice();
    newTracks.splice(indexOfPrimaryResizeTrack, 0, 0);
    newTracks[indexOfPrimaryResizeTrack] = Math.abs(newTrackSize);
    newTracks[indexOfSecondaryResizeTrack] -= newTrackSize;

    if (resizeDirection === "horizontal") {
      this.colCount += 1;
    } else {
      this.rowCount += 1;
    }

    return newTracks;
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

  measureResizeDetails({
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
    const contrasAndSiblings = this.findContrasAndSiblings(
      resizeItem,
      resizeDirection
    );

    console.log({ contrasAndSiblings });

    //TOSO reuse the code in getSplitters to get sibling/contra items
    const adjacentItems = this.getGridItemsAdjoiningTrack(
      resizeElement.id,
      resizeDirection,
      splitterAlign
    );

    // DEBUG start --------------
    contrasAndSiblings?.contras?.forEach(
      ({ id }) => (document.getElementById(id).dataset.resizeRole = "contra")
    );
    // adjacentItems.contraOtherTrack.forEach(
    //   ({ id }) =>
    //     (document.getElementById(id).dataset.resizeRole = "contra-other-track")
    // );
    s.forEach(
      ({ id }) => (document.getElementById(id).dataset.resizeRole = "sibling")
    );
    // DEBUG end -------------------------

    const track: GridLayoutTrack =
      resizeDirection === "horizontal" ? "column" : "row";

    const [indexOfPrimaryResizeTrack, indexOfSecondaryResizeTrack] =
      splitterAlign === "start"
        ? [resizeItem[track].start - 1, resizeItem[track].start - 2]
        : [resizeItem[track].end - 2, resizeItem[track].end - 1];

    // ITS a simple resize if splitter does not share col with another splitter
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
