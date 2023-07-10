import { describe, expect, it } from "vitest";
import { highPriorityItemsHaveWrappedButShouldNotHave } from "../src/overflow-container/overflow-utils";

describe("overflow-utils", () => {
  describe("highPriorityItemsHaveWrappedButShouldNotHave", () => {
    it("returns false for empty item lists", () => {
      expect(highPriorityItemsHaveWrappedButShouldNotHave([], [])).toEqual(
        false
      );
    });
    it("returns false if overflow only has overflowed", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [],
          [{ index: "overflow", overflowPriority: "0" }]
        )
      ).toEqual(false);
    });
    it("returns true if overflow has overflowed", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [],
          [
            { index: "4", overflowPriority: "0" },
            { index: "overflow", overflowPriority: "0" },
          ]
        )
      ).toEqual(true);
    });

    it("returns true if a high priority item has overflowed", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [
            { index: "1", overflowPriority: "0" },
            { index: "2", overflowPriority: "0" },
            { index: "3", overflowPriority: "0" },
          ],
          [
            { index: "4", overflowPriority: "1" },
            { index: "5", overflowPriority: "0" },
          ]
        )
      ).toEqual(true);
    });

    it("returns false if no higher priority has yet to overflow", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [
            { index: "1", overflowPriority: "1" },
            { index: "2", overflowPriority: "1" },
          ],
          [
            { index: "3", overflowPriority: "1" },
            { index: "4", overflowPriority: "0" },
            { index: "5", overflowPriority: "0" },
          ]
        )
      ).toEqual(false);
    });
  });
});
