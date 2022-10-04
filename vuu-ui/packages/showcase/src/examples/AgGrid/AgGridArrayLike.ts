import { WindowRange } from "@vuu-ui/utils";

export class ArrayLike<T = string> {
  public range: WindowRange;
  public data: T[];
  public length: number = 0;

  constructor(input: T[], size: number, range: WindowRange) {
    this.range = range;
    this.data = input;
    this.length = size;

    const handler = {
      get: (target: ArrayLike<T>, prop: string | symbol): any => {
        if (prop === "length") {
          return target.length;
        } else if (prop === "slice") {
          return target.slice;
        } else if (prop === "map") {
          throw Error("map not supported");
        } else if (prop === "toString") {
          return target.debug;
        } else if (typeof prop === "string") {
          const index = parseInt(prop, 10);
          if (!isNaN(index)) {
            console.log(`direct access to row ${index}`);
            return target.getItem(index);
          }
        }
        console.log(`AgGridArrayLike property access ${prop}`);
        return target.data[prop];
      },
      set: (target: ArrayLike<T>, prop: string, newVal: any) => {
        if (prop === "length") {
          target.length = newVal;
          return true;
        } else if (prop === "data") {
          target.data = newVal;
          return true;
        } else if (prop === "range") {
          target.range = newVal;
          return true;
        } else {
          throw Error(`ArrayLike is immutable except for length`);
        }
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
