import { describe, expect, it } from "vitest";
import {
  dateTimePattern,
  fallbackDateTimePattern,
  withDateTimePattern,
} from "../../src/date/dateTimePattern";
import { getTemporalInfo } from "../../src/date/temporal";
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

describe("withDateTimePattern", () => {
  const nanoColumn = {
    name: "execTime",
    serverDataType: "epochtimestampnano",
    type: {
      name: "date/time",
      formatting: {
        pattern: { date: "yyyy-mm-dd", time: "hh:mm:ss" },
        timeZone: "America/New_York",
      },
    },
  } as const;

  it("returns descriptor unchanged when no pattern provided", () => {
    expect(withDateTimePattern(nanoColumn)).toBe(nanoColumn);
  });

  it("returns non temporal descriptor unchanged", () => {
    const column = { name: "price", serverDataType: "double" } as const;
    expect(withDateTimePattern(column, { time: "hh:mm:ss" })).toBe(column);
  });

  it("applies a time only pattern as a 'time' type, preserving other formatting", () => {
    const column = withDateTimePattern(nanoColumn, { time: "hh:mm:ss.ms" });
    expect(column).toEqual({
      name: "execTime",
      serverDataType: "epochtimestampnano",
      type: {
        name: "time",
        formatting: {
          pattern: { time: "hh:mm:ss.ms" },
          timeZone: "America/New_York",
        },
      },
    });
    expect(getTemporalInfo(column)).toEqual({
      kind: "time",
      encoding: "epochNanos",
      precision: "ns",
      timeZone: "America/New_York",
    });
    // original is not mutated
    expect(nanoColumn.type.name).toBe("date/time");
  });

  it("derives type name from pattern", () => {
    const column = { name: "ts", serverDataType: "epochtimestamp" } as const;
    expect(withDateTimePattern(column, { date: "dd.mm.yyyy" }).type).toEqual({
      name: "date",
      formatting: { pattern: { date: "dd.mm.yyyy" } },
    });
    expect(
      withDateTimePattern(column, { date: "dd.mm.yyyy", time: "hh:mm:ss" })
        .type,
    ).toEqual({
      name: "date/time",
      formatting: { pattern: { date: "dd.mm.yyyy", time: "hh:mm:ss" } },
    });
  });
});
