import { EventEmitter, uuid, type OptionalProperty } from "@vuu-ui/vuu-utils";
import type { CSSProperties } from "react";
import type { DropPosition } from "./drag-drop-next/DragContextNext";
import {
  bisectTracks,
  computeSplitters,
  findBisectingTrack,
  findUnusedGridLines,
  getProportionalResizeAllowance,
  insertTrack,
  readTracks,
  regeneratePlaceholders,
  removeGridTrack,
  removeTrack,
  resizeTrackTo,
  resizeTracksAdjacent,
  resizeTracksProportionally,
  shiftItemsForInsertedTrack,
  shiftItemsForNewTrack,
  splitTrack,
  trackMetrics,
  type GridGeometry,
  type GridGeometryItem,
  type GridGeometryResult,
  type GridGeometryTrack,
  type GridGeometryUpdate,
  type GridMeasurements,
  type GridTrackTransition,
  type TrackMetrics,
} from "./GridGeometry";
import { getGridArea, getGridPosition } from "./grid-layout-utils";
import type {
  GridItemRemoveReason,
  GridItemUpdate,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
} from "./GridLayoutModel";
import {
  addGridStackItem,
  cloneGridStackState,
  createGridStack,
  gridStackSelectedIndex,
  normalizeGridStackState,
  removeGridStackItem,
  renameGridStackItem,
  reorderGridStackItem,
  selectGridStackItem,
  type GridStackArea,
  type GridStackMember,
  type GridStackResult,
  type GridStackState,
  type GridStackTransition,
} from "./GridStack";
import type { GridItemId, GridSpanSnapshot, StackId } from "./GridSnapshot";

export type TrackUnit = "px" | "fr";
export type CSSFraction = `${number}fr`;
export type CSSPixels = `${number}px`;
export type TrackSize = CSSFraction | CSSPixels;
export const DEFAULT_MIN_GRID_ITEM_SIZE = 80;

export const resolveMinimumGridItemSize = (
  minimum: number | undefined,
  styleMinimum: CSSProperties["minWidth"],
) => {
  if (minimum !== undefined) {
    return minimum;
  }
  if (typeof styleMinimum === "number") {
    return styleMinimum;
  }
  if (
    typeof styleMinimum === "string" &&
    /^-?\d+(?:\.\d+)?px$/.test(styleMinimum)
  ) {
    return Number.parseFloat(styleMinimum);
  }
};

export const isFractionUnit = (
  trackSize: TrackSize,
): trackSize is CSSFraction =>
  typeof trackSize === "string" && trackSize.endsWith("fr");

export const isPixelUnit = (trackSize: TrackSize): trackSize is CSSPixels =>
  typeof trackSize === "string" && trackSize.endsWith("px");

/**
 * Convert pure geometry updates into the legacy update tuples broadcast to
 * position listeners.
 */
export const toGridItemUpdates = (
  updates: readonly GridGeometryUpdate[],
): GridItemUpdate[] =>
  updates.map(({ column, id, row }) => [
    id,
    {
      ...(column ? { column: { end: column.end, start: column.start } } : {}),
      ...(row ? { row: { end: row.end, start: row.start } } : {}),
    },
  ]) as GridItemUpdate[];

//TODO shouldn't id be here ?
export interface GridLayoutChildItemDescriptor {
  componentId?: string;
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  gridArea: string;
  header?: boolean;
  minHeight?: number;
  minWidth?: number;
  resizeable?: GridModelItemResizeable;
  /**
   * For GridLayoutItems that are 'stacked' (e.g. displayed in tabbed container)
   * this is the id of the associated StackedLayoutItem.
   */
  stackId?: string;
  title?: string;
}

export interface GridLayoutChildItemDescriptorWithComponentId
  extends GridLayoutChildItemDescriptor {
  componentId: string;
}

export type GridLayoutChildItemDescriptors = Record<
  string,
  GridLayoutChildItemDescriptor
>;
// export type GridLayoutChildItemDescriptors =
//   | Record<string, GridLayoutChildItemDescriptor>
//   | GridLayoutChildItemDescriptorWithComponentId[];

export interface GridColumnsAndRows {
  cols: TrackSize[];
  rows: TrackSize[];
}

/**
 * Describes a GridLayout
 * grid rows and columns
 * layout details of gridItems
 *
 * @deprecated This is the v1 compatibility descriptor. Persist and observe
 * canonical GridSnapshot values through GridLayoutDocument/GridController.
 */
export interface GridLayoutDescriptor extends GridColumnsAndRows {
  gridLayoutItems?: GridLayoutChildItemDescriptors;
}

export interface GridLayoutModelCoordinates {
  column: GridLayoutModelPosition;
  row: GridLayoutModelPosition;
}

export interface GridModelChildItemProps
  extends Omit<GridLayoutChildItemDescriptor, "gridArea"> {
  contentVisible?: boolean;
  fixed?: boolean;
  height?: number;
  id: string;
  style?: GridChildItemStyle;
  type?: GridModelItemType;
  width?: number;
}

export type GridModelTrack = "column" | "row";

export type AssignDirection = "bwd" | "fwd";

export type TrackInsertionPosition = {
  index: number;
  position: "before" | "after";
};

const assertValidTracks = (track: "col" | "row", trackSizes?: TrackSize[]) => {
  if (trackSizes === undefined) {
    console.warn(`[GridModel]  ${track}s  must be specified`);
  }
};

/** @deprecated Use committed GridLayoutDocument changes from GridLayoutProvider. */
export type GridLayoutChangeHandler = (
  gridId: string,
  gridLayoutDescriptor: GridLayoutDescriptor,
) => void;

export type GridTrackAddedEvent = {
  gridId: string;
  trackType: TrackType;
  newTrackIndex: number;
  newTracks: GridTrack[];
};
export type GridTrackAddedHandler = (evt: GridTrackAddedEvent) => void;

export type NonContentResetOptions = {
  placeholders?: boolean;
  splitters?: boolean;
};

export const NonContentResetOptions: NonContentResetOptions = {
  placeholders: false,
  splitters: false,
};

export type GridChildPositionChangeHandler = (
  updates: GridItemUpdate[],
  nonContentResetOptions?: NonContentResetOptions,
) => void;

export type TabsChangeHandler = (
  tabsId: string,
  active: number,
  tabs: TabStateTab[],
) => void;
export type TabSelectionChangeHandler = (
  tabsId: string,
  active: number,
) => void;

export type GridModelEvents = {
  "grid-layout-change": GridLayoutChangeHandler;
  "grid-track-added": GridTrackAddedHandler;
  "child-position-updates": GridChildPositionChangeHandler;
  "tabs-change": TabsChangeHandler;
  "tabs-created": (stackItem: GridModelChildItem) => void;
  "tabs-removed": (tabsId: string) => void;
  "tab-selection-change": TabSelectionChangeHandler;
};

export type GridModelPosition = {
  end: number;
  start: number;
};

/**
 * Describes position of component within grid container. Position
 * is grid column and row start and end values.
 */
export interface GridModelCoordinates {
  column: GridModelPosition;
  row: GridModelPosition;
}

export type GridModelItemResizeable = "h" | "v" | "hv" | false;
export type GridModelItemType =
  | "content"
  | "placeholder"
  | "splitter"
  | "stacked-content";

/**
 * The set of attributes that allow the management of layout and behaviour of a
 * component laid out in a grid container.
 */
export interface IGridModelChildItem extends GridModelCoordinates {
  childId?: string[];
  closeable?: boolean;
  componentInstanceId?: string;
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  fixed?: boolean;
  header?: boolean;
  height?: number;
  id: string;
  minHeight?: number;
  minWidth?: number;
  stackId?: string;
  resizeable?: GridModelItemResizeable;
  title?: string;
  type: GridModelItemType;
  width?: number;
}

export interface IPlaceholder extends IGridModelChildItem {
  type: "placeholder";
}

// TODO revert this when we support full gridARea syntax
// export type GridChildItemStyle = Pick<CSSProperties, "gridArea">;
export type GridChildItemStyle = Omit<CSSProperties, "gridArea"> & {
  gridArea: string;
};

const isPlaceholder = (item: IGridModelChildItem): item is IPlaceholder =>
  item.type === "placeholder";

type StackedGridModelChildItem = GridModelChildItem & { stackId: string };
export const isStackedItem = (
  i: GridModelChildItem,
): i is StackedGridModelChildItem => !!i.stackId;

export type GridModelStackedChildItem = GridModelChildItem & {
  type: "stacked-content";
};

