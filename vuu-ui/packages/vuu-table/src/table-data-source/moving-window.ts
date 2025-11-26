import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { Range, WindowRange, metadataKeys } from "@vuu-ui/vuu-utils";

const { SELECTED } = metadataKeys;

export class MovingWindow {
  public data: DataSourceRow[];
  public rowCount = 0;
  #sourceRange: Range;
  #range: WindowRange;

  constructor(range: Range) {
    this.#sourceRange = range;
    const { from, to } = range;
    this.#range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.data = new Array(Math.max(0, to - from));
    this.rowCount = 0;
  }

  setRange(range: Range) {
    this.#sourceRange = range;
    const { from, to } = range;

    if (from !== this.#range.from || to !== this.#range.to) {
      const [overlapFrom, overlapTo] = this.#range.overlap(from, to);
      const newData = new Array(Math.max(0, to - from));
      for (let i = overlapFrom; i < overlapTo; i++) {
        const data = this.getAtIndex(i);
        if (data) {
          const index = i - from;
          newData[index] = data;
        }
      }
      this.data = newData;
      this.#range.from = from;
      this.#range.to = to;
    }
  }

  setRowCount = (rowCount: number) => {
    // TODO, do we still need this, given the call to setRange below
    if (rowCount < this.data.length) {
      this.data.length = rowCount;
    }

    this.rowCount = rowCount;

    this.#sourceRange.rowCount = rowCount;
    this.setRange(this.#sourceRange);
  };

  add(data: DataSourceRow) {
    const [index] = data;
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.#range.from;
      this.data[internalIndex] = data;
    }
  }

  getAtIndex(index: number) {
    return this.#range.isWithin(index) &&
      this.data[index - this.#range.from] != null
      ? this.data[index - this.#range.from]
      : undefined;
  }

  isWithinRange(index: number) {
    return this.#range.isWithin(index);
  }

  getSelectedRows() {
    return this.data.filter((row) => row[SELECTED] !== 0);
  }

  get range() {
    return this.#range;
  }

  slice(): DataSourceRow[] {
    const data: DataSourceRow[] = [];
    const { from } = this.range;
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i]) {
        data.push(this.data[i]);
      } else {
        data.push([from + i, from + i, true, false, 1, 0, "", 0, 0, false]);
      }
    }
    return data;
  }

  /**
   * Update all rows by splicing the supplied index. Used when a column
   * is removed.
   */
  spliceDataAtIndex(index: number) {
    if (index >= 10) {
      for (let i = 0; i < this.data.length; i++) {
        this.data[i] = this.data[i].toSpliced(index, 1) as DataSourceRow;
      }
    } else {
      throw Error(`[MovingWindow] canno splir metadata value from Row`);
    }
  }

  // TODO make this more performant, see implementation in
  // array-backed-moving-window - use same implementation
  get hasAllRowsWithinRange(): boolean {
    const { from, to } = this.#range;

    for (let i = from; i < to; i++) {
      if (this.getAtIndex(i) === undefined) {
        return false;
      }
    }
    return true;
  }
}
