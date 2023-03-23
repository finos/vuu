export interface VuuRange {
  from: number;
  to: number;
  bufferSize?: number;
  reset?: boolean;
}

interface FromToRange {
  from: number;
  to: number;
}

export function getFullRange(
  { from, to }: VuuRange,
  bufferSize = 0,
  rowCount: number = Number.MAX_SAFE_INTEGER
): FromToRange {
  if (bufferSize === 0) {
    if (rowCount < from) {
      return { from: 0, to: 0 };
    } else {
      return { from, to: Math.min(to, rowCount) };
    }
  } else if (from === 0) {
    return { from, to: Math.min(to + bufferSize, rowCount) };
  } else {
    const rangeSize = to - from;
    const buff = Math.round(bufferSize / 2);
    const shortfallBefore = from - buff < 0;
    const shortFallAfter = rowCount - (to + buff) < 0;

    if (shortfallBefore && shortFallAfter) {
      return { from: 0, to: rowCount };
    } else if (shortfallBefore) {
      return { from: 0, to: rangeSize + bufferSize };
    } else if (shortFallAfter) {
      return {
        from: Math.max(0, rowCount - (rangeSize + bufferSize)),
        to: rowCount,
      };
    } else {
      return { from: from - buff, to: to + buff };
    }
  }
}

export function resetRange({ from, to, bufferSize = 0 }: VuuRange): VuuRange {
  return {
    from: 0,
    to: to - from,
    bufferSize,
    reset: true,
  };
}

export const withinRange = (value: number, { from, to }: VuuRange) =>
  value >= from && value < to;

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
