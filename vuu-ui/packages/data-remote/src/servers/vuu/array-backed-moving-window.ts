import { WindowRange } from '@vuu-ui/utils/src/range-utils';
import {bufferBreakout, FromToRange} from './buffer-range';
import {LoHiRange} from "../viewserver/server-proxy";

export class ArrayBackedMovingWindow {
  private bufferSize: number;
  private clientRange: WindowRange;
  private range: WindowRange;
  private internalData: any[];
  private rowsWithinRange: number;
  private rowCount: number;

  // Note, the buffer is already accounted for in the range passed in here
  constructor({ lo, hi }: LoHiRange, { from, to }: FromToRange, bufferSize: number) {
    this.bufferSize = bufferSize;
    this.clientRange = new WindowRange(lo, hi);
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
      (this.rowCount > 0 && this.rowsWithinRange === this.rowCount)
    );
  }

  setRowCount = (rowCount: number) => {
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

  setAtIndex(index: number, data: any) {
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
    return this.range.isWithin(index) && this.internalData[index - this.range.from] != null
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
  setClientRange(from: number, to: number): [boolean] | [boolean, any[], any[]] {
    const currentFrom = this.clientRange.from;
    const currentTo = Math.min(this.clientRange.to, this.rowCount);

    if (from === currentFrom && to === currentTo) {
      return [false];
    }

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

    let clientRows = undefined;
    let holdingRows = undefined;
    const offset = this.range.from;

    if (this.hasAllRowsWithinRange) {
      if (to > originalRange.to) {
        const start = Math.max(from, originalRange.to);
        clientRows = this.internalData.slice(start - offset, to - offset);
      } else {
        const end = Math.min(originalRange.from, to);
        clientRows = this.internalData.slice(from - offset, end - offset);
      }
    } else if (this.rowsWithinRange > 0) {
      if (to > originalRange.to) {
        const start = Math.max(from, originalRange.to);
        holdingRows = this.internalData.slice(start - offset, to - offset).filter((row) => !!row);
      } else {
        const end = Math.min(originalRange.from, to);
        holdingRows = this.internalData
          .slice(Math.max(0, from - offset), end - offset)
          .filter((row) => !!row);
      }
    }

    const serverDataRequired = bufferBreakout(this.range, from, to, this.bufferSize);
    return [serverDataRequired, clientRows, holdingRows];
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
    const { from: lo, to: hi } = this.clientRange;
    const startOffset = Math.max(0, lo - from);
    // TEMP hack, whu wouldn't we have rowCount ?
    const endOffset = Math.min(to - from, to, hi - from, this.rowCount ?? to);
    // const endOffset = Math.min(to-from, to, hi - from, this.rowCount);
    return this.internalData.slice(startOffset, endOffset);
  }
}
