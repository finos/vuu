import {
  GridLayoutSplitDirection,
  OptionalProperty,
  uuid,
} from "@finos/vuu-utils";
import {
  getBisectingGridLine,
  gridResizeDirectionFromDropPosition,
  doesResizeRequireNewTrack as isResizeTrackShared,
  itemsFillColumn,
  itemsFillRow,
  splitGridChildPosition,
  splitTrack,
  splitTracks,
} from "./grid-layout-utils";
import type { GridModel, GridModelItemResizeable } from "./GridModel";

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

export type GridItemRemoveReason = "drag" | "close" | "placeholder";

export type GridLayoutResizeOperation = "contract" | "expand";
export type SplitterAlign = "start" | "end";
export type GridLayoutResizeDirection = "vertical" | "horizontal";
export type GridLayoutRelativePosition =
  | "aboveInSameColumn"
  | "belowInSameColumn"
  | "rightInSameRow"
  | "leftInSameRow";
export type GridLayoutTrack = "column" | "row";

export type GridLayoutModelItemType =
  | "content"
  | "placeholder"
  | "splitter"
  | "stacked-content";

export interface GridLayoutModelCoordinates {
  column: GridLayoutModelPosition;
  row: GridLayoutModelPosition;
}
type OneOrBothGridLayoutModelCoordinates =
  | GridLayoutModelCoordinates
  | OptionalProperty<GridLayoutModelCoordinates, "column">
  | OptionalProperty<GridLayoutModelCoordinates, "row">;
export interface IGridLayoutModelItem extends GridLayoutModelCoordinates {
  childId?: string[];
  closeable?: boolean;
  fixed?: boolean;
  id: string;
  resizeable?: GridModelItemResizeable;
  type: GridLayoutModelItemType;
}

export interface ISplitter extends IGridLayoutModelItem {
  align: SplitterAlign;
  controls: string;
  orientation: GridLayoutResizeDirection;
  type: "splitter";
}

export type GridItemUpdate = [string, OneOrBothGridLayoutModelCoordinates];
type ColumnAndRowUpdates = [GridItemUpdate[], GridItemUpdate[]];

function findUpdate(
  updates: GridItemUpdate[],
  gridItemId: string,
  throwIfNotFound?: false,
): GridItemUpdate | undefined;
function findUpdate(
  updates: GridItemUpdate[],
  gridItemId: string,
  throwIfNotFound: true,
): GridItemUpdate;
function findUpdate(
  updates: GridItemUpdate[],
  gridItemId: string,
  throwIfNotFound = false,
) {
  const update = updates.find(([id]) => id === gridItemId);
  if (update) {
    return update;
  }
  if (throwIfNotFound) {
    throw Error(`No update found for gridItemId ${gridItemId}`);
  }
}

export class GridLayoutModel {
  private splitters: ISplitter[] | undefined;

  constructor(private gridModel: GridModel) {}

