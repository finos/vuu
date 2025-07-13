import { VuuDataRow, VuuRange, VuuRow } from "@vuu-ui/vuu-protocol-types";
import { rangeDiff } from "./range-utils";

const rangesAreAdjacent = (r1: VuuRange, r2: VuuRange) =>
  r1.to === r2.from || r1.from === r2.to;

const expandRange = (
  { from, to }: VuuRange,
  expandBy: number,
  max: number = Number.MAX_SAFE_INTEGER,
): VuuRange => ({
  from: Math.max(0, from - expandBy),
  to: Math.min(max, to + expandBy),
});

export const rangeFromRows = (rows: VuuRow<VuuDataRow>[]) => {
  const len = rows.length;
  if (len === 0) {
    return NullRange;
  } else {
    const first = rows[0].rowIndex;
    const last = rows[len - 1].rowIndex;
    return { from: first, to: last + 1 };
  }
};

const withinRange = ({ from, to }: VuuRange, position: number) =>
  position >= from && position < to;

export const NullRange: Readonly<VuuRange> = { from: -1, to: -1 };

type ViewportCacheStatus = "empty" | "partially-filled" | "full";

export class ViewportCache {
  #bufferSize: number;
  #clientRange: VuuRange = NullRange;
  #rows: (VuuRow<VuuDataRow> | undefined)[] = [];
  #clientRangeCount = 0;

  constructor(bufferSize = 0) {
    this.#bufferSize = bufferSize;
  }

  get clientRangeCount() {
    return this.#clientRangeCount;
  }

  get rows() {
    return this.#rows;
  }

  /**
   * status of the cache in the context of clientRange
   */
  get status(): ViewportCacheStatus {
    if (this.#clientRangeCount === 0) {
      return "empty";
    }
    return this.full ? "full" : "partially-filled";
  }

  get full() {
    return (
      this.#clientRangeCount === this.clientRange.to - this.clientRange.from
    );
  }

  hasAllRows({ from, to }: VuuRange) {
    const start = from - this.range.from;
    const end = to - this.range.from;
    for (let i = start; i < end; i++) {
      if (this.#rows[i] === undefined) {
        // console.log(`[ViewportCache]  hasAllRows ${from}:${to} false`);
        return false;
      }
    }
    // console.log(`[ViewportCache]  hasAllRows ${from}:${to} true`);
    return true;
  }

  getAvailableRange(from: number, to: number): VuuRange {
    // console.log(`[ViewportCache]  getAvailableRange ${from}:${to}`);
    if (this.range.from >= to) {
      return NullRange;
    } else if (this.range.to <= from) {
      return NullRange;
    } else {
      const rangeLo = Math.max(from, this.range.from);
      const rangeHi = Math.min(to, this.range.to);

      const start = rangeLo - this.range.from;
      const end = rangeHi - this.range.from;

      let dataStart = -1;
      let dataEnd = -1;

      for (let i = start; i < end; i++) {
        if (dataStart === -1 && this.#rows[i] !== undefined) {
          dataStart = this.range.from + i;
        } else if (dataStart !== -1 && this.#rows[i] === undefined) {
          dataEnd = this.range.from + i;
          break;
        }
      }
      if (dataStart !== -1 && dataEnd === -1) {
        dataEnd = rangeHi;
      }
      return { from: dataStart, to: dataEnd };
    }
  }

