import { EventEmitter } from "@finos/vuu-utils";

type TrackSize = number | string;

export interface GridModelConstructorProps {
  cols?: TrackSize[];
  rows?: TrackSize[];
  colCount?: number;
  rowCount?: number;
}

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

export class GridModel extends EventEmitter<GridModelEvents> {
  #cols: number[] = [];
  #rows: number[] = [];
  #templateCols: TrackSize[];
  #templateRows: TrackSize[];

  constructor({ cols, colCount, rows, rowCount }: GridModelConstructorProps) {
    super();
    assertValidTracks("col", cols, colCount);
    assertValidTracks("row", rows, rowCount);

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

  get cols() {
    return this.#cols;
  }

  get rows() {
    return this.#rows;
  }

  get gridTemplateColumns() {
    return this.#templateCols;
  }

  get gridTemplateRows() {
    return this.#templateRows;
  }

  setGridCols(tracks: number[]) {
    this.#cols = tracks;
    this.emit("grid-template-columns", tracks);
  }
  setGridRows(tracks: number[]) {
    this.#rows = tracks;
    this.emit("grid-template-rows", tracks);
  }

  removeGridColumn(index: number, assignDirection?: AssignDirection) {
    console.log(`remove column ${index} ${assignDirection}`);
    const newCols = this.removeGridTrack(this.#cols, index, assignDirection);
    console.log(`[GridModel] removeGridColumn new cols ${newCols.join(",")}`);
    this.setGridCols(newCols);
  }
  removeGridRow(index: number, assignDirection?: AssignDirection) {
    console.log(`remove row ${index} ${assignDirection}`);
    const newRows = this.removeGridTrack(this.#rows, index, assignDirection);
    console.log(`[GridModel] removeGridRow new rows ${newRows.join(",")}`);
    this.setGridRows(newRows);
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