  private updateContrasToOccupySpace = ({
    column,
    id,
    row,
  }: IGridLayoutModelItem): ColumnAndRowUpdates => {
    // Do we have one or more GridItems that can be extended horizontally
    // to fill the space described by column, row
    // 1) Identify items that start on the same row and abut our gridCell(s)
    // of interest, either to the left or to the right.
    const adjacentItemsWithSameRowStart = this.gridModel
      .findByRowStart(row.start)
      ?.filter(
        ({ column: { start, end }, fixed }) =>
          (!fixed && end === column.start) || start === column.end,
      );
    if (adjacentItemsWithSameRowStart) {
      // 2) do any of the items that start on the same row as our gridcell
      // of interest also span exactly the same row(s) as that cell. If we
      // have at least one of these, then we have a single item that can be
      // extended to cover our cell(s) of interest.
      // TODO sort by column, so we get the left item first
      const itemsInSameRow = adjacentItemsWithSameRowStart.filter(
        (item) => item.row.end === row.end && item.id !== id,
      );
      if (itemsInSameRow.length === 1) {
        const {
          id: contraId,
          column: { start, end },
        } = itemsInSameRow[0];
        if (end === column.start) {
          return [[[contraId, { column: { start, end: column.end } }]], []];
        } else if (start === column.end) {
          return [[[contraId, { column: { start: column.start, end } }]], []];
        }
      } else if (itemsInSameRow.length === 2) {
        // assuming no overlapping gridcells, the most we can have here
        // is 2 items in same row, one left and one right
        const adjacentBefore = itemsInSameRow.filter(
          (item) => item.column.end === column.start,
        );
        if (adjacentBefore.length === 1) {
          const {
            id: contraId,
            column: { start },
          } = adjacentBefore[0];
          return [[[contraId, { column: { start, end: column.end } }]], []];
        }
        const adjacentAfter = itemsInSameRow.filter(
          (item) => item.column.start === column.end,
        );
        if (adjacentAfter.length === 1) {
          const {
            id: contraId,
            column: { end },
          } = adjacentAfter[0];
          return [[[contraId, { column: { start: column.start, end } }]], []];
        }
      } else {
        // 3) We do not have a single gridcell that can be extended to cover our
        // gridcell of interest, but we might have multiple cells that together
        // can serve the same end. If we have multiple cells that all abut our
        // target cell (on the same side) and together span the same row(s) as
        // our target, we have what we need.
        if (row.end - row.start > 1) {
          const itemsEndingWhereTargetStarts = this.gridModel
            .findByColumnEnd(column.start)
            ?.filter(
              (item) => item.row.start >= row.start && item.row.end <= row.end,
            );
          if (
            itemsEndingWhereTargetStarts &&
            itemsFillRow(itemsEndingWhereTargetStarts, row)
          ) {
            const columnUpdates = itemsEndingWhereTargetStarts.map(
              ({ id: contraId, column: { start } }) =>
                [
                  contraId,
                  { column: { start, end: column.end } },
                ] as GridItemUpdate,
            );
            return [columnUpdates, []];
          }
          const itemsStartingWhereTargetEnds = this.gridModel
            .findByColumnStart(column.end)
            ?.filter(
              (item) => item.row.start >= row.start && item.row.end <= row.end,
            );
          if (
            itemsStartingWhereTargetEnds &&
            itemsFillRow(itemsStartingWhereTargetEnds, row)
          ) {
            const columnUpdates = itemsStartingWhereTargetEnds.map(
              ({ id: contraId, column: { end } }) =>
                [
                  contraId,
                  { column: { start: column.start, end } },
                ] as GridItemUpdate,
            );
            return [columnUpdates, []];
          }
        }
      }
    }
    const adjacentItemsWithSameColumnStart = this.gridModel
      .findByColumnStart(column.start)
      ?.filter(
        ({ row: { start, end }, fixed }) =>
          (!fixed && end === row.start) || start === row.end,
      );
    if (adjacentItemsWithSameColumnStart) {
      const itemsInSameColumn = adjacentItemsWithSameColumnStart.filter(
        (item) => item.column.end === column.end && item.id !== id,
      );

      if (itemsInSameColumn.length === 1) {
        const {
          id: contraId,
          row: { start, end },
        } = itemsInSameColumn[0];
        if (end === row.start) {
          return [[], [[contraId, { row: { start, end: row.end } }]]];
        } else if (start === row.end) {
          return [[], [[contraId, { row: { start: row.start, end } }]]];
        }
      } else if (itemsInSameColumn.length === 2) {
        const adjacentBefore = itemsInSameColumn.filter(
          (item) => item.row.end === row.start,
        );
        if (adjacentBefore.length === 1) {
          const {
            id: contraId,
            row: { start },
          } = adjacentBefore[0];
          return [[[contraId, { row: { start, end: row.end } }]], []];
        }
        const adjacentAfter = itemsInSameColumn.filter(
          (item) => item.row.start === row.end,
        );
        if (adjacentAfter.length === 1) {
          const {
            id: contraId,
            row: { end },
          } = adjacentAfter[0];
          return [[[contraId, { row: { start: row.start, end } }]], []];
        }
      } else {
        if (column.end - column.start > 1) {
          const itemsEndingWhereTargetStarts = this.gridModel
            .findByRowEnd(row.start)
            ?.filter(
              (item) =>
                item.column.start >= column.start &&
                item.column.end <= column.end,
            );
          if (
            itemsEndingWhereTargetStarts &&
            itemsFillColumn(itemsEndingWhereTargetStarts, column)
          ) {
            const rowUpdates = itemsEndingWhereTargetStarts.map(
              ({ id: contraId, row: { start } }) =>
                [contraId, { row: { start, end: row.end } }] as GridItemUpdate,
            );
            return [[], rowUpdates];
          }
          const itemsStartingWhereTargetEnds = this.gridModel
            .findByRowStart(row.end)
            ?.filter(
              (item) =>
                item.column.start >= column.start &&
                item.column.end <= column.end,
            );
          if (
            itemsStartingWhereTargetEnds &&
            itemsFillColumn(itemsStartingWhereTargetEnds, column)
          ) {
            const rowUpdates = itemsStartingWhereTargetEnds.map(
              ({ id: contraId, row: { end } }) =>
                [
                  contraId,
                  { row: { start: row.start, end } },
                ] as GridItemUpdate,
            );
            return [[], rowUpdates];
          }
        }
      }
    }
    return [[], []];
  };

