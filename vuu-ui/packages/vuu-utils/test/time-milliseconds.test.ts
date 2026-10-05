import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { describe, expect, it } from "vitest";
import { isTimeDataValueWithMilliseconds } from "../src/column-utils";
import { asTimeString, asTimeStringMillis, Time } from "../src/date/date-utils";
import { getDefaultTimeRange } from "../src/filters/filter-utils";
import { getTypedValue, isValidRange } from "../src/form-utils";

const timeColumn: ColumnDescriptor = {
  name: "created",
  serverDataType: "long",
  type: "time",
};
const timeColumnMillis: ColumnDescriptor = {
  name: "created",
  serverDataType: "long",
  type: { name: "time", formatting: { pattern: { time: "hh:mm:ss.ms" } } },
};

describe("time values with millisecond precision", () => {
  describe("isTimeDataValueWithMilliseconds", () => {
    it("is true only for time columns with millisecond pattern", () => {
      expect(isTimeDataValueWithMilliseconds(timeColumnMillis)).toBe(true);
      expect(isTimeDataValueWithMilliseconds(timeColumn)).toBe(false);
      expect(
        isTimeDataValueWithMilliseconds({
          name: "created",
          type: { name: "time", formatting: { pattern: { time: "hh:mm:ss" } } },
        }),
      ).toBe(false);
      expect(
        isTimeDataValueWithMilliseconds({ name: "x", serverDataType: "long" }),
      ).toBe(false);
      expect(isTimeDataValueWithMilliseconds(undefined)).toBe(false);
    });
  });

  describe("asTimeString", () => {
    it("truncates millisecond time strings", () => {
      expect(asTimeString("12:34:56.789", false)).toEqual("12:34:56");
    });
  });

  describe("asTimeStringMillis", () => {
    it("accepts both precisions of time string", () => {
      expect(asTimeStringMillis("12:34:56.789", false)).toEqual("12:34:56.789");
      expect(asTimeStringMillis("12:34:56", false)).toEqual("12:34:56.000");
    });
    it("converts timestamps, number or string", () => {
      const ts = +Time("12:34:56.789").asDate();
      expect(asTimeStringMillis(ts, false)).toEqual("12:34:56.789");
      expect(asTimeStringMillis(`${ts}`, false)).toEqual("12:34:56.789");
    });
    it("handles undefined", () => {
      expect(asTimeStringMillis(undefined, true)).toBeUndefined();
      expect(() => asTimeStringMillis(undefined, false)).toThrow();
    });
    it("throws for invalid values", () => {
      expect(() => asTimeStringMillis("12:34", false)).toThrow();
    });
  });

  describe("Time.millisToTimeStringMillis", () => {
    it("pads milliseconds", () => {
      const ts = +Time("01:02:03.004").asDate();
      expect(Time.millisToTimeStringMillis(ts)).toEqual("01:02:03.004");
    });
  });

  describe("getDefaultTimeRange", () => {
    it("returns full day range at appropriate precision", () => {
      expect(getDefaultTimeRange(timeColumn)).toEqual(["00:00:00", "23:59:59"]);
      expect(getDefaultTimeRange(timeColumnMillis)).toEqual([
        "00:00:00.000",
        "23:59:59.999",
      ]);
    });
  });

  describe("isValidRange", () => {
    it("compares millisecond time strings", () => {
      expect(isValidRange(["12:00:00.001", "12:00:00.002"])).toBe(true);
      expect(isValidRange(["12:00:00.002", "12:00:00.001"])).toBe(false);
      expect(isValidRange(["12:00:00.000", "12:00:00.000"])).toBe(false);
    });
    it("compares mixed precision time strings", () => {
      expect(isValidRange(["12:00:00", "12:00:00.001"])).toBe(true);
      expect(isValidRange(["12:00:00.001", "12:00:00"])).toBe(false);
    });
    it("still compares seconds time strings", () => {
      expect(isValidRange(["12:00:00", "12:00:01"])).toBe(true);
      expect(isValidRange(["12:00:01", "12:00:00"])).toBe(false);
    });
  });

  describe("getTypedValue", () => {
    it("accepts millisecond time strings for time type", () => {
      expect(
        getTypedValue("12:00:00.500", "time", false, {
          date: "today",
          type: "TimeString",
        }),
      ).toEqual("12:00:00.500");
      expect(getTypedValue("12:00:00.500", "time")).toEqual(
        +Time("12:00:00.500").asDate(),
      );
    });
  });
});
