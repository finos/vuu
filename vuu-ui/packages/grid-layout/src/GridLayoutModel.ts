import {
  EventEmitter,
  uuid,
  type GridLayoutSplitDirection,
  type OptionalProperty,
} from "@vuu-ui/vuu-utils";
import {
  canSplitGridItem,
  doesResizeRequireNewTrack,
  gridResizeDirectionForSplit,
  insertTrackForResize,
  removeGridItem,
  replaceGridItem,
  shiftItemsForRemovedTrack,
  splitGridItem,
  type GridGeometryTransition,
  type GridInsertTrackTransition,
  type GridRemoveItemTransition,
  type GridReplaceItemTransition,
} from "./GridGeometry";
import { toGridItemUpdates } from "./GridModel";
import type {
  TrackType,
  GridLayoutModelCoordinates,
  GridModel,
  GridModelChildItem,
  GridModelEvents,
  GridTrackResizeConstraint,
  ISplitter,
} from "./GridModel";

export type GridLayoutModelPosition = {
  end: number;
  start: number;
};

export type ResizeState = {
  maxMousePos: number;
  minMousePos: number;
  proportionalTrackGroups?: {
    after: number[];
    before: number[];
  };
  proportionalTrackConstraints?: {
    after: GridTrackResizeConstraint[];
    before: GridTrackResizeConstraint[];
  };
  proportionalInitialTrackSizes?: number[];
  proportionalMoveBy?: number;
  resizeTrackIsShared: boolean;
  mousePos: number;
  splitter: ISplitter;
};

export type GridItemRemoveReason = "drag" | "close" | "placeholder" | "unstack";

export type GridLayoutResizeOperation = "contract" | "expand";
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

type OneOrBothGridLayoutModelCoordinates =
  | GridLayoutModelCoordinates
  | OptionalProperty<GridLayoutModelCoordinates, TrackType>;

export type GridItemUpdate = [string, OneOrBothGridLayoutModelCoordinates];
type ColumnAndRowUpdates = [GridItemUpdate[], GridItemUpdate[]];

export type GridLayoutModelEvents = Pick<
  GridModelEvents,
  "child-position-updates"
>;

export class GridLayoutModel extends EventEmitter<GridLayoutModelEvents> {
  private splitters: ISplitter[] | undefined;

  constructor(private gridModel: GridModel) {
    super();
  }

  /**
   * Hydrate a pure remove transition and notify listeners exactly as the
   * legacy engine did: positions are broadcast before placeholders are
   * regenerated.
   */
  applyRemoveTransition(transition: GridRemoveItemTransition) {
    const [removal] = transition.removals;
    const gridItem = this.gridModel.getChildItem(removal.id, true);
    const stackId = gridItem.stackId;
    this.gridModel.removeChildItem(removal.id, removal.reason);

    if (transition.stackMember && stackId) {
      const result = this.gridModel.removeStackItem(stackId, gridItem.id);
      if (!result.ok) {
        throw Error(result.error.message);
      }
      return;
    }

    this.gridModel.applyGeometryPositions(transition.geometry);
    if (transition.columns) {
      this.gridModel.tracks.applyTrackTransition("column", transition.columns);
    }
    if (transition.rows) {
      this.gridModel.tracks.applyTrackTransition("row", transition.rows);
    }

    if (transition.notify) {
      this.emit(
        "child-position-updates",
        toGridItemUpdates(transition.updates),
        {
          placeholders: true,
          splitters: true,
        },
      );
    }

    if (transition.placeholders) {
      this.gridModel.applyPlaceholderTransition(transition.placeholders);
    }
  }

  removeGridItem(gridItemId: string, reason: GridItemRemoveReason) {
    const geometry = this.gridModel.toGeometry();
    const result = this.gridModel.runGeometry((measurements) =>
      removeGridItem(
        geometry,
        { itemId: gridItemId, reason },
        { createPlaceholderId: uuid, measurements },
      ),
    );
    if (!result.ok) {
      throw Error(result.error.message);
    }
    this.applyRemoveTransition(result.value);
  }

  /** Hydrate a pure centre replacement transition. */
  applyReplaceTransition(transition: GridReplaceItemTransition) {
    for (const { id, reason } of transition.removals) {
      this.gridModel.removeChildItem(id, reason);
    }
    this.gridModel.applyGeometryPositions(transition.geometry);
  }

  dropReplaceGridItem(droppedItemId: string, targetItemId: string) {
    const droppedGridItem = this.gridModel.getChildItem(droppedItemId, true);
    const result = replaceGridItem(this.gridModel.toGeometry(), {
      droppedItemId,
      targetItemId,
    });
    if (!result.ok) {
      throw Error(result.error.message);
    }
    this.applyReplaceTransition(result.value);
    return droppedGridItem;
  }

