import { describe, expect, it } from "vitest";
import { filterAsQuery } from "../../src/filters";
import type { Filter, NumericFilterClauseOp } from "@vuu-ui/vuu-filter-types";
import { dateFilterAsQuery } from "../../src/filters/filterAsQuery";

describe("filterAsQuery", () => {
  it("stringifies simple filter clauses, string values", () => {
    expect(
      filterAsQuery({
        column: "currency",
        op: "=",
        value: "EUR",
      }),
    ).toEqual('currency = "EUR"');
  });
  it("stringifies multi value filter clauses, string values", () => {
    expect(
      filterAsQuery({
        column: "currency",
        op: "in",
        values: ["EUR", "GBP"],
      }),
    ).toEqual('currency in ["EUR","GBP"]');
  });
  it("stringifies simple filter clauses, numeric values", () => {
    expect(
      filterAsQuery({
        column: "price",
        op: ">",
        value: 1000,
      }),
    ).toEqual("price > 1000");
  });
  it("stringifies multi value filter clauses, numeric values", () => {
    expect(
      filterAsQuery({
        column: "price",
        op: "in",
        values: [1000, 2000, 3000],
      }),
    ).toEqual("price in [1000,2000,3000]");
  });
  it("stringifies simple filter clauses, boolean values", () => {
    expect(
      filterAsQuery({
        column: "isCancelled",
        op: "=",
        value: true,
      }),
    ).toEqual("isCancelled = true");
  });

  it("stringifies non-nested multi clause filters", () => {
    expect(
      filterAsQuery({
        op: "and",
        filters: [
          { op: "=", column: "currency", value: "EUR" },
          { op: ">=", column: "price", value: 200.5 },
          { op: "!=", column: "cancelled", value: true },
        ],
      }),
    ).toEqual('currency = "EUR" and price >= 200.5 and cancelled != true');
    expect(
      filterAsQuery({
        op: "or",
        filters: [
          { op: "=", column: "currency", value: "EUR" },
          { op: ">=", column: "price", value: 200.5 },
          { op: "!=", column: "cancelled", value: true },
        ],
      }),
    ).toEqual('currency = "EUR" or price >= 200.5 or cancelled != true');
  });

  it("preserves order of nested multi clause filters using parentheses", () => {
    const nestedMultiClauseFilter: Filter = {
      op: "and",
      filters: [
        {
          op: "or",
          filters: [
            { column: "currency", op: "=", value: "CAD" },
            {
              op: "and",
              filters: [
                { op: "!=", column: "cancelled", value: true },
                { op: "=", column: "isSupported", value: true },
              ],
            },
          ],
        },
        { op: ">=", column: "price", value: 200.5 },
      ],
    };
    expect(filterAsQuery(nestedMultiClauseFilter)).toEqual(
      '(currency = "CAD" or (cancelled != true and isSupported = true)) and price >= 200.5',
    );
  });

  describe("date/time filter", () => {
    const date = new Date("2021-12-15");
    date.setHours(0, 0, 0, 0);
    const datePlus1Day = new Date(date);
    datePlus1Day.setDate(date.getDate() + 1);

    it("handles simple `=` filter", () => {
      const result = filterAsQuery(
        {
          op: "=",
          column: "lastUpdated",
          value: date.getTime(),
        },
        {
          columnsByName: {
            lastUpdated: { name: "lastUpdated", type: "date/time" },
          },
        },
      );

      expect(result).toEqual(
        `lastUpdated >= ${date.getTime()} and lastUpdated < ${datePlus1Day.getTime()}`,
      );
    });

    it("handles non-nested multi clause filter", () => {
      const result = filterAsQuery(
        {
          op: "and",
          filters: [
            {
              op: "!=",
              column: "lastUpdated",
              value: date.getTime(),
            },
            { op: "!=", column: "currency", value: "EUR" },
          ],
        },
        {
          columnsByName: {
            lastUpdated: { name: "lastUpdated", type: "date/time" },
          },
        },
      );

      expect(result).toEqual(
        `(lastUpdated < ${date.getTime()} or lastUpdated >= ${datePlus1Day.getTime()}) and currency != "EUR"`,
      );
    });
  });

  describe("numeric string values in string columns vs numeric columns", () => {
    it("preserves quotes for numeric string values when column type is string", () => {
      const result = filterAsQuery(
        {
          column: "ticker",
          op: "=",
          value: "1234",
        },
        {
          columnsByName: {
            ticker: { name: "ticker", serverDataType: "string" },
          },
        },
      );
      expect(result).toEqual('ticker = "1234"');
    });

    it("omits quotes for numeric string values when column type is numeric schema", () => {
      const result = filterAsQuery(
        {
          column: "id",
          op: "=",
          value: "1000000000000001234",
        },
        {
          columnsByName: {
            id: { name: "id", serverDataType: "long" },
          },
        },
      );
      expect(result).toEqual("id = 1000000000000001234");
    });

    it("falls back safely to regex boundary classification if columnsByName metadata is absent", () => {
      const result = filterAsQuery({
        column: "id",
        op: "=",
        value: "1000000000000001234",
      });
      expect(result).toEqual("id = 1000000000000001234");
    });

    it("preserves quotes if string value is not numeric and no columnsByName metadata is present", () => {
      const result = filterAsQuery({
        column: "ticker",
        op: "=",
        value: "AAPL",
      });
      expect(result).toEqual('ticker = "AAPL"');
    });
  });
});

describe("dateFilterAsQuery", () => {
  it.each<NumericFilterClauseOp>([
    "<",
    ">",
    "<=",
    ">=",
  ])("stringifies date filter with op `%s`", (op) => {
    const filter = { op, value: 1, column: "lastUpdated" } as const;
    const expected = [filter.column, filter.op, filter.value].join(" ");
    expect(dateFilterAsQuery(filter)).toEqual(expected);
  });

  const testDate = new Date("2021-12-15");
  testDate.setHours(0, 0, 0, 0);
  const testDatePlus1Day = new Date(testDate);
  testDatePlus1Day.setDate(testDate.getDate() + 1);

  it("stringifies date filter with op `!=` (special case)", () => {
    const f = {
      op: "!=",
      column: "lastUpdated",
      value: testDate.getTime(),
    } as const;

    expect(dateFilterAsQuery(f)).toEqual(
      `(lastUpdated < ${testDate.getTime()} or lastUpdated >= ${testDatePlus1Day.getTime()})`,
    );
  });

  it("stringifies date filter with op `=` (special case)", () => {
    const f = {
      op: "=",
      column: "lastUpdated",
      value: testDate.getTime(),
    } as const;

    expect(dateFilterAsQuery(f)).toEqual(
      `(lastUpdated >= ${testDate.getTime()} and lastUpdated < ${testDatePlus1Day.getTime()})`,
    );
  });
});
