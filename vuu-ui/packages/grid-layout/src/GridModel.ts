import { EventEmitter, uuid, type OptionalProperty } from "@vuu-ui/vuu-utils";
import { CSSProperties } from "react";
import { DropPosition } from "./drag-drop-next/DragContextNext";
import {
  byColumnStart,
  byRowStart,
  getGridPosition,
  getMatchingColspan,
  getMatchingRowspan,
  isFixedHeightChildItem,
  isFixedWidthChildItem,
  setColumnEnd,
  moveColumn,
  setRowEnd,
  moveRow,
  getGridArea,
} from "./grid-layout-utils";
import { getEmptyExtents, getGridMatrix } from "./grid-matrix";
import {
  GridItemRemoveReason,
  GridItemUpdate,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
} from "./GridLayoutModel";

export type TrackUnit = "px" | "fr";
export type CSSFraction = `${number}fr`;
export type CSSPixels = `${number}px`;
export type TrackSize = CSSFraction | CSSPixels;

export const isFractionUnit = (
  trackSize: TrackSize,
): trackSize is CSSFraction =>
  typeof trackSize === "string" && trackSize.endsWith("fr");

export const isPixelUnit = (trackSize: TrackSize): trackSize is CSSPixels =>
  typeof trackSize === "string" && trackSize.endsWith("px");

const NO_SPLITTERS: ISplitter[] = [];

//TODO shouldn't id be here ?
export interface GridLayoutChildItemDescriptor {
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  gridArea: string;
  header?: boolean;
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
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  fixed?: boolean;
  header?: boolean;
  height?: number;
  id: string;
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
  contentDetached?: boolean;
  contentVisible?: boolean;
  dropTarget?: boolean | string;
  header?: boolean;
  height?: number;
  horizontalSplitter = false;
  stackId?: string;
  resizeable: GridModelItemResizeable;
  row: GridModelPosition;
  title?: string;
  type: GridModelItemType;
  verticalSplitter = false;
  width?: number;

  #dragging = false;

