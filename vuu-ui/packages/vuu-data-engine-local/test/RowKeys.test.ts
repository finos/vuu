import { describe, expect, it } from "vitest";
import { RowKeys } from "../src/RowKeys";

const keysFor = (keys: RowKeys, from: number, to: number) => {
  const result: number[] = [];
  for (let i = from; i < to; i++) result.push(keys.keyFor(i));
  return result;
};

describe("RowKeys", () => {
  it("assigns sequential keys to the initial range", () => {
    const keys = new RowKeys({ from: 10, to: 15 });
    expect(keysFor(keys, 10, 15)).toEqual([0, 1, 2, 3, 4]);
  });

  it("retains keys of rows that remain in range and recycles the rest", () => {
    const keys = new RowKeys({ from: 0, to: 5 });
    expect(keys.reset({ from: 2, to: 7 })).toBe(false);
    expect(keysFor(keys, 2, 7)).toEqual([2, 3, 4, 0, 1]);
  });

  it("recycles all keys on a jump to a non-overlapping range", () => {
    const keys = new RowKeys({ from: 0, to: 5 });
    keys.reset({ from: 1000, to: 1005 });
    expect(keysFor(keys, 1000, 1005).sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it("allocates new keys when the range grows", () => {
    const keys = new RowKeys({ from: 0, to: 3 });
    keys.reset({ from: 0, to: 5 });
    expect(keysFor(keys, 0, 5)).toEqual([0, 1, 2, 3, 4]);
  });

  it("resequences when the range shrinks", () => {
    const keys = new RowKeys({ from: 5, to: 10 });
    expect(keys.reset({ from: 6, to: 8 })).toBe(true);
    expect(keysFor(keys, 6, 8)).toEqual([0, 1]);
  });

  it("keys are unique within the range after many resets", () => {
    const keys = new RowKeys({ from: 0, to: 20 });
    for (const from of [3, 17, 500, 490, 0, 7]) {
      keys.reset({ from, to: from + 20 });
      expect(new Set(keysFor(keys, from, from + 20)).size).toBe(20);
    }
  });

  it("throws for a row outside the range", () => {
    const keys = new RowKeys({ from: 0, to: 5 });
    expect(() => keys.keyFor(5)).toThrow();
  });
});
