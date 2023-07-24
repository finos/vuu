import { WindowRange } from "@finos/vuu-utils";

export class ArrayLike<T = string> {
  public range: WindowRange;
  public data: T[];
  public length = 0;

  constructor(input: T[], size: number, range: WindowRange) {
    this.range = range;
    this.data = input;
    this.length = size;

    const handler = {
      get: (target: ArrayLike<T>, prop: string | symbol): any => {
        if (prop === "length") {
          return target.length;
        }
        if (prop === "slice") {
          return target.slice;
        }
        if (prop === "toString") {
          return target.debug;
        }
        if (typeof prop === "string") {
          const index = parseInt(prop, 10);
          if (!isNaN(index)) {
            return target.getItem(index);
          }
        }
        return target.data[prop];
      },
      set: (target: ArrayLike<T>, prop: string, newVal: any) => {
        if (prop === "length") {
          target.length = newVal;
          return true;
        }
        if (prop === "data") {
          target.data = newVal;
          return true;
        }
        if (prop === "range") {
          target.range = newVal;
          return true;
        }
        throw Error(`ArrayLike is immutable except for length`);
      },
    };
    return new Proxy(this, handler);
  }

  getItem = (index: number) => {
    const offset = this.range.from;
    return this.data[index - offset];
  };

  slice = (from: number, to: number) => {
    const offset = this.range.from;
    const out = [];
    for (let i = from; i < to; i++) {
      const index = i - offset;
      if (this.data[index] !== undefined) {
        out.push(this.data[index]);
      } else {
        out.push({ label: "???", value: "" });
      }
    }
    return out;
  };

  debug = () => {
    return `ArrayLike: range ${this.range.from} - ${this.range.to} data 
        ${JSON.stringify(this.data[0])} - ${JSON.stringify(
      this.data[this.data.length - 1]
    )}`;
  };
}