/** Read the canonical grid area of a legacy grid item. */
const toStackArea = ({ column, row }: GridModelCoordinates): GridStackArea => ({
  column: { span: column.end - column.start, start: column.start },
  row: { span: row.end - row.start, start: row.start },
});

const toGridModelPosition = ({
  span,
  start,
}: GridSpanSnapshot): GridModelPosition => ({ end: start + span, start });

class ObservableGridPosition {
  #id: string;
  #start: number;
  #end: number;
  constructor(id: string, { start, end }: GridModelPosition) {
    this.#id = id;
    this.#start = start;
    this.#end = end;
  }

  get start() {
    return this.#start;
  }
  set start(val: number) {
    // console.log(`[ObservableGridPosition] #${this.#id} set start ${val}`);
    this.#start = val;
  }
  get end() {
    return this.#end;
  }
  set end(val: number) {
    // console.log(`[ObservableGridPosition] #${this.#id} set end ${val}`);
    this.#end = val;
  }

  // clone() {
  //   return new ObservableGridPosition(this.#id, {
  //     start: this.#start,
  //     end: this.#end,
  //   });
  // }

  toJSON() {
    return {
      start: this.#start,
      end: this.#end,
    };
  }
}

export class GridModelChildItem implements IGridModelChildItem {
  id: string;
  column: GridModelPosition;
  componentInstanceId?: string;
  contentDetached?: boolean;
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  header?: boolean;
  height?: number;
  horizontalSplitter = false;
  minHeight?: number;
  minWidth?: number;
  stackId?: string;
  resizeable: GridModelItemResizeable;
  row: GridModelPosition;
  title?: string;
  type: GridModelItemType;
  verticalSplitter = false;
  width?: number;

  #dragging = false;

  constructor({
    componentInstanceId,
    header,
    height,
    id,
    minHeight,
    minWidth,
    row,
    column,
    dropTarget,
    stackId,
    resizeable = false,
    title,
    type = "content",
    width,
    contentVisible = stackId === undefined,
  }: OptionalProperty<IGridModelChildItem, "type">) {
    this.componentInstanceId = componentInstanceId;
    this.contentVisible = contentVisible;
    this.dropTarget = dropTarget;
    this.header = header;
    this.height = height;
    this.id = id;
    this.minHeight = minHeight;
    this.minWidth = minWidth;
    this.row = new ObservableGridPosition(id, row);
    this.column = new ObservableGridPosition(id, column);
    this.stackId = stackId;
    this.resizeable = resizeable;
    this.title = title;
    this.type = type;
    this.width = width;
  }

  get dragging() {
    return this.#dragging;
  }

  set dragging(isDragging: boolean) {
    // console.log(`[GridModelItem#${this.id}] set dragging ${isDragging}`);
    this.#dragging = isDragging;
  }

  get gridArea() {
    return getGridArea(this);
  }
}

export type AriaOrientation = "horizontal" | "vertical";
export type SplitterAlign = "start" | "end";

export interface ISplitter extends GridLayoutModelCoordinates {
  align: SplitterAlign;
  ariaOrientation: AriaOrientation;
  controls: string;
  id: string;
  orientation: GridLayoutResizeDirection;
  /**
   * Index values of the two grid tracks (column or row) whose
   * dimension (width for columns, height for rows) can be
   * manipulated with this splitter. The tracks will usually,
   * but not always, be adjacent.
   */
  resizedGridTracks: [number, number];
  resizedChildItems: {
    before: string[];
    after: string[];
  };
}

export type TabStateEvent = (tabState: TabState) => void;
export type TabStateTabEvents = {
  "active-change": TabStateEvent;
  "tab-added": (tabState: TabState, tab: TabStateTab) => void;
  "tab-detached": TabStateEvent;
  "tabs-change": (tabsId: string, active: number, tabs: TabStateTab[]) => void;
  "tabs-removed": (tabsId: string) => void;
};

export type TabStateTab = {
  id: string;
  label: string;
};

export class TabState extends EventEmitter<TabStateTabEvents> {
  detachedTab: TabStateTab | undefined = undefined;
  constructor(
    public id: string,
    public active: number,
    public tabs: TabStateTab[],
  ) {
    super();
  }

  setActiveTab(value: string) {
    this.active = this.indexOfTab(value);
    this.emit("active-change", this);
  }

  setActiveTabById(id: string) {
    this.active = this.tabs.findIndex((tab) => tab.id === id);
    this.emit("active-change", this);
  }

  /**
   * A Tab is detached when a drag operation commences. It is removed from Tabstrip, but associated component
   * remains in DOM. The 'next' tab is selected and the associated TabPanel made visible. The tab panel associated
   * with the detached tab remains below the selected tab panel. This allows a dragged tab panel to be repositioned
   * vis drag drop without removing it from DOM, triggering React unmount/remount.
   */
  detachTab(value: string) {
    const nextActiveTab = this.getNextActiveTab();
    if (nextActiveTab) {
      this.detachedTab = this.tabs[this.indexOfTab(value)];
      this.emit("tab-detached", this);
      this.setActiveTab(nextActiveTab.label);
    }
  }

  restoreDetachedTab(value: string) {
    if (this.detachedTab?.label === value) {
      this.detachedTab = undefined;
      this.setActiveTab(value);
    }
  }

  setNextActiveTab() {
    const nextActiveTab = this.getNextActiveTab();
    if (nextActiveTab) {
      this.setActiveTab(nextActiveTab.label);
    }
  }

  moveTab(
    tab: TabStateTab,
    { position, target }: DropPosition,
    activateTab = false,
  ) {
    const { label: activeTab } = this.activeTab;
    const indexOfMovedTab = this.indexOfTab(tab.label);
    const newTabs = this.tabs.slice();
    const [movedTab] = newTabs.splice(indexOfMovedTab, 1);
    const indexOfTargetTab = this.indexOfTab(target, newTabs);

    if (position === "after") {
      newTabs.splice(indexOfTargetTab + 1, 0, movedTab);
    } else {
      newTabs.splice(indexOfTargetTab, 0, movedTab);
    }

    this.tabs = newTabs;

    if (activateTab) {
      this.active = this.indexOfTab(tab.label);
    } else {
      this.active = this.indexOfTab(activeTab);
    }

    this.emit("tabs-change", this.id, this.active, this.tabs);
  }

  moveTabById(
    tabId: string,
    targetId: string,
    position: "after" | "before",
    activateTab = false,
  ) {
    const activeTabId = this.activeTab.id;
    const newTabs = this.tabs.slice();
    const indexOfMovedTab = newTabs.findIndex(({ id }) => id === tabId);
    const [movedTab] = newTabs.splice(indexOfMovedTab, 1);
    const indexOfTargetTab = newTabs.findIndex(({ id }) => id === targetId);
    newTabs.splice(
      position === "after" ? indexOfTargetTab + 1 : indexOfTargetTab,
      0,
      movedTab,
    );
    this.tabs = newTabs;
    this.active = this.tabs.findIndex(
      ({ id }) => id === (activateTab ? tabId : activeTabId),
    );
    this.emit("tabs-change", this.id, this.active, this.tabs);
  }

  addTab(tab: TabStateTab, dropPosition?: DropPosition) {
    if (dropPosition) {
      const { position, target } = dropPosition;
      const pos = this.indexOfTab(target);
      const newTabs = this.tabs.slice();
      newTabs.splice(position === "after" ? pos + 1 : pos, 0, tab);
      this.active = newTabs.indexOf(tab);
      this.tabs = newTabs;
      this.emit("tab-added", this, tab);
    } else {
      const newTabs = this.tabs.concat([tab]);
      this.tabs = newTabs;
      if (this.active === -1) {
        this.setActiveTab(tab.label);
      }
    }
  }

  removeTab(id: string) {
    const activeTabId = this.activeTab.id;
    const previousActive = this.active;
    this.tabs = this.tabs.filter((tab) => tab.id !== id);
    this.active =
      activeTabId === id
        ? Math.min(previousActive, this.tabs.length - 1)
        : this.tabs.findIndex((tab) => tab.id === activeTabId);
    if (this.tabs.length === 1) {
      this.emit("tabs-removed", this.id);
    } else {
      this.emit("tabs-change", this.id, this.active, this.tabs);
    }
  }

  renameTab(id: string, label: string) {
    const tabIndex = this.tabs.findIndex((tab) => tab.id === id);
    if (tabIndex !== -1) {
      this.tabs[tabIndex] = { id, label };
      this.emit("tabs-change", this.id, this.active, this.tabs);
    } else {
      throw Error(
        `[TabState] cannot rename tab #${id} => '${label}', tab not found`,
      );
    }
  }