  /**
   * When we are scrolling slowly through a dataset, overlapping range requests will
   * arrive. We return only the rows that constitute the range delta, avoiding
   * returning the same rows multiple times. The client is expected to manage the
   * state of rows within the current range.
   */
  addRows(rows: VuuRow<VuuDataRow>[], ignoreRange?: VuuRange) {
    // resolve any pending range requests
    // console.log(
    //   `[ViewportCache]  addRows range=${JSON.stringify(this.range)} clientRange=${JSON.stringify(this.#clientRange)}`,
    // );
    const keyMapPreviousRows = this.buildKeyMap();
    const clientRange = this.#clientRange;
    const hadAllRows = this.hasAllRows(clientRange);

    const rowsWithinClientRange: VuuRow<VuuDataRow>[] = [];

    for (const row of rows) {
      const { rowIndex } = row;
      if (withinRange(this.range, rowIndex)) {
        const internalIndex = rowIndex - this.range.from;
        const hadRow = this.#rows[internalIndex] !== undefined;
        this.#rows[internalIndex] = row;
        if (withinRange(clientRange, rowIndex)) {
          rowsWithinClientRange.push(row);
          if (!hadRow) {
            this.#clientRangeCount += 1;
          }
        }
      } else {
        // console.log(`[CACHE] ignore row [${rowIndex}], out of range`);
        // ,ight be worth tracking a count of these - too many might
        // indicater a problem
      }
    }

    // If we already had all client rows in cache, then we are processing updates
    // send return the updates.
    // If we had less than the complete set of rows in cache, then we have changed
    // position and now have the full set - return the full client range.
    // If we have less than the complete set of client rows, return nothing - we do
    // not send incomplete row sets to client.
    if (rowsWithinClientRange.length > 0) {
      if (hadAllRows) {
        // const newRows = this.identifyNewRows(keyMapPreviousRows);
        // console.log({ newRows });

        return rowsWithinClientRange;
      } else if (this.hasAllRows(clientRange)) {
        if (ignoreRange) {
          const addedRange = rangeFromRows(rowsWithinClientRange);
          if (rangesAreAdjacent(ignoreRange, addedRange)) {
            return rowsWithinClientRange;
          } else {
            const rangeDelta = rangeDiff(ignoreRange, clientRange);
            return this.getRows(rangeDelta);
          }
        } else {
          return this.getRows(clientRange);
        }
      }
    }
  }

  getRows({ from, to }: VuuRange): VuuRow<VuuDataRow>[] {
    const start = from - this.range.from;
    const end = to - this.range.from;
    return this.#rows.slice(start, end) as VuuRow<VuuDataRow>[];
  }

  get clientRange() {
    return this.#clientRange;
  }

  set clientRange(range: VuuRange) {
    // console.log(`[ViewportCache] setClientRange ${JSON.stringify(range)}`);
    this.#clientRange = { ...range };
    this.purgeRowsOutsideRange();
    // if (this.hasAllRows(range)) {
    //   this.#clientRange.resolved = true;
    // }
  }

  get range() {
    return this.#bufferSize === 0
      ? this.#clientRange
      : expandRange(this.#clientRange, this.#bufferSize);
  }

  // TODO do we really need it
  setRowCount(/*rowCount: number*/) {
    // console.log(`[ViewportCache] setRowCount ${rowCount}`);
    //
  }

  private buildKeyMap() {
    return this.#rows.reduce<Record<string, number>>(
      (map, row) => (row && (map[row.rowKey] = row.rowIndex), map),
      {},
    );
  }

  private identifyNewRows(keySetPreviousRows: Record<string, number>) {
    // we should avaoid the copy that happens here, just iterate the (client) rows directly
    const clientRows = this.getRows(this.#clientRange);
    for (const { rowIndex, rowKey, ts } of clientRows) {
      const prevIndex = keySetPreviousRows[rowKey];
      if (prevIndex === undefined) {
        console.log(`${rowKey} at [${rowIndex}] created at ${ts} is new`);
      } else if (prevIndex !== rowIndex) {
        console.log(`${rowKey} at [${rowIndex}] has moved from [${prevIndex}]`);
      }
    }
  }

  private purgeRowsOutsideRange() {
    const { from, to } = this.range;
    const newRows = [];
    let rowsWithinClientRange = 0;
    for (let i = 0; i < this.#rows.length; i++) {
      const row = this.#rows[i];
      if (row !== undefined) {
        if (row.rowIndex >= from && row.rowIndex < to) {
          newRows[row.rowIndex - from] = row;
          if (withinRange(this.#clientRange, row.rowIndex)) {
            rowsWithinClientRange += 1;
          }
        }
      }
    }
    this.#rows = newRows;
    this.#clientRangeCount = rowsWithinClientRange;
  }
}
