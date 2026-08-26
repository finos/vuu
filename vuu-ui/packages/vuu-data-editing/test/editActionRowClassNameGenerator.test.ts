import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import { editActionRowClassNameGenerator } from "../src/editActionRowClassNameGenerator";
import { isEditRowReadOnly } from "../src/edit-utils";

const dataRow = (vuuAction: string): DataRow => ({ vuuAction }) as DataRow;

describe("editActionRowClassNameGenerator", () => {
  it.each([
    ["addRow", "vuuTableRow-inserted"],
    ["deleteRow", "vuuTableRow-deleted"],
    ["editCell", undefined],
    ["", undefined],
  ])("maps %s to the expected row class", (action, expectedClassName) => {
    expect(editActionRowClassNameGenerator(dataRow(action))).toBe(
      expectedClassName,
    );
  });

  describe("isEditRowReadOnly", () => {
    it("only marks deleted edit-session rows as read-only", () => {
      expect(isEditRowReadOnly(dataRow("deleteRow"))).toBe(true);
      expect(isEditRowReadOnly(dataRow("addRow"))).toBe(false);
      expect(isEditRowReadOnly(dataRow("editCell"))).toBe(false);
    });
  });
});
