import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { DataRow } from "@vuu-ui/vuu-table-types";
import { WindowRange } from "@vuu-ui/vuu-utils";

export class MovingDataRowWindow {
  public data: DataRow[];
  public rowCount = 0;
  #range: WindowRange;

  constructor({ from, to }: VuuRange) {
    this.#range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.data = new Array(Math.max(0, to - from));
    this.rowCount = 0;
  }

  setRowCount = (rowCount: number) => {
    if (rowCount < this.data.length) {
      this.data.length = rowCount;
    }

    this.rowCount = rowCount;
  };

  add(data: DataRow) {
    const { index } = data;
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

  getByKey(key: string) {
    return this.data.find((row) => row.key === key);
  }

  isWithinRange(index: number) {
    return this.#range.isWithin(index);
  }

  setRange({ from, to }: VuuRange) {
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

  getSelectedRows() {
    return this.data.filter((dataRow) => dataRow.isSelected);
  }

  get hasData() {
    return this.data.some((d) => d !== undefined);
  }

  /**
   * This will throw if there is no data. Check `hasData` first
   * to guard against this, if not certain.
   */
  get firstRow() {
    for (let i = 0; i < this.data.length; i++) {
      if (this.data[i]) {
        return this.data[i];
      }
    }
    throw Error(`[DataRowMovingWinddow] firstRow, no data`);
  }

  get range() {
    return this.#range;
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
