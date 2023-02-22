import { describe, expect, it } from "vitest";
import {
  deselectItem,
  expandSelection,
  selectItem,
} from "../src/selection-utils";

describe("selection-utils", () => {
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
