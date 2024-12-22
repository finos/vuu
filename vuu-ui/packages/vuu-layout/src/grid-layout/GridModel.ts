type TrackSize = number | string;

export interface GridModelConstructorProps {
  cols?: TrackSize[];
  rows?: TrackSize[];
  colCount?: number;
  rowCount?: number;
}

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

export class GridModel {
  #cols: TrackSize[];
  #rows: TrackSize[];

  constructor({ cols, colCount, rows, rowCount }: GridModelConstructorProps) {
    assertValidTracks("col", cols, colCount);
    assertValidTracks("row", rows, rowCount);

    this.#cols = cols ?? Array(colCount).fill("1fr");
    this.#rows = rows ?? Array(rowCount).fill("1fr");
  }

  get cols() {
    return this.#cols;
  }

  get rows() {
    return this.#rows;
  }
}
