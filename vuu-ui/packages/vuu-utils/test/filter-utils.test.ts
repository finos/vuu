import { describe, expect, it } from "vitest";
import { filterAsQuery } from "../src/filter-utils";

describe("filter-utils", () => {
  describe("filterAsQuery", () => {
    it("stringifies simple filter clauses, string values", () => {
      expect(
        filterAsQuery({
          column: "currency",
          op: "=",
          value: "EUR",
        })
      ).toEqual('currency = "EUR"');
    });
    it("stringifies multi value filter clauses, string values", () => {
      expect(
        filterAsQuery({
          column: "currency",
          op: "in",
          values: ["EUR", "GBP"],
        })
      ).toEqual('currency in ["EUR","GBP"]');
    });
    it("stringifies simple filter clauses, numeric values", () => {
      expect(
        filterAsQuery({
          column: "price",
          op: ">",
          value: 1000,
        })
      ).toEqual("price > 1000");
    });
    it("stringifies multi value filter clauses, numeric values", () => {
      expect(
        filterAsQuery({
          column: "price",
          op: "in",
          values: [1000, 2000, 3000],
        })
      ).toEqual("price in [1000,2000,3000]");
    });
    it("stringifies simple filter clauses, boolean values", () => {
      expect(
        filterAsQuery({
          column: "isCancelled",
          op: "=",
          value: true,
        })
      ).toEqual("isCancelled = true");
    });

    it("stringifies multi clause filters", () => {
      expect(
        filterAsQuery({
          op: "and",
          filters: [
            { op: "=", column: "currency", value: "EUR" },
            { op: ">=", column: "price", value: 200.5 },
            { op: "!=", column: "cancelled", value: true },
          ],
        })
      ).toEqual('currency = "EUR" and price >= 200.5 and cancelled != true');
      expect(
        filterAsQuery({
          op: "or",
          filters: [
            { op: "=", column: "currency", value: "EUR" },
            { op: ">=", column: "price", value: 200.5 },
            { op: "!=", column: "cancelled", value: true },
          ],
        })
      ).toEqual('currency = "EUR" or price >= 200.5 or cancelled != true');
    });
  });
});
