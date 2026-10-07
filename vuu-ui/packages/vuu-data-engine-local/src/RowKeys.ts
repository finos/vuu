import type { VuuRange } from "@vuu-ui/vuu-protocol-types";

/**
 * Assigns stable render keys to row indices in the client range, recycling
 * the keys of rows that leave the range. Same contract as KeySet from
 * vuu-utils, but array backed, so reset costs O(range size) with no Map
 * scans or array shifts.
 */
export class RowKeys {
  #from = 0;
  #keys: number[] = [];
  #nextKeyValue = 0;

  constructor(range: VuuRange) {
    this.#init(range);
  }

  #init({ from, to }: VuuRange) {
    const size = Math.max(0, to - from);
    const keys = new Array<number>(size);
    for (let i = 0; i < size; i++) {
      keys[i] = i;
    }
    this.#from = from;
    this.#keys = keys;
    this.#nextKeyValue = size;
  }

  /**
   * Returns true when keys have been resequenced (range size reduced), in
   * which case all rows must be re-sent to the client.
   */
  reset(range: VuuRange): boolean {
    const { from, to } = range;
    const newSize = Math.max(0, to - from);
    const oldKeys = this.#keys;
    const oldSize = oldKeys.length;
    if (oldSize > newSize) {
      this.#init(range);
      return true;
    }
    const oldFrom = this.#from;
    const oldTo = oldFrom + oldSize;

    const freeKeys: number[] = [];
    for (let i = 0; i < oldSize; i++) {
      const rowIndex = oldFrom + i;
      if (rowIndex < from || rowIndex >= to) {
        freeKeys.push(oldKeys[i]);
      }
    }

    const keys = new Array<number>(newSize);
    let free = 0;
    for (let rowIndex = from, i = 0; rowIndex < to; rowIndex++, i++) {
      if (rowIndex >= oldFrom && rowIndex < oldTo) {
        keys[i] = oldKeys[rowIndex - oldFrom];
      } else if (free < freeKeys.length) {
        keys[i] = freeKeys[free++];
      } else {
        keys[i] = this.#nextKeyValue++;
      }
    }
    this.#from = from;
    this.#keys = keys;
    return false;
  }

  keyFor(rowIndex: number): number {
    const key = this.#keys[rowIndex - this.#from];
    if (key === undefined) {
      throw Error(`RowKeys, no key found for rowIndex ${rowIndex}`);
    }
    return key;
  }
}
