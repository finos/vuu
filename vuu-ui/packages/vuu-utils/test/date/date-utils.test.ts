import { describe, expect, it } from "vitest";
import {
  decrementTimeUnitValue,
  incrementTimeUnitValue,
  isValidTimeString,
  isValidTimeStringMillis,
  normaliseTimeString,
  Time,
  updateTimeString,
} from "../../src/date/date-utils";

describe("date-utils", () => {
  describe("udateTimeSting", () => {
    it("correctly updates hours", () => {
      expect(updateTimeString("00:00:00", "hours", "11")).toEqual("11:00:00");
    });
    it("correctly updates minutes", () => {
      expect(updateTimeString("00:00:00", "minutes", "30")).toEqual("00:30:00");
    });
    it("correctly updates seconds", () => {
      expect(updateTimeString("00:00:00", "seconds", "59")).toEqual("00:00:59");
    });
  });
  describe("isValidTimeString", () => {
    it("accepts valid time strings", () => {
      for (const value of ["00:00:00", "09:30:15", "23:59:59"]) {
        expect(isValidTimeString(value)).toBe(true);
      }
    });
    it("rejects out of range values", () => {
      for (const value of ["24:00:00", "12:60:00", "12:00:60"]) {
        expect(isValidTimeString(value)).toBe(false);
      }
    });
    it("rejects strings that merely contain a valid time", () => {
      for (const value of [
        "123:45:00",
        "x12:34:56",
        "12:34:567",
        " 12:34:56",
      ]) {
        expect(isValidTimeString(value)).toBe(false);
      }
    });
    it("rejects non strings", () => {
      expect(isValidTimeString(undefined)).toBe(false);
      expect(isValidTimeString(123456)).toBe(false);
    });
  });
  describe("incrementTimeUnitValue/decrementTimeUnitValue", () => {
    it("wraps at unit boundaries", () => {
      expect(incrementTimeUnitValue("hours", "23")).toEqual("00");
      expect(incrementTimeUnitValue("minutes", "59")).toEqual("00");
      expect(decrementTimeUnitValue("hours", "00")).toEqual("23");
      expect(decrementTimeUnitValue("seconds", "00")).toEqual("59");
      expect(incrementTimeUnitValue("seconds", "09")).toEqual("10");
    });
  });
  describe("milliseconds", () => {
    it("updateTimeString updates units of a TimeStringMillis", () => {
      expect(updateTimeString("00:00:00.000", "hours", "11")).toEqual(
        "11:00:00.000",
      );
      expect(updateTimeString("00:00:00.000", "seconds", "59")).toEqual(
        "00:00:59.000",
      );
      expect(updateTimeString("00:00:00.000", "milliseconds", "123")).toEqual(
        "00:00:00.123",
      );
    });
    it("isValidTimeStringMillis accepts only hh:mm:ss.SSS", () => {
      expect(isValidTimeStringMillis("23:59:59.999")).toBe(true);
      expect(isValidTimeStringMillis("00:00:00.000")).toBe(true);
      for (const value of [
        "23:59:59",
        "23:59:59.99",
        "23:59:59.9999",
        "24:00:00.000",
        "x23:59:59.999",
      ]) {
        expect(isValidTimeStringMillis(value)).toBe(false);
      }
    });
    it("isValidTimeString rejects values with milliseconds", () => {
      expect(isValidTimeString("23:59:59.999")).toBe(false);
    });
    it("increments and decrements milliseconds, with wrap", () => {
      expect(incrementTimeUnitValue("milliseconds", "000")).toEqual("001");
      expect(incrementTimeUnitValue("milliseconds", "099")).toEqual("100");
      expect(incrementTimeUnitValue("milliseconds", "999")).toEqual("000");
      expect(decrementTimeUnitValue("milliseconds", "000")).toEqual("999");
      expect(decrementTimeUnitValue("milliseconds", "100")).toEqual("099");
    });
    it("normaliseTimeString converts between precisions", () => {
      expect(normaliseTimeString("12:34:56", true)).toEqual("12:34:56.000");
      expect(normaliseTimeString("12:34:56.789", true)).toEqual("12:34:56.789");
      expect(normaliseTimeString("12:34:56.789", false)).toEqual("12:34:56");
      expect(normaliseTimeString("12:34:56")).toEqual("12:34:56");
      expect(normaliseTimeString("12:34", true)).toBeUndefined();
      expect(normaliseTimeString(undefined, true)).toBeUndefined();
    });
    it("Time parses milliseconds", () => {
      const time = Time("12:34:56.789");
      expect(time.milliseconds).toEqual(789);
      expect(time.toString()).toEqual("12:34:56.789");
      expect(time.asDate(new Date(2024, 0, 1)).getMilliseconds()).toEqual(789);
    });
    it("Time without milliseconds is unchanged", () => {
      const time = Time("12:34:56");
      expect(time.milliseconds).toEqual(0);
      expect(time.toString()).toEqual("12:34:56");
      expect(Time.toString(1, 2, 3)).toEqual("01:02:03");
      expect(Time.toString(1, 2, 3, 4)).toEqual("01:02:03.004");
    });
  });
});
