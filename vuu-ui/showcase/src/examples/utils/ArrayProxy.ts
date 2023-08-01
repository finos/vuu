export type RowAtIndexFunc<T = unknown> = (index: number) => T | undefined;

export class ArrayProxy<T = string> {
  #getItem: RowAtIndexFunc;
  public length = 0;

  constructor(size: number, getRow: RowAtIndexFunc) {
    this.#getItem = getRow;
    this.length = size;

    const handler = {
      get: (target: ArrayProxy<T>, prop: string | symbol): any => {
        if (prop === "length") {
          return target.length;
        } else if (prop === "slice") {
          return target.slice;
        } else if (prop === "map") {
          return target.map;
        } else if (prop === "toString") {
          return "[ArrayProxy]";
        }
        if (typeof prop === "string") {
          const index = parseInt(prop, 10);
          if (!isNaN(index)) {
            if (index < this.length) {
              return target.#getItem(index);
            } else {
              return undefined;
            }
          }
        }
        throw Error(`unsupported property ${String(prop)} on ArrayProxy`);
      },
      set: (target: ArrayProxy<T>, prop: string, newVal: unknown) => {
        if (prop === "length") {
          target.length = newVal as number;
          return true;
        }
        throw Error(`ArrayProxy is immutable except for length`);
      },
    };
    return new Proxy(this, handler);
  }

  map = (func: (item: T, i: number) => unknown) => {
    return new ArrayProxy(this.length, (i: number) => {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return func(this.#getItem(i), i);
    });
  };
  slice = (from: number, to: number) => {
    const out = [];
    const end = Math.min(this.length, to);
    for (let i = from; i < end; i++) {
      out.push(this.#getItem(i));
    }
    return out;
  };
}
