import { VuuRange } from "@vuu-ui/vuu-protocol-types";
import { IKeySet } from "@vuu-ui/vuu-utils";

export class MockKeySet implements IKeySet {
  #index = 0;
  #keys: number[];
  constructor(keys: number[]) {
    this.#keys = keys;
  }
  keyFor(rowIndex: number) {
    console.log(`[MockKeySet] keyFor [${rowIndex}] `);
    return this.#keys[this.#index++];
  }

  reset(_: VuuRange) {
    // console.log(`[MockKeySet] reset (${range.from}:${range.to})`);
  }
}

export class LoopingKeySet implements IKeySet {
  #keys: number[];
  #size: number;
  constructor(size: number) {
    this.#keys = [];
    this.#size = size;
    for (let i = 0; i < size; i++) {
      this.#keys[i] = i;
    }
  }

  keyFor(rowIndex: number) {
    // console.log(`[MockKeySet] keyFor [${rowIndex}] `);
    const index = rowIndex % this.#size;
    return this.#keys[index];
  }

  reset(_: VuuRange) {
    //console.log(`[MockKeySet] reset (${range.from}:${range.to})`);
  }
}
