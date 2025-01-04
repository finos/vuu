import { EventEmitter, type OptionalProperty } from "@finos/vuu-utils";
import {
  GridItemRemoveReason,
  GridItemUpdate,
  GridLayoutModelPosition,
  GridLayoutResizeDirection,
} from "./GridLayoutModel";
import { CSSProperties } from "react";
import { getEmptyExtents, getGridMatrix } from "./grid-matrix";
import {
  byColumnStart,
  byRowStart,
  getMatchingColspan,
  getMatchingRowspan,
} from "./grid-layout-utils";

type TrackSize = number | string;

export interface GridModelChildItemProps {
  fixed?: boolean;
  id: string;
  resizeable?: GridModelItemResizeable;
  style: GridChildItemStyle;
}

export interface GridModelConstructorProps {
  cols?: TrackSize[];
  rows?: TrackSize[];
  colCount?: number;
  rowCount?: number;
}

export type GridModelTrack = "column" | "row";

export type AssignDirection = "bwd" | "fwd";

const assertValidTracks = (
  track: "col" | "row",
  trackSizes?: TrackSize[],
  trackCount?: number,
) => {
  if (trackSizes === undefined && trackCount === undefined) {
    console.warn(
      `[GridModel] either ${track}s or ${track}Count must be specified`,
    );
  }
  if (trackSizes && trackCount && trackCount !== trackSizes.length) {
    console.warn(
      `[GridModel] both ${track}s and ${track}Count have been specified (one or the other is expected). ${track}Count does not match the number of items in ${track}s.\n`,
    );
  }
};

export type GridModelEvents = {
  "grid-template-rows": (rows: number[]) => void;
  "grid-template-columns": (cols: number[]) => void;
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

export type GridModelItemResizeable = "h" | "v" | "hv";
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
  fixed?: boolean;
  id: string;
  resizeable?: GridModelItemResizeable;
  type: GridModelItemType;
}

export interface IPlaceholder extends IGridModelChildItem {
  type: "placeholder";
}

export type GridChildItemStyle = Pick<
  CSSProperties,
  "gridColumnStart" | "gridColumnEnd" | "gridRowStart" | "gridRowEnd"
>;

export const isFullGridChildItemStyle = (
  style: CSSProperties & GridChildItemStyle,
): style is Required<GridChildItemStyle> =>
  ["gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd"].every(
    (v) => v in style,
  );

const isPlaceholder = (item: IGridModelChildItem): item is IPlaceholder =>
  item.type === "placeholder";

export class GridModelChildItem implements IGridModelChildItem {
  id: string;
  column: GridModelPosition;
  resizeable: GridModelItemResizeable;
  row: GridModelPosition;
  type: GridModelItemType;

  #dragging = false;

  constructor({
    id,
    row,
    column,
    resizeable = "hv",
    type = "content",
  }: OptionalProperty<IGridModelChildItem, "type">) {
    this.id = id;
    this.row = row;
    this.column = column;
    this.resizeable = resizeable;
    this.type = type;
  }

  get dragging() {
    return this.#dragging;
  }

  set dragging(isDragging: boolean) {
    if (isDragging) {
      console.log(`#${this.id} is being dragged`);
    } else {
      console.log(`#${this.id} is no longer being dragged`);
    }
    this.#dragging = isDragging;
  }

  get layoutStyle() {
    const {
      column: { start: gridColumnStart, end: gridColumnEnd },
      row: { start: gridRowStart, end: gridRowEnd },
    } = this;
    return { gridColumnEnd, gridColumnStart, gridRowEnd, gridRowStart };
  }
}

export class GridModel extends EventEmitter<GridModelEvents> {
  #cols: number[];
  #rows: number[];
  #templateCols: TrackSize[];
  #templateRows: TrackSize[];

  #childItems: GridModelChildItem[] = [];
  #index = new Map<string, IGridModelChildItem>();

  constructor({
    cols,
    colCount = cols?.length ?? 0,
    rows,
    rowCount = rows?.length ?? 0,
  }: GridModelConstructorProps) {
    super();
    assertValidTracks("col", cols, colCount);
    assertValidTracks("row", rows, rowCount);

    this.#cols = Array(colCount).fill(0);
    this.#rows = Array(rowCount).fill(0);

    this.#templateCols = cols ?? Array(colCount).fill("1fr");
    this.#templateRows = rows ?? Array(rowCount).fill("1fr");
  }

  /**
   * Set the numeric track values from values read from DOM
   */
  setRowsAndCols = (el: HTMLElement) => {
    this.#cols = getComputedStyle(el)
      .getPropertyValue("grid-template-columns")
      .split(" ")
      .map((value) => parseInt(value, 10));

    this.#rows = getComputedStyle(el)
      .getPropertyValue("grid-template-rows")
      .split(" ")
      .map((value) => parseInt(value, 10));
  };

  get childItems() {
    return this.#childItems;
  }

  get cols() {
    return this.#cols;
  }

  get colCount() {
    return this.#cols.length;
  }

  get rows() {
    return this.#rows;
  }

  get rowCount() {
    return this.#rows.length;
  }

  get gridTemplateColumns() {
    return this.#templateCols.join(" ");
  }

  get gridTemplateRows() {
    return this.#templateRows.join(" ");
  }

  getTracks(direction: GridLayoutResizeDirection) {
    return direction === "vertical" ? this.#rows : this.#cols;
  }

  setGridCols(tracks: number[]) {
    this.#cols = tracks;
    this.emit("grid-template-columns", tracks);
  }
  setGridRows(tracks: number[]) {
    this.#rows = tracks;
    this.emit("grid-template-rows", tracks);
  }

