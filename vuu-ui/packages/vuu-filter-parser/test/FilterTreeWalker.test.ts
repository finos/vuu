import { describe, expect, it } from "vitest";
import { parser } from "../src/generated/filter-parser";
import { walkTree } from "../src/FilterTreeWalker";

describe("Filter treeWalker", () => {
  it("parses an eq clause", () => {
    const str = 'currency = "EUR"';
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      column: "currency",
      op: "=",
      value: "EUR",
    });
  });

  it("parses an in clause", () => {
    const str = 'currency in ["EUR","USD"]';
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      column: "currency",
      op: "in",
      values: ["EUR", "USD"],
    });
  });

  it("parses a numeric value", () => {
    const str = "price > 100.00";
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      column: "price",
      op: ">",
      value: 100.0,
    });
  });

  it("parses a boolean value", () => {
    const str = "cancelled = true";
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      column: "cancelled",
      op: "=",
      value: true,
    });
  });

  it("parses two anded clauses", () => {
    const str = 'price > 100.00 and currency = "EUR"';
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      filters: [
        { column: "price", op: ">", value: 100 },
        { column: "currency", op: "=", value: "EUR" },
      ],
      op: "and",
    });
  });

  it("parses three anded clauses", () => {
    const str = 'price > 100.00 and currency = "EUR" and status = "active"';
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      filters: [
        { column: "price", op: ">", value: 100 },
        { column: "currency", op: "=", value: "EUR" },
        { column: "status", op: "=", value: "active" },
      ],
      op: "and",
    });
  });

  it("parses two ored clauses", () => {
    const str = 'price > 100.00 or currency = "EUR"';
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      filters: [
        { column: "price", op: ">", value: 100 },
        { column: "currency", op: "=", value: "EUR" },
      ],
      op: "or",
    });
  });

  it("parses three ored clauses", () => {
    const str = 'price > 100.00 or currency = "EUR" or status = "active"';
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      filters: [
        { column: "price", op: ">", value: 100 },
        { column: "currency", op: "=", value: "EUR" },
        { column: "status", op: "=", value: "active" },
      ],
      op: "or",
    });
  });
  it("parses a named filter", () => {
    const str = "price > 100.00 as HighPrice";
    const result = parser.parse(str);
    const filter = walkTree(result, str);
    expect(filter).toEqual({
      column: "price",
      name: "HighPrice",
      op: ">",
      value: 100.0,
    });
  });
});
