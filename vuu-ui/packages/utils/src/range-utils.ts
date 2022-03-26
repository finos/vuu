import {FromToRange} from "../../data-remote/src/servers/vuu/buffer-range";

export interface VuuRange {
  lo?: number;
  hi?: number;
  from: number;
  to: number;
}

export function getFullRange(
  { from, to, lo = from, hi = to }: VuuRange,
  bufferSize: number = 0,
  rowCount: number = Number.MAX_SAFE_INTEGER
): FromToRange {
  if (bufferSize === 0) {
    return { from: lo, to: Math.min(hi, rowCount) };
  } else if (lo === 0) {
    return { from: lo, to: Math.min(hi + bufferSize, rowCount) };
  } else {
    const rangeSize = hi - lo;
    const buff = Math.round(bufferSize / 2);
    const shortfallBefore = lo - buff < 0;
    const shortFallAfter = rowCount - (hi + buff) < 0;

    if (shortfallBefore && shortFallAfter) {
      return { from: 0, to: rowCount };
    } else if (shortfallBefore) {
      return { from: 0, to: rangeSize + bufferSize };
    } else if (shortFallAfter) {
      return { from: Math.max(0, rowCount - (rangeSize + bufferSize)), to: rowCount };
    } else {
      return { from: lo - buff, to: hi + buff };
    }
  }
}

export function resetRange({ lo, hi, bufferSize = 0 }) {
  return {
    lo: 0,
    hi: hi - lo,
    bufferSize,
    reset: true
  };
}

export class WindowRange {
  public from: number;
  public to: number;

  constructor(from: number, to: number) {
    this.from = from;
    this.to = to;
  }

  public isWithin(index: number) {
    return index >= this.from && index < this.to;
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
