import { describe, expect, it } from "vitest";
import {
  dateTimePattern,
  fallbackDateTimePattern,
} from "../../src/date/helpers";
import { DateTimePattern } from "../../src/date/types";

const testPattern: DateTimePattern = { date: "mm/dd/yyyy" };

describe("dateTimePattern", () => {
  it("returns exact pattern when found in descriptor type", () => {
    const type = {
      name: "date/time" as const,
      formatting: { pattern: testPattern },
    };
    const actualPattern = dateTimePattern(type);
    expect(actualPattern).toEqual(testPattern);
  });

  it("fallback pattern when pattern not found in descriptor type", () => {
    const type = { name: "date/time" as const, formatting: {} };
    const actualPattern = dateTimePattern(type);
    expect(actualPattern).toEqual(fallbackDateTimePattern);
  });

  it("fallback pattern when simple type", () => {
    const type = "date/time";
    const actualPattern = dateTimePattern(type);
    expect(actualPattern).toEqual(fallbackDateTimePattern);
  });
});
