import { describe, expect, it } from "vitest";
import { isDateTimePattern } from "../../src/date/types";
import { ColumnTypeFormatting } from "@finos/vuu-table-types";

describe("isDateTimePattern", () => {
  it.each<{ pattern: ColumnTypeFormatting["pattern"]; expected: boolean }>([
    { pattern: { date: "dd MMM yyyy" }, expected: true },
    { pattern: { time: "hh:mm:ss a" }, expected: true },
    { pattern: { date: "dd/mm/yyyy", time: "hh:mm:ss" }, expected: true },
    { pattern: undefined, expected: false },
  ])(
    "returns $expected when pattern is a DateTimePattern",
    ({ pattern, expected }) => {
      const actual = isDateTimePattern(pattern);
      expect(actual).toEqual(expected);
    }
  );
});
