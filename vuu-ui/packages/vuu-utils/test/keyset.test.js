import { describe, expect, it } from "vitest";
import { KeySet } from "../src/keyset";

describe("KeySet", () => {
  describe("reset", () => {
    it("initialises an empty keyset", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      expect(keySet.keys.size).toEqual(10);
      // prettier-ignore
      expect([...keySet.keys.entries()]).toEqual([[0,0], [1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9]]);
      expect(keySet["nextKeyValue"]).toEqual(10);
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
    });

    it("re-initialises a keyset, reducing size to zero, then resets to non zero value", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 0, to: 0 });
      expect(keySet.keys.size).toEqual(0);
      expect([...keySet.keys.keys()]).toEqual([]);
      keySet.reset({ from: 0, to: 10 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("re-initialises a keyset, forwards, with overlap", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 2, to: 12 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      expect([...keySet.keys.values()]).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 0, 1]);
    });

    it("re-initialises a keyset, forwards, no overlap", () => {
      const keySet = new KeySet({ from: 0, to: 10 });
      keySet.reset({ from: 10, to: 20 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
      ]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("re-initialises a keyset, backwards, with overlap", () => {
      const keySet = new KeySet({ from: 10, to: 20 });
      keySet.reset({ from: 8, to: 18 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([
        10, 11, 12, 13, 14, 15, 16, 17, 8, 9,
      ]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("re-initialises a keyset, backwards, no overlap", () => {
      const keySet = new KeySet({ from: 10, to: 20 });
      keySet.reset({ from: 0, to: 10 });
      expect(keySet.keys.size).toEqual(10);
      expect([...keySet.keys.keys()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
      expect([...keySet.keys.values()]).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("Bug repro, page down x2, page up x 2 page down", () => {
      const keySet = new KeySet({ from: 0, to: 0 });

      keySet.reset({ from: 0, to: 35 });
      keySet.reset({ from: 25, to: 66 });
      keySet.reset({ from: 55, to: 96 });
      keySet.reset({ from: 25, to: 66 });
      keySet.reset({ from: 0, to: 36 });
      keySet.reset({ from: 25, to: 66 });
      // prettier-ignore
      expect([...keySet.keys.entries()]).toEqual([
        [25,25], [26,26], [27,27], [28,28], [29,29], [30,30], [31,31], [32,32], [33,33], [34,34], [35,35], [36,0], [37,1],
        [38,2], [39,3], [40,4], [41,5], [42,6], [43,7], [44,8], [45,9], [46,10], [47,11], [48,12],
        [49,13], [50,14], [51,15], [52,16], [53,17], [54,18],
        [55,19], [56,20], [57,21], [58,22], [59,23], [60,24], [61,36], [62,37], [63,38], [64,39], [65,40],
      ]);
    });
  });

  // it("handles erratic resets without ever producing a duplicate key", () => {
  //   const keySet = new KeySet({ from: 0, to: 0 });
  //   keySet.reset({ from: 0, to: 0 });
  //   keySet.reset({ from: 0, to: 30 });
  //   keySet.reset({ from: 0, to: 21 });
  //   keySet.reset({ from: 0, to: 30 });
  //   keySet.reset({ from: 1, to: 22 });
  //   keySet.reset({ from: 0, to: 30 });
  //   expect(keySet.keys.size).toEqual(30);
  //   // prettier-ignore
  //   expect([...keySet.keys.entries()]).toEqual([
  //     [1,1], [2,2], [3,3], [4,4], [5,5], [6,6], [7,7], [8,8], [9,9], [10,10], [11,11], [12,12], [13,13],
  //     [14,14], [15,15], [16,16], [17,17], [18,18], [19,19], [20,20], [21,21],
  //     [0,0], [22,22], [23,23], [24,24], [25,25], [26,26], [27,27], [28,28], [29,29],
  //   ]);
  //   expect(keySet.free).toEqual([]);
  // });
});
