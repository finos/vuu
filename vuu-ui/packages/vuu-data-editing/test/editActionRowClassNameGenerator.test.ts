import type { DataRow } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import { editActionRowClassNameGenerator } from "../src/editActionRowClassNameGenerator";

const dataRow = (vuu_action: string): DataRow => ({ vuu_action }) as DataRow;

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
});
