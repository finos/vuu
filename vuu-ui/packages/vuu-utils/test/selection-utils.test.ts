import { describe, expect, it } from "vitest";
import {
  deselectItem,
  expandSelection,
  getSelectionDiff,
  selectItem,
} from "../src/selection-utils";

describe("selection-utils", () => {
  describe("getSelectionDiff", () => {
    it("returns no values if there was and is no selection", () => {
      expect(getSelectionDiff([], [])).toEqual({
        added: [],
        removed: [],
      });
    });

    it("identifies a brand new selection", () => {
      expect(getSelectionDiff([], [1])).toEqual({
        added: [1],
        removed: [],
      });
      expect(getSelectionDiff([], [1, 2, 3])).toEqual({
        added: [1, 2, 3],
        removed: [],
      });
      expect(getSelectionDiff([], [1, [2, 4], 7])).toEqual({
        added: [1, [2, 4], 7],
        removed: [],
      });
    });

    it("identifies complete removal of selection", () => {
      expect(getSelectionDiff([1], [])).toEqual({
        added: [],
        removed: [1],
      });
      expect(getSelectionDiff([1, 2, 3], [])).toEqual({
        added: [],
        removed: [1, 2, 3],
      });
      expect(getSelectionDiff([1, [2, 4], 7], [])).toEqual({
        added: [],
        removed: [1, [2, 4], 7],
      });
    });

    it("identifies the added items in a selection of single values", () => {
      expect(getSelectionDiff([1], [1, 2])).toEqual({
        added: [2],
        removed: [],
      });
      expect(getSelectionDiff([1, 3], [1, 3, 7, 9])).toEqual({
        added: [7, 9],
        removed: [],
      });
      expect(
        getSelectionDiff([1, 3, 10, 20], [1, 3, 6, 10, 12, 14, 20])
      ).toEqual({
        added: [6, 12, 14],
        removed: [],
      });
    });

    it("identifies the addition of a new selection range", () => {
      expect(getSelectionDiff([1], [1, [3, 5]])).toEqual({
        added: [[3, 5]],
        removed: [],
      });
    });

    it("identifies the removed items in a selection of single values", () => {
      expect(getSelectionDiff([1, 2], [1])).toEqual({
        added: [],
        removed: [2],
      });
      expect(getSelectionDiff([1, 3, 7, 9], [1, 3])).toEqual({
        added: [],
        removed: [7, 9],
      });
      expect(
        getSelectionDiff([1, 3, 6, 10, 12, 14, 20], [1, 3, 10, 20])
      ).toEqual({
        added: [],
        removed: [6, 12, 14],
      });
    });

    it("identifies a removed range in an existing selection", () => {
      expect(getSelectionDiff([[1, 5]], [7])).toEqual({
        added: [7],
        removed: [[1, 5]],
      });
    });

    it.only("identifies a partially removed range in an existing selection", () => {
      // prettier-ignore
      expect(getSelectionDiff([[1, 10]], [[1, 5], [7, 10]])).toEqual({
        added: [],
        removed: [6],
      });
      // prettier-ignore
      expect(getSelectionDiff([[1, 12]], [[1, 5], [9, 11]])).toEqual({
        added: [],
        removed: [[[6,8],12]],
      });
    });

    it("identifies a selected item extended to a range", () => {
      expect(getSelectionDiff([1], [[1, 5]])).toEqual({
        added: [[2, 5]],
        removed: [],
      });
    });
  });

  describe("selectItem", () => {
    describe("single selection mode", () => {
      it("selects a single item", () => {
        expect(selectItem("single", [], 5, false, false)).toEqual([5]);
      });
      it("ignores if selection unchanged", () => {
        expect(selectItem("single", [5], 5, false, false)).toEqual([5]);
      });
    });

    describe("extended selection mode", () => {
      it("selects a single item, no range required, no preserve selection", () => {
        expect(selectItem("extended", [2, 5], 7, false, false)).toEqual([7]);
      });
      it("selects a single item, no range required, preserve selection", () => {
        expect(selectItem("extended", [2, 5], 7, false, true)).toEqual([
          2, 5, 7,
        ]);
      });
      it("selects a range from single existing selection", () => {
        expect(selectItem("extended", [2], 7, true, false, 2)).toEqual([
          [2, 7],
        ]);
      });
      it("extends an existing range", () => {
        expect(selectItem("extended", [[2, 5]], 7, true, false, 5)).toEqual([
          [2, 7],
        ]);
      });
      it("creates an additional range from activeItem", () => {
        expect(selectItem("extended", [[2, 5], 7], 9, true, false, 7)).toEqual([
          [2, 5],
          [7, 9],
        ]);
      });
      it("merges new range into existing range", () => {
        expect(selectItem("extended", [[2, 5], 7], 4, true, false, 7)).toEqual([
          [2, 7],
        ]);
      });
      it("returns selected items in order", () => {
        expect(selectItem("extended", [2, 9], 7, false, true)).toEqual([
          2, 7, 9,
        ]);
      });
    });
  });
  describe("deselectItem", () => {
    describe("single selection mode", () => {
      it("deselects a single item", () => {
        expect(deselectItem("single", [5], 5, false, false)).toEqual([]);
      });
      it("ignores if selection unchanged", () => {
        expect(deselectItem("single", [], 5, false, false)).toEqual([]);
      });
    });

    describe("extended selection mode", () => {
      it("deselects a single item, no range required, no preserve selection", () => {
        expect(deselectItem("extended", [2, 5, 7], 7, false, false)).toEqual(
          []
        );
      });
      it("deselects a single item, no range required, preserve selection", () => {
        expect(deselectItem("extended", [2, 5, 7], 7, false, true)).toEqual([
          2, 5,
        ]);
      });

      it("deselects a single item from beginning of range", () => {
        expect(deselectItem("extended", [[2, 5]], 2, false, true)).toEqual([
          [3, 5],
        ]);
      });
      it("deselects a single item from end of range", () => {
        expect(deselectItem("extended", [[2, 5]], 5, false, true)).toEqual([
          [2, 4],
        ]);
      });
      it("deselects a single item from middle of three item range", () => {
        expect(deselectItem("extended", [[2, 4]], 3, false, true)).toEqual([
          2, 4,
        ]);
      });
      it("deselects a single item from middle  range", () => {
        expect(deselectItem("extended", [[2, 9]], 5, false, true)).toEqual([
          [2, 4],
          [6, 9],
        ]);
      });
    });
  });

  describe("expandSelection", () => {
    it("returns a number only selection as-is", () => {
      let selected: number[] = [];
      expect(selected === expandSelection(selected)).toEqual(true);

      selected = [1];
      expect(selected === expandSelection(selected)).toEqual(true);

      selected = [1, 5, 8, 9];
      expect(selected === expandSelection(selected)).toEqual(true);
    });

    it("returns a range expanded", () => {
      expect(expandSelection([[2, 5]])).toEqual([2, 3, 4, 5]);
    });

    it("expands multiple ranges", () => {
      expect(expandSelection([[2, 5], 7, [9, 11]])).toEqual([
        2, 3, 4, 5, 7, 9, 10, 11,
      ]);
    });
  });
});
