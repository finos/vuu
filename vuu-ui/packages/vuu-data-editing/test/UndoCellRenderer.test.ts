import { describe, expect, it } from "vitest";
import {
  getUndoButtonContent,
  getUndoTooltipContent,
  type UndoCellRendererComponentProps,
} from "../src/UndoCellRenderer";

describe("getUndoTooltipContent", () => {
  it.each([
    ["deleteRow", "Undo delete row"],
    ["addRow", "Undo insert row"],
    ["editCell", "Undo row edits"],
    ["", undefined],
  ])("maps action %s and row-change state %s to the expected tooltip", (action, expectedTooltip) => {
    expect(getUndoTooltipContent(action)).toBe(expectedTooltip);
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
      expect(getUndoButtonContent(componentProps as UndoCellRendererComponentProps)).toEqual(expected);
    });
  });
});
