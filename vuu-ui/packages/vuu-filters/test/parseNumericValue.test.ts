import { describe, expect, it } from "vitest";
import { parseNumericValue } from "../src/filter-bar/filter-clause/value-editors/numeric-value-utils";

describe("parseNumericValue", () => {
  it("parses integers and decimals", () => {
    expect(parseNumericValue("1000", false)).toEqual(1000);
    expect(parseNumericValue(" 10.5 ", false)).toEqual(10.5);
    expect(parseNumericValue("-3", true)).toEqual(-3);
  });
  it("rejects empty text", () => {
    expect(parseNumericValue("", false)).toBeUndefined();
    expect(parseNumericValue("   ", false)).toBeUndefined();
  });
  it("rejects text that is not wholly numeric", () => {
    expect(parseNumericValue("12abc", false)).toBeUndefined();
    expect(parseNumericValue("abc", false)).toBeUndefined();
    expect(parseNumericValue("Infinity", false)).toBeUndefined();
  });
  it("rejects decimals when an integer is required", () => {
    expect(parseNumericValue("10.5", true)).toBeUndefined();
    expect(parseNumericValue("10.0", true)).toEqual(10);
  });
});
