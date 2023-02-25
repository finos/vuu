import { describe, expect, it } from "vitest";
import { KeySet } from "../src/keyset";

describe("KeySet", () => {
  describe("reset", () => {
    it("initialises an empty keyset", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("re-initialises a keyset, extending size", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 0, to: 11 });
      expect(keySet.keys.size).toEqual(11);
      expect([...keySet.keys.keys()]).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
      expect([...keySet.keys.values()]).toEqual([
        0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
      ]);
    });

    it("re-initialises a keyset, reducing size", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 0, to: 9 });
      expect(keySet.keys.size).toEqual(9);
      expect([...keySet.keys.keys()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
      expect(keySet.free).toEqual([]);
    });

    it("re-initialises a keyset, forwards, with overlap", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 2, to: 12 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect([...keySet.keys.values()]).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 1, 0]);
    });

    it("re-initialises a keyset, forwards, no overlap", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 10, to: 20 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      ]);
      expect([...keySet.keys.values()]).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    });

    it("re-initialises a keyset, backwards, with overlap", () => {
      const keySet = new KeySet({ from: 10, to: 20 });
      keySet.reset({ from: 8, to: 18 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 8, 9,
      ]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 9, 8]);
    });

    it("re-initialises a keyset, backwards, no overlap", () => {
      const keySet = new KeySet({ from: 10, to: 20 });
      keySet.reset({ from: 0, to: 10 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect([...keySet.keys.values()]).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
    });
  });
});
