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

describe("parseFilter, nested boolean expressions", () => {
  const ric = { column: "ric", op: "=", value: "AAB.L" };
  const buy = { column: "buy", op: ">", value: 0 };
  const sell = { column: "sell", op: ">", value: 0 };

  it("nests a parenthesised 'or' within an 'and'", () => {
    expect(parseFilter('ric = "AAB.L" and (buy > 0 or sell > 0)')).toEqual({
      op: "and",
      filters: [ric, { op: "or", filters: [buy, sell] }],
    });
  });
  it("nests a parenthesised 'and' within an 'or'", () => {
    expect(parseFilter('(ric = "AAB.L" and buy > 0) or sell > 0')).toEqual({
      op: "or",
      filters: [{ op: "and", filters: [ric, buy] }, sell],
    });
  });
  it("nests a leading parenthesised 'or' within an 'and'", () => {
    expect(parseFilter('(buy > 0 or sell > 0) and ric = "AAB.L"')).toEqual({
      op: "and",
      filters: [{ op: "or", filters: [buy, sell] }, ric],
    });
  });
  it("gives 'and' precedence over 'or'", () => {
    expect(parseFilter('buy > 0 or sell > 0 and ric = "AAB.L"')).toEqual({
      op: "or",
      filters: [buy, { op: "and", filters: [sell, ric] }],
    });
    expect(parseFilter('ric = "AAB.L" and buy > 0 or sell > 0')).toEqual({
      op: "or",
      filters: [{ op: "and", filters: [ric, buy] }, sell],
    });
  });
  it("merges parenthesised clauses with the same combinator", () => {
    expect(parseFilter('ric = "AAB.L" and (buy > 0 and sell > 0)')).toEqual({
      op: "and",
      filters: [ric, buy, sell],
    });
  });
  it("nests two parenthesised groups", () => {
    expect(
      parseFilter(
        '(ric = "AAB.L" or ric in ["BBB.L", "CCC.L"]) and (buy > 0 or sell > 0)',
      ),
    ).toEqual({
      op: "and",
      filters: [
        {
          op: "or",
          filters: [
            ric,
            { column: "ric", op: "in", values: ["BBB.L", "CCC.L"] },
          ],
        },
        { op: "or", filters: [buy, sell] },
      ],
    });
  });
  it("keeps the filter name on a nested expression", () => {
    expect(
      parseFilter('ric = "AAB.L" and (buy > 0 or sell > 0) as Active'),
    ).toEqual({
      op: "and",
      filters: [ric, { op: "or", filters: [buy, sell] }],
      name: "Active",
    });
  });
});