  removeGridColumn(
    index: number,
    assignDirection?: AssignDirection,
    updateChildItems = true,
  ) {
    const newCols = this.removeGridTrack(this.#cols, index, assignDirection);
    this.setGridCols(newCols);

    const updates: GridItemUpdate[] = [];

    if (updateChildItems) {
      const gridPosition = index + 1;

      for (const item of this.#childItems) {
        const { start, end } = item.column;

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
              column: { start, end, ...startUpdate, ...endUpdate },
            },
          ]);
        }
      }

      updates.forEach(([id, { column }]) => {
        if (column) {
          this.upddateChildColumn(id, column);
        }
      });
    }

    return updates;
  }
  removeGridRow(
    index: number,
    assignDirection?: AssignDirection,
    updateChildItems = true,
  ) {
    const newRows = this.removeGridTrack(this.#rows, index, assignDirection);
    this.setGridRows(newRows);

    const updates: GridItemUpdate[] = [];

    if (updateChildItems) {
      const gridPosition = index + 1;

      for (const item of this.#childItems) {
        const { start, end } = item.row;

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
              row: { start, end, ...startUpdate, ...endUpdate },
            },
          ]);
        }
      }

      updates.forEach(([id, { row }]) => {
        if (row) {
          this.upddateChildRow(id, row);
        }
      });
    }

    return updates;
  }

  addChildItem(childItem: GridModelChildItem) {
    // TODO assert that item is within current columns, rows or extend these
    this.#childItems.push(childItem);
    this.#index.set(childItem.id, childItem);
  }

  upddateChildColumn(childItemId: string, { start, end }: GridModelPosition) {
    const childItem = this.getChildItem(childItemId, true);
    const { start: previousStart, end: previousEnd } = childItem.column;
    if (start !== previousStart) {
      childItem.column.start = start;
    }
    if (end !== previousEnd) {
      childItem.column.end = end;
    }
  }

  upddateChildRow(childItemId: string, { start, end }: GridModelPosition) {
    const childItem = this.getChildItem(childItemId, true);
    const { start: previousStart, end: previousEnd } = childItem.row;
    if (start !== previousStart) {
      childItem.row.start = start;
    }
    if (end !== previousEnd) {
      childItem.row.end = end;
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

  getChildItemLayout(childItemId: string): Required<GridChildItemStyle> {
    return this.getChildItem(childItemId, true).layoutStyle;
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
    const { colCount, rowCount } = this;

    const unusedStartPositions: number[] = [];
    const unusedColLines: number[] = [];
    const unusedRowLines: number[] = [];

    for (let i = 1; i <= colCount; i++) {
      if (!this.findByColumnStart(i)) {
        unusedStartPositions.push(i);
      }
    }

    for (let i = 2; i <= colCount + 1; i++) {
      if (!this.findByColumnEnd(i)) {
        if (unusedStartPositions.includes(i)) {
          unusedColLines.push(i);
        }
      }
    }

    unusedStartPositions.length = 0;

    for (let i = 1; i <= rowCount; i++) {
      if (!this.findByRowStart(i)) {
        unusedStartPositions.push(i);
      }
    }

    for (let i = 2; i <= rowCount + 1; i++) {
      if (!this.findByRowEnd(i)) {
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
    const { childItems: gridItems, colCount, rowCount } = this;

    this.clearPlaceholders();

    const grid = getGridMatrix(gridItems, rowCount, colCount);
    const emptyExtents = getEmptyExtents(grid);
    emptyExtents.forEach((gridItem) => this.addChildItem(gridItem));
  }

  getPlaceholders() {
    return this.childItems.filter(isPlaceholder);
  }

  findContrasAndSiblings(
    gridItem: GridModelChildItem,
    resizeDirection: GridLayoutResizeDirection = "horizontal",
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

  toDebugString() {
    console.log(
      `\ncols        ${this.#cols.join(", ")}`
        .concat(`\nrows        ${this.#rows.join(", ")}\n`)
        .concat(
          this.#childItems
            .map(
              (c) =>
                `${c.id.padEnd(10)} col ${c.column.start}/${c.column.end}, row ${c.row.start}/${c.row.end}`,
            )
            .join("\n"),
        ),
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

  findByColumnStart(pos: number) {
    const childItems = this.#childItems.filter(
      ({ column: { start } }) => start === pos,
    );
    return childItems.length === 0 ? undefined : childItems;
  }

  findByColumnEnd(pos: number) {
    const childItems = this.#childItems.filter(
      ({ column: { end } }) => end === pos,
    );
    return childItems.length === 0 ? undefined : childItems;
  }
  findByRowStart(pos: number) {
    const childItems = this.#childItems.filter(
      ({ row: { start } }) => start === pos,
    );
    return childItems.length === 0 ? undefined : childItems;
  }
  findByRowEnd(pos: number) {
    const childItems = this.#childItems.filter(
      ({ row: { end } }) => end === pos,
    );
    return childItems.length === 0 ? undefined : childItems;
  }

  private removeGridTrack(
    tracks: number[],
    index: number,
    assignDirection: AssignDirection = "fwd",
  ) {
    const value1 = tracks.at(index) as number;
    const newTracks = tracks.filter((_track, i) => i !== index);

    const assignFwd = index === 0 || assignDirection === "fwd";

    if (assignFwd) {
      const value2 = tracks.at(index + 1) as number;
      newTracks[index] = value1 + value2;
    } else {
      const value2 = tracks.at(index - 1) as number;
      newTracks[index - 1] = value1 + value2;
    }
    return newTracks;
  }
}
