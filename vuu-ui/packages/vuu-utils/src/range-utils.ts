import { VuuRange } from "@vuu-ui/vuu-protocol-types";

interface FromToRange {
  from: number;
  to: number;
}

export interface Range extends VuuRange {
  equals: (vuuRange: VuuRange) => boolean;
  firstRowInViewport: number;
  lastRowInViewport: number;
  renderBufferSize?: number;
  reset: Range;
  rowCount?: number;
}

export interface RangeOptions {
  renderBufferSize?: number;
  rowCount?: number;
}

const defaultRangeOptions = {
  renderBufferSize: 0,
  rowCount: -1,
};
class RangeImpl implements Range {
  #baseFrom: number;
  #renderBufferSize = 0;
  #rowCount = -1;
  #baseTo: number;

  // We have to keep from and to as simple public properties (not getters) so they survive structuredClone
  constructor(
    /** Index position of first visible row in viewport */
    public from: number,
    /** Index position of last visible row in viewport + 1 */
    public to: number,
    rangeOptions: RangeOptions = defaultRangeOptions,
  ) {
    this.#baseFrom = from;
    this.#baseTo = to;
    this.renderBufferSize =
      rangeOptions.renderBufferSize ?? defaultRangeOptions.renderBufferSize;
    this.rowCount = rangeOptions.rowCount ?? defaultRangeOptions.rowCount;
  }

  get firstRowInViewport() {
    return this.#baseFrom + 1;
  }

  get lastRowInViewport() {
    if (this.#rowCount > 0) {
      return Math.min(this.#baseTo, this.#rowCount);
    } else {
      return this.#baseTo;
    }
  }

  get renderBufferSize() {
    return this.#renderBufferSize;
  }

  set renderBufferSize(value: number) {
    this.#renderBufferSize = value;
    this.from = Math.max(0, this.#baseFrom - value);
    if (this.#rowCount > 0) {
      this.to = Math.max(this.#baseTo + this.#renderBufferSize, this.#rowCount);
    } else {
      this.to = this.#baseTo + this.#renderBufferSize;
    }
  }

  get rowCount() {
    return this.#rowCount;
  }

  set rowCount(value: number) {
    this.#rowCount = value;
    if (value > 0) {
      this.to = Math.min(this.#baseTo + this.#renderBufferSize, value);
    } else {
      this.to = this.#baseTo + this.#renderBufferSize;
    }
  }

  get reset() {
    return new RangeImpl(0, this.#baseTo - this.#baseFrom, {
      rowCount: this.#rowCount,
      renderBufferSize: this.#renderBufferSize,
    });
  }

  equals(range: VuuRange) {
    return range.from === this.#baseFrom && range.to === this.#baseTo;
  }

  toJson() {
    return {
      from: this.from,
      to: this.to,
      baseFrom: this.#baseFrom,
      baseTo: this.#baseTo,
      renderBufferSize: this.#renderBufferSize,
      rowCount: this.#rowCount,
    };
  }
}

export const Range = (
  from: number,
  to: number,
  rangeOptions?: RangeOptions,
): Range => new RangeImpl(from, to, rangeOptions);

export const NULL_RANGE = Range(0, 0);

export function getFullRange(
  { from, to }: VuuRange,
  bufferSize = 0,
  totalRowCount: number = Number.MAX_SAFE_INTEGER,
): FromToRange {
  if (from === 0 && to === 0) {
    return { from, to };
  } else if (bufferSize === 0) {
    if (totalRowCount < from) {
      return { from: 0, to: 0 };
    } else {
      return { from, to: Math.min(to, totalRowCount) };
    }
  } else if (from === 0) {
    return { from, to: Math.min(to + bufferSize, totalRowCount) };
  } else {
    const shortfallBefore = from - bufferSize < 0;
    const shortfallAfter = totalRowCount - (to + bufferSize) < 0;
    if (shortfallBefore && shortfallAfter) {
      return { from: 0, to: totalRowCount };
    } else if (shortfallBefore) {
      return { from: 0, to: to + bufferSize };
    } else if (shortfallAfter) {
      return {
        from: Math.max(0, from - bufferSize),
        to: totalRowCount,
      };
    } else {
      return { from: from - bufferSize, to: to + bufferSize };
    }
  }
}

export const withinRange = (value: number, { from, to }: VuuRange) =>
  value >= from && value < to;

export const rangeNewItems = (
  { from: from1, to: to1 }: VuuRange,
  newRange: VuuRange,
): VuuRange => {
  const { from: from2, to: to2 } = newRange;
  const noOverlap = from2 >= to1 || to2 <= from1;
  const newFullySubsumesOld = from2 < from1 && to2 > to1;
  return noOverlap || newFullySubsumesOld
    ? newRange
    : to2 > to1
      ? { from: to1, to: to2 }
      : { from: from2, to: from1 };
};

export class WindowRange {
  public from: number;
  public to: number;

  constructor(from: number, to: number) {
    this.from = from;
    this.to = to;
  }

  public isWithin(index: number) {
    return withinRange(index, this);
  }

  //find the overlap of this range and a new one
  public overlap(from: number, to: number): [number, number] {
    return from >= this.to || to < this.from
      ? [0, 0]
      : [Math.max(from, this.from), Math.min(to, this.to)];
  }

  public copy(): WindowRange {
    return new WindowRange(this.from, this.to);
  }
}
