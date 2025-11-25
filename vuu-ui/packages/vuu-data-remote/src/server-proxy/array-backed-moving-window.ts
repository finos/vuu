import { VuuRange, VuuRow } from "@vuu-ui/vuu-protocol-types";
import { logger, WindowRange } from "@vuu-ui/vuu-utils";

const EMPTY_ARRAY = [] as const;

type RangeTuple = [boolean, readonly VuuRow[] /*, readonly VuuRow[]*/];

const log = logger("array-backed-moving-window");

function dataIsUnchanged(newRow: VuuRow, existingRow?: VuuRow) {
  if (!existingRow) {
    return false;
  }

  if (existingRow.data.length !== newRow.data.length) {
    return false;
  }

  if (existingRow.sel !== newRow.sel) {
    return false;
  }

  for (let i = 0; i < existingRow.data.length; i++) {
    if (existingRow.data[i] !== newRow.data[i]) {
      return false;
    }
  }
  return true;
}

export class ArrayBackedMovingWindow {
  #range: WindowRange;

  private bufferSize: number;
  private internalData: VuuRow[];
  private rowsWithinRange: number;

  public clientRange: WindowRange;
  public rowCount: number;

  // Note, the buffer is already accounted for in the range passed in here
  constructor(
    { from: clientFrom, to: clientTo }: VuuRange,
    { from, to }: VuuRange,
    bufferSize: number,
  ) {
    this.bufferSize = bufferSize;
    this.clientRange = new WindowRange(clientFrom, clientTo);
    this.#range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.internalData = new Array(bufferSize);
    this.rowsWithinRange = 0;
    this.rowCount = 0;
  }

  get range() {
    return this.#range;
  }

  get hasAllRowsWithinRange(): boolean {
    return (
      this.rowsWithinRange === this.clientRange.to - this.clientRange.from ||
      (this.rowCount > 0 &&
        this.clientRange.from + this.rowsWithinRange === this.rowCount)
    );
  }

  // Check to see if set of rows is outside the current viewport range, indicating
  // that veiwport is being scrolled quickly and server is not able to keep up.
  outOfRange(firstIndex: number, lastIndex: number) {
    const { from, to } = this.range;
    if (lastIndex < from) {
      return true;
    }
    if (firstIndex >= to) {
      return true;
    }
  }

  setRowCount = (rowCount: number) => {
    log.info?.(`setRowCount ${rowCount}`);
    if (rowCount < this.internalData.length) {
      this.internalData.length = rowCount;
    }
    if (rowCount < this.rowCount) {
      // Brute force, works
      this.rowsWithinRange = 0;
      const end = Math.min(rowCount, this.clientRange.to);
      for (let i = this.clientRange.from; i < end; i++) {
        const rowIndex = i - this.#range.from;
        if (this.internalData[rowIndex] !== undefined) {
          this.rowsWithinRange += 1;
        }
      }
    }
    this.rowCount = rowCount;
  };

  setAtIndex(row: VuuRow) {
    const { rowIndex: index } = row;
    const internalIndex = index - this.#range.from;
    //TODO measure the performance impact of this check
    if (dataIsUnchanged(row, this.internalData[internalIndex])) {
      return false;
    }
    const isWithinClientRange = this.isWithinClientRange(index);
    if (isWithinClientRange || this.isWithinRange(index)) {
      if (!this.internalData[internalIndex] && isWithinClientRange) {
        this.rowsWithinRange += 1;
      }
      this.internalData[internalIndex] = row;
    }
    return isWithinClientRange;
  }

  getAtIndex(index: number): VuuRow | undefined {
    return this.#range.isWithin(index) &&
      this.internalData[index - this.#range.from] != null
      ? this.internalData[index - this.#range.from]
      : undefined;
  }

  isWithinRange(index: number): boolean {
    return this.#range.isWithin(index);
  }

  isWithinClientRange(index: number): boolean {
    return this.clientRange.isWithin(index);
  }

  // Returns [false] or [serverDataRequired, clientRows]
  setClientRange(from: number, to: number): RangeTuple {
    log.debug?.(`setClientRange ${from} - ${to}`);

    const currentFrom = this.clientRange.from;
    const currentTo = Math.min(this.clientRange.to, this.rowCount);

    if (from === currentFrom && to === currentTo) {
      return [false, EMPTY_ARRAY] as RangeTuple;
    }

    const originalRange = this.clientRange.copy();
    this.clientRange.from = from;
    this.clientRange.to = to;
    this.rowsWithinRange = 0;
    for (let i = from; i < to; i++) {
      const internalIndex = i - this.#range.from;
      if (this.internalData[internalIndex]) {
        this.rowsWithinRange += 1;
      }
    }

    const clientRows: VuuRow[] = [];
    const offset = this.#range.from;

    // if (this.hasAllRowsWithinRange) {
    if (to > originalRange.to) {
      const start = Math.max(from, originalRange.to);
      for (let i = start - offset; i < to - offset; i++) {
        const row = this.internalData[i];
        if (row) {
          clientRows.push(row);
        }
      }
    } else {
      const end = Math.min(originalRange.from, to);
      for (let i = from - offset; i < end - offset; i++) {
        const row = this.internalData[i];
        if (row) {
          clientRows.push(row);
        }
      }
    }
    // } else if (this.rowsWithinRange > 0) {
    //   // console.log(`[ArrayBackedMovingWindow] has some client rows but not all`);
    // }

    const serverDataRequired = this.bufferBreakout(from, to);
    return [serverDataRequired, clientRows] as RangeTuple;
  }

  setRange(from: number, to: number) {
    if (from !== this.#range.from || to !== this.#range.to) {
      log.debug?.(`setRange ${from} - ${to}`);
      const [overlapFrom, overlapTo] = this.#range.overlap(from, to);
      const newData: VuuRow[] = new Array(to - from);
      this.rowsWithinRange = 0;

      for (let i = overlapFrom; i < overlapTo; i++) {
        const row = this.getAtIndex(i);
        if (row) {
          const index = i - from;
          newData[index] = row;
          if (this.isWithinClientRange(i)) {
            this.rowsWithinRange += 1;
          }
        }
      }

      this.internalData = newData;
      this.#range.from = from;
      this.#range.to = to;
    } else {
      log.debug?.(`setRange ${from} - ${to} IGNORED because not changed`);
    }
  }

  //TODO temp
  get data() {
    return this.internalData;
  }

  private bufferBreakout = (from: number, to: number): boolean => {
    const bufferPerimeter = this.bufferSize * 0.25;
    if (this.#range.to - to < bufferPerimeter) {
      return true;
    } else if (
      this.#range.from > 0 &&
      from - this.#range.from < bufferPerimeter
    ) {
      return true;
    } else {
      return false;
    }
  };

  getData(): VuuRow[] {
    const { from, to } = this.#range;
    const { from: clientFrom, to: clientTo } = this.clientRange;
    const startOffset = Math.max(0, clientFrom - from);
    // TEMP hack, why wouldn't we have rowCount ?
    const endOffset = Math.min(
      to - from,
      to,
      clientTo - from,
      this.rowCount ?? to,
    );
    return this.internalData.slice(startOffset, endOffset);
  }

  clear() {
    log.debug?.("clear");
    this.internalData.length = 0;
    this.rowsWithinRange = 0;
    this.setRowCount(0);
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
