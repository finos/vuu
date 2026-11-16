import { describe, expect, it } from "vitest";
import {
  formatNumericHint,
  formatNumericShorthand,
  parseNumericValue,
} from "../src/filter-bar/filter-clause/value-editors/numeric-value-utils";

describe("parseNumericValue", () => {
  it("parses integers and decimals", () => {
    expect(parseNumericValue("1000", false)).toEqual(1000);
    expect(parseNumericValue(" 10.5 ", false)).toEqual(10.5);
    expect(parseNumericValue("-3", true)).toEqual(-3);
    expect(parseNumericValue(".5", false)).toEqual(0.5);
    expect(parseNumericValue("+7", true)).toEqual(7);
  });
  it("rejects empty text", () => {
    expect(parseNumericValue("", false)).toBeUndefined();
    expect(parseNumericValue("   ", false)).toBeUndefined();
  });
  it("rejects text that is not wholly numeric", () => {
    expect(parseNumericValue("12abc", false)).toBeUndefined();
    expect(parseNumericValue("abc", false)).toBeUndefined();
    expect(parseNumericValue("Infinity", false)).toBeUndefined();
    expect(parseNumericValue("0x10", false)).toBeUndefined();
    expect(parseNumericValue("1 000", false)).toBeUndefined();
    expect(parseNumericValue("-", false)).toBeUndefined();
    expect(parseNumericValue(".", false)).toBeUndefined();
  });
  it("rejects decimals when an integer is required", () => {
    expect(parseNumericValue("10.5", true)).toBeUndefined();
    expect(parseNumericValue("10.0", true)).toEqual(10);
  });
  it("keeps exponent form working", () => {
    expect(parseNumericValue("3e10", true)).toEqual(30_000_000_000);
    expect(parseNumericValue("3E10", false)).toEqual(30_000_000_000);
    expect(parseNumericValue("1.5e-3", false)).toEqual(0.0015);
    expect(parseNumericValue("1.5e-3", true)).toBeUndefined();
    expect(parseNumericValue("1e400", false)).toBeUndefined();
  });

  describe("shorthand suffixes", () => {
    it("accepts k, m, bn, b, tn, t", () => {
      expect(parseNumericValue("5k", true)).toEqual(5_000);
      expect(parseNumericValue("5m", true)).toEqual(5_000_000);
      expect(parseNumericValue("30bn", true)).toEqual(30_000_000_000);
      expect(parseNumericValue("30b", true)).toEqual(30_000_000_000);
      expect(parseNumericValue("2tn", true)).toEqual(2_000_000_000_000);
      expect(parseNumericValue("2t", true)).toEqual(2_000_000_000_000);
    });
    it("is case-insensitive", () => {
      expect(parseNumericValue("5K", true)).toEqual(5_000);
      expect(parseNumericValue("5M", true)).toEqual(5_000_000);
      expect(parseNumericValue("30BN", true)).toEqual(30_000_000_000);
      expect(parseNumericValue("30Bn", true)).toEqual(30_000_000_000);
      expect(parseNumericValue("2TN", true)).toEqual(2_000_000_000_000);
    });
    it("accepts a space before the suffix", () => {
      expect(parseNumericValue("30 bn", true)).toEqual(30_000_000_000);
      expect(parseNumericValue(" 1.5  m ", true)).toEqual(1_500_000);
    });
    it("accepts negatives", () => {
      expect(parseNumericValue("-5m", true)).toEqual(-5_000_000);
      expect(parseNumericValue("-0.5k", true)).toEqual(-500);
    });
    it("scales decimals exactly", () => {
      expect(parseNumericValue("1.15m", true)).toEqual(1_150_000);
      expect(parseNumericValue("1.25m", true)).toEqual(1_250_000);
      expect(parseNumericValue("0.1k", true)).toEqual(100);
      expect(parseNumericValue("2.3bn", true)).toEqual(2_300_000_000);
    });
    it("accepts a shorthand on an integer column only when the result is whole", () => {
      expect(parseNumericValue("1.5k", true)).toEqual(1500);
      expect(parseNumericValue("1.2345k", true)).toBeUndefined();
      expect(parseNumericValue("1.2345k", false)).toEqual(1234.5);
    });
    it("rejects a suffix without a number, or unknown suffixes", () => {
      expect(parseNumericValue("k", false)).toBeUndefined();
      expect(parseNumericValue("bn", false)).toBeUndefined();
      expect(parseNumericValue("5x", false)).toBeUndefined();
      expect(parseNumericValue("5kk", false)).toBeUndefined();
      expect(parseNumericValue("5mn", false)).toBeUndefined();
      expect(parseNumericValue("5 k m", false)).toBeUndefined();
    });
    it("rejects an exponent combined with a suffix", () => {
      expect(parseNumericValue("3e3k", false)).toBeUndefined();
    });
  });

  describe("thousands separators", () => {
    it("accepts correctly grouped digits", () => {
      expect(parseNumericValue("1,500", true)).toEqual(1500);
      expect(parseNumericValue("1,234,567", true)).toEqual(1_234_567);
      expect(parseNumericValue("-1,234.5", false)).toEqual(-1234.5);
      expect(parseNumericValue("1,500k", true)).toEqual(1_500_000);
    });
    it("rejects badly grouped digits", () => {
      expect(parseNumericValue("1,5", false)).toBeUndefined();
      expect(parseNumericValue("12,34", false)).toBeUndefined();
      expect(parseNumericValue("1234,567", false)).toBeUndefined();
      expect(parseNumericValue(",500", false)).toBeUndefined();
      expect(parseNumericValue("1,500.5,0", false)).toBeUndefined();
    });
  });
});

