import { describe, expect, it } from "vitest";
import { asInteger, numericTypeOfStringValue } from "../src/data-utils";

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

describe("asInteger", () => {
  it("returns stringified integer values as int numbers", () => {
    expect(asInteger("1")).toEqual(1);
  });
  it("returns stringified decinal values as int numbers", () => {
    expect(asInteger("1.234")).toEqual(1);
    expect(asInteger("-1.234")).toEqual(-1);
  });
  it("returns integer numbers unchanged", () => {
    expect(asInteger(-1)).toEqual(-1);
    expect(asInteger(1)).toEqual(1);
  });
  it("returns decimal numbers shorn of decimals", () => {
    expect(asInteger(1.456)).toEqual(1);
    expect(asInteger(-10.456)).toEqual(-10);
  });
});
