import { describe, expect, it } from "vitest";
import { isDateTimePattern } from "../../src/date/types";

describe("isDateTimePattern", () => {
  it.each<{ pattern: string | undefined; expected: boolean }>([
    { pattern: "dd MMM yyyy", expected: true },
    { pattern: "not-a-date-time-pattern", expected: false },
    { pattern: undefined, expected: false },
  ])(
    "returns $expected when pattern is a DateTimePattern",
    ({ pattern, expected }) => {
      const actual = isDateTimePattern(pattern);
      expect(actual).toEqual(expected);
    }
  );
});
