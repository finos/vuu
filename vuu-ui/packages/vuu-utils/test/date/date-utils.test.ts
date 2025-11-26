import { describe, expect, it } from "vitest";
import { Time, updateTimeString } from "../../src/date/date-utils";

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
});
