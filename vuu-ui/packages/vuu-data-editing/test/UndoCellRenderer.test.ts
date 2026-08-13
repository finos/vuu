import { describe, expect, it } from "vitest";
import { getUndoTooltipContent } from "../src/UndoCellRenderer";

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
});
