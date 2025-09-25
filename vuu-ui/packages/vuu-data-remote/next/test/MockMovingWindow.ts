import { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { EventEmitter, metadataKeys, WindowRange } from "@vuu-ui/vuu-utils";

const { SELECTED } = metadataKeys;

const timestamp = 0;
const isNew = false;

export type MovingWindowRangeFilledHandler = (range: VuuRange) => void;

export type MovingWindowEvents = {
  "range-filled": MovingWindowRangeFilledHandler;
};

export class MovingWindow extends EventEmitter<MovingWindowEvents> {
  public data: DataSourceRow[];
  public rowCount = 0;
  #range: WindowRange;

  constructor({ from, to }: VuuRange) {
    super();
    // console.log(`[MovingWindow] new (${from}:${to})`);
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

  add(data: DataSourceRow) {
    const [index] = data;
    if (this.isWithinRange(index)) {
      //TODO super inefficient, to be improved
      const hadAllRowsWithinRange = this.hasAllRowsWithinRange;

      const internalIndex = index - this.#range.from;
      this.data[internalIndex] = data;

      if (!hadAllRowsWithinRange && this.hasAllRowsWithinRange) {
        this.emit("range-filled", this.#range);
      }
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

  setRange({ from, to }: VuuRange) {
    // console.log(`[MovingWindow] setRange (${from}:${to})`);

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
        data.push([
          from + i,
          from + i,
          true,
          false,
          1,
          0,
          "",
          0,
          timestamp,
          isNew,
        ]);
      }
    }
    return data;
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
