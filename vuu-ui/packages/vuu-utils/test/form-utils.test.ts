import { describe, expect, it } from "vitest";
import { getTypedValue } from "../src/form-utils";

describe("getTypedValue", () => {
  it("handles int values", () => {
    expect(getTypedValue("1234", "int")).toEqual(1234);
    expect(getTypedValue("0", "int")).toEqual(0);
    expect(getTypedValue("0", "long")).toEqual(0);
    expect(getTypedValue("123456789", "long")).toEqual(123456789);
  });
  it("handles int number values", () => {
    expect(getTypedValue("0", "number")).toEqual(0);
  });
  it("handles decimal values", () => {
    expect(getTypedValue("0.123", "double")).toEqual(0.123);
  });
  it("handles decimal number values", () => {
    expect(getTypedValue("0.123", "number")).toEqual(0.123);
  });
  it("handles string values", () => {
    expect(getTypedValue("A String", "string")).toEqual("A String");
    expect(getTypedValue("12345", "string")).toEqual("12345");
  });
  it("handles boolean values", () => {
    expect(getTypedValue("true", "boolean")).toEqual(true);
    expect(getTypedValue("false", "boolean")).toEqual(false);
  });
  it("handles time values", () => {
    let typedValue = getTypedValue("00:00:00", "time") as number;
    expect(new Date(typedValue).toTimeString().slice(0, 8)).toEqual("00:00:00");
    typedValue = getTypedValue("23:59:59", "time") as number;
    expect(new Date(typedValue).toTimeString().slice(0, 8)).toEqual("23:59:59");
  });
  it("returns undefined for invalid time values", () => {
    let typedValue = getTypedValue("00:00:65", "time") as number;
    expect(typedValue).toBeUndefined();
    typedValue = getTypedValue("25:59:59", "time") as number;
    expect(typedValue).toBeUndefined();
  });
  it("throwsfor invalid time values, if required", () => {
    expect(() => getTypedValue("00:00:65", "time", true)).toThrow();
  });
});
