import { describe, expect, it } from "vitest";
import { parseFilter } from "../src/FilterParser";

describe("parseFilter", () => {
  it("parses clauses with a decimal value", () => {
    const filterQuery = "price = 10.345";
    expect(parseFilter(filterQuery)).toEqual({
      column: "price",
      op: "=",
      value: 10.345,
    });
  });
  it("parses clauses with a negative decimal value", () => {
    const filterQuery = "price = -10.345";
    expect(parseFilter(filterQuery)).toEqual({
      column: "price",
      op: "=",
      value: -10.345,
    });
  });
});

describe("parseFilter, large integers", () => {
  it("preserves epoch nano values as strings", () => {
    expect(parseFilter("ts > 1710460800123456789")).toEqual({
      column: "ts",
      op: ">",
      value: "1710460800123456789",
    });
  });
  it("parses safe integers as numbers", () => {
    expect(parseFilter("ts > 1710460800123")).toEqual({
      column: "ts",
      op: ">",
      value: 1710460800123,
    });
  });
});

describe("parseFilter, inclusive range operators", () => {
  it("parses >= and <=", () => {
    expect(parseFilter("(ts >= 100 and ts <= 200)")).toEqual({
      op: "and",
      filters: [
        { column: "ts", op: ">=", value: 100 },
        { column: "ts", op: "<=", value: 200 },
      ],
    });
  });
});