  createSplitters(): ISplitter[] {
    return (this.splitters = this.gridModel.getSplitters());
  }

  getSplitterById(splitterId: string) {
    const splitter = this.splitters?.find(({ id }) => id === splitterId);
    if (splitter) {
      return splitter;
    } else {
      throw Error(`[GridLayoutModel] getSplitterId #${splitterId}`);
    }
  }

  getSplitter(
    gridLayoutItem: GridModelChildItem,
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

  /** Hydrate a pure track insertion transition. */
  applyInsertTrackTransition(
    trackType: TrackType,
    transition: GridInsertTrackTransition,
  ) {
    const trackTransition =
      trackType === "column" ? transition.columns : transition.rows;
    if (trackTransition) {
      this.gridModel.tracks.applyTrackTransition(trackType, trackTransition);
    }
    this.gridModel.applyUpdates(toGridItemUpdates(transition.insertUpdates));
    // The legacy engine notified twice, once for the tracks, once for the
    // grid items anchored to the new track.
    this.gridModel.emit(
      "child-position-updates",
      toGridItemUpdates(transition.insertUpdates),
      { splitters: true },
    );

    this.gridModel.applyGeometryPositions(transition.geometry);
    this.emit(
      "child-position-updates",
      toGridItemUpdates(transition.anchorUpdates),
      { splitters: true },
    );
  }

  /**
   * We're going to resize a gridItem that shares a grid line with one or
   * more other grid items. We need to insert a new grid line, then anchor
   * the griditem to be resized to the new grid line.
   */
  addTrackForResize(
    trackType: TrackType,
    newTrackSize: number,
    resizeOperation: GridLayoutResizeOperation,
    index: number,
    state: ResizeState,
  ) {
    const { splitter } = state;
    const { before: contraItemIds, after: resizeItemIds } =
      splitter.resizedChildItems;
    const position = resizeOperation === "expand" ? "before" : "after";
    const geometry = this.gridModel.toGeometry();
    const result = this.gridModel.runGeometry((measurements) =>
      insertTrackForResize(
        geometry,
        {
          contraItemIds,
          index,
          position,
          resizeItemIds,
          size: newTrackSize,
          trackType,
        },
        measurements,
      ),
    );
    if (!result.ok) {
      throw Error(result.error.message);
    }
    this.applyInsertTrackTransition(trackType, result.value);
  }

  /** Hydrate a pure split transition. */
  applySplitTransition(transition: GridGeometryTransition) {
    if (transition.columns) {
      this.gridModel.tracks.applyTrackTransition("column", transition.columns);
    }
    if (transition.rows) {
      this.gridModel.tracks.applyTrackTransition("row", transition.rows);
    }
    this.gridModel.applyGeometryPositions(transition.geometry);

    this.emit("child-position-updates", toGridItemUpdates(transition.updates), {
      splitters: true,
    });
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
    resizeDirection = gridResizeDirectionForSplit(splitDirection),
  ) {
    const geometry = this.gridModel.toGeometry();
    const result = this.gridModel.runGeometry((measurements) =>
      splitGridItem(
        geometry,
        {
          droppedItemId,
          resizeDirection,
          splitDirection,
          targetItemId,
        },
        measurements,
      ),
    );
    if (!result.ok) {
      if (result.error.code === "NON_RESIZABLE") {
        return false;
      }
      throw Error(result.error.message);
    }

    this.applySplitTransition(result.value);
    return true;
  }

  canSplitGridItem(
    targetItemId: string,
    splitDirection: GridLayoutSplitDirection,
  ) {
    return canSplitGridItem(
      this.gridModel.getChildItem(targetItemId, true),
      splitDirection,
    );
  }

  /*
  When we remove a track edge, all following track edges will be reduced by 1.
  Any gridItem bound to an edge greater than the one being removed must be
  adjusted.
 */
  removeTrack(trackIndex: number, resizeDirection: GridLayoutResizeDirection) {
    const trackType = resizeDirection === "horizontal" ? "column" : "row";
    const updates = toGridItemUpdates(
      shiftItemsForRemovedTrack(
        this.gridModel.toGeometry().items,
        trackType,
        trackIndex,
      ),
    );

    this.gridModel.applyUpdates(updates);

    return updates;
  }

  isResizeTrackShared(splitter: ISplitter) {
    if (this.splitters) {
      return doesResizeRequireNewTrack(this.splitters, splitter);
    } else {
      throw Error(
        "[GridLayoutModel] isResizeTrackShared, no splitters created",
      );
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
}
