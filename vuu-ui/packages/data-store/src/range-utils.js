export const NULL_RANGE = { lo: 0, hi: 0 };

// If the requested range overlaps the last sent range, we only need send the
// newly exposed section of the range. The client will manage dropping off
// the expired section.
//
// |----------------------------------| _range
//  ++++++|----------------------------------| prevRange
//
//
//
//  |------------------------------------| _range
//  |----------------------------------|+  prevRange

/** @type {import('./range-utils').getDeltaRange} */
export function getDeltaRange(oldRange, newRange) {
  //TODO do we still need these calls to getFullRange ?
  const { lo: oldLo, hi: oldHi } = oldRange; /*getFullRange(oldRange)*/
  const { lo: newLo, hi: newHi } = newRange; /*getFullRange(newRange)*/

  if (newLo >= oldLo && newHi <= oldHi) {
    // reduced range, no delta
    return { from: newHi, to: newHi };
  } else if (newLo >= oldHi || newHi < oldLo) {
    return { from: newLo, to: newHi };
  } else if (newLo === oldLo && newHi === oldHi) {
    return { from: oldHi, to: oldHi };
  } else {
    return {
      from: newLo < oldLo ? newLo : oldHi,
      to: newHi > oldHi ? newHi : oldLo
    };
  }
}

/**
 *
 * @type {import('./range-utils').resetRange}
 */
export function resetRange({ lo, hi, bufferSize = 0 }) {
  return {
    lo: 0,
    hi: hi - lo,
    bufferSize,
    reset: true
  };
}

const SAME = 0;
const FWD = 2;
const BWD = 4;
const CONTIGUOUS = 8;
const OVERLAP = 16;
const REDUCE = 32;
const EXPAND = 64;
const NULL = 128;

export const RangeFlags = {
  SAME,
  FWD,
  BWD,
  CONTIGUOUS,
  OVERLAP,
  REDUCE,
  EXPAND,
  NULL
};

RangeFlags.GAP = ~(CONTIGUOUS | OVERLAP | REDUCE);

/** @type {import('./range-utils').compareRanges} */
export function compareRanges(range1, range2) {
  if (range2.lo === 0 && range2.hi === 0) {
    return NULL;
  } else if (range1.lo === range2.lo && range1.hi === range2.hi) {
    return SAME;
  } else if (range2.hi > range1.hi) {
    if (range2.lo > range1.hi) {
      return FWD;
    } else if (range2.lo === range1.hi) {
      return FWD + CONTIGUOUS;
    } else if (range2.lo >= range1.lo) {
      return FWD + OVERLAP;
    } else {
      return EXPAND;
    }
  } else if (range2.lo < range1.lo) {
    if (range2.hi < range1.lo) {
      return BWD;
    } else if (range2.hi === range1.lo) {
      return BWD + CONTIGUOUS;
    } else if (range2.hi > range1.lo) {
      return BWD + OVERLAP;
    } else {
      return EXPAND;
    }
  } else if (range2.lo > range1.lo) {
    return REDUCE + FWD;
  } else {
    return REDUCE + BWD;
  }
}
