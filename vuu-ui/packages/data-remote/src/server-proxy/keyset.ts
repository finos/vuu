import { FromToRange } from './buffer-range';

export interface VuuRange {
  from: number;
  to: number;
}
export interface HwRange {
  lo: number;
  hi: number;
}

const isVuuRange = (range: VuuRange | HwRange): range is VuuRange =>
  typeof (range as VuuRange).from === 'number' && typeof (range as VuuRange).to === 'number';

const isHwRange = (range: VuuRange | HwRange): range is HwRange =>
  typeof (range as HwRange).lo === 'number' && typeof (range as HwRange).hi === 'number';

export class KeySet {
  private keys: Map<number, number>;
  private free: number[];
  private nextKeyValue: number;

  constructor(range: VuuRange | HwRange) {
    this.keys = new Map();
    this.free = [];
    this.nextKeyValue = 0;
    if (isVuuRange(range)) {
      this.reset(range);
    } else if (isHwRange(range)) {
      this.reset({ from: range.lo, to: range.hi });
    }
  }

  public next(): number {
    if (this.free.length > 0) {
      return this.free.pop() as number;
    } else {
      return this.nextKeyValue++;
    }
  }

  public reset({ from, to }: FromToRange) {
    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        this.free.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });

    const size = to - from;
    if (this.keys.size + this.free.length > size) {
      this.free.length = size - this.keys.size;
    }

    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next();
        this.keys.set(rowIndex, nextKeyValue);
      }
    }
  }

  public keyFor(rowIndex: number): number {
    const key = this.keys.get(rowIndex);
    if (key === undefined) {
      throw Error(`KeySet, no key found for rowIndex ${rowIndex}`);
    }
    return key;
  }
}
