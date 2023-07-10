import { describe, expect, it } from "vitest";
import { findSplitterAndPlaceholderPositions } from "../src/flexbox/flexbox-utils";

describe("findSplitterAndPlaceholderPositions", () => {
  let positions;
  describe("WHEN there are less than 2 items", () => {
    it("THEN no splitters are inserted", () => {
      positions = findSplitterAndPlaceholderPositions([]);
      expect(positions).toEqual([]);

      positions = findSplitterAndPlaceholderPositions([{ resizeable: true }]);
      expect(positions).toEqual([0]);

      positions = findSplitterAndPlaceholderPositions([{ resizeable: false }]);
      expect(positions).toEqual([0]);
    });
  });

  describe("WHEN there are no resizeable items", () => {
    it("THEN no splitters are inserted", () => {
      positions = findSplitterAndPlaceholderPositions([
        { resizeable: false },
        { resizeable: false },
      ]);
      expect(positions).toEqual([0, 0]);

      positions = findSplitterAndPlaceholderPositions([
        { resizeable: false },
        { resizeable: false },
        { resizeable: false },
      ]);
      expect(positions).toEqual([0, 0, 0]);

      positions = findSplitterAndPlaceholderPositions([
        { resizeable: false },
        { resizeable: false },
        { resizeable: false },
        { resizeable: false },
      ]);
      expect(positions).toEqual([0, 0, 0, 0]);
    });
  });

  describe("WHEN all items are resizeable", () => {
    it("THEN splitters are inserted between items", () => {
      positions = findSplitterAndPlaceholderPositions([
        { resizeable: true },
        { resizeable: true },
      ]);
      expect(positions).toEqual([1, 0]);

      positions = findSplitterAndPlaceholderPositions([
        { resizeable: true },
        { resizeable: true },
        { resizeable: true },
      ]);
      expect(positions).toEqual([1, 1, 0]);

      positions = findSplitterAndPlaceholderPositions([
        { resizeable: true },
        { resizeable: true },
        { resizeable: true },
        { resizeable: true },
      ]);
      expect(positions).toEqual([1, 1, 1, 0]);
    });
  });

  describe("WHEN some items are resizeable", () => {
    it("THEN splitters are inserted where appropriate between items", () => {
      // positions = findSplitterAndPlaceholderPositions([{resizeable: true},{resizeable: true}]);
      // expect(positions).toEqual([1,0])

      positions = findSplitterAndPlaceholderPositions([
        { resizeable: false },
        { resizeable: true },
        { resizeable: true },
      ]);
      expect(positions).toEqual([0, 1, 0]);

      positions = findSplitterAndPlaceholderPositions([
        { resizeable: false },
        { resizeable: true },
        { resizeable: true },
        { resizeable: true },
      ]);
      expect(positions).toEqual([0, 1, 1, 0]);
    });
  });
});
