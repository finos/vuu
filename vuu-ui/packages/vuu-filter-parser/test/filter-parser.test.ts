import { describe, expect, it } from "vitest";
import { parser } from "../src/generated/filter-parser";

const strictParser = parser.configure({ strict: true });

const Ok = "ok";
const NotOk = "not ok";

const evaluateFilter = (filter: string) => {
  try {
    strictParser.parse(filter);
    return Ok;
  } catch (err) {
    return NotOk;
  }
};

describe("FilterParser", () => {
  it("rejects invalid filters", () => {
    expect(evaluateFilter("currency EUR")).toEqual(NotOk);
    expect(evaluateFilter('currency "EUR"')).toEqual(NotOk);
    expect(evaluateFilter('currency = "EUR')).toEqual(NotOk);
    expect(evaluateFilter("currency = EUR")).toEqual(NotOk);
    expect(evaluateFilter("price = 1.")).toEqual(NotOk);
    expect(evaluateFilter("price = 1.2.3")).toEqual(NotOk);
  });

  it("parses an equals clause", () => {
    expect(evaluateFilter('currency = "EUR"')).toEqual(Ok);
  });

  it("parses a not equals clause", () => {
    expect(evaluateFilter('currency != "EUR"')).toEqual(Ok);
  });

  it("parses an in clause", () => {
    expect(evaluateFilter('currency in ["EUR","USD"]')).toEqual(Ok);
    expect(evaluateFilter("lotSize in [1,2,30]")).toEqual(Ok);
  });

  it("parses anded clauses", () => {
    expect(
      evaluateFilter('currency in ["EUR","USD"] and exchange = "XLON/LSE-SETS"')
    ).toEqual(Ok);
    expect(
      evaluateFilter(
        'currency in ["EUR","USD"] and exchange = "XLON/LSE-SETS" and price > 1000'
      )
    ).toEqual(Ok);
  });

  it("parses ored clauses", () => {
    expect(
      evaluateFilter('currency in ["EUR","USD"] or exchange = "XLON/LSE-SETS"')
    ).toEqual(Ok);
    expect(
      evaluateFilter(
        'currency in ["EUR","USD"] or exchange = "XLON/LSE-SETS" or price > 1000'
      )
    ).toEqual(Ok);
  });

  it("parses and/ ored clauses", () => {
    expect(
      evaluateFilter(
        'currency in ["EUR","USD"] or exchange = "XLON/LSE-SETS" and price > 1000'
      )
    ).toEqual(Ok);
  });

  it("recognises braces", () => {
    expect(
      evaluateFilter(
        '(currency in ["EUR","USD"] or exchange = "XLON/LSE-SETS") and price > 1000'
      )
    ).toEqual(Ok);
    expect(
      evaluateFilter(
        'currency in ["EUR","USD"] or (exchange = "XLON/LSE-SETS" and price > 1000)'
      )
    ).toEqual(Ok);
  });

  it("recognizes special characters in strings", () => {
    expect(evaluateFilter('exchange = "XLON/LSE-SETS"')).toEqual(Ok);
    expect(evaluateFilter('ric ends ".L"')).toEqual(Ok);
  });

  it("allows spaces in strings", () => {
    expect(evaluateFilter('bbg = "AAA US"')).toEqual(Ok);
  });

  it("recognizes boolean values", () => {
    expect(evaluateFilter("isCancelled = false")).toEqual(Ok);
  });

  it("recognizes int values", () => {
    expect(evaluateFilter("price = 199")).toEqual(Ok);
  });

  it("recognizes decimal int values", () => {
    expect(evaluateFilter("price = 199.05")).toEqual(Ok);
    expect(evaluateFilter("price = .05")).toEqual(Ok);
  });

  it("parses named filters", () => {
    expect(evaluateFilter('currency = "EUR" as euros')).toEqual(Ok);
    expect(
      evaluateFilter('currency = "EUR" and price > 100 as pricey_euros')
    ).toEqual(Ok);
  });
});
