import { GridLayoutSplitDirection, uuid } from "@finos/vuu-utils";
import { getColumns, getRows } from "./grid-dom-utils";
import {
  byColumnStart,
  byRowStart,
  getBisectingGridLine,
  getMatchingColspan,
  getMatchingRowspan,
  getUnusedGridTrackLines,
  gridResizeDirectionFromDropPosition,
  doesResizeRequireNewTrack as isResizeTrackShared,
  splitTrack,
  splitTracks,
} from "./grid-layout-utils";
import { getEmptyExtents, getGridMatrix } from "./grid-matrix";

export type GridLayoutModelPosition = {
  end: number;
  start: number;
};

export type ResizeState = {
  cols: number[];
  contras: IGridLayoutModelItem[];
  contraTrackIndex: number;
  resizeTrackIsShared: boolean;
  grid: HTMLElement;
  mousePos: number;
  resizeElement: HTMLElement;
  resizeDirection: GridLayoutResizeDirection;
  resizeItem: IGridLayoutModelItem;
  resizeTrackIndex: number;
  rows: number[];
  siblings: IGridLayoutModelItem[];
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

export interface GridLayoutModelCoordinates {
  column: GridLayoutModelPosition;
  row: GridLayoutModelPosition;
}
export interface IGridLayoutModelItem extends GridLayoutModelCoordinates {
  closeable?: boolean;
  id: string;
  resizeable?: GridLayoutModelItemResizeable;
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
export type GridItemMaps = {
  end: GridItemMap;
  start: GridItemMap;
};

export type GridItemUpdate = [string, GridLayoutModelPosition];
type ColumnAndRowUpdates = [GridItemUpdate[], GridItemUpdate[]];

function findUpdate(
  updates: GridItemUpdate[],
  gridItemId: string,
  throwIfNotFound?: false
): GridLayoutModelPosition | undefined;
function findUpdate(
  updates: GridItemUpdate[],
  gridItemId: string,
  throwIfNotFound: true
): GridLayoutModelPosition;
function findUpdate(
  updates: GridItemUpdate[],
  gridItemId: string,
  throwIfNotFound = false
) {
  const update = updates.find(([id]) => id === gridItemId);
  if (update) {
    return update[1];
  }
  if (throwIfNotFound) {
    throw Error(`No update found for gridItemId ${gridItemId}`);
  }
}

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

export class GridLayoutModel {
  colCount: number;
  gridItems: IGridLayoutModelItem[] = [];
  rowCount: number;

  private index: GridItemIndex = new Map();
  private splitters: ISplitter[] | undefined;

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

  private updateContrasToOccupySpace = ({
    column,
    id,
    row,
  }: IGridLayoutModelItem): ColumnAndRowUpdates => {
    const itemsWithSameRowStart = this.rowMaps.start.get(row.start);

    if (itemsWithSameRowStart) {
      const itemsInSameRow = itemsWithSameRowStart.filter(
        (item) => item.row.end === row.end && item.id !== id
      );
      if (itemsInSameRow.length === 1) {
        const {
          id: contraId,
          column: { start, end },
        } = itemsInSameRow[0];
        if (end === column.start) {
          return [[[contraId, { start, end: column.end }]], []];
        } else if (start === column.end) {
          return [[[contraId, { start: column.start, end }]], []];
        } else {
          console.log("One item in same row, but it is not adjacent");
        }
      } else if (itemsInSameRow.length > 1) {
        const adjacentBefore = itemsInSameRow.filter(
          (item) => item.column.end === column.start
        );
        if (adjacentBefore.length === 1) {
          const {
            id: contraId,
            column: { start },
          } = adjacentBefore[0];
          return [[[contraId, { start, end: column.end }]], []];
        }
        const adjacentAfter = itemsInSameRow.filter(
          (item) => item.column.start === column.end
        );
        if (adjacentAfter.length === 1) {
          const {
            id: contraId,
            column: { end },
          } = adjacentAfter[0];
          return [[[contraId, { start: column.start, end }]], []];
        }
      }
    }
    // try for vertical before we look for multi contra
    console.log("lets try for vertical contras");
    const potentialVerticalContras = this.columnMaps.start.get(column.start);
    if (potentialVerticalContras) {
      const verticalContras = potentialVerticalContras.filter(
        (item) => item.column.end === column.end && item.id !== id
      );
      if (verticalContras.length === 1) {
        const {
          id: contraId,
          row: { start, end },
        } = verticalContras[0];
        if (end === row.start) {
          return [[], [[contraId, { start, end: row.end }]]];
        } else if (start === row.end) {
          return [[], [[contraId, { start: row.start, end }]]];
        } else {
          console.log(
            "none of the horizontal contras abut, is this possible ?"
          );
        }
      } else if (verticalContras.length > 1) {
        console.log("take immediately prior first, them immediately after");
      }
    }
    return [[], []];
  };

  private getContrasAbove({ column, row }: IGridLayoutModelItem) {
    const allContrasAbove = this.rowMaps.end.get(row.start);
    if (allContrasAbove) {
      const indexOfAlignedContra = allContrasAbove.findIndex(
        (item) => item.column.start === column.start
      );
      if (indexOfAlignedContra !== -1) {
        return allContrasAbove.sort(byColumnStart).slice(indexOfAlignedContra);
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
        // placeholders may not be in correct sort position
        // sorting the original array here is ok
        return allContrasLeft.sort(byRowStart).slice(indexOfAlignedContra);
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

  private setRowExpanded = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [id, { start, end: end + 1 }];

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

  private findUnusedGridLines() {
    const { colCount, rowCount } = this;
    const unusedColLines = getUnusedGridTrackLines(this.columnMaps, colCount);
    const unusedRowLines = getUnusedGridTrackLines(this.rowMaps, rowCount);
    return [unusedColLines, unusedRowLines];
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

      const [colItemUpdates, rowItemUpdates] =
        this.updateContrasToOccupySpace(gridItem);
      if (rowItemUpdates.length || colItemUpdates.length) {
        colItemUpdates.forEach(([id, position]) => {
          this.setGridColumn(id, position);
        });
        rowItemUpdates.forEach(([id, position]) => {
          this.setGridRow(id, position);
        });

        const [unusedColLines, unusedRowLines] = this.findUnusedGridLines();
        if (unusedColLines.length === 1) {
          const trackIndex = unusedColLines[0] - 1;
          const colUpdates = this.removeTrack(trackIndex, "horizontal");

          colUpdates.forEach(([id, u]) => {
            const existingUpdate = colItemUpdates.find(
              ([itemId]) => id === itemId
            );
            if (existingUpdate) {
              existingUpdate[1] = u;
            } else {
              colItemUpdates.push([id, u]);
            }
          });
        }
        if (unusedRowLines.length === 1) {
          const trackIndex = unusedRowLines[0] - 1;
          const rowUpdates = this.removeTrack(trackIndex, "vertical");
          rowUpdates.forEach(([id, u]) => {
            const existingUpdate = rowItemUpdates.find(
              ([itemId]) => id === itemId
            );
            if (existingUpdate) {
              existingUpdate[1] = u;
            } else {
              rowItemUpdates.push([id, u]);
            }
          });
        }

        return {
          updates: [colItemUpdates, rowItemUpdates],
          removedTrackLines: [unusedColLines, unusedRowLines],
        };
      }

      if (updatePlaceholders) {
        this.createPlaceholders();
      }
    }

    return { updates: [[], []] };
  }

  replaceGridItem(gridItemId: string, itemType: GridLayoutModelItemType) {
    const gridItem = this.getGridItem(gridItemId);
    if (gridItem) {
      const updatePlaceholders =
        gridItem?.type === "placeholder" || itemType === "placeholder";
      if (gridItem.type !== itemType) {
        gridItem.type = itemType;
        if (updatePlaceholders) {
          this.createPlaceholders();
        }
        return gridItem;
      }
    }
    throw Error(`replaceGridItem: no GridItem found #${gridItemId} `);
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
      const { column, id, row } = gridItem;

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

    this.splitters = splitterPositions;
    return splitterPositions;
  }

  getSplitter(
    gridLayoutItem: IGridLayoutModelItem,
    resizeDirection: GridLayoutResizeDirection
  ) {
    const splitter = this.splitters?.find(
      ({ controls, orientation }) =>
        controls === gridLayoutItem.id && orientation === resizeDirection
    );

    if (splitter) {
      return splitter;
    }
    throw Error(
      `no splitter for gridItem ${gridLayoutItem.id} (${resizeDirection})`
    );
  }

  addTrackForResize(
    tracks: number[],
    newTrackIndex: number,
    newTrackSize: number,
    resizeOperation: GridLayoutResizeOperation,
    state: ResizeState
  ) {
    const { contras, resizeDirection, resizeItem, siblings } = state;

    const expandingResizeItem = resizeOperation === "expand";

    const setTrack =
      resizeDirection === "vertical" ? this.setGridRow : this.setGridColumn;

    const track = resizeDirection === "horizontal" ? "column" : "row";

    // TODO use splitTrack from grid-layout-utils
    const newTracks = this.splitSharedTrack(
      tracks,
      newTrackSize,
      resizeOperation,
      state
    );
    const updates = this.addTrack(newTrackIndex, resizeDirection);
    const indexAdjustment = expandingResizeItem ? -1 : +1;

    contras.forEach(({ id, [track]: { start, end } }) => {
      const existingUpdate = updates.find(([itemId]) => id === itemId);
      if (existingUpdate) {
        const [, position] = existingUpdate;
        position.end += indexAdjustment;
      } else {
        updates.push([id, { start, end: end + indexAdjustment }]);
      }
    });

    siblings.concat(resizeItem).forEach(({ id, [track]: { start, end } }) => {
      const existingUpdate = updates.find(([itemId]) => id === itemId);
      if (existingUpdate) {
        const [, position] = existingUpdate;
        position.start += indexAdjustment;
      } else {
        updates.push([id, { start, end: end + indexAdjustment }]);
      }
    });

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    return { newTracks, updates };
  }

  splitGridItem(
    gridItemId: string,
    dropPosition: GridLayoutSplitDirection,
    tracks: number[]
  ): {
    newGridItem: IGridLayoutModelItem;
    tracks: number[];
    updates: GridItemUpdate[];
  } {
    const gridItem = this.getGridItem(gridItemId);
    if (gridItem) {
      const resizeDirection = gridResizeDirectionFromDropPosition(dropPosition);
      let updates: GridItemUpdate[] | undefined = undefined;
      let newTracks = tracks;
      const isVertical = resizeDirection === "vertical";
      const track = isVertical ? "row" : "column";
      const {
        [track]: { start, end },
      } = gridItem;

      const newItemId = uuid();
      const newGridItem: IGridLayoutModelItem = {
        column: { ...gridItem.column },
        id: newItemId,
        resizeable: "vh",
        row: { ...gridItem.row },
        type: "content",
      };
      this.addGridItem(newGridItem);

      let newTrackIndex = start - 1;

      if (end - start === 1) {
        newTracks = splitTrack(tracks, newTrackIndex);
        updates = this.addTrack(newTrackIndex, resizeDirection);

        const targetPosition = findUpdate(updates, gridItemId, true);
        const newPosition = findUpdate(updates, newItemId, true);
        if (dropPosition === "north" || dropPosition === "west") {
          newPosition.end -= 1;
          targetPosition.start += 1;
        } else {
          newPosition.start += 1;
          targetPosition.end -= 1;
        }
      } else {
        // If there is already a trackEdge that bisects this gridItem ,
        // we just have to realign the gridItem
        const bisectingGridLine = getBisectingGridLine(tracks, start, end);
        if (bisectingGridLine !== -1) {
          if (dropPosition === "west" || dropPosition === "north") {
            updates = [
              [newItemId, { start, end: bisectingGridLine }],
              [gridItemId, { start: bisectingGridLine, end }],
            ];
          } else {
            updates = [
              [gridItemId, { start, end: bisectingGridLine }],
              [newItemId, { start: bisectingGridLine, end }],
            ];
          }
        } else {
          // this will calculate sizes of the new tracks
          ({ newTracks, newTrackIndex } = splitTracks(tracks, start, end));
          const bisectingGridLine = newTrackIndex + 2;
          // this will apply trackEdge changes to gridLayoutItems
          updates = this.addTrack(newTrackIndex, resizeDirection);

          const targetPosition = findUpdate(updates, gridItemId, true);
          const newPosition = findUpdate(updates, newItemId, true);
          if (dropPosition === "north" || dropPosition === "west") {
            newPosition.end = bisectingGridLine;
            targetPosition.start = bisectingGridLine;
          } else {
            newPosition.start = bisectingGridLine;
            targetPosition.end = bisectingGridLine;
          }
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
        newGridItem,
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

    const [{ end: endMap, start: startMap }, setTrack] =
      resizeDirection === "vertical"
        ? [this.rowMaps, this.setGridRow]
        : [this.columnMaps, this.setGridColumn];

    const updateMap = (
      map: GridItemMap,
      track: GridLayoutTrack,
      pos: "start" | "end"
    ) => {
      for (const [position, gridItems] of map) {
        if (position > gridPosition) {
          gridItems.forEach(({ id, [track]: { start, end } }) => {
            const existingUpdate = updates.find(([itemId]) => itemId === id);
            if (existingUpdate) {
              existingUpdate[1][pos] -= 1;
            } else {
              if (pos === "start") {
                updates.push([id, { start: start - 1, end }]);
              } else {
                updates.push([id, { start, end: end - 1 }]);
              }
            }
          });
        }
      }
    };

    if (resizeDirection === "vertical") {
      updateMap(startMap, "row", "start");
      updateMap(endMap, "row", "end");
    } else {
      updateMap(startMap, "column", "start");
      updateMap(endMap, "column", "end");
    }

    updates.forEach(([id, position]) => {
      setTrack(id, position);
    });

    return updates;
  }

  splitSharedTrack(
    tracks: number[],
    newTrackSize: number,
    resizeOperation: GridLayoutResizeOperation,
    { resizeTrackIndex }: ResizeState
  ) {
    const newTracks = tracks.slice();
    newTracks.splice(resizeTrackIndex, 0, 0);
    newTracks[resizeTrackIndex] = Math.abs(newTrackSize);

    if (resizeOperation === "expand") {
      newTracks[resizeTrackIndex - 1] -= newTrackSize;
    } else {
      newTracks[resizeTrackIndex + 1] -= newTrackSize;
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
    mousePos,
    rows = getRows(grid),
    resizeElement,
    resizeDirection,
    resizeItem,
    ...rest
  }: Omit<
    ResizeState,
    | "contras"
    | "contraTrackIndex"
    | "cols"
    | "mouseCurrentPos"
    | "resizeTrackIndex"
    | "resizeTrackIsShared"
    | "rows"
    | "siblings"
  > & {
    cols?: number[];
    mousePos: number;
    rows?: number[];
  }): ResizeState | undefined {
    const contrasAndSiblings = this.findContrasAndSiblings(
      resizeItem,
      resizeDirection
    );

    if (contrasAndSiblings && this.splitters) {
      const { contras, siblings } = contrasAndSiblings;

      // DEBUG start --------------
      // contrasAndSiblings?.contras?.forEach(
      //   ({ id }) => (document.getElementById(id).dataset.resizeRole = "contra")
      // );
      // adjacentItems.contraOtherTrack.forEach(
      //   ({ id }) =>
      //     (document.getElementById(id).dataset.resizeRole = "contra-other-track")
      // );
      // s.forEach(
      //   ({ id }) => (document.getElementById(id).dataset.resizeRole = "sibling")
      // );
      // DEBUG end -------------------------

      //TODO calculate simpleResize

      const track: GridLayoutTrack =
        resizeDirection === "horizontal" ? "column" : "row";

      const resizeTrackIndex = resizeItem[track].start - 1;
      const contraTrackIndex = resizeItem[track].start - 2;

      const splitter = this.getSplitter(resizeItem, resizeDirection);
      const resizeTrackIsShared = isResizeTrackShared(this.splitters, splitter);

      console.log({
        resizeTrackIsShared,
        contrasAndSiblings,
        contraTrackIndex,
        resizeTrackIndex,
      });

      return {
        ...rest,
        cols,
        contras,
        contraTrackIndex,
        grid,
        mousePos,
        resizeElement,
        resizeItem,
        resizeDirection,
        rows,
        siblings,
        resizeTrackIndex,
        resizeTrackIsShared,
      };
    }
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
