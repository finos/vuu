import { VuuRange } from "@finos/vuu-protocol-types";

export class KeySet {
  private keys: Map<number, number>;
  private free: number[];
  private nextKeyValue: number;

  constructor(range: VuuRange) {
    this.keys = new Map();
    this.free = [];
    this.nextKeyValue = 0;
    this.reset(range);
  }

  public next(): number {
    if (this.free.length > 0) {
      return this.free.pop() as number;
    } else {
      return this.nextKeyValue++;
    }
  }

  public reset({ from, to }: VuuRange) {
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
      console.log(`key not found
        keys: ${Object.entries(this.keys)
          .map((rowIndex, keyValue) => `${rowIndex}=>${keyValue}`)
          .join(", ")}
        free : ${this.free.join(",")}  
      `);
      throw Error(`KeySet, no key found for rowIndex ${rowIndex}`);
    }
    return key;
  }
}
