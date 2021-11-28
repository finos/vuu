export function getFullRange(
  { from, to, lo = from, hi = to },
  bufferSize = 0,
  rowCount = Number.MAX_SAFE_INTEGER
) {
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
  constructor(from, to) {
    this.from = from;
    this.to = to;
  }

  isWithin(index) {
    return index >= this.from && index < this.to;
  }

  //find the overlap of this range and a new one
  overlap(from, to) {
    return from >= this.to || to < this.from
      ? [0, 0]
      : [Math.max(from, this.from), Math.min(to, this.to)];
  }

  copy() {
    return new WindowRange(this.from, this.to);
  }
}
