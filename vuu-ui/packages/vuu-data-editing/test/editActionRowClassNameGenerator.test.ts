import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import { editActionRowClassNameGenerator } from "../src/editActionRowClassNameGenerator";
import { isEditRowReadOnly } from "../src/edit-utils";

const dataRow = (vuuAction: string): DataRow =>
  ({ hasColumn: (name: string) => name === "vuuAction", vuuAction }) as DataRow;

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

    it("does not read vuuAction from rows without that column", () => {
      const row = new Proxy({} as DataRow, {
        get(_target, prop) {
          if (prop === "hasColumn") return () => false;
          throw Error(`unexpected read of ${String(prop)}`);
        },
      });
      expect(isEditRowReadOnly(row)).toBe(false);
    });
  });
});
