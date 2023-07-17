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
          [{ index: "overflow", label: "", overflowPriority: "0" }]
        )
      ).toEqual(false);
    });
    it("returns true if overflow has overflowed", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [],
          [
            { index: "4", label: "", overflowPriority: "0" },
            { index: "overflow", label: "", overflowPriority: "0" },
          ]
        )
      ).toEqual(true);
    });

    it("returns true if a high priority item has overflowed", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [
            { index: "1", label: "", overflowPriority: "0" },
            { index: "2", label: "", overflowPriority: "0" },
            { index: "3", label: "", overflowPriority: "0" },
          ],
          [
            { index: "4", label: "", overflowPriority: "1" },
            { index: "5", label: "", overflowPriority: "0" },
          ]
        )
      ).toEqual(true);
    });

    it("returns false if no higher priority has yet to overflow", () => {
      expect(
        highPriorityItemsHaveWrappedButShouldNotHave(
          [
            { index: "1", label: "", overflowPriority: "1" },
            { index: "2", label: "", overflowPriority: "1" },
          ],
          [
            { index: "3", label: "", overflowPriority: "1" },
            { index: "4", label: "", overflowPriority: "0" },
            { index: "5", label: "", overflowPriority: "0" },
          ]
        )
      ).toEqual(false);
    });
  });
});
