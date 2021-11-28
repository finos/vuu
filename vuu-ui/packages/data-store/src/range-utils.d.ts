type Range = {lo: number, hi: number, bufferSize?: number, reset?: boolean} // is reset needed ?

export declare const NULL_RANGE: Range;

export declare const RangeFlags: {
  [key: string]: number;
}

/**
 * Return the delta of 2 ranges, those rows in the new range
 * which were not in the old range. If the ranges are disjunct,
 * entire newRange will be delta. If new range is entirely
 * contained within old range, delta size is zero. OTW, delta
 * are those rows in newRange, not in old range. 
 */
export type getDeltaRange = (oldRange: Range, newRange: Range) => Range;
export declare const getDeltaRange: getDeltaRange;

export type resetRange = (range: Range) => Range;
export declare const resetRange: resetRange;

/**
 * Return a bitwise flag that describes the relationship 
 * between 2 ranges. A range can be expanding or reducing, 
 * moving forwards or backwards, any move can be discrete,
 * contiguaous or overlapping. The ranges can, of course,
 * be the same.
 * If range2 is null (0,0) the result is null.
 */
export type compareRanges = (range1: Range, range2: Range) => number;
export declare const compareRanges: compareRanges;