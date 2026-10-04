import { describe, expect, it } from "vitest";
import {
  decrementTimeUnitValue,
  incrementTimeUnitValue,
  isValidTimeString,
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
});
