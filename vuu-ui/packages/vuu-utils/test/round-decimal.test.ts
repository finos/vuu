import { describe, expect, it } from "vitest";

import {
  exceedsMaxSafeInteger,
  roundDecimal,
  roundScaledDecimal,
} from "../src";

// MAX_SAFE_INTEGER = "9007199254740991";

describe("round-decimal", () => {
  describe("exceedsMaxSafeInteger", () => {
    it("evcaluates correctly agains max safe integer", () => {
      expect(exceedsMaxSafeInteger("100")).toEqual(false);
      expect(exceedsMaxSafeInteger("99999999")).toEqual(false);
      expect(exceedsMaxSafeInteger("9007199254740991")).toEqual(false);
      expect(exceedsMaxSafeInteger("9007199254740992")).toEqual(true);
      expect(exceedsMaxSafeInteger("10000000000000000")).toEqual(true);
    });
  });

  describe("roundDecimal", () => {
    it("carries into the integral part when decimals round up", () => {
      expect(roundDecimal(99.996, "right", 2)).toEqual("100.00");
      expect(roundDecimal(1.996, "right", 2)).toEqual("2.00");
      expect(roundDecimal(-1.996, "right", 2)).toEqual("-2.00");
      expect(roundDecimal(0.999, "right", 2)).toEqual("1.00");
      expect(roundDecimal(-0.999, "right", 2)).toEqual("-1.00");
      expect(roundDecimal(999.9999, "right", 2)).toEqual("1,000.00");
      expect(roundDecimal(1.6, "right", 0)).toEqual("2");
    });
    it("does not carry when truncating", () => {
      expect(
        roundDecimal(1.996, "right", 2, false, false, true, "truncate"),
      ).toEqual("1.99");
    });
  });

  describe("roundScaledDecimal", () => {
    it("carries into the integral part when decimals round up", () => {
      expect(roundScaledDecimal("99.996", "right", 2)).toEqual("100.00");
      expect(roundScaledDecimal("-1.996", "right", 2)).toEqual("-2.00");
      expect(roundScaledDecimal("-0.999", "right", 2)).toEqual("-1.00");
      expect(roundScaledDecimal(".999", "right", 2)).toEqual("1.00");
      expect(
        roundScaledDecimal("99.996", "right", 2, false, false, false),
      ).toEqual("100.00");
      expect(roundScaledDecimal("9999999999999999.999", "right", 2)).toEqual(
        "10,000,000,000,000,000.00",
      );
    });
  });
});