  get activeTab() {
    return this.tabs[this.active];
  }

  private getNextActiveTab() {
    const pos = this.tabs.indexOf(this.activeTab);
    return pos > 0 ? this.tabs[pos - 1] : this.tabs[pos + 1];
  }

  private indexOfTab(label: string, tabs = this.tabs) {
    return tabs.findIndex((tab) => tab.label === label);
  }
}

export type TrackType = "column" | "row";

export type GridTrackResizeHandler = (
  trackType: TrackType,
  tracks: GridTrack[],
) => void;
export type GridTrackEvents = {
  "grid-track-added": GridTrackAddedHandler;
  "grid-track-resize": GridTrackResizeHandler;
};

export type GridTrackResizeConstraint = {
  minimum: number;
  trackIndices: number[];
};

export class GridTrack {
  static fromTrackSize = (trackSize: TrackSize) => new GridTrack(trackSize);

  #measuredValue = -1;
  #fractions = -1;
  #pixels = -1;

  constructor(trackSize: TrackSize) {
    this.trackSize = trackSize;
  }

  get hasBeenMeasured() {
    return this.#measuredValue !== -1;
  }

  get isFraction() {
    return this.#fractions !== -1;
  }

  get isPixelValue() {
    return this.#pixels !== -1;
  }

  get isMeasured() {
    return this.measuredValue !== -1;
  }

  get measuredValue() {
    return this.#measuredValue;
  }

  set measuredValue(value: number) {
    this.#measuredValue = value;
  }

  convertUnitsToPixels() {
    if (this.hasBeenMeasured) {
      this.#pixels = this.#measuredValue;
      this.#fractions = -1;
    } else {
      throw Error(
        "[GridTrack] convertUnitToPixels, tracks must be measured before calling this method",
      );
    }
  }

  get hasNumericValue() {
    return this.isPixelValue || this.isMeasured;
  }

  get numericValue(): number {
    if (this.isPixelValue) {
      return this.#pixels;
    } else if (this.#measuredValue !== -1) {
      return this.#measuredValue;
    } else {
      throw Error(
        "[GridTrack] getter numericValue, trackSize is neither numeric or a pixel value",
      );
    }
  }

  get trackSize() {
    return this.#fractions !== -1
      ? `${this.#fractions}fr`
      : `${this.#pixels}px`;
  }

  set trackSize(trackSize: TrackSize) {
    if (isPixelUnit(trackSize)) {
      this.#pixels = parseFloat(trackSize);
      this.#fractions = -1;
    } else {
      this.#fractions = parseFloat(trackSize);
      this.#pixels = -1;
    }

    this.#measuredValue = -1;
  }

  addFraction(trackSize: TrackSize) {
    if (this.isFraction && isFractionUnit(trackSize)) {
      this.#fractions += parseFloat(trackSize);
    } else {
      throw Error("Track.addFraction, both trackSize values must be fractions");
    }
  }

  increment(value: number) {
    if (this.isFraction && !this.isMeasured) {
      throw Error(
        `[GridTrack] increment, value ${this.trackSize} cannot be incremented unless measured first`,
      );
    }

    if (this.isFraction) {
      this.convertUnitsToPixels();
    }

    this.#pixels += value;
  }

  toString = () => this.trackSize;
}

type GridTrackCheckpoint = {
  readonly track: GridTrack;
  readonly measuredValue: number;
  readonly size: TrackSize;
};

type GridTracksCheckpoint = {
  readonly columns: readonly GridTrackCheckpoint[];
  readonly rows: readonly GridTrackCheckpoint[];
};

export class GridTracks extends EventEmitter<GridTrackEvents> {
  #columns: GridTrack[];
  #rows: GridTrack[];

  constructor(
    private gridId: string,
    columns: TrackSize[],
    rows: TrackSize[],
  ) {
    super();
    this.#columns = columns.map(GridTrack.fromTrackSize);
    this.#rows = rows.map(GridTrack.fromTrackSize);
  }

  get columns() {
    return this.#columns.map((col) => col.trackSize);
  }