  constructor({
    header,
    height,
    id,
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
    this.contentVisible = contentVisible;
    this.dropTarget = dropTarget;
    this.header = header;
    this.height = height;
    this.id = id;
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
    console.log(`[GridModelItem#${this.id}] set dragging ${isDragging}`);
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

  addTab(tab: TabStateTab, dropPosition?: DropPosition) {
    if (dropPosition) {
      const { position, target } = dropPosition;
      console.log(
        `[TabState#${this.id}] add tab #${tab.id} ${tab.label} ${position} ${target}`,
      );
      const pos = this.indexOfTab(target);
      const newTabs = this.tabs.slice();
      newTabs.splice(pos, 0, tab);
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
    console.log(`[TabState] remove tab ${id}`);
    const { label: activeLabel } = this.activeTab;
    this.tabs = this.tabs.filter((tab) => tab.id !== id);
    this.active = this.indexOfTab(activeLabel);
    if (this.tabs.length === 1) {
      this.emit("tabs-removed", this.id);
    } else {
      this.emit("tabs-change", this.id, this.active, this.tabs);
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
        `[GridTrack] convertUnitToPixels, tracks must be measured before calling this method`,
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
        `[GridTrack] getter numericValue, trackSize is neither numeric or a pixel value`,
      );
    }
  }

  get trackSize() {
    return this.#fractions !== -1
      ? `${this.#fractions}fr`
      : `${this.#pixels}px`;
  }

  set trackSize(trackSize: TrackSize) {
    console.log(
      `[GridTrackTrack] set trackSize ${trackSize}, this measuredValue ${this.measuredValue}`,
    );

    if (isPixelUnit(trackSize)) {
      this.#pixels = parseInt(trackSize);
      this.#fractions = -1;
    } else {
      this.#fractions = parseInt(trackSize);
      this.#pixels = -1;
    }

    this.#measuredValue = -1;
  }

  addFraction(trackSize: TrackSize) {
    if (this.isFraction && isFractionUnit(trackSize)) {
      this.#fractions += parseInt(trackSize);
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

    console.log(`[GridTracks]
      columns ${columns.join(" ")}
      rows ${rows.join(" ")}`);
  }

  get columns() {
    return this.#columns.map((col) => col.trackSize);
  }

  // suspected NOT USED
  set columns(columns: TrackSize[]) {
    alert("unexpected");
    console.log(`[GridTracks] set columns ${columns.join(" ")}`);
    this.#columns = columns.map(GridTrack.fromTrackSize);
    this.emit("grid-track-resize", "column", this.#columns);
  }

  get rows() {
    return this.#rows.map((col) => col.trackSize);
  }

  // suspected NOT USED
  set rows(rows: TrackSize[]) {
    alert("unexpected");
    console.log(`[GridTracks] set rows ${rows.join(" ")}`);
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
        .map((value) => parseInt(value, 10));
      console.log(
        `[GridTracks] measure  ${trackType} ${measuredTracks.join(" ")}`,
      );
      measuredTracks.forEach((val, i) => (tracks[i].measuredValue = val));
    } else {
      throw Error(`[GridTracks] measure no grid element found #${this.gridId}`);
    }
  }

  getBisectingTrack(
    trackType: TrackType,
    startIndex: number,
    endIndex: number,
  ) {
    console.log(
      `[GridTracks] getBisectingTrack (${trackType}) [${startIndex} : ${endIndex}] `,
    );

    const tracks = this.getTracks(trackType);
    const tracksInRange = tracks.slice(startIndex - 1, endIndex);
    if (!tracksInRange.every((track) => track.hasNumericValue)) {
      this.measure(trackType);
    }

    if (endIndex - startIndex > 1) {
      // Total the sizes between start and end
      // find the half way point
      // see if an existing edge occurs at that point (or wiuthin .5 pixesl, if decimal)
    }
    let size = 0;
    for (let i = startIndex - 1; i < endIndex - 1; i++) {
      size += tracks[i].numericValue;
    }
    const halfSize = size / 2;

    size = 0;
    for (let i = startIndex - 1; i < endIndex - 1; i++) {
      size += tracks[i].numericValue;
      if (Math.abs(halfSize - size) < 1) {
        return i + 2;
      }
    }
    return -1;
  }

  /**
   * Split a single track into 2 equal sized tracks
   *
   */
  splitTrack(trackType: TrackType, trackIndex: number) {
    console.log(`[GridTracks] splitTrack (${trackType}) [${trackIndex}] `);

    const tracks = this.getTracks(trackType);
    const targetTrack = tracks[trackIndex];
    if (targetTrack.isFraction) {
      const otherFractionTracks = tracks.filter(
        (track, i) => i !== trackIndex && track.isFraction,
      );

      if (otherFractionTracks.length === 0) {
        tracks.splice(trackIndex, 0, new GridTrack(targetTrack.trackSize));
      } else if (otherFractionTracks.length === 1) {
        const [otherFractionTrack] = otherFractionTracks;
        if (otherFractionTrack.trackSize === "1fr") {
          otherFractionTrack.trackSize = "2fr";
          targetTrack.trackSize = "1fr";
          tracks.splice(trackIndex, 0, new GridTrack("1fr"));
        } else {
          console.log("need to do a bit more here");
        }
      } else {
        console.log("need to do a bit more here");
      }
    } else {
      const sizeOfNewTrack = Math.floor(targetTrack.numericValue / 2);

      tracks.splice(trackIndex, 0, new GridTrack(`${sizeOfNewTrack}px`));
      targetTrack.increment(-sizeOfNewTrack);
    }

    this.emit("grid-track-resize", trackType, tracks);
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
    const tracks = this.getTracks(trackType);

    const tracksInRange = tracks.slice(fromTrackLine - 1, toTrackLine);

    let newTrackIndex = 0;
    const newTracks: GridTrack[] = [];

    // if (tracksInRange.every(({ trackSize }) => isFractionUnit(trackSize))) {
    //   console.log(`every track is a fraction`);
    //   const fractionTotal = tracksInRange.reduce((sum, { trackSize }) => {
    //     sum += parseInt(trackSize as string);
    //     return sum;
    //   }, 0);

    //   if (fractionTotal % 2 === 0) {
    //     const newSize = fractionTotal / 2;
    //     console.log(`new trackSize ${newSize}fr`);
    //   } else {
    //     console.log("need to double up all fractions in tracks");
    //   }

    // } else {
    if (!tracksInRange.every((track) => track.hasNumericValue)) {
      this.measure(trackType);
    }

    let size = 0;
    for (let i = fromTrackLine - 1; i < toTrackLine - 1; i++) {
      size += tracks[i].numericValue;
    }
    let halfTrack = Math.floor(size / 2);
    for (let i = 0; i < tracks.length; i++) {
      if (i < fromTrackLine - 1) {
        newTracks.push(tracks[i]);
      } else if (i < toTrackLine - 1) {
        if (tracks[i].numericValue < halfTrack) {
          newTracks.push(tracks[i]);
          halfTrack -= tracks[i].numericValue;
        } else if (halfTrack) {
          newTrackIndex = newTracks.length;
          newTracks.push(new GridTrack(`${halfTrack}px`));
          newTracks.push(
            new GridTrack(`${tracks[i].numericValue - halfTrack}px`),
          );
          halfTrack = 0;
        } else {
          newTracks.push(tracks[i]);
        }
      } else {
        newTracks.push(tracks[i]);
      }
    }
    // }

    if (trackType === "column") {
      this.#columns = newTracks;
    } else {
      this.#rows = newTracks;
    }

    console.log(`[GridTracks] splitTracks, after: ${tracks.join(" ")}`);

    this.emit("grid-track-resize", trackType, newTracks);

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
    const tracks = this.getTracks(trackType);
    const reducedTrack =
      position === "before" ? tracks[index - 1] : tracks[index];
    if (reducedTrack) {
      if (reducedTrack.isFraction) {
        this.measure(trackType);
      }
      tracks.splice(index, 0, new GridTrack(`${Math.abs(trackSize)}px`));
      reducedTrack.increment(-trackSize);

      this.emit("grid-track-resize", trackType, tracks);
    }
  }

  removeTrack(
    trackType: TrackType,
    index: number,
    assignDirection: AssignDirection = "fwd",
  ) {
    const assignFwd = index === 0 || assignDirection === "fwd";

    const tracks = this.getTracks(trackType);

    const contraIndex = assignFwd ? index + 1 : index - 1;
    const contraTrack = tracks[contraIndex];
    const removedTrack = tracks[index];

    const otherTracksAreFractions = tracks.some(
      (track, i) => i !== index && i !== contraIndex && track.isFraction,
    );

    if (contraTrack.isFraction && removedTrack.isFraction) {
      // We don't need to do anything if there are no other fraction unit tracks
      if (otherTracksAreFractions) {
        contraTrack.addFraction(removedTrack.trackSize);
      }
    } else if (contraTrack.isFraction) {
      // We don't need to do anything if there are no other fraction unit tracks
      if (otherTracksAreFractions) {
        this.measure(trackType);
        contraTrack.increment(removedTrack.numericValue);
      }
    } else if (removedTrack.isFraction) {
      this.measure(trackType);
      contraTrack.increment(removedTrack.numericValue);
    } else {
      contraTrack.increment(removedTrack.numericValue);
    }

    tracks.splice(index, 1);

    this.emit("grid-track-resize", trackType, tracks);
  }

  resizeTo(
    trackType: TrackType,
    trackIndex: number,
    value: TrackSize,
    // animate = true,
  ) {
    // console.log(
    //   `[GridTracks] resizeTo ${trackType} [${trackIndex}] ${value} animate ? ${animate}`,
    // );

    const tracks = this.getTracks(trackType);
    tracks[trackIndex].trackSize = value;
    this.emit("grid-track-resize", trackType, tracks);
  }

  resizeBy(
    trackType: "row" | "column",
    trackIndex: number,
    contraTrackIndex: number,
    value: number,
  ) {
    // console.log(
    //   `[GridTracks] resize ${trackType} [${trackIndex},${contraTrackIndex}] by ${value}`,
    // );
    const tracks = this.getTracks(trackType);
    const resizeTrack = tracks[trackIndex];
    const contraTrack = tracks[contraTrackIndex];

    if (resizeTrack === undefined || contraTrack === undefined) {
      throw Error("[GridTracks] resize, no track at index position");
    }

    if (!resizeTrack.isFraction) {
      resizeTrack.increment(value);
    }
    if (!contraTrack.isFraction) {
      contraTrack.increment(-value);
    } else if (resizeTrack.isFraction) {
      // both tracks are defined with fractional unit
      this.measure(trackType);
      contraTrack.convertUnitsToPixels();
      contraTrack.increment(-value);
    }

    this.emit("grid-track-resize", trackType, tracks);
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
export class GridModel extends EventEmitter<GridModelEvents> {
  tracks: GridTracks;

  #childItems: GridModelChildItem[] = [];
  #index = new Map<string, IGridModelChildItem>();
  #tabState = new Map<string, TabState>();

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
    console.log(`[GridModel] handleTabsChange #${stackId} [${active}]`);
    const activeTab = tabs[active];
    this.activateStackedChildItem(stackId, activeTab);
    this.emit("tabs-change", stackId, active, tabs);
  };

  private handleTabsRemoved = (stackId: string) => {
    console.log(`[GridModel] handleTabsRemoved #${stackId}`);
    this.removeChildItem(stackId, "unstack");

    this.emit("tabs-removed", stackId);
  };

  private handleTabSelectionChange = ({
    active,
    activeTab,
    id: stackId,
  }: TabState) => {
    console.log(`[GridModel] handleTabSelectionChange #${stackId} [${active}]`);
    this.activateStackedChildItem(stackId, activeTab);
    this.emit("tab-selection-change", stackId, active);
  };

  private handleTabAdded = (
    { activeTab, id, tabs }: TabState,
    tab: TabStateTab,
  ) => {
    const active = tabs.indexOf(activeTab);

    const stackItem = this.getChildItem(id, true);
    const stackedItem = this.getChildItem(activeTab.id, true);
    console.log(`[GridModel] handleTabAdded ${id}`, {
      tab,
      stackItem,
      stackedItem,
    });

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
    console.log(`[GridModel#${this.id}] handleTabDetached#${stackId}`);
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
    console.log(`[GridModel] setTabState  ${stackId}`);
    let tabState = this.#tabState.get(stackId);
    if (tabState) {
      throw Error(`[GridModel] setTabState  already created for ${stackId}`);
    }
    const tabs = childItems.map(({ id, title }, index) => ({
      id,
      label: title ?? `Label-${index + 1}`,
    }));
    tabState = new TabState(stackId, activeItem, tabs);

    tabState.on("active-change", this.handleTabSelectionChange);
    tabState.on("tab-added", this.handleTabAdded);
    tabState.on("tab-detached", this.handleTabDetached);
    tabState.on("tabs-change", this.handleTabsChange);
    tabState.on("tabs-removed", this.handleTabsRemoved);

    if (tabs[activeItem]) {
      // tabState can be set before childItems are identified in the case of an
      // explicit GridLayoutStackedItem. In this case the activeStackedChildItem
      // will be activated later.
      this.activateStackedChildItem(stackId, tabs[activeItem]);
    }

    this.#tabState.set(stackId, tabState);
    return tabState;
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

  moveItemWithinTabs(
    tabsId: string,
    tab: TabStateTab,
    dropPosition: DropPosition,
    selectMovedTab: boolean,
  ) {
    console.log(
      `[GridModel#${this.id}] moveItemWithinTabs ${tab.id} in ${tabsId} ${dropPosition.position} ${dropPosition.target}`,
    );
    this.getTabState(tabsId).moveTab(tab, dropPosition, selectMovedTab);
  }

  moveItemBetweenTabs(
    fromTabsId: string,
    toTabsId: string,
    tab: TabStateTab,
    dropPosition: DropPosition,
  ) {
    console.log(
      `[GridModel] moveItemBetweenTabs ${tab.id} from ${fromTabsId} to ${toTabsId} ${dropPosition.position} ${dropPosition.target}`,
    );

    this.getTabState(fromTabsId).removeTab(tab.id);
    this.getTabState(toTabsId).addTab(tab, dropPosition);
  }

  notifyChange() {
    this.emit("grid-layout-change", this.id, this.toGridLayoutDescriptor());
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
            contentVisible,
            dropTarget,
            header,
            resizeable,
            row,
            stackId,
            title,
            type,
          },
        ) => {
          console.log(`[GridModel] toGridLayoutDescriptor ${id} = ${type}`);
          if (stackId) {
            console.log(
              `[GridModel] is a stacked item, active item ? ${contentVisible === true} `,
            );
          }
          // The stacked-content gridItems are a runtime construct, no need to serialize
          if (type !== "stacked-content") {
            result[id] = {
              contentVisible,
              dropTarget,
              gridArea: `${row.start}/${column.start}/${row.end}/${column.end}`,
              header,
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
    const gridPosition = trackIndex + 1;
    const updates: GridItemUpdate[] = [];

    const [setTrackEnd, moveTrack] =
      trackType === "row" ? [setRowEnd, moveRow] : [setColumnEnd, moveColumn];

    for (const item of this.#childItems) {
      const { start, end } = item[trackType];

      if (start > gridPosition) {
        updates.push(moveTrack(item));
      } else if (end > gridPosition) {
        updates.push(setTrackEnd(item));
      }
    }

    this.applyUpdates(updates);
  }

  insertGridTrack(
    trackType: TrackType,
    { index, position }: TrackInsertionPosition,
    trackSize: number,
  ) {
    this.tracks.insertTrack(trackType, { index, position }, trackSize);

    const gridPosition = index + 1;
    const updates: GridItemUpdate[] = [];

    const [setTrackEnd, moveTrack] =
      trackType === "row" ? [setRowEnd, moveRow] : [setColumnEnd, moveColumn];

    for (const item of this.#childItems) {
      const { start, end } = item[trackType];

      if (position === "before") {
        if (start >= gridPosition) {
          updates.push(moveTrack(item));
        } else if (end >= gridPosition) {
          updates.push(setTrackEnd(item));
        }
      } else {
        if (start > gridPosition) {
          updates.push(moveTrack(item));
        } else if (end > gridPosition) {
          updates.push(setTrackEnd(item));
        }
      }
    }

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
    console.log(`[GridModel] removeGridTrack ${trackType} [${trackIndex}]`);

    this.tracks.removeTrack(trackType, trackIndex, assignDirection);

    if (updateChildItems) {
      const updates: GridItemUpdate[] = [];
      const gridPosition = trackIndex + 1;

      for (const item of this.#childItems) {
        const { start, end } = item[trackType];

        let startUpdate: Partial<GridLayoutModelPosition> | undefined =
          undefined;
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
              [trackType]: { start, end, ...startUpdate, ...endUpdate },
            },
          ]);
        }
      }

      this.applyUpdates(updates);
      this.emit("child-position-updates", updates, { splitters: true });
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
        contentVisible,
        dropTarget,
        header,
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
          id,
          column,
          dropTarget,
          header,
          resizeable,
          row,
          stackId,
          title,
        }),
      );
    }
  }

  addChildItem(childItem: GridModelChildItem) {
    // TODO assert that item is within current columns, rows or extend these

    // GridLayoutStackedItem may or may not be declared explicitly in JSX.
    // If not, it will be created post initial render, based on stackId
    // references in gridItems. If declared explicitly, it may or may not
    // preceed childItems in source code order.
    if (childItem.stackId) {
      const stackItem = this.getChildItem(childItem.stackId);
      if (stackItem) {
        this.addChildItemToStack(childItem, stackItem);
      }
    }

    this.#childItems.push(childItem);
    this.#index.set(childItem.id, childItem);
  }

  private addChildItemToStack(
    childItem: GridModelChildItem,
    stackItem: GridModelChildItem,
  ) {
    console.log(
      `[GridModel] addChildItemToStack #${childItem.id} => #${stackItem.id}`,
    );
    if (childItem.stackId) {
      const tabState = this.getTabState(childItem.stackId);
      const tab: TabStateTab = {
        id: childItem.id,
        label: childItem.title ?? childItem.id,
      };
      tabState.addTab(tab);
      if (tabState.activeTab === tab) {
        childItem.contentVisible = true;
      }
    } else {
      throw Error(
        `[[GridModel] addChildItemToStack #${childItem.id} => #${stackItem.id} child has no stackId`,
      );
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
        const stackedChildItems = this.getStackedChildItems(childItemId);
        stackedChildItems.forEach((childItem) => {
          childItem.stackId = undefined;
          childItem.contentVisible = true;
        });
      }
    }
  }

  stackChildItems(targetId: string, stackedChildId: string) {
    const targetChild = this.getChildItem(targetId, true);
    const stackedChild = this.getChildItem(stackedChildId, true);

    const {
      column: { start: colStart, end: colEnd },
      row: { start: rowStart, end: rowEnd },
    } = targetChild;
    const stackId = uuid();

    const stackChild = new GridModelChildItem({
      column: { start: colStart, end: colEnd },
      id: stackId,
      row: { start: rowStart, end: rowEnd },
      type: "stacked-content",
    });

    const { horizontalSplitter: h, verticalSplitter: v } = targetChild;
    stackChild.horizontalSplitter = stackedChild.horizontalSplitter = h;
    stackChild.verticalSplitter = stackedChild.verticalSplitter = v;

    this.setTabState(stackId, [targetChild, stackedChild]);

    this.addChildItem(stackChild);

    targetChild.stackId = stackId;
    stackedChild.stackId = stackId;

    this.updateChildColumn(stackedChild.id, { start: colStart, end: colEnd });
    this.updateChildRow(stackedChild.id, { start: rowStart, end: rowEnd });

    stackedChild.contentVisible = false;
    targetChild.contentVisible = true;

    this.emit("tabs-created", stackChild);
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
    const { colCount, rowCount } = this.tracks;

    const unusedStartPositions: number[] = [];
    const unusedColLines: number[] = [];
    const unusedRowLines: number[] = [];

    const childItemsWithoutDraggedItem = this.#childItems.filter(
      (item) => !item.dragging,
    );

    for (let i = 1; i <= colCount; i++) {
      if (!this.findByColumnStart(i, childItemsWithoutDraggedItem)) {
        unusedStartPositions.push(i);
      }
    }

    for (let i = 2; i <= colCount + 1; i++) {
      if (!this.findByColumnEnd(i, childItemsWithoutDraggedItem)) {
        if (unusedStartPositions.includes(i)) {
          unusedColLines.push(i);
        }
      }
    }

    unusedStartPositions.length = 0;

    for (let i = 1; i <= rowCount; i++) {
      if (!this.findByRowStart(i, childItemsWithoutDraggedItem)) {
        unusedStartPositions.push(i);
      }
    }

    for (let i = 2; i <= rowCount + 1; i++) {
      if (!this.findByRowEnd(i, childItemsWithoutDraggedItem)) {
        if (unusedStartPositions.includes(i)) {
          unusedRowLines.push(i);
        }
      }
    }

    return [unusedColLines, unusedRowLines];
  }

  /*
  Placeholders are created to represent any empty areas on the grid
  */
  createPlaceholders() {
    const {
      childItems: gridItems,
      tracks: { colCount, rowCount },
    } = this;

    this.clearPlaceholders();

    const grid = getGridMatrix(gridItems, rowCount, colCount);
    const emptyExtents = getEmptyExtents(grid);
    emptyExtents.forEach((gridItem) => this.addChildItem(gridItem));
  }

  getPlaceholders() {
    return this.childItems.filter(isPlaceholder);
  }

  getSplitters() {
    this.#childItems.forEach((childItem) => {
      childItem.horizontalSplitter = false;
      childItem.verticalSplitter = false;
    });
    return this.#childItems.flatMap(this.getSplittersForChildItem);
  }

  private getSplittersForChildItem = (childItem: GridModelChildItem) => {
    if (childItem.stackId) {
      return NO_SPLITTERS;
    }

    const splitters: ISplitter[] = [];
    const { column, id, row } = childItem;

    // 1) Horizontal (column) resizing - the vertically aligned splitters

    if (!isFixedWidthChildItem(childItem)) {
      const columnContrasAndSiblings =
        this.findColumnContrasAndSiblings(childItem);

      console.log(`column contrasAndSiblings for #${childItem.id}`, {
        columnContrasAndSiblings,
      });

      if (columnContrasAndSiblings) {
        const resizeTrackIndex = column.start - 1;
        const contraTrackIndex = column.start - 2;

        const resizedChildItems = {
          before: columnContrasAndSiblings.contras.map((c) => c.id),
          after: columnContrasAndSiblings.siblings.map((c) => c.id),
        };

        columnContrasAndSiblings.siblings.forEach((childItem) => {
          childItem.verticalSplitter = true;
        });

        splitters.push({
          align: "start",
          ariaOrientation: "vertical",
          column,
          controls: id,
          id: `${id}-splitter-h`,
          orientation: "horizontal",
          row: columnContrasAndSiblings.position,
          resizedChildItems,
          resizedGridTracks: [contraTrackIndex, resizeTrackIndex],
        });
      }
    }

    // 2) Vertical (row) resizing - the horizontally aligned splitters

    if (!isFixedHeightChildItem(childItem)) {
      const rowContrasAndSiblings = this.findRowContrasAndSiblings(childItem);

      if (rowContrasAndSiblings) {
        const contraTrackIndex = row.start - 2;
        let resizeTrackIndex = row.start - 1;

        if (rowContrasAndSiblings.siblings[0] !== childItem) {
          resizeTrackIndex = rowContrasAndSiblings.siblings[0].row.start - 1;
        }

        const resizedChildItems = {
          before: rowContrasAndSiblings.contras.map((c) => c.id),
          after: rowContrasAndSiblings.siblings.map((c) => c.id),
        };

        rowContrasAndSiblings.siblings.forEach((childItem) => {
          childItem.horizontalSplitter = true;
        });

        splitters.push({
          align: "start",
          ariaOrientation: "horizontal",
          column: rowContrasAndSiblings.position,
          controls: id,
          id: `${id}-splitter-v`,
          orientation: "vertical",
          resizedChildItems,
          resizedGridTracks: [contraTrackIndex, resizeTrackIndex],
          row,
        });
      }
    }

    // console.log(
    //   `[GridModel#${this.id}] getSplittersForChildItem#${childItem.id}`,
    //   {
    //     splitters,
    //   },
    // );

    return splitters;
  };

  private findColumnContrasAndSiblings(childItem: GridModelChildItem) {
    const contrasLeft = this.getContrasLeft(childItem);
    if (contrasLeft.length > 0) {
      const siblingsBelow = this.getSiblingsBelow(childItem);
      return getMatchingRowspan(childItem, siblingsBelow, contrasLeft);
    }
  }
  private findRowContrasAndSiblings(childItem: GridModelChildItem) {
    const contrasAbove = this.getContrasAbove(childItem);
    if (
      contrasAbove.length > 0 &&
      !contrasAbove.every(isFixedHeightChildItem)
    ) {
      if (isFixedHeightChildItem(childItem)) {
        const contrasBelow = this.getContrasBelow(childItem);
        if (contrasBelow) {
          const [contra] = contrasBelow;
          const siblingsRight = this.getSiblingsRight(contra);
          return getMatchingColspan(contra, siblingsRight, contrasAbove);
        }
        // console.log(`going to have to skip a row for ${childItem.id}`, {
        //   contrasBelow,
        // });
      } else {
        const siblingsRight = this.getSiblingsRight(childItem);
        return getMatchingColspan(childItem, siblingsRight, contrasAbove);
      }
    }
  }

  toDebugString() {
    console.log(
      this.#childItems
        .map(
          (c) =>
            `${c.id.padEnd(10)} col ${c.column.start}/${c.column.end}, row ${c.row.start}/${c.row.end}`,
        )
        .join("\n"),
    );
  }

  private getContrasAbove({ column, row }: GridModelChildItem) {
    const allContrasAbove = this.findByRowEnd(row.start);
    if (allContrasAbove) {
      const indexOfAlignedContra = allContrasAbove.findIndex(
        (item) => item.column.start === column.start,
      );
      if (indexOfAlignedContra !== -1) {
        return allContrasAbove.sort(byColumnStart).slice(indexOfAlignedContra);
      }
    }
    return [];
  }
  private getContrasBelow({ column, row }: GridModelChildItem) {
    const allContrasBelow = this.findByRowStart(row.end);
    if (allContrasBelow) {
      const indexOfAlignedContra = allContrasBelow.findIndex(
        (item) => item.column.start === column.start,
      );
      if (indexOfAlignedContra !== -1) {
        return allContrasBelow.sort(byColumnStart).slice(indexOfAlignedContra);
      }
    }
    return [];
  }

  private getSiblingsRight({ column, row }: GridModelChildItem) {
    return (
      this.findByRowStart(row.start)?.filter(
        (item) => item.column.start > column.start,
      ) ?? []
    );
  }

  private getContrasLeft({ column, row }: GridModelChildItem) {
    const allContrasLeft = this.findByColumnEnd(column.start);
    if (allContrasLeft) {
      const indexOfAlignedContra = allContrasLeft.findIndex(
        (item) => item.row.start === row.start,
      );
      if (indexOfAlignedContra !== -1) {
        // placeholders may not be in correct sort position
        // sorting the original array here is ok
        return allContrasLeft.sort(byRowStart).slice(indexOfAlignedContra);
      }
    }
    return [];
  }

  private getSiblingsBelow({ column, row }: GridModelChildItem) {
    return (
      this.findByColumnStart(column.start)?.filter(
        (item) => item.row.start > row.start,
      ) ?? []
    );
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
