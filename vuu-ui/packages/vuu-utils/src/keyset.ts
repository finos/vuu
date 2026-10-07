import { VuuRange } from "@vuu-ui/vuu-protocol-types";

const EMPTY: number[] = [];

export interface IKeySet {
  keyFor: (rowIndex: number) => number;
  reset: (range: VuuRange) => void;
}

export class KeySet implements IKeySet {
  private keys = new Map<number, number>();
  private freeKeys: number[] = [];
  private nextKeyValue = 0;
  private range: VuuRange;

  constructor(range: VuuRange) {
    this.range = { from: range.from, to: range.to };
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
    this.freeKeys.length = 0;
    this.nextKeyValue = 0;

    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      const nextKeyValue = this.next();
      this.keys.set(rowIndex, nextKeyValue);
    }

    return true;
  }

  /**
   * Keys assigned to rows that remain within range are never changed, keys
   * released by rows leaving the range are recycled for rows entering the
   * range. Keys are never re-sequenced, clients may retain rows (and their
   * keys) that remain within range, so re-assigning keys to those rows would
   * risk duplicate keys on the client.
   * Note: range is copied, callers may mutate the range object they pass.
   * Returns false, keys are never resequenced.
   */
  public reset({ from, to }: VuuRange) {
    this.range = { from, to };

    const { freeKeys } = this;
    this.keys.forEach((keyValue, rowIndex) => {
      if (rowIndex < from || rowIndex >= to) {
        freeKeys.push(keyValue);
        this.keys.delete(rowIndex);
      }
    });

    let freeKeyIndex = 0;
    for (let rowIndex = from; rowIndex < to; rowIndex++) {
      if (!this.keys.has(rowIndex)) {
        const nextKeyValue =
          freeKeyIndex < freeKeys.length
            ? freeKeys[freeKeyIndex++]
            : this.nextKeyValue++;
        this.keys.set(rowIndex, nextKeyValue);
      }
    }

    if (freeKeyIndex > 0) {
      freeKeys.splice(0, freeKeyIndex);
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
