import { describe, expect, it } from "vitest";
import { numericTypeOfStringValue } from "../src/data-utils";

describe("numericTypeOfStringDecimal", () => {
  it("correctly identifies int and decimal types", () => {
    expect(numericTypeOfStringValue("123")).toEqual("int");
    expect(numericTypeOfStringValue("-123")).toEqual("int");
    expect(numericTypeOfStringValue("1.5")).toEqual("double");
    expect(numericTypeOfStringValue("-1.5")).toEqual("double");
    expect(numericTypeOfStringValue("1.0")).toEqual("double");
    expect(numericTypeOfStringValue("-1.0")).toEqual("double");
    expect(numericTypeOfStringValue(".5")).toEqual("double");
    expect(numericTypeOfStringValue("123a")).toEqual("NaN");
    expect(numericTypeOfStringValue("1.2.3")).toEqual("NaN");
    expect(numericTypeOfStringValue("1.")).toEqual("NaN");
  });
});
