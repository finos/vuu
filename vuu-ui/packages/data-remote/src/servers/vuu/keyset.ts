import {VuuRange} from "../../../../utils/src/range-utils";
import {FromToRange} from "./buffer-range";

export class KeySet {
  private keys: Map<number, number>;
  private free: number[];
  private nextKeyValue: number;

  constructor(range: VuuRange) {
    this.keys = new Map();
    this.free = [];
    this.nextKeyValue = 0;
    if (range) {
      const { lo, hi, from = lo, to = hi } = range;
      this.reset({ from, to });
    }
  }

  public next(): number {
    if (this.free.length) {
      return this.free.pop();
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
    return this.keys.get(rowIndex);
  }
}
