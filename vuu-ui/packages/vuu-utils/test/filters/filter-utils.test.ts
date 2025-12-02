import { describe, expect, it, vi } from "vitest";
import {
  filtersAreEqual,
  getColumnValueFromFilter,
} from "../../src/filters/filter-utils";

vi.mock("@vuu-ui/vuu-filter-parser", () => ({
  ...vi.importActual("@vuu-ui/vuu-filter-parser"),
  parseFilter: (filterString: string) => {
    if (filterString === 'ric = "AAOQ.OQ" and price > 100') {
      return {
        op: "and",
        filters: [
          { column: "ric", op: "=", value: "AAOQ.OQ" },
          { column: "price", op: ">", value: 100 },
        ],
      };
    }
    if (filterString === "price > 100") {
      return { column: "price", op: ">", value: 100 };
    }
    if (
      filterString === 'lastUpdate > "09:00:00" and lastUpdate < "10:00:00"'
    ) {
      return {
        op: "and",
        filters: [
          { column: "lastUpdate", op: ">", value: "09:00:00" },
          { column: "lastUpdate", op: "<", value: "10:00:00" },
        ],
      };
    }
    return {};
  },
}));

vi.mock("../../src/date/date-utils", async () => {
  const actual = await vi.importActual<
    typeof import("../../src/date/date-utils")
  >("../../src/date/date-utils");
  return {
    ...actual,
    Time: (timeString: string) => ({
      asDate: vi.fn(() => {
        const d = new Date(`2025-05-15T${timeString}Z`);
        return d;
      }),
      toString: () => timeString,
    }),
  };
});

describe("getColumnValueFromFilter", () => {
  it("returns value from a simple filter clause", () => {
    expect(
      getColumnValueFromFilter(
        { name: "currency", serverDataType: "string" },
        "=",
        {
          column: "currency",
          op: "=",
          value: "GBP",
        },
      ),
    ).toEqual("GBP");
  });
  it("returns default value for a simple filter clause, when not found", () => {
    expect(
      getColumnValueFromFilter(
        { name: "currency", serverDataType: "string" },
        "=",
        {
          column: "exchange",
          op: "=",
          value: "XLON/SETS",
        },
      ),
    ).toEqual("");
  });
  it("returns value from a simple filter clause within a filter", () => {
    expect(
      getColumnValueFromFilter(
        { name: "currency", serverDataType: "string" },
        "=",
        {
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "exchange",
              op: "=",
              value: "XLON/SETS",
            },
          ],
        },
      ),
    ).toEqual("GBP");
  });
  it("returns value from a between filter clause", () => {
    expect(
      getColumnValueFromFilter(
        { name: "price", serverDataType: "string" },
        "between",
        {
          op: "and",
          filters: [
            {
              column: "price",
              op: ">",
              value: "100",
            },
            {
              column: "price",
              op: "<",
              value: "200",
            },
          ],
        },
      ),
    ).toEqual(["100", "200"]);
  });
  it("returns value from a nested between filter clause", () => {
    expect(
      getColumnValueFromFilter(
        { name: "price", serverDataType: "string" },
        "between",
        {
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              op: "and",
              filters: [
                {
                  column: "price",
                  op: ">",
                  value: "100",
                },
                {
                  column: "price",
                  op: "<",
                  value: "200",
                },
              ],
            },
          ],
        },
      ),
    ).toEqual(["100", "200"]);
  });
  it("returns default value from a  between filter clause when not found", () => {
    expect(
      getColumnValueFromFilter(
        { name: "price", serverDataType: "string" },
        "between",
        {
          column: "lotSize",
          op: "=",
          value: "100",
        },
      ),
    ).toEqual(["", ""]);
  });

  it("returns default value from a  Time between filter clause when not found", () => {
    expect(
      getColumnValueFromFilter(
        { name: "vuuCreatedTime", serverDataType: "long", type: "time" },
        "between",
        {
          column: "lotSize",
          op: "=",
          value: "100",
        },
      ),
    ).toEqual(["00:00:00", "23:59:59"]);
  });
  it("returns value from a partial (lower value) between filter clause", () => {
    expect(
      getColumnValueFromFilter(
        { name: "price", serverDataType: "string" },
        "between",
        {
          column: "price",
          op: "=",
          value: "100",
        },
      ),
    ).toEqual(["100", ""]);
  });
  it("returns value from a partial (higher value) between filter clause", () => {
    expect(
      getColumnValueFromFilter(
        { name: "price", serverDataType: "string" },
        "between",
        {
          column: "price",
          op: "<",
          value: "200",
        },
      ),
    ).toEqual(["", "200"]);
  });
});

