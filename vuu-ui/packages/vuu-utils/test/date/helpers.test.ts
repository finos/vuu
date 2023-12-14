import { describe, expect, it } from "vitest";
import { dateTimePattern, defaultPatternByTypes } from "../../src/date/helpers";
import { DateTimePattern } from "../../src/date/types";

const testPattern: DateTimePattern = "mm/dd/yyyy";

describe("dateTimePattern", () => {
  it("returns exact pattern when found in descriptor type", () => {
    const type = {
      name: "date" as const,
      formatting: { pattern: testPattern },
    };
    const actualPattern = dateTimePattern(type);
    expect(actualPattern).toEqual(testPattern);
  });

  it("falls back to default when pattern not found in descriptor type", () => {
    const type = { name: "time" as const, formatting: {} };
    const actualPattern = dateTimePattern(type);
    expect(actualPattern).toEqual(defaultPatternByTypes["time"]);
  });

  it("falls back to default when simple type", () => {
    const type = "date";
    const actualPattern = dateTimePattern(type);
    expect(actualPattern).toEqual(defaultPatternByTypes["date"]);
  });
});