  private setColExpanded = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { column: { start, end: end + 1 } },
  ];

  private setRowExpanded = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { row: { start, end: end + 1 } },
  ];

  private setShiftColForward = ({
    id,
    column: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { column: { start: start + 1, end: end + 1 } },
  ];

  private setShiftRowForward = ({
    id,
    row: { start, end },
  }: IGridLayoutModelItem): GridItemUpdate => [
    id,
    { row: { start: start + 1, end: end + 1 } },
  ];

  removeGridItem(gridItemId: string, reason: GridItemRemoveReason) {
    const gridItem = this.gridModel.getChildItem(gridItemId, true);
    this.gridModel.removeChildItem(gridItemId, reason);

    const [colItemUpdates, rowItemUpdates] =
      this.updateContrasToOccupySpace(gridItem);
    if (rowItemUpdates.length || colItemUpdates.length) {
      colItemUpdates.forEach(([id, { column: colPosition }]) => {
        if (colPosition) {
          this.gridModel.upddateChildColumn(id, colPosition);
        }
      });
      rowItemUpdates.forEach(([id, { row: rowPosition }]) => {
        if (rowPosition) {
          this.gridModel.upddateChildRow(id, rowPosition);
        }
      });

      const [unusedColLines, unusedRowLines] =
        this.gridModel.findUnusedGridLines();
      if (unusedColLines.length === 2) {
        console.warn(
          `multiple unused lines ${unusedColLines.join(",")} (colCount = ${
            this.gridModel.colCount
          })`,
        );
      }
      if (unusedColLines.length === 1) {
        const trackIndex = unusedColLines[0] - 1;
        const colUpdates = this.removeTrack(trackIndex, "horizontal");

        colUpdates.forEach(([id, u]) => {
          const existingUpdate = colItemUpdates.find(
            ([itemId]) => id === itemId,
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
            ([itemId]) => id === itemId,
          );
          if (existingUpdate) {
            existingUpdate[1] = u;
          } else {
            rowItemUpdates.push([id, u]);
          }
        });
      }

      if (unusedColLines.length === 1) {
        const [indexOfRemovedColumnTrack] = unusedColLines;
        this.gridModel.removeGridColumn(
          indexOfRemovedColumnTrack - 1,
          "bwd",
          false,
        );
      }

      if (unusedRowLines.length === 1) {
        const [indexOfRemovedRowTrack] = unusedRowLines;
        this.gridModel.removeGridRow(indexOfRemovedRowTrack - 1, "bwd", false);
      }

      return colItemUpdates.concat(rowItemUpdates);
    }

    if (reason !== "placeholder") {
      this.gridModel.createPlaceholders();
    }

    return [];
  }

  replaceGridItem(gridItemId: string, itemType: GridLayoutModelItemType) {
    const gridItem = this.gridModel.getChildItem(gridItemId, true);
    const updatePlaceholders =
      gridItem?.type === "placeholder" || itemType === "placeholder";
    if (gridItem.type !== itemType) {
      gridItem.type = itemType;
      if (itemType === "stacked-content") {
        // we need to give the stack a new is
        // gridItem.childId = [gridItemId, gridItem.id];
      }
      if (updatePlaceholders) {
        this.gridModel.createPlaceholders();
      }
    }
    return gridItem;
  }

  getSplitterPositions(): ISplitter[] {
    const splitterPositions: ISplitter[] = [];
    for (const gridItem of this.gridModel.childItems) {
      const { column, id, row } = gridItem;

      // 1) Horizontal resizing - the vertically aligned splitters

      const rowSpan = this.gridModel.findContrasAndSiblings(
        gridItem,
        "horizontal",
      );

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

      const columnSpan = this.gridModel.findContrasAndSiblings(
        gridItem,
        "vertical",
      );

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
    resizeDirection: GridLayoutResizeDirection,
  ) {
    const splitter = this.splitters?.find(
      ({ controls, orientation }) =>
        controls === gridLayoutItem.id && orientation === resizeDirection,
    );

    if (splitter) {
      return splitter;
    }
    throw Error(
      `no splitter for gridItem ${gridLayoutItem.id} (${resizeDirection})`,
    );
  }

  addTrackForResize(
    tracks: number[],
    newTrackIndex: number,
    newTrackSize: number,
    resizeOperation: GridLayoutResizeOperation,
    state: ResizeState,
  ) {
    const { contras, resizeDirection, resizeItem, siblings } = state;

    const expandingResizeItem = resizeOperation === "expand";

    const track = resizeDirection === "horizontal" ? "column" : "row";

    // TODO use splitTrack from grid-layout-utils
    const newTracks = this.splitSharedTrack(
      tracks,
      newTrackSize,
      resizeOperation,
      state,
    );
    const updates = this.addTrack(newTrackIndex, resizeDirection);
    const indexAdjustment = expandingResizeItem ? -1 : +1;

    contras.forEach(({ id, [track]: { start, end } }) => {
      const existingUpdate = updates.find(
        ([itemId, positions]) => id === itemId && positions[track],
      );
      if (existingUpdate) {
        const [, { [track]: position }] = existingUpdate;
        if (position) {
          position.end += indexAdjustment;
        }
      } else {
        if (track === "column") {
          updates.push([id, { column: { start, end: end + indexAdjustment } }]);
        } else {
          updates.push([id, { row: { start, end: end + indexAdjustment } }]);
        }
      }
    });

    siblings.concat(resizeItem).forEach(({ id, [track]: { start, end } }) => {
      const existingUpdate = updates.find(
        ([itemId, positions]) => id === itemId && positions[track],
      );
      if (existingUpdate) {
        const [, { [track]: position }] = existingUpdate;
        if (position) {
          position.start += indexAdjustment;
        }
      } else {
        if (track === "column") {
          updates.push([id, { column: { start, end: end + indexAdjustment } }]);
        } else {
          updates.push([id, { row: { start, end: end + indexAdjustment } }]);
        }
      }
    });

    this.applyUpdates(updates);

    return { newTracks, updates };
  }

  private dropSplitTarget(
    droppedItemId: string,
    targetItemId: string,
    splitDirection: GridLayoutSplitDirection,
    splitIndex: number,
  ) {
    const updates: GridItemUpdate[] = [];
    const targetGridItem = this.gridModel.getChildItem(targetItemId, true);

    const [droppedItemPosition, targetItemPosition] = splitGridChildPosition(
      targetGridItem,
      splitDirection,
      splitIndex,
    );

    updates.push([targetItemId, targetItemPosition]);
    updates.push([droppedItemId, droppedItemPosition]);

    this.applyUpdates(updates);

    return updates;
  }

  /**
   * Dragged child item has been dropped on (NESW) quadrant of target.
   * Split the target in two, respecting targetted quadrant and
   * assign layout positions of each child item.
   */
  dropSplitGridItem(
    droppedItemId: string,
    targetItemId: string,
    splitDirection: GridLayoutSplitDirection,
    resizeDirection = gridResizeDirectionFromDropPosition(splitDirection),
  ) {
    const targetGridItem = this.gridModel.getChildItem(targetItemId, true);
    let updates: GridItemUpdate[] = [];

    // 1) determine where we need to split the track and check that this is, in fact, neccesary
    const currentTracks = this.gridModel.getTracks(resizeDirection);
    const isVertical = resizeDirection === "vertical";
    const { column: targetColumn, row: targetRow } = targetGridItem;

    const resizeTrack = isVertical ? targetRow : targetColumn;
    let newTrackIndex = resizeTrack.start - 1;
    let newTracks: number[] = [];

    if (resizeTrack.end - resizeTrack.start === 1) {
      updates = this.addTrack(newTrackIndex, resizeDirection);

      this.applyUpdates(updates);

      updates = updates.filter(
        ([id]) => id !== droppedItemId && id !== targetItemId,
      );

      updates = updates.concat(
        this.dropSplitTarget(
          droppedItemId,
          targetItemId,
          splitDirection,
          isVertical
            ? targetGridItem.row.end - 1
            : targetGridItem.column.end - 1,
        ),
      );

      newTracks = splitTrack(currentTracks, newTrackIndex);
    } else {
      // Is there already a track line in the required position
      const bisectingGridLine = getBisectingGridLine(
        currentTracks,
        resizeTrack.start,
        resizeTrack.end,
      );
      if (bisectingGridLine !== -1) {
        const [droppedItemPosition, targetItemPosition] =
          splitGridChildPosition(
            { column: targetGridItem.column, row: targetGridItem.row },
            splitDirection,
            bisectingGridLine,
          );

        updates.push([droppedItemId, droppedItemPosition]);
        updates.push([targetItemId, targetItemPosition]);
        this.applyUpdates(updates);
      } else {
        // this will calculate sizes of the new tracks
        ({ newTracks, newTrackIndex } = splitTracks(
          currentTracks,
          resizeTrack.start,
          resizeTrack.end,
        ));
        updates = this.addTrack(newTrackIndex, resizeDirection);

        updates = updates.filter(
          ([id]) => id !== droppedItemId && id !== targetItemId,
        );

        updates = updates.concat(
          this.dropSplitTarget(
            droppedItemId,
            targetItemId,
            splitDirection,
            newTrackIndex + 2,
          ),
        );
      }
    }

    if (newTracks.length > 0) {
      if (resizeDirection === "vertical") {
        this.gridModel.setGridRows(newTracks);
      } else {
        this.gridModel.setGridCols(newTracks);
      }
    }

    return updates;
  }

  // We may be splitting a GridItem either to make space for a new item (initialised below)
  // or because we are dropping an existing component (droppedGridItemId) that is being
  // repositioned. The GridItem for the dropped component will have been marked as dragging.
  splitGridItem(
    gridItemId: string,
    dropPosition: GridLayoutSplitDirection,
    tracks: number[],
    newGridItemId?: string,
  ): {
    newGridItem: IGridLayoutModelItem;
    tracks: number[];
    updates: GridItemUpdate[];
  } {
    const gridItem = this.gridModel.getChildItem(gridItemId, true);
    const resizeDirection = gridResizeDirectionFromDropPosition(dropPosition);
    let updates: GridItemUpdate[] | undefined = undefined;
    let newTracks = tracks;
    const isVertical = resizeDirection === "vertical";
    const track = isVertical ? "row" : "column";
    const { start, end } = gridItem[track];

    const newItemId = newGridItemId ?? uuid();

    const newGridItem: IGridLayoutModelItem = {
      column: { ...gridItem.column },
      id: newItemId,
      resizeable: "vh",
      row: { ...gridItem.row },
      type: "content",
    };
    this.gridModel.addChildItem(newGridItem);

    let newTrackIndex = start - 1;

    if (end - start === 1) {
      newTracks = splitTrack(tracks, newTrackIndex);
      updates = this.addTrack(newTrackIndex, resizeDirection);

      const [, { column: targetColumnPosition, row: targetRowPosition }] =
        findUpdate(updates, gridItemId, true);
      const [, { column: newColumnPosition, row: newRowPosition }] = findUpdate(
        updates,
        newItemId,
        true,
      );

      if (dropPosition === "north" || dropPosition === "west") {
        if (targetColumnPosition) {
          targetColumnPosition.start += 1;
        }
        if (targetRowPosition) {
          targetRowPosition.start += 1;
        }
        if (newColumnPosition) {
          newColumnPosition.end -= 1;
        }
        if (newRowPosition) {
          newRowPosition.end -= 1;
        }
      } else {
        if (targetColumnPosition) {
          targetColumnPosition.end - 1;
        }
        if (targetRowPosition) {
          targetRowPosition.end - 1;
        }
        if (newColumnPosition) {
          newColumnPosition.start += 1;
        }
        if (newRowPosition) {
          newRowPosition.start += 1;
        }
      }
    } else {
      // If there is already a trackEdge that bisects this gridItem ,
      // we just have to realign the gridItem
      const bisectingGridLine = getBisectingGridLine(tracks, start, end);
      if (bisectingGridLine !== -1) {
        if (dropPosition === "west") {
          updates = [
            [newItemId, { column: { start, end: bisectingGridLine } }],
            [gridItemId, { column: { start: bisectingGridLine, end } }],
          ];
        } else if (dropPosition === "north") {
          updates = [
            [newItemId, { row: { start, end: bisectingGridLine } }],
            [gridItemId, { row: { start: bisectingGridLine, end } }],
          ];
        } else if (dropPosition === "east") {
          updates = [
            [gridItemId, { column: { start, end: bisectingGridLine } }],
            [newItemId, { column: { start: bisectingGridLine, end } }],
          ];
        } else if (dropPosition === "south") {
          updates = [
            [gridItemId, { row: { start, end: bisectingGridLine } }],
            [newItemId, { row: { start: bisectingGridLine, end } }],
          ];
        }
      } else {
        // this will calculate sizes of the new tracks
        ({ newTracks, newTrackIndex } = splitTracks(tracks, start, end));
        const bisectingGridLine = newTrackIndex + 2;
        // this will apply trackEdge changes to gridLayoutItems
        updates = this.addTrack(newTrackIndex, resizeDirection);

        const [, { column: targetColumnPosition, row: targetRowPosition }] =
          findUpdate(updates, gridItemId, true);
        const [, { column: newColumnPosition, row: newRowPosition }] =
          findUpdate(updates, newItemId, true);

        if (dropPosition === "west") {
          newColumnPosition.end = bisectingGridLine;
          targetColumnPosition.start = bisectingGridLine;
        } else if (dropPosition === "north") {
          newRowPosition.end = bisectingGridLine;
          targetRowPosition.start = bisectingGridLine;
        } else if (dropPosition === "east") {
          newColumnPosition.start = bisectingGridLine;
          targetColumnPosition.end = bisectingGridLine;
        } else if (dropPosition === "south") {
          newRowPosition.start = bisectingGridLine;
          targetRowPosition.end = bisectingGridLine;
        }
      }
    }

    this.applyUpdates(updates);

    return {
      updates: updates ?? [],
      tracks: newTracks,
      newGridItem,
    };
  }

  /*
  When we add a track, all current track edges will be increased by 1.
  Any gridItem bound to an edge equal to or greater than the one being
  added must be adjusted.
 */
  addTrack(trackIndex: number, resizeDirection: GridLayoutResizeDirection) {
    const gridPosition = trackIndex + 1;
    const updates: GridItemUpdate[] = [];

    const [setExpanded, setShiftForward] =
      resizeDirection === "vertical"
        ? [this.setRowExpanded, this.setShiftRowForward]
        : [this.setColExpanded, this.setShiftColForward];

    const track = resizeDirection === "vertical" ? "row" : "column";
    for (const item of this.gridModel.childItems) {
      const { start, end } = item[track];
      console.log(`#${item.id} ${track}: ${start}/${end}`);

      if (start > gridPosition) {
        updates.push(setShiftForward(item));
      } else if (end > gridPosition) {
        updates.push(setExpanded(item));
      }
    }

    this.applyUpdates(updates);

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

    const track = resizeDirection === "horizontal" ? "column" : "row";
    for (const item of this.gridModel.childItems) {
      const { start, end } = item[track];
      let startUpdate: Partial<GridLayoutModelPosition> | undefined = undefined;
      let endUpdate: Partial<GridLayoutModelPosition> | undefined = undefined;

      if (start > gridPosition) {
        startUpdate = { start: start - 1 };
      }
      if (end > gridPosition) {
        endUpdate = { end: end - 1 };
      }

      if (startUpdate || endUpdate) {
        updates.push([
          item.id,
          {
            [track]: { start, end, ...startUpdate, ...endUpdate },
          } as OneOrBothGridLayoutModelCoordinates,
        ]);
      }
    }

    this.applyUpdates(updates);

    return updates;
  }

  splitSharedTrack(
    tracks: number[],
    newTrackSize: number,
    resizeOperation: GridLayoutResizeOperation,
    { resizeTrackIndex }: ResizeState,
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

  measureResizeDetails({
    grid,
    cols,
    mousePos,
    rows,
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
    cols: number[];
    mousePos: number;
    rows: number[];
  }): ResizeState | undefined {
    const contrasAndSiblings = this.gridModel.findContrasAndSiblings(
      resizeItem,
      resizeDirection,
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
      ${this.gridModel.childItems
        .map(
          ({ id, column, resizeable = "", row }) =>
            `\n${id}\t\tcol ${column.start}/${column.end}\t row ${row.start}/${row.end}\t${resizeable}`,
        )
        .join("")}
    `;
  }

  private applyUpdates(updates: GridItemUpdate[]) {
    updates?.forEach(([id, { column: columnPosition, row: rowPosition }]) => {
      if (columnPosition) {
        this.gridModel.upddateChildColumn(id, columnPosition);
      }
      if (rowPosition) {
        this.gridModel.upddateChildRow(id, rowPosition);
      }
    });
  }
}
