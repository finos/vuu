import { describe, expect, it } from "vitest";
import {
  getUndoButtonContent,
  getUndoTooltipContent,
} from "../src/UndoCellRenderer";

describe("getUndoTooltipContent", () => {
  it.each([
    ["deleteRow", false, "Undo delete row"],
    ["addRow", false, "Undo insert row"],
    ["editCell", false, "Undo row edits"],
    ["", true, "Undo row edits"],
    ["", false, undefined],
  ])("maps action %s and row-change state %s to the expected tooltip", (action, hasRowChanges, expectedTooltip) => {
    expect(getUndoTooltipContent(action, hasRowChanges)).toBe(expectedTooltip);
  });

  describe("getUndoButtonContent", () => {
    it("defaults to UNDO text with no icon", () => {
      expect(getUndoButtonContent()).toEqual({
        icon: undefined,
        text: "UNDO",
      });
    });

    it.each([
      [{ text: "REVERT" }, { icon: undefined, text: "REVERT" }],
      [{ icon: "undo" }, { icon: "undo", text: "UNDO" }],
      [
        { icon: "undo", text: false },
        { icon: "undo", text: undefined },
      ],
      [
        { icon: "undo", text: "" },
        { icon: "undo", text: undefined },
      ],
    ])("maps component props %o to button content", (componentProps, expected) => {
      expect(getUndoButtonContent(componentProps)).toEqual(expected);
    });
  });
});
