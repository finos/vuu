import { VuuRange, VuuRow } from "@finos/vuu-protocol-types";
import { logger, WindowRange } from "@finos/vuu-utils";
import { bufferBreakout } from "./buffer-range";

const EMPTY_ARRAY = [] as const;

type RangeTuple = [boolean, readonly VuuRow[] /*, readonly VuuRow[]*/];

const log = logger('array-backed-moving-window');

export class ArrayBackedMovingWindow {
  private bufferSize: number;
  private range: WindowRange;
  private internalData: VuuRow[];
  private rowsWithinRange: number;

  public clientRange: WindowRange;
  public rowCount: number;

  // Note, the buffer is already accounted for in the range passed in here
  constructor(
    { from: clientFrom, to: clientTo }: VuuRange,
    { from, to }: VuuRange,
    bufferSize: number
  ) {
    this.bufferSize = bufferSize;
    this.clientRange = new WindowRange(clientFrom, clientTo);
    this.range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.internalData = new Array(bufferSize);
    this.rowsWithinRange = 0;
    this.rowCount = 0;
  }

  // TODO we shpuld probably have a hasAllClientRowsWithinRange
  get hasAllRowsWithinRange(): boolean {
    return (
      this.rowsWithinRange === this.clientRange.to - this.clientRange.from ||
      // this.rowsWithinRange === this.range.to - this.range.from ||
      (this.rowCount > 0 &&
        this.clientRange.from + this.rowsWithinRange === this.rowCount)
    );
  }

  setRowCount = (rowCount: number) => {
    log.info?.(`Rowcount: ${rowCount}`)
    if (rowCount < this.internalData.length) {
      this.internalData.length = rowCount;
    }
    if (rowCount < this.rowCount) {
      // Brute force, works
      this.rowsWithinRange = 0;
      const end = Math.min(rowCount, this.clientRange.to);
      for (let i = this.clientRange.from; i < end; i++) {
        const rowIndex = i - this.range.from;
        if (this.internalData[rowIndex] !== undefined) {
          this.rowsWithinRange += 1;
        }
      }
    }
    this.rowCount = rowCount;
  };

  setAtIndex(index: number, data: VuuRow) {
    const isWithinClientRange = this.isWithinClientRange(index);
    if (isWithinClientRange || this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      if (!this.internalData[internalIndex] && isWithinClientRange) {
        this.rowsWithinRange += 1;
        //onsole.log(`rowsWithinRange is now ${this.rowsWithinRange} out of ${this.range.to - this.range.from}`)
      }

      this.internalData[internalIndex] = data;
    }
    return isWithinClientRange;
  }

  getAtIndex(index: number): any {
    return this.range.isWithin(index) &&
      this.internalData[index - this.range.from] != null
      ? this.internalData[index - this.range.from]
      : undefined;
  }

  isWithinRange(index: number): boolean {
    return this.range.isWithin(index);
  }

  isWithinClientRange(index: number): boolean {
    return this.clientRange.isWithin(index);
  }

  // Returns [false] or [serverDataRequired, clientRows, holdingRows]
  setClientRange(from: number, to: number): RangeTuple {
    const currentFrom = this.clientRange.from;
    const currentTo = Math.min(this.clientRange.to, this.rowCount);

    if (from === currentFrom && to === currentTo) {
      return [false, EMPTY_ARRAY /*, EMPTY_ARRAY*/] as RangeTuple;
    }
    log.info?.(`Client Range is From ${from} To ${to}`);

    const originalRange = this.clientRange.copy();
    this.clientRange.from = from;
    this.clientRange.to = to;
    this.rowsWithinRange = 0;
    for (let i = from; i < to; i++) {
      const internalIndex = i - this.range.from;
      if (this.internalData[internalIndex]) {
        this.rowsWithinRange += 1;
      }
    }

    let clientRows: readonly VuuRow[] = EMPTY_ARRAY;
    const offset = this.range.from;

    if (this.hasAllRowsWithinRange) {
      if (to > originalRange.to) {
        const start = Math.max(from, originalRange.to);
        clientRows = this.internalData.slice(start - offset, to - offset);
      } else {
        const end = Math.min(originalRange.from, to);
        clientRows = this.internalData.slice(from - offset, end - offset);
      }
    }

    const serverDataRequired = bufferBreakout(
      this.range,
      from,
      to,
      this.bufferSize
    );
    return [serverDataRequired, clientRows] as RangeTuple;
  }

  setRange(from: number, to: number) {

    const [overlapFrom, overlapTo] = this.range.overlap(from, to);

    const newData = new Array(to - from + this.bufferSize);
    this.rowsWithinRange = 0;

    for (let i = overlapFrom; i < overlapTo; i++) {
      const data = this.getAtIndex(i);
      if (data) {
        const index = i - from;
        newData[index] = data;
        if (this.isWithinClientRange(i)) {
          this.rowsWithinRange += 1;
        }
      }
    }

    this.internalData = newData;
    this.range.from = from;
    this.range.to = to;
  }

  getData(): any[] {
    const { from, to } = this.range;
    const { from: clientFrom, to: clientTo } = this.clientRange;
    const startOffset = Math.max(0, clientFrom - from);
    // TEMP hack, whu wouldn"t we have rowCount ?
    const endOffset = Math.min(
      to - from,
      to,
      clientTo - from,
      this.rowCount ?? to
    );
    // const endOffset = Math.min(to-from, to, hi - from, this.rowCount);
    return this.internalData.slice(startOffset, endOffset);
  }

  // used only for debugging
  getCurrentDataRange() {
    const rows = this.internalData;
    const len = rows.length;
    let [firstRow] = this.internalData;
    let lastRow = this.internalData[len - 1];
    if (firstRow && lastRow) {
      return [firstRow.rowIndex, lastRow.rowIndex];
    } else {
      for (let i = 0; i < len; i++) {
        if (rows[i] !== undefined) {
          firstRow = rows[i];
          break;
        }
      }
      for (let i = len - 1; i >= 0; i--) {
        if (rows[i] !== undefined) {
          lastRow = rows[i];
          break;
        }
      }
      if (firstRow && lastRow) {
        return [firstRow.rowIndex, lastRow.rowIndex];
      } else {
        return [-1, -1];
      }
    }
  }
}
