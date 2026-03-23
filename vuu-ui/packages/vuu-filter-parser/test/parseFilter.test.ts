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