describe("filtersAreEqual", () => {
  it("works with singleValueFilterClause", () => {
    expect(
      filtersAreEqual(
        { column: "exchange", op: "=", value: "XLON" },
        { column: "exchange", op: "=", value: "XLON" },
      ),
    ).toEqual(true);
    expect(
      filtersAreEqual(
        { column: "exchange", op: "starts", value: "XLO" },
        { column: "exchange", op: "=", value: "XLON" },
      ),
    ).toEqual(false);
    expect(
      filtersAreEqual(
        { column: "currency", op: "=", value: "GBP" },
        { column: "exchange", op: "=", value: "XLON" },
      ),
    ).toEqual(false);
  });
  it("works with betweenClause", () => {
    expect(
      filtersAreEqual(
        {
          op: "and",
          filters: [
            { column: "price", op: ">", value: 100 },
            { column: "price", op: "<", value: 200 },
          ],
        },
        {
          op: "and",
          filters: [
            { column: "price", op: ">", value: 100 },
            { column: "price", op: "<", value: 200 },
          ],
        },
      ),
    ).toEqual(true);
    expect(
      filtersAreEqual(
        {
          op: "and",
          filters: [
            { column: "price", op: ">", value: 100 },
            { column: "price", op: "<", value: 250 },
          ],
        },
        {
          op: "and",
          filters: [
            { column: "price", op: ">", value: 100 },
            { column: "price", op: "<", value: 200 },
          ],
        },
      ),
    ).toEqual(false);
  });

  it("works with Multi Clause and  Filter", () => {
    expect(
      filtersAreEqual(
        {
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            { column: "price", op: "<", value: 200 },
          ],
        },
        {
          op: "and",
          filters: [
            { column: "price", op: "<", value: 200 },
            { column: "currency", op: "=", value: "GBP" },
          ],
        },
      ),
    ).toEqual(true);
    expect(
      filtersAreEqual(
        {
          op: "and",
          filters: [
            { column: "exchange", op: "=", value: "XLON" },
            { column: "price", op: "<", value: 200 },
          ],
        },
        {
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            { column: "price", op: "<", value: 200 },
          ],
        },
      ),
    ).toEqual(false);
  });

  it("works with nested between filter", () => {
    expect(
      filtersAreEqual(
        {
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            {
              op: "and",
              filters: [
                { column: "price", op: ">", value: 100 },
                { column: "price", op: "<", value: 250 },
              ],
            },

            { column: "price", op: "<", value: 200 },
          ],
        },
        {
          op: "and",
          filters: [
            { column: "price", op: "<", value: 200 },
            { column: "currency", op: "=", value: "GBP" },
            {
              op: "and",
              filters: [
                { column: "price", op: ">", value: 100 },
                { column: "price", op: "<", value: 250 },
              ],
            },
          ],
        },
      ),
    ).toEqual(true);
    expect(
      filtersAreEqual(
        {
          op: "and",
          filters: [
            { column: "exchange", op: "=", value: "XLON" },
            { column: "price", op: "<", value: 200 },
          ],
        },
        {
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            { column: "price", op: "<", value: 200 },
          ],
        },
      ),
    ).toEqual(false);
  });

  it("returns false if filters are different type", () => {
    expect(
      filtersAreEqual(
        { column: "currency", op: "=", value: "GBP" },
        {
          op: "and",
          filters: [
            { column: "currency", op: "=", value: "GBP" },
            { column: "exchange", op: "=", value: "XLON" },
          ],
        },
      ),
    ).toEqual(false);
  });
});