  // suspected NOT USED
  set columns(columns: TrackSize[]) {
    this.#columns = columns.map(GridTrack.fromTrackSize);
    this.emit("grid-track-resize", "column", this.#columns);
  }

  get rows() {
    return this.#rows.map((col) => col.trackSize);
  }

  // suspected NOT USED
  set rows(rows: TrackSize[]) {
    this.#rows = rows.map(GridTrack.fromTrackSize);
    this.emit("grid-track-resize", "row", this.#rows);
  }

  get colCount() {
    return this.#columns.length;
  }
  get rowCount() {
    return this.#rows.length;
  }

  getTracks(trackType: TrackType) {
    return trackType === "column" ? this.#columns : this.#rows;
  }

  createCheckpoint(): GridTracksCheckpoint {
    const checkpointTrack = (track: GridTrack): GridTrackCheckpoint => ({
      measuredValue: track.measuredValue,
      size: track.trackSize,
      track,
    });
    return {
      columns: this.#columns.map(checkpointTrack),
      rows: this.#rows.map(checkpointTrack),
    };
  }

  restoreCheckpoint({ columns, rows }: GridTracksCheckpoint) {
    const restoreTrack = ({
      measuredValue,
      size,
      track,
    }: GridTrackCheckpoint) => {
      track.trackSize = size;
      if (measuredValue !== -1) {
        track.measuredValue = measuredValue;
      }
      return track;
    };
    this.#columns = columns.map(restoreTrack);
    this.#rows = rows.map(restoreTrack);
    this.emit("grid-track-resize", "column", this.#columns);
    this.emit("grid-track-resize", "row", this.#rows);
  }

  /**
   * Set the numeric track values from values read from DOM. This is invoked from a callbackRef
   * as soom as GridLayout container is rendered into dom.
   */
  measure(trackType: TrackType) {
    const el = document.getElementById(this.gridId);
    if (el) {
      const tracks = this.getTracks(trackType);
      const measuredTracks = getComputedStyle(el)
        .getPropertyValue(`grid-template-${trackType}s`)
        .split(" ")
        .map((value) => parseFloat(value));

      measuredTracks.forEach((val, i) => {
        if (tracks[i] === undefined) {
          //debugger;
        } else {
          tracks[i].measuredValue = val;
        }
      });
    } else {
      throw Error(`[GridTracks] measure no grid element found #${this.gridId}`);
    }
  }

  /**
   * The immutable measurement input for a track type. Measured values are -1
   * for tracks that have not been measured.
   */
  getTrackMetrics(trackType: TrackType): TrackMetrics {
    return trackMetrics(
      this.getTracks(trackType).map((track) => track.measuredValue),
    );
  }

  private readGeometryTracks(trackType: TrackType) {
    return readTracks(
      this.getTracks(trackType).map(({ trackSize }) => trackSize),
      this.getTrackMetrics(trackType),
    );
  }

  /**
   * Run a pure track transition. Measurement is the only browser input the
   * geometry needs; when a transition reports that it is missing, tracks are
   * measured and the transition is retried.
   */
  runTrackGeometry<T>(
    trackType: TrackType,
    compute: (tracks: readonly GridGeometryTrack[]) => GridGeometryResult<T>,
  ): GridGeometryResult<T> {
    const result = compute(this.readGeometryTracks(trackType));
    if (!result.ok && result.error.code === "MEASUREMENT_REQUIRED") {
      this.measure(trackType);
      return compute(this.readGeometryTracks(trackType));
    }
    return result;
  }

  private runTrackTransition<T>(
    trackType: TrackType,
    compute: (tracks: readonly GridGeometryTrack[]) => GridGeometryResult<T>,
  ): T {
    const result = this.runTrackGeometry(trackType, compute);
    if (!result.ok) {
      throw Error(result.error.message);
    }
    return result.value;
  }

  /**
   * Hydrate a pure track transition. Track instances are reused wherever the
   * transition identifies the track they derive from, so that measured values
   * survive transitions which leave a track untouched.
   */
  applyTrackTransition(
    trackType: TrackType,
    { sources, tracks: nextTracks }: GridTrackTransition,
  ) {
    const currentTracks = this.getTracks(trackType);
    const claimedSources = new Set<number>();
    const tracks = nextTracks.map(({ measured, size }, index) => {
      const source = sources[index] ?? -1;
      const existingTrack =
        source === -1 || claimedSources.has(source)
          ? undefined
          : currentTracks[source];
      if (existingTrack) {
        claimedSources.add(source);
      }
      const track = existingTrack ?? new GridTrack(size);
      if (track.trackSize !== size || track.measuredValue !== measured) {
        track.trackSize = size;
        if (measured !== -1) {
          track.measuredValue = measured;
        }
      }
      return track;
    });

    if (trackType === "column") {
      this.#columns = tracks;
    } else {
      this.#rows = tracks;
    }

    this.emit("grid-track-resize", trackType, tracks);
  }

  getBisectingTrack(
    trackType: TrackType,
    startIndex: number,
    endIndex: number,
  ) {
    return this.runTrackTransition(trackType, (tracks) =>
      findBisectingTrack(tracks, startIndex, endIndex, trackType),
    );
  }

  /**
   * Split a single track into 2 equal sized tracks
   */
  splitTrack(trackType: TrackType, trackIndex: number) {
    this.applyTrackTransition(
      trackType,
      this.runTrackTransition(trackType, (tracks) =>
        splitTrack(tracks, trackIndex, trackType),
      ),
    );
  }

  /**
   * Given multiple tracks (columns/rows), create a new grid line that exactly bisects
   * given tracks.
   */
  //TODO what if there is an existing track that bisects range
  splitTracks(
    trackType: TrackType,
    fromTrackLine: number,
    toTrackLine: number,
  ) {
    const { newTrackIndex, transition } = this.runTrackTransition(
      trackType,
      (tracks) => bisectTracks(tracks, fromTrackLine, toTrackLine, trackType),
    );
    this.applyTrackTransition(trackType, transition);
    return newTrackIndex;
  }

  /**
   * In the trackInsertionPosition, the index always indicates where the new track
   * will be inserted. The position indicates where it falls, conceptually, in relation
   * to the existing two tracks that it will fall between. It will overlap one, but not
   * both of the existing track positions.
   */
  insertTrack(
    trackType: TrackType,
    { index, position }: TrackInsertionPosition,
    trackSize: number,
  ) {
    const transition = this.runTrackTransition(trackType, (tracks) =>
      insertTrack(tracks, { index, position }, trackSize, trackType),
    );
    if (transition) {
      this.applyTrackTransition(trackType, transition);
    }
  }

  removeTrack(
    trackType: TrackType,
    index: number,
    assignDirection: AssignDirection = "fwd",
  ) {
    this.applyTrackTransition(
      trackType,
      this.runTrackTransition(trackType, (tracks) =>
        removeTrack(tracks, index, assignDirection, trackType),
      ),
    );
  }

  resizeTo(
    trackType: TrackType,
    trackIndex: number,
    value: TrackSize,
    // animate = true,
  ) {
    this.applyTrackTransition(
      trackType,
      this.runTrackTransition(trackType, (tracks) =>
        resizeTrackTo(tracks, trackIndex, value, trackType),
      ),
    );
  }

  resizeBy(
    trackType: "row" | "column",
    trackIndex: number,
    contraTrackIndex: number,
    value: number,
  ) {
    this.applyTrackTransition(
      trackType,
      this.runTrackTransition(trackType, (tracks) =>
        resizeTracksAdjacent(
          tracks,
          {
            contraTrackIndex,
            delta: value,
            resizedTrackIndex: trackIndex,
          },
          trackType,
        ),
      ),
    );
  }

  resizeGroupsProportionally(
    trackType: TrackType,
    beforeTrackIndices: number[],
    afterTrackIndices: number[],
    value: number,
    beforeConstraints: GridTrackResizeConstraint[] = [],
    afterConstraints: GridTrackResizeConstraint[] = [],
    initialTrackSizes?: number[],
  ) {
    this.applyTrackTransition(
      trackType,
      this.runTrackTransition(trackType, (tracks) =>
        resizeTracksProportionally(
          tracks,
          {
            afterConstraints,
            afterTrackIndices,
            beforeConstraints,
            beforeTrackIndices,
            delta: value,
            initialSizes: initialTrackSizes,
          },
          trackType,
        ),
      ),
    );
  }

  getProportionalResizeAllowance(
    trackType: TrackType,
    trackIndices: number[],
    constraints: GridTrackResizeConstraint[],
  ) {
    return this.runTrackTransition(trackType, (tracks) =>
      getProportionalResizeAllowance(
        tracks,
        trackIndices,
        constraints,
        trackType,
      ),
    );
  }

  get css(): Pick<CSSProperties, "gridTemplateColumns" | "gridTemplateRows"> {
    return {
      gridTemplateColumns: this.#columns.join(" "),
      gridTemplateRows: this.#rows.join(" "),
    };
  }

  serialize() {
    return {
      cols: this.columns,
      rows: this.rows,
    };
  }

  toString() {
    return `
      grid-template-columns: ${this.#columns.join(" ")}
      grid-template-rows: ${this.#rows.join(" ")}
    `;
  }
}

type GridModelChildItemCheckpoint = {
  readonly item: GridModelChildItem;
  readonly state: {
    readonly column: GridModelPosition;
    readonly contentDetached: boolean | undefined;
    readonly contentVisible: boolean | undefined;
    readonly dragging: boolean;
    readonly dropTarget: boolean | string | undefined;
    readonly header: boolean | undefined;
    readonly height: number | undefined;
    readonly horizontalSplitter: boolean;
    readonly minHeight: number | undefined;
    readonly minWidth: number | undefined;
    readonly resizeable: GridModelItemResizeable;
    readonly row: GridModelPosition;
    readonly stackId: string | undefined;
    readonly title: string | undefined;
    readonly type: GridModelItemType;
    readonly verticalSplitter: boolean;
    readonly width: number | undefined;
  };
};

type TabStateCheckpoint = {
  readonly active: number;
  readonly detachedTab: TabStateTab | undefined;
  readonly tabs: readonly TabStateTab[];
  readonly tabState: TabState;
};

export type GridModelCheckpoint = {
  readonly childItems: readonly GridModelChildItemCheckpoint[];
  readonly stackStates: readonly (readonly [StackId, GridStackState])[];
  readonly tabStates: readonly TabStateCheckpoint[];
  readonly tracks: GridTracksCheckpoint;
};

export class GridModel extends EventEmitter<GridModelEvents> {
  tracks: GridTracks;

  #childItems: GridModelChildItem[] = [];
  #index = new Map<string, IGridModelChildItem>();
  #tabState = new Map<string, TabState>();
  /**
   * Canonical stack state, keyed by stack id. This is the authority for stack
   * membership, order, identity and selection; TabState is projected from it.
   */
  #stackStates = new Map<StackId, GridStackState>();

  createCheckpoint(): GridModelCheckpoint {
    return {
      childItems: this.#childItems.map((item) => ({
        item,
        state: {
          column: { end: item.column.end, start: item.column.start },
          contentDetached: item.contentDetached,
          contentVisible: item.contentVisible,
          dragging: item.dragging,
          dropTarget: item.dropTarget,
          header: item.header,
          height: item.height,
          horizontalSplitter: item.horizontalSplitter,
          minHeight: item.minHeight,
          minWidth: item.minWidth,
          resizeable: item.resizeable,
          row: { end: item.row.end, start: item.row.start },
          stackId: item.stackId,
          title: item.title,
          type: item.type,
          verticalSplitter: item.verticalSplitter,
          width: item.width,
        },
      })),
      tabStates: [...this.#tabState.values()].map((tabState) => ({
        active: tabState.active,
        detachedTab: tabState.detachedTab
          ? { ...tabState.detachedTab }
          : undefined,
        tabState,
        tabs: tabState.tabs.map((tab) => ({ ...tab })),
      })),
      stackStates: [...this.#stackStates].map(
        ([stackId, state]) => [stackId, cloneGridStackState(state)] as const,
      ),
      tracks: this.tracks.createCheckpoint(),
    };
  }

  restoreCheckpoint({
    childItems,
    stackStates,
    tabStates,
    tracks,
  }: GridModelCheckpoint) {
    const currentStacks = new Map(
      this.#childItems
        .filter(({ type }) => type === "stacked-content")
        .map((item) => [item.id, item]),
    );
    const currentTabStates = new Map(
      [...this.#tabState].map(([id, { active, tabs }]) => [
        id,
        { active, tabs: tabs.map((tab) => ({ ...tab })) },
      ]),
    );
    this.tracks.restoreCheckpoint(tracks);
    this.#childItems = childItems.map(({ item, state }) => {
      item.column.start = state.column.start;
      item.column.end = state.column.end;
      item.contentDetached = state.contentDetached;
      item.contentVisible = state.contentVisible;
      item.dragging = state.dragging;
      item.dropTarget = state.dropTarget;
      item.header = state.header;
      item.height = state.height;
      item.horizontalSplitter = state.horizontalSplitter;
      item.minHeight = state.minHeight;
      item.minWidth = state.minWidth;
      item.resizeable = state.resizeable;
      item.row.start = state.row.start;
      item.row.end = state.row.end;
      item.stackId = state.stackId;
      item.title = state.title;
      item.type = state.type;
      item.verticalSplitter = state.verticalSplitter;
      item.width = state.width;
      return item;
    });
    this.#index = new Map(this.#childItems.map((item) => [item.id, item]));
    this.#tabState = new Map(
      tabStates.map(({ active, detachedTab, tabs, tabState }) => {
        tabState.active = active;
        tabState.detachedTab = detachedTab ? { ...detachedTab } : undefined;
        tabState.tabs = tabs.map((tab) => ({ ...tab }));
        return [tabState.id, tabState];
      }),
    );
    this.#stackStates = new Map(
      stackStates.map(([stackId, state]) => [
        stackId,
        cloneGridStackState(state),
      ]),
    );
    const restoredStacks = new Map(
      this.#childItems
        .filter(({ type }) => type === "stacked-content")
        .map((item) => [item.id, item]),
    );
    for (const stackId of currentStacks.keys()) {
      if (!restoredStacks.has(stackId)) {
        this.emit("tabs-removed", stackId);
      }
    }
    for (const [stackId, stackItem] of restoredStacks) {
      if (!currentStacks.has(stackId)) {
        this.emit("tabs-created", stackItem);
      } else {
        const restored = this.#tabState.get(stackId);
        const current = currentTabStates.get(stackId);
        if (
          restored &&
          current &&
          (restored.active !== current.active ||
            JSON.stringify(restored.tabs) !== JSON.stringify(current.tabs))
        ) {
          this.emit(
            "tabs-change",
            stackId,
            restored.active,
            restored.tabs.map((tab) => ({ ...tab })),
          );
          this.emit("tab-selection-change", stackId, restored.active);
        }
      }
    }
  }

  constructor(
    public id: string,
    { cols, gridLayoutItems, rows }: GridLayoutDescriptor,
  ) {
    super();

    assertValidTracks("col", cols);
    assertValidTracks("row", rows);

    this.tracks = new GridTracks(id, cols, rows);

    if (gridLayoutItems) {
      this.addChildItems(gridLayoutItems);
    }
  }

  get childItems() {
    return this.#childItems;
  }

  private handleTabsChange = (
    stackId: string,
    active: number,
    tabs: TabStateTab[],
  ) => {
    const activeTab = tabs[active];
    this.activateStackedChildItem(stackId, activeTab);
    this.emit("tabs-change", stackId, active, tabs);
  };

  private handleTabsRemoved = (stackId: string) => {
    this.removeChildItem(stackId, "unstack");

    this.emit("tabs-removed", stackId);
  };

  private handleTabSelectionChange = ({
    active,
    activeTab,
    id: stackId,
  }: TabState) => {
    this.activateStackedChildItem(stackId, activeTab);
    this.emit("tab-selection-change", stackId, active);
  };

  private handleTabAdded = ({ activeTab, id, tabs }: TabState) => {
    const active = tabs.indexOf(activeTab);

    const stackItem = this.getChildItem(id, true);
    const stackedItem = this.getChildItem(activeTab.id, true);

    stackedItem.stackId = id;

    // TODO - should we assign same instance of column and row to stacked items ?
    this.updateChildColumn(activeTab.id, stackItem.column);
    this.updateChildRow(activeTab.id, stackItem.row);
    this, this.activateStackedChildItem(id, activeTab);
    this.emit("child-position-updates", [
      [activeTab.id, { column: stackItem.column, row: stackItem.row }],
    ]);

    this.emit("tabs-change", id, active, tabs);
  };
  private handleTabDetached = ({ activeTab, id: stackId }: TabState) => {
    this.detachStackedChildItem(stackId, activeTab);
  };

  getTabState = (
    tabsId: string,
    fallbackAction: "throw" | "create" = "throw",
  ): TabState => {
    const tabState = this.#tabState.get(tabsId);
    if (tabState) {
      return tabState;
    } else if (fallbackAction === "create") {
      // GridItems that refer to this stack may have already been created,
      // find them here
      this.setTabState(tabsId, [], -1);
      return this.getTabState(tabsId, "throw");
    } else {
      throw Error(
        `[GridModel#${this.id}] getTabState, no tabState found for tabs #${tabsId} and no initialisation params provided`,
      );
    }
  };

  setTabState(
    stackId: string,
    childItems: GridModelChildItem[],
    activeItem = 0,
  ) {
    const tabs = childItems.map(({ id, title }, index) => ({
      id,
      label: title ?? `Label-${index + 1}`,
    }));
    const tabState = this.#createTabState(stackId, tabs, activeItem);

    if (tabs[activeItem]) {
      // tabState can be set before childItems are identified in the case of an
      // explicit GridLayoutStackedItem. In this case the activeStackedChildItem
      // will be activated later.
      this.activateStackedChildItem(stackId, tabs[activeItem]);
    }

    return tabState;
  }

  #createTabState(stackId: string, tabs: TabStateTab[], active: number) {
    if (this.#tabState.get(stackId)) {
      throw Error(`[GridModel] setTabState  already created for ${stackId}`);
    }
    const tabState = new TabState(stackId, active, tabs);

    tabState.on("active-change", this.handleTabSelectionChange);
    tabState.on("tab-added", this.handleTabAdded);
    tabState.on("tab-detached", this.handleTabDetached);
    tabState.on("tabs-change", this.handleTabsChange);
    tabState.on("tabs-removed", this.handleTabsRemoved);

    this.#tabState.set(stackId, tabState);
    return tabState;
  }

  // -------------------------------------------------------------------------
  // canonical stack state
  //
  // Stack membership, order, identity, selection, placement and lifecycle are
  // owned by the pure transitions in GridStack.ts. The methods below hydrate
  // canonical state from this model and project a transition back onto the
  // legacy runtime (child items, TabState and the events the React layer
  // listens to). They are the only writers of stack semantics.
  // -------------------------------------------------------------------------

  /**
   * Canonical stack state. Membership, order, identity and selection are read
   * from the canonical store — they are never re-derived from the mutable
   * runtime projection once a stack exists. Placement and durable layout
   * metadata are read from the grid item, which the geometry engine owns.
   */
  getStackState = (stackId: StackId): GridStackState => {
    const canonical =
      this.#stackStates.get(stackId) ?? this.#hydrateStack(stackId);
    const anchor =
      this.getChildItem(stackId) ??
      this.getChildItem(canonical.members[0]?.id ?? "");
    const state = normalizeGridStackState({
      ...canonical,
      area: anchor ? toStackArea(anchor) : canonical.area,
      metadata: anchor
        ? {
            minHeight: anchor.minHeight,
            minWidth: anchor.minWidth,
            resizeable: anchor.resizeable,
          }
        : canonical.metadata,
    });
    this.#stackStates.set(stackId, state);
    return state;
  };

  /**
   * Adopt the legacy runtime as canonical state, once, for a stack that was
   * created outside a canonical transition (declarative JSX, a restored
   * layout, or a legacy caller).
   */
  #hydrateStack(stackId: StackId): GridStackState {
    const { active, tabs } = this.getTabState(stackId);
    return {
      area: { column: { span: 1, start: 1 }, row: { span: 1, start: 1 } },
      id: stackId,
      members: tabs.map(({ id, label }) => ({
        id,
        label,
        title: this.getChildItem(id)?.title,
      })),
      metadata: {},
      selectedItemId: tabs[active]?.id ?? "",
    };
  }

  /** Every stack currently present in the layout, in child item order. */
  getStackStates(): GridStackState[] {
    return this.#childItems
      .filter(({ type }) => type === "stacked-content")
      .map(({ id }) => this.getStackState(id));
  }

  /**
   * Project a canonical stack transition onto the compatibility runtime. The
   * legacy TabState is written from canonical state, never the other way
   * round; observers are then notified exactly as the legacy engine notified
   * them, for presentation only.
   */
  applyStackTransition(transition: GridStackTransition) {
    const { operation, state } = transition;
    if (transition.dissolved) {
      this.#stackStates.delete(state.id);
    } else {
      this.#stackStates.set(state.id, state);
    }
    switch (operation) {
      case "create": {
        const [reference] = state.members;
        const referenceItem = this.getChildItem(reference.id, true);
        const stackItem = new GridModelChildItem({
          column: toGridModelPosition(state.area.column),
          id: state.id,
          minHeight: state.metadata.minHeight,
          minWidth: state.metadata.minWidth,
          resizeable: state.metadata.resizeable,
          row: toGridModelPosition(state.area.row),
          type: "stacked-content",
        });
        stackItem.horizontalSplitter = referenceItem.horizontalSplitter;
        stackItem.verticalSplitter = referenceItem.verticalSplitter;
        this.#createTabState(
          state.id,
          state.members.map(({ id, label }) => ({ id, label })),
          gridStackSelectedIndex(state),
        );
        this.#registerChildItem(stackItem);
        for (const { id } of state.members) {
          const member = this.getChildItem(id, true);
          member.horizontalSplitter = referenceItem.horizontalSplitter;
          member.verticalSplitter = referenceItem.verticalSplitter;
        }
        this.#applyStackPlacement(state);
        this.#applyStackSelection(state);
        this.emit("tabs-created", stackItem);
        return;
      }
      case "add": {
        this.#applyStackPlacement(state);
        const tabState = this.#writeTabState(state);
        this.#applyStackSelection(state);
        if (transition.positioned) {
          // The legacy engine broadcast the coordinates of a tab dropped at a
          // specific position before it announced the new tab order.
          const [{ id: addedId }] = transition.added;
          const { column, row } = this.getChildItem(addedId, true);
          this.emit("child-position-updates", [[addedId, { column, row }]]);
          this.emit("tabs-change", state.id, tabState.active, tabState.tabs);
        }
        return;
      }
      case "remove": {
        const tabState = this.#writeTabState(state);
        if (transition.dissolved) {
          this.removeChildItem(state.id, "unstack");
          this.emit("tabs-removed", state.id);
        } else {
          this.#applyStackSelection(state);
          this.emit("tabs-change", state.id, tabState.active, tabState.tabs);
        }
        return;
      }
      case "rename":
      case "reorder": {
        const tabState = this.#writeTabState(state);
        this.#applyStackSelection(state);
        this.emit("tabs-change", state.id, tabState.active, tabState.tabs);
        return;
      }
      case "select": {
        const tabState = this.#writeTabState(state);
        this.#applyStackSelection(state);
        this.emit("tab-selection-change", state.id, tabState.active);
        return;
      }
      default:
        throw Error(`[GridModel] unhandled stack transition ${operation}`);
    }
  }

  /** Create a stack from two existing grid items. */
  createStack(
    targetId: GridItemId,
    itemId: GridItemId,
    stackId: StackId = uuid(),
  ): GridStackResult<GridStackTransition> {
    const targetChild = this.getChildItem(targetId, true);
    const stackedChild = this.getChildItem(itemId, true);
    const result = createGridStack({
      area: toStackArea(targetChild),
      id: stackId,
      members: [targetChild, stackedChild].map(
        ({ id, title }, index): GridStackMember => ({
          id,
          label: title ?? `Label-${index + 1}`,
          title,
        }),
      ),
      metadata: {
        minHeight: targetChild.minHeight,
        minWidth: targetChild.minWidth,
        resizeable: targetChild.resizeable,
      },
    });
    if (result.ok) {
      this.applyStackTransition(result.value);
    }
    return result;
  }

  /** Register a new grid item and add it to a stack in one transition. */
  addStackItem(
    stackId: StackId,
    childItem: GridModelChildItem,
    dropPosition?: DropPosition,
  ): GridStackResult<GridStackTransition> {
    const result = this.#addStackTransition(stackId, childItem, dropPosition);
    if (result.ok) {
      this.#registerChildItem(childItem);
      this.applyStackTransition(result.value);
    }
    return result;
  }

  /** Add an existing grid item to a stack. */
  addStackMember(
    stackId: StackId,
    itemId: GridItemId,
    dropPosition?: DropPosition,
  ): GridStackResult<GridStackTransition> {
    const result = this.#addStackTransition(
      stackId,
      this.getChildItem(itemId, true),
      dropPosition,
    );
    if (result.ok) {
      this.applyStackTransition(result.value);
    }
    return result;
  }

  #addStackTransition(
    stackId: StackId,
    { id, title }: GridModelChildItem,
    dropPosition?: DropPosition,
  ) {
    const state = this.getStackState(stackId);
    const position = dropPosition
      ? {
          placement: dropPosition.position,
          // legacy drop positions identify their target by label; the first
          // match is used, exactly as the legacy tabstrip did.
          targetItemId:
            state.members.find(({ label }) => label === dropPosition.target)
              ?.id ?? dropPosition.target,
        }
      : undefined;
    return addGridStackItem(state, {
      member: { id, label: title ?? id, title },
      position,
    });
  }

  /** Remove a member from a stack, dissolving the stack when it empties. */
  removeStackItem(
    stackId: StackId,
    itemId: GridItemId,
  ): GridStackResult<GridStackTransition> {
    const result = removeGridStackItem(this.getStackState(stackId), { itemId });
    if (result.ok) {
      this.applyStackTransition(result.value);
    }
    return result;
  }

  /** Select a stack member by its stable id. */
  selectStackItem(
    stackId: StackId,
    itemId: GridItemId,
  ): GridStackResult<GridStackTransition> {
    const result = selectGridStackItem(this.getStackState(stackId), { itemId });
    if (result.ok) {
      this.applyStackTransition(result.value);
    }
    return result;
  }

  /** Move a stack member relative to another member. */
  reorderStackItem(
    stackId: StackId,
    request: {
      activate?: boolean;
      itemId: GridItemId;
      placement: "after" | "before";
      targetItemId: GridItemId;
    },
  ): GridStackResult<GridStackTransition> {
    const result = reorderGridStackItem(this.getStackState(stackId), request);
    if (result.ok) {
      this.applyStackTransition(result.value);
    }
    return result;
  }

  #renameStackItem(
    stackId: StackId,
    itemId: GridItemId,
    title: string,
  ): GridStackResult<GridStackTransition> {
    const result = renameGridStackItem(this.getStackState(stackId), {
      itemId,
      title,
    });
    if (result.ok) {
      this.applyStackTransition(result.value);
    }
    return result;
  }

  #writeTabState(state: GridStackState) {
    const tabState = this.getTabState(state.id);
    tabState.tabs = state.members.map(({ id, label }) => ({ id, label }));
    tabState.active = gridStackSelectedIndex(state);
    return tabState;
  }

  /** Members always occupy the stack area and reference the stack. */
  #applyStackPlacement(state: GridStackState) {
    const column = toGridModelPosition(state.area.column);
    const row = toGridModelPosition(state.area.row);
    for (const { id } of state.members) {
      const member = this.getChildItem(id);
      if (member) {
        member.stackId = state.id;
        this.updateChildColumn(id, column);
        this.updateChildRow(id, row);
      }
    }
  }

  #applyStackSelection(state: GridStackState) {
    const selected = state.members.find(
      ({ id }) => id === state.selectedItemId,
    );
    if (selected) {
      this.activateStackedChildItem(state.id, selected);
    }
  }

  activateStackedChildItem(stackId: string, { id }: TabStateTab) {
    const stackedChildren = this.getStackedChildItems(stackId);
    stackedChildren.forEach((child) => {
      if (child.id === id) {
        child.contentVisible = true;
        child.contentDetached = undefined;
      } else {
        child.contentVisible = false;
      }
    });
  }

  detachStackedChildItem(stackId: string, { id }: TabStateTab) {
    const stackedChildren = this.getStackedChildItems(stackId);
    const detachedChild = stackedChildren.find(
      ({ id: itemId }) => itemId === id,
    );
    if (detachedChild) {
      detachedChild.contentDetached = true;
    }
  }

  /**
   * A tab is detached when a drag operation commences: it is removed from the
   * TabStrip but its content remains in the DOM. Selection moves to the
   * neighbouring member, chosen from canonical order.
   */
  detachTab(stackId: StackId, label: string) {
    const tabState = this.getTabState(stackId);
    const state = this.getStackState(stackId);
    const selectedIndex = gridStackSelectedIndex(state);
    if (state.members[selectedIndex]?.label !== label) {
      return;
    }
    const next =
      state.members[selectedIndex - 1] ?? state.members[selectedIndex + 1];
    if (!next) {
      return;
    }
    tabState.detachedTab = { ...tabState.tabs[selectedIndex] };
    this.detachStackedChildItem(stackId, state.members[selectedIndex]);
    const result = this.selectStackItem(stackId, next.id);
    if (!result.ok) {
      throw Error(result.error.message);
    }
  }

  restoreDetachedTab(stackId: StackId, label: string) {
    const tabState = this.getTabState(stackId);
    const detachedTab = tabState.detachedTab;
    if (detachedTab?.label === label) {
      tabState.detachedTab = undefined;
      const result = this.selectStackItem(stackId, detachedTab.id);
      if (!result.ok) {
        throw Error(result.error.message);
      }
    }
  }

  moveItemWithinTabs(
    tabsId: string,
    tab: TabStateTab,
    { position, target }: DropPosition,
    selectMovedTab: boolean,
  ) {
    const state = this.getStackState(tabsId);
    const result = this.reorderStackItem(tabsId, {
      activate: selectMovedTab,
      itemId: tab.id,
      placement: position,
      targetItemId:
        state.members.find(({ label }) => label === target)?.id ?? target,
    });
    if (!result.ok) {
      throw Error(result.error.message);
    }
  }

  moveItemBetweenTabs(
    fromTabsId: string,
    toTabsId: string,
    tab: TabStateTab,
    dropPosition: DropPosition,
  ) {
    const removed = this.removeStackItem(fromTabsId, tab.id);
    if (!removed.ok) {
      throw Error(removed.error.message);
    }
    const added = this.addStackMember(toTabsId, tab.id, dropPosition);
    if (!added.ok) {
      throw Error(added.error.message);
    }
  }

  notifyChange() {
    this.emit("grid-layout-change", this.id, this.toGridLayoutDescriptor());
  }

  restoreLayout({ cols, gridLayoutItems = {}, rows }: GridLayoutDescriptor) {
    this.clearPlaceholders();
    this.tracks.columns = cols;
    this.tracks.rows = rows;
    for (const [id, { gridArea }] of Object.entries(gridLayoutItems)) {
      const child = this.getChildItem(id);
      if (child) {
        const { column, row } = getGridPosition(gridArea);
        this.updateChildColumn(id, column);
        this.updateChildRow(id, row);
        child.dragging = false;
      }
    }
    this.createPlaceholders();
  }

  toGridLayoutDescriptor(): GridLayoutDescriptor {
    return {
      ...this.tracks.serialize(),
      gridLayoutItems: this.#childItems.reduce<GridLayoutChildItemDescriptors>(
        (
          result,
          {
            id,
            column,
            componentInstanceId,
            contentVisible,
            dropTarget,
            header,
            minHeight,
            minWidth,
            resizeable,
            row,
            stackId,
            title,
            type,
            dragging,
          },
        ) => {
          // Runtime stack containers and transactionally detached drag sources
          // are not part of the canonical layout.
          if (type !== "stacked-content" && !(dragging && !stackId)) {
            result[id] = {
              ...(componentInstanceId === undefined
                ? {}
                : { componentId: componentInstanceId }),
              contentVisible,
              dropTarget,
              gridArea: `${row.start}/${column.start}/${row.end}/${column.end}`,
              header,
              minHeight,
              minWidth,
              resizeable,
              stackId,
              title,
            };
          }
          return result;
        },
        {},
      ),
    };
  }

  splitGridTrack(trackType: TrackType, trackIndex: number) {
    this.tracks.splitTrack(trackType, trackIndex);
    this.updateChildItemsToAccommodateNewTrack(trackType, trackIndex);
  }

  splitGridTracks(
    trackType: TrackType,
    fromTrackLine: number,
    toTrackLine: number,
  ) {
    const trackIndex = this.tracks.splitTracks(
      trackType,
      fromTrackLine,
      toTrackLine,
    );

    this.updateChildItemsToAccommodateNewTrack(trackType, trackIndex);

    return trackIndex;
  }

  private updateChildItemsToAccommodateNewTrack(
    trackType: TrackType,
    trackIndex: number,
  ) {
    this.applyUpdates(
      toGridItemUpdates(
        shiftItemsForNewTrack(this.toGeometry().items, trackType, trackIndex),
      ),
    );
  }

  insertGridTrack(
    trackType: TrackType,
    { index, position }: TrackInsertionPosition,
    trackSize: number,
  ) {
    this.tracks.insertTrack(trackType, { index, position }, trackSize);

    const updates = toGridItemUpdates(
      shiftItemsForInsertedTrack(
        this.toGeometry().items,
        trackType,
        index,
        position,
      ),
    );

    this.applyUpdates(updates);
    // do we ned to fire an event here ?
    this.emit("child-position-updates", updates, { splitters: true });
  }

  removeGridTrack(
    trackType: TrackType,
    trackIndex: number,
    assignDirection?: AssignDirection,
    updateChildItems = true,
  ) {
    const geometry = this.toGeometry();
    const result = this.runGeometry((measurements) =>
      removeGridTrack(
        geometry,
        {
          assignDirection,
          trackIndex,
          trackType,
          updateItems: updateChildItems,
        },
        measurements,
      ),
    );
    if (!result.ok) {
      throw Error(result.error.message);
    }
    const { columns, rows, updates } = result.value;
    const trackTransition = trackType === "column" ? columns : rows;
    if (trackTransition) {
      this.tracks.applyTrackTransition(trackType, trackTransition);
    }

    if (updateChildItems) {
      const itemUpdates = toGridItemUpdates(updates);
      this.applyUpdates(itemUpdates);
      this.emit("child-position-updates", itemUpdates, { splitters: true });
    }
  }

  /**
   * Read an immutable geometry snapshot. This is the input to every pure
   * geometry transition; the model itself is never read by those transitions.
   */
  toGeometry(): GridGeometry {
    return {
      columns: this.tracks.columns,
      items: this.#childItems.map(
        ({ column, dragging, id, resizeable, row, stackId, type }) => ({
          column: { end: column.end, start: column.start },
          dragging,
          id,
          resizeable,
          row: { end: row.end, start: row.start },
          stackId,
          type,
        }),
      ),
      rows: this.tracks.rows,
    };
  }

  /** The current measurement input for both track types. */
  getMeasurements(): GridMeasurements {
    return {
      column: this.tracks.getTrackMetrics("column"),
      row: this.tracks.getTrackMetrics("row"),
    };
  }

  /**
   * Run a pure geometry transition, measuring tracks and retrying once if the
   * transition reports that it needs measurement it was not given.
   */
  runGeometry<T>(
    compute: (measurements: GridMeasurements) => GridGeometryResult<T>,
  ): GridGeometryResult<T> {
    const result = compute(this.getMeasurements());
    if (
      result.ok ||
      result.error.code !== "MEASUREMENT_REQUIRED" ||
      result.error.trackType === undefined
    ) {
      return result;
    }
    this.tracks.measure(result.error.trackType);
    return compute(this.getMeasurements());
  }

  /**
   * Hydrate the item positions described by a pure geometry into the model.
   */
  applyGeometryPositions(geometry: GridGeometry) {
    for (const { column, id, row } of geometry.items) {
      const childItem = this.getChildItem(id);
      if (childItem === undefined) {
        continue;
      }
      if (
        childItem.column.start !== column.start ||
        childItem.column.end !== column.end
      ) {
        this.updateChildColumn(id, { end: column.end, start: column.start });
      }
      if (childItem.row.start !== row.start || childItem.row.end !== row.end) {
        this.updateChildRow(id, { end: row.end, start: row.start });
      }
    }
  }

  applyUpdates(updates: GridItemUpdate[]) {
    updates?.forEach(([id, { column: columnPosition, row: rowPosition }]) => {
      if (columnPosition) {
        this.updateChildColumn(id, columnPosition);
      }
      if (rowPosition) {
        this.updateChildRow(id, rowPosition);
      }
    });
  }

  private addChildItems(childItems: GridLayoutChildItemDescriptors) {
    for (const [
      id,
      {
        componentId,
        contentVisible,
        dropTarget,
        header,
        minHeight,
        minWidth,
        resizeable,
        stackId,
        title,
        ...item
      },
    ] of Object.entries(childItems)) {
      const { column, row } = getGridPosition(item.gridArea);
      this.addChildItem(
        new GridModelChildItem({
          contentVisible,
          componentInstanceId: componentId,
          id,
          column,
          dropTarget,
          header,
          minHeight,
          minWidth,
          resizeable,
          row,
          stackId,
          title,
        }),
      );
    }
  }

  addChildItem(childItem: GridModelChildItem, dropPosition?: DropPosition) {
    // TODO assert that item is within current columns, rows or extend these

    // GridLayoutStackedItem may or may not be declared explicitly in JSX.
    // If not, it will be created post initial render, based on stackId
    // references in gridItems. If declared explicitly, it may or may not
    // preceed childItems in source code order.
    if (childItem.stackId && this.getChildItem(childItem.stackId)) {
      const result = this.addStackItem(
        childItem.stackId,
        childItem,
        dropPosition,
      );
      if (!result.ok) {
        throw Error(result.error.message);
      }
      return;
    }
    this.#registerChildItem(childItem);
  }

  #registerChildItem(childItem: GridModelChildItem) {
    this.#childItems.push(childItem);
    this.#index.set(childItem.id, childItem);
  }

  updateChildTitle(childItemId: string, title: string) {
    const childItem = this.getChildItem(childItemId, true);
    if (title !== childItem.title) {
      childItem.title = title;
      if (childItem.stackId) {
        const result = this.#renameStackItem(
          childItem.stackId,
          childItemId,
          title,
        );
        if (!result.ok) {
          throw Error(
            `[TabState] cannot rename tab #${childItemId} => '${title}', tab not found`,
          );
        }
      }
    }
  }

  updateChildColumn(childItemId: string, { start, end }: GridModelPosition) {
    const childItem = this.getChildItem(childItemId, true);
    const { start: previousStart, end: previousEnd } = childItem.column;
    if (start !== previousStart) {
      childItem.column.start = start;
    }
    if (end !== previousEnd) {
      childItem.column.end = end;
    }

    if (childItem.type === "stacked-content") {
      const stackedChildItems = this.getStackedChildItems(childItemId);
      stackedChildItems.forEach((childItem) => {
        this.updateChildColumn(childItem.id, { start, end });
      });
    }
  }

  updateChildRow(childItemId: string, { start, end }: GridModelPosition) {
    const childItem = this.getChildItem(childItemId, true);
    const { start: previousStart, end: previousEnd } = childItem.row;
    if (start !== previousStart) {
      childItem.row.start = start;
    }
    if (end !== previousEnd) {
      childItem.row.end = end;
    }

    if (childItem.type === "stacked-content") {
      const stackedChildItems = this.getStackedChildItems(childItemId);
      stackedChildItems.forEach((childItem) => {
        this.updateChildRow(childItem.id, { start, end });
      });
    }
  }

  /**
   * How we handle removal depends on context (the remove reason).
   * If the child item is being deleted, we clear all references to the
   * item in our internal structures. If the item is being dragged, we
   * can expect it to be dropped again. We preserve some references,
   * but mark the item as dragging.
   */
  removeChildItem(childItemId: string, reason: GridItemRemoveReason) {
    const childItem = this.getChildItem(childItemId, true);
    if (reason === "drag") {
      childItem.dragging = true;
    } else {
      const indexOfDoomedItem = this.#childItems.indexOf(childItem);
      this.#childItems.splice(indexOfDoomedItem, 1);
      this.#index.delete(childItemId);
      if (childItem.type === "stacked-content") {
        this.#stackStates.delete(childItemId);
        const stackedChildItems = this.getStackedChildItems(childItemId);
        stackedChildItems.forEach((childItem) => {
          childItem.stackId = undefined;
          childItem.contentVisible = true;
        });
      }
    }
  }

  stackChildItems(targetId: string, stackedChildId: string) {
    const result = this.createStack(targetId, stackedChildId);
    if (!result.ok) {
      throw Error(result.error.message);
    }
  }

  getChildItem(childItemId: string, throwIfNotFound: true): GridModelChildItem;
  getChildItem(
    childItemId: string,
    throwIfNotFound?: false,
  ): GridModelChildItem | undefined;
  getChildItem(childItemId: string, throwIfNotFound = false) {
    const gridItem = this.#index.get(childItemId);
    if (gridItem) {
      return gridItem;
    } else if (throwIfNotFound) {
      throw Error(`[GridModel] GridItem #${childItemId} not found`);
    }
  }

  getStackedChildItems(): Map<string, StackedGridModelChildItem[]>;
  getStackedChildItems(stackId: string): GridModelChildItem[];
  getStackedChildItems(stackId?: string) {
    if (stackId) {
      return this.childItems.filter(
        (childItem) => childItem.stackId === stackId,
      );
    } else {
      const stackedChildren = this.childItems.filter(isStackedItem);
      return Map.groupBy(stackedChildren, ({ stackId }) => stackId);
    }
  }

  validateChildId(childItemId: string) {
    if (this.#childItems.findIndex(({ id }) => id === childItemId) === -1) {
      throw Error(`[GridModel] validateChildId #${childItemId}`);
    } else {
      return childItemId;
    }
  }

  clearPlaceholders() {
    const placeHolders = this.getPlaceholders();
    placeHolders.forEach((placeholder) =>
      this.removeChildItem(placeholder.id, "placeholder"),
    );
  }

  findUnusedGridLines() {
    const [unusedColLines, unusedRowLines] = findUnusedGridLines(
      this.toGeometry(),
    );
    return [[...unusedColLines], [...unusedRowLines]];
  }

  /*
  Placeholders are created to represent any empty areas on the grid
  */
  createPlaceholders() {
    this.applyPlaceholderTransition(
      regeneratePlaceholders(this.toGeometry(), uuid),
    );
  }

  /**
   * Hydrate the placeholders described by a pure placeholder transition.
   */
  applyPlaceholderTransition({
    added,
    removedIds,
  }: {
    added: readonly GridGeometryItem[];
    removedIds: readonly string[];
  }) {
    removedIds.forEach((id) => {
      if (this.getChildItem(id)) {
        this.removeChildItem(id, "placeholder");
      }
    });
    added.forEach(({ column, id, resizeable, row, type }) => {
      this.addChildItem(
        new GridModelChildItem({
          column: { end: column.end, start: column.start },
          id,
          resizeable,
          row: { end: row.end, start: row.start },
          type,
        }),
      );
    });
  }

  getPlaceholders() {
    return this.childItems.filter(isPlaceholder);
  }

  getSplitters(): ISplitter[] {
    const { horizontalSplitterItemIds, splitters, verticalSplitterItemIds } =
      computeSplitters(this.toGeometry());

    const horizontal = new Set(horizontalSplitterItemIds);
    const vertical = new Set(verticalSplitterItemIds);
    this.#childItems.forEach((childItem) => {
      childItem.horizontalSplitter = horizontal.has(childItem.id);
      childItem.verticalSplitter = vertical.has(childItem.id);
    });

    return splitters.map(
      ({ column, resizedChildItems, resizedGridTracks, row, ...splitter }) => ({
        ...splitter,
        column: { end: column.end, start: column.start },
        resizedChildItems: {
          after: [...resizedChildItems.after],
          before: [...resizedChildItems.before],
        },
        resizedGridTracks: [...resizedGridTracks] as [number, number],
        row: { end: row.end, start: row.start },
      }),
    );
  }

  toDebugString() {
    return this.#childItems
      .map(
        (c) =>
          `${c.id.padEnd(10)} col ${c.column.start}/${c.column.end}, row ${c.row.start}/${c.row.end}`,
      )
      .join("\n");
  }

  /**
   * Given a column, return all childItems starting at that column
   */
  findByColumnStart(col: number, childItems = this.#childItems) {
    const childItemsStartingAtCol = childItems.filter(
      ({ column: { start } }) => start === col,
    );
    return childItemsStartingAtCol.length === 0
      ? undefined
      : childItemsStartingAtCol;
  }
  /**
   * Given a column, return all childItems ending at that column
   */
  findByColumnEnd(col: number, childItems = this.#childItems) {
    const childItemsEndingAtCol = childItems.filter(
      ({ column: { end } }) => end === col,
    );
    return childItemsEndingAtCol.length === 0
      ? undefined
      : childItemsEndingAtCol;
  }
  /**
   * Given a row, return all childItems starting at that row
   */
  findByRowStart(row: number, childItems = this.#childItems) {
    const childItemsStartingAtRow = childItems.filter(
      ({ row: { start } }) => start === row,
    );
    return childItemsStartingAtRow.length === 0
      ? undefined
      : childItemsStartingAtRow;
  }
  /**
   * Given a row, return all childItems ending at that row
   */
  findByRowEnd(row: number, childItems = this.#childItems) {
    const childItemsEndingAtRow = childItems.filter(
      ({ row: { end } }) => end === row,
    );
    return childItemsEndingAtRow.length === 0
      ? undefined
      : childItemsEndingAtRow;
  }
}
