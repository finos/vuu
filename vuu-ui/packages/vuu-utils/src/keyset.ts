import { VuuRange } from "@vuu-ui/vuu-protocol-types";

const EMPTY: number[] = [];

export interface IKeySet {
  keyFor: (rowIndex: number) => number;
  reset: (range: VuuRange) => void;
}

export class KeySet implements IKeySet {
  private keys = new Map<number, number>();
  private nextKeyValue = 0;
  private range: VuuRange;

  constructor(range: VuuRange) {
    this.range = range;
    this.init(range);
  }

  public next(free: number[] = EMPTY): number {
    if (free.length > 0) {
      return free.shift() as number;
    } else {
      return this.nextKeyValue++;
    }
  }

  private init({ from, to }: VuuRange) {
    this.keys.clear();
    this.nextKeyValue = 0;

    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      const nextKeyValue = this.next();
      this.keys.set(rowIndex, nextKeyValue);
    }

    return true;
  }

  public reset(range: VuuRange) {
    const { from, to } = range;

    const newSize = to - from;
    const currentSize = this.range.to - this.range.from;
    this.range = range;

    if (currentSize > newSize) {
      // We re-initialize the range when the range size reduces, even though this will
      // potentially re-render all items.
      return this.init(range);
    }

    const freeKeys: number[] = [];

    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        freeKeys.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });

    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue = this.next(freeKeys);
        this.keys.set(rowIndex, nextKeyValue);
      }
    }

    return false;
  }

  public keyFor(rowIndex: number): number {
    const key = this.keys.get(rowIndex);
    if (key === undefined) {
      console.log(`key not found
        keys: ${this.toDebugString()}
      `);
      throw Error(`KeySet, no key found for rowIndex ${rowIndex}`);
    }
    return key;
  }

  public toDebugString() {
    return `${this.keys.size} keys
${Array.from(this.keys.entries())
  .sort(([key1], [key2]) => key1 - key2)
  .map<string>(([k, v]) => `${k}=>${v}`)
  .join(",")}]\n`;
  }
}