describe("formatNumericShorthand", () => {
  it("uses the shortest exact shorthand", () => {
    expect(formatNumericShorthand(30_000_000_000)).toEqual("30bn");
    expect(formatNumericShorthand(1_250_000)).toEqual("1.25m");
    expect(formatNumericShorthand(1_000)).toEqual("1k");
    expect(formatNumericShorthand(1_500)).toEqual("1.5k");
    expect(formatNumericShorthand(2_000_000_000_000)).toEqual("2tn");
    expect(formatNumericShorthand(1_500_000_000_000_000)).toEqual("1500tn");
  });
  it("keeps the plain number when it is shorter", () => {
    expect(formatNumericShorthand(1234)).toEqual("1234");
    expect(formatNumericShorthand(1_234_567)).toEqual("1234567");
    expect(formatNumericShorthand(999)).toEqual("999");
    expect(formatNumericShorthand(0)).toEqual("0");
    expect(formatNumericShorthand(12.5)).toEqual("12.5");
    expect(formatNumericShorthand(0.001)).toEqual("0.001");
  });
  it("formats negatives", () => {
    expect(formatNumericShorthand(-5_000_000)).toEqual("-5m");
    expect(formatNumericShorthand(-1234)).toEqual("-1234");
  });
  it("leaves numbers String renders with an exponent alone", () => {
    expect(formatNumericShorthand(1e21)).toEqual("1e+21");
    expect(formatNumericShorthand(1e-7)).toEqual("1e-7");
  });
  it("round trips through parseNumericValue", () => {
    for (const value of [
      30_000_000_000, 1_250_000, 1_150_000, 1500, 1234, -5_000_000, 0.25,
      123_456_789_000, 7_000_000_000_001,
    ]) {
      expect(parseNumericValue(formatNumericShorthand(value), false)).toEqual(
        value,
      );
    }
  });
});

describe("formatNumericHint", () => {
  it("shows the value with thousands separators", () => {
    expect(formatNumericHint(30_000_000_000)).toEqual("= 30,000,000,000");
    expect(formatNumericHint(-1234.5)).toEqual("= -1,234.5");
  });
});
