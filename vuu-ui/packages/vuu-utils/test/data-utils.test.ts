import { describe, expect, it } from "vitest";
import {
  asInteger,
  numericTypeOfStringValue,
  stringIsValidDecimal,
  stringIsValidInt,
  stringIsValidLong,
  stringIsValidNumber,
} from "../src/data-utils";

describe("stringIsValidInt", () => {
  it("accepts positive and negative integers", () => {
    expect(stringIsValidInt("0")).toBe(true);
    expect(stringIsValidInt("123")).toBe(true);
    expect(stringIsValidInt("-123")).toBe(true);
  });

  it("rejects decimals and trailing-dot strings", () => {
    expect(stringIsValidInt("1.5")).toBe(false);
    expect(stringIsValidInt("1.")).toBe(false);
    expect(stringIsValidInt(".5")).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(stringIsValidInt("abc")).toBe(false);
    expect(stringIsValidInt("123a")).toBe(false);
    expect(stringIsValidInt("")).toBe(false);
  });
});

describe("stringIsValidLong", () => {
  it("accepts positive and negative integers", () => {
    expect(stringIsValidLong("0")).toBe(true);
    expect(stringIsValidLong("123")).toBe(true);
    expect(stringIsValidLong("-123")).toBe(true);
    expect(stringIsValidLong("1000000000000001234")).toBe(true);
    expect(stringIsValidLong("-1000000000000001234")).toBe(true);
  });

  it("rejects decimals and trailing-dot strings", () => {
    expect(stringIsValidLong("1.5")).toBe(false);
    expect(stringIsValidLong("1.")).toBe(false);
    expect(stringIsValidLong(".5")).toBe(false);
  });

  it("rejects non-numeric strings", () => {
    expect(stringIsValidLong("abc")).toBe(false);
    expect(stringIsValidLong("123a")).toBe(false);
    expect(stringIsValidLong("")).toBe(false);
  });
});

describe("stringIsValidDecimal", () => {
  it("accepts integers as valid decimals", () => {
    expect(stringIsValidDecimal("0")).toBe(true);
    expect(stringIsValidDecimal("123")).toBe(true);
    expect(stringIsValidDecimal("-123")).toBe(true);
  });

  it("accepts standard decimal strings", () => {
    expect(stringIsValidDecimal("1.5")).toBe(true);
    expect(stringIsValidDecimal("-1.5")).toBe(true);
    expect(stringIsValidDecimal("1.0")).toBe(true);
    expect(stringIsValidDecimal(".5")).toBe(true);
  });

  it("accepts trailing-dot decimals (e.g. 123.)", () => {
    expect(stringIsValidDecimal("1.")).toBe(true);
    expect(stringIsValidDecimal("123.")).toBe(true);
    expect(stringIsValidDecimal("-1.")).toBe(true);
    expect(stringIsValidDecimal("-123.")).toBe(true);
  });

  it("rejects non-numeric and malformed strings", () => {
    expect(stringIsValidDecimal("abc")).toBe(false);
    expect(stringIsValidDecimal("123a")).toBe(false);
    expect(stringIsValidDecimal("1.2.3")).toBe(false);
  });
});

describe("stringIsValidNumber", () => {
  it("accepts integers", () => {
    expect(stringIsValidNumber("123")).toBe(true);
    expect(stringIsValidNumber("-123")).toBe(true);
  });

  it("accepts decimals including trailing-dot form", () => {
    expect(stringIsValidNumber("1.5")).toBe(true);
    expect(stringIsValidNumber("1.")).toBe(true);
    expect(stringIsValidNumber("123.")).toBe(true);
  });

  it("rejects non-numeric strings", () => {
    expect(stringIsValidNumber("abc")).toBe(false);
    expect(stringIsValidNumber("1.2.3")).toBe(false);
  });
});

describe("numericTypeOfStringValue", () => {
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
  });

  it("treats trailing-dot numbers as double", () => {
    expect(numericTypeOfStringValue("1.")).toEqual("double");
    expect(numericTypeOfStringValue("123.")).toEqual("double");
    expect(numericTypeOfStringValue("-1.")).toEqual("double");
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
