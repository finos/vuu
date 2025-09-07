import { describe, expect, it } from "vitest";
import {
  deselectItem,
  expandSelection,
  getSelectionStatus,
  RowSelected,
  selectionCount,
  selectItem,
} from "../src/selection-utils";

describe("selection-utils", () => {
  describe("getSelectionStatus", () => {
    it("returns 0 when no selection at all", () => {
      expect(getSelectionStatus([], 0)).toEqual(RowSelected.False);
    });
    it("returns False when no rowIndex is not in selection", () => {
      expect(getSelectionStatus([1, 5, 9], 2)).toEqual(RowSelected.False);
    });
    it("returns False when no rowIndex is not in selection", () => {
      expect(getSelectionStatus([[0, 2], 5, 9], 3)).toEqual(RowSelected.False);
    });

    it("returns True when rowIndex is included in selection", () => {
      expect(getSelectionStatus([1], 1) & RowSelected.True).toEqual(
        RowSelected.True,
      );
      expect(getSelectionStatus([[0, 3]], 1)).toEqual(RowSelected.True);
    });
    it("returns True when rowIndex falls within a range selection", () => {
      expect(getSelectionStatus([[0, 3]], 1)).toEqual(RowSelected.True);
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
      it("acts like single select if activeItem index not set", () => {
        expect(selectItem("extended", [2], 9, true, false, -1)).toEqual([9]);
      });
      it("creates an additional range from activeItem", () => {
        expect(selectItem("extended", [[2, 5], 7], 9, true, false, 7)).toEqual([
          [2, 5],
          [7, 9],
        ]);
      });
      it("extends existing range with range select", () => {
        expect(selectItem("extended", [[2, 5], 7], 4, true, false, 7)).toEqual([
          [2, 7],
        ]);
      });

      it("extends existing range with extended contiguous select", () => {
        expect(selectItem("extended", [[8, 12]], 13, false, true, 13)).toEqual([
          [8, 13],
        ]);
      });
      // prettier-ignore
      it("joins existing ranges that are separated by single row, when that row is selected", () => {
        expect(selectItem("extended", [[8, 10],[12,14]], 11, false, true, 13)).toEqual([
          [8, 14],
        ]);
      });

      // prettier-ignore
      it("joins an existing selection to an existing ranges, when that single row that separated them is selected", () => {
        expect(selectItem("extended", [[8, 10],12], 11, false, true, 13)).toEqual([
          [8, 12],
        ]);
      });

      it("returns selected items in order", () => {
        expect(selectItem("extended", [2, 9], 7, false, true)).toEqual([
          2, 7, 9,
        ]);
      });
      it("works correctly when first row is selected", () => {
        expect(selectItem("extended", [0], 2, false, true)).toEqual([0, 2]);
      });
      it("creates a range by joining single items", () => {
        expect(selectItem("extended", [1], 2, false, true, 2)).toEqual([
          [1, 2],
        ]);
        expect(selectItem("extended", [2, 4], 3, false, true, 3)).toEqual([
          [2, 4],
        ]);
        expect(selectItem("extended", [0, 2, 4, 7], 3, false, true, 3)).toEqual(
          [0, [2, 4], 7],
        );
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
          [],
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

  describe("selectionCount", () => {
    it("correctly reports no item", () => {
      expect(selectionCount([])).toEqual(0);
    });
    it("correctly counts a single item", () => {
      expect(selectionCount([1])).toEqual(1);
    });
    it("correctly counts multiple single items", () => {
      expect(selectionCount([1, 5, 9])).toEqual(3);
    });
    it("correctly counts a single range", () => {
      expect(selectionCount([[1, 3]])).toEqual(3);
    });
    it("correctly counts multiple ranges", () => {
      expect(
        selectionCount([
          [1, 3],
          [9, 11],
        ]),
      ).toEqual(6);
    });
    it("correctly counts mized ranges and single items", () => {
      expect(selectionCount([[1, 3], 5, [9, 11], 15, 19])).toEqual(9);
    });
  });
});
