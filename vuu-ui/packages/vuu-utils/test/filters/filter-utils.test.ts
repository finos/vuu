import { describe, expect, it, vi } from "vitest";
import {
  ColumnFilterStore,
  FilterAggregator,
  getColumnValueFromFilter,
} from "../../src/filters/filter-utils";
import { toColumnDescriptor } from "../../src/column-utils";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

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

describe("ColumnFilterStore", () => {
  const lastUpdateDescriptor: ColumnDescriptor = {
    name: "lastUpdate",
    serverDataType: "long",
    type: "time",
  };
  const priceDescriptor: ColumnDescriptor = toColumnDescriptor(
    "price",
    "double",
  );
  const ricDescriptor: ColumnDescriptor = toColumnDescriptor("ric");

  it("adds a filter to the store", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ"' });
  });

  it("removes a filter from the store", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.removeFilter(ricDescriptor);
    expect(store.filter).toEqual({ filter: "" });
  });

  it("resets all filters", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.addFilter(priceDescriptor, ">", 100);
    store.resetFilters();
    expect(store.filter).toEqual({ filter: "" });
  });

  it("handles multiple filters with AND", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.addFilter(priceDescriptor, ">", 100);
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ" and price > 100' });
  });

  it("handles between operator for numeric columns", () => {
    const store = new ColumnFilterStore();
    store.addFilter(priceDescriptor, "between", ["10", "20"]);
    expect(store.filter).toEqual({ filter: "price > 10 and price < 20" });
  });

  it("handles time filter with single value", () => {
    const store = new ColumnFilterStore();
    store.addFilter(lastUpdateDescriptor, "=", "12:34:56");
    expect(store.filter).toEqual({ filter: "lastUpdate = 1747312496000" });
    expect(store.columnValues.get("lastUpdate")).toBe("12:34:56");
  });

  it("handles between operator for time columns", () => {
    const store = new ColumnFilterStore();
    store.addFilter(lastUpdateDescriptor, "between", ["09:00:00", "10:00:00"]);
    expect(store.filter).toEqual({
      filter: "lastUpdate > 1747299600000 and lastUpdate < 1747303200000",
    });
  });

  it("loads filter from query string for text field", () => {
    const store = new ColumnFilterStore({ filter: "" }, [
      ricDescriptor,
      priceDescriptor,
    ]);
    store.filter = { filter: 'ric = "AAOQ.OQ" and price > 100' };
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ" and price > 100' });
  });

  it("loads filter from query string for time range", () => {
    const store = new ColumnFilterStore({ filter: "" }, [lastUpdateDescriptor]);
    store.filter = {
      filter: 'lastUpdate > "09:00:00" and lastUpdate < "10:00:00"',
    };
    expect(store.filter).toEqual({
      filter: "lastUpdate > 1747299600000 and lastUpdate < 1747303200000",
    });
  });

  it("set filter clears previous filters", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.filter = { filter: "price > 100" };
    expect(store.filter).toEqual({ filter: "price > 100" });
  });

  it("emits onChange when filter is added", () => {
    const store = new ColumnFilterStore();
    const onChange = vi.fn();
    store.on("onChange", onChange);
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    expect(onChange).toHaveBeenCalledWith({ filter: 'ric = "AAOQ.OQ"' });
  });

  it("emits onChange when filter is removed", () => {
    const store = new ColumnFilterStore();
    const onChange = vi.fn();
    store.on("onChange", onChange);
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.removeFilter(ricDescriptor);
    expect(onChange).toHaveBeenCalledWith({ filter: "" });
  });

  it("emits onChange when filters are reset", () => {
    const store = new ColumnFilterStore();
    const onChange = vi.fn();
    store.on("onChange", onChange);
    store.resetFilters();
    expect(onChange).toHaveBeenCalledWith({ filter: "" });
  });

  it("returns correct columnValues after adding filters", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.addFilter(priceDescriptor, "between", ["10", "20"]);
    store.addFilter(lastUpdateDescriptor, "between", ["09:00:00", "10:00:00"]);
    const values = store.columnValues;
    expect(values.get("ric")).toBe("AAOQ.OQ");
    expect(values.get("price")).toEqual(["10", "20"]);
    expect(values.get("lastUpdate")).toEqual(["09:00:00", "10:00:00"]);
    expect(Array.from(values.keys())).toEqual(["ric", "price", "lastUpdate"]);
  });

  it("returns empty columnValues after reset", () => {
    const store = new ColumnFilterStore();
    store.addFilter(ricDescriptor, "=", "AAOQ.OQ");
    store.resetFilters();
    expect(store.columnValues.size).toBe(0);
  });
});

describe("FilterAggregator", () => {
  describe("returns correct 'filter'", () => {
    it("WHEN created empty", () => {
      const aggregator = new FilterAggregator();
      expect(aggregator.filter).toBeUndefined();
    });

    it("WHEN created with a single value", () => {
      const aggregator = new FilterAggregator({
        column: "currency",
        op: "=",
        value: "GBP",
      });
      expect(aggregator.filter).toEqual({
        column: "currency",
        op: "=",
        value: "GBP",
      });
    });

    it("WHEN created with a multi-clause filter", () => {
      const aggregator = new FilterAggregator({
        op: "and",
        filters: [
          {
            column: "currency",
            op: "=",
            value: "GBP",
          },
          {
            column: "price",
            op: ">",
            value: 100,
          },
        ],
      });
      expect(aggregator.filter).toEqual({
        op: "and",
        filters: [
          {
            column: "currency",
            op: "=",
            value: "GBP",
          },
          {
            column: "price",
            op: ">",
            value: 100,
          },
        ],
      });
    });
  });

  it("WHEN created with a between filter", () => {
    const aggregator = new FilterAggregator({
      op: "and",
      filters: [
        {
          column: "price",
          op: ">",
          value: 100,
        },
        {
          column: "price",
          op: "<",
          value: 200,
        },
      ],
    });
    expect(aggregator.filter).toEqual({
      op: "and",
      filters: [
        {
          column: "price",
          op: ">",
          value: 100,
        },
        {
          column: "price",
          op: "<",
          value: 200,
        },
      ],
    });
  });
  it("WHEN created with a multi-clause filter, including a between filter", () => {
    const aggregator = new FilterAggregator({
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
        {
          op: "and",
          filters: [
            {
              column: "price",
              op: ">",
              value: 100,
            },
            {
              column: "price",
              op: "<",
              value: 200,
            },
          ],
        },
      ],
    });
    expect(aggregator.filter).toEqual({
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
        {
          op: "and",
          filters: [
            {
              column: "price",
              op: ">",
              value: 100,
            },
            {
              column: "price",
              op: "<",
              value: 200,
            },
          ],
        },
      ],
    });
  });

  describe("GIVEN an empty filter", () => {
    describe("WHEN a simple value is added", () => {
      it("THEN a single filter clause is created", () => {
        const aggregator = new FilterAggregator();
        aggregator.add({ name: "currency", serverDataType: "string" }, "GBP");
        expect(aggregator.filter).toEqual({
          column: "currency",
          op: "=",
          value: "GBP",
        });
      });
    });
    describe("WHEN a value tuple is added", () => {
      describe("AND both tuple values are present", () => {
        it("THEN a between filter is created, with appropriate data types", () => {
          const aggregator = new FilterAggregator();
          aggregator.add({ name: "price", serverDataType: "double" }, [
            "100",
            "200",
          ]);
          expect(aggregator.filter).toEqual({
            op: "and",
            filters: [
              {
                column: "price",
                op: ">",
                value: 100,
              },
              {
                column: "price",
                op: "<",
                value: 200,
              },
            ],
          });
        });
      });
      describe("AND only first range value is present", () => {
        it("THEN an '=' filter is created", () => {
          const aggregator = new FilterAggregator();
          aggregator.add({ name: "price", serverDataType: "double" }, [
            "100",
            "",
          ]);
          expect(aggregator.filter).toEqual({
            column: "price",
            op: "=",
            value: 100,
          });
        });
        describe("AND only second range value is present", () => {
          it("THEN a '<' filter is created", () => {
            const aggregator = new FilterAggregator();
            aggregator.add({ name: "price", serverDataType: "double" }, [
              "",
              "100",
            ]);
            expect(aggregator.filter).toEqual({
              column: "price",
              op: "<",
              value: 100,
            });
          });
        });
      });
    });
  });

  describe("GIVEN an existing filter", () => {
    describe("WHEN a value is added for a new column", () => {
      it("THEN a new filter clause is added", () => {
        const aggregator = new FilterAggregator({
          column: "currency",
          op: "=",
          value: "GBP",
        });

        aggregator.add({ name: "price" }, 100);

        expect(aggregator.filter).toEqual({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "100",
            },
          ],
        });
      });
    });

    describe("WHEN a value is added for an existing column", () => {
      it("THEN if value is simple value, filter clause for that column is replaced", () => {
        const aggregator = new FilterAggregator({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "100",
            },
          ],
        });

        aggregator.add({ name: "price" }, 200);

        expect(aggregator.filter).toEqual({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "200",
            },
          ],
        });
      });
      it("THEN if value is range tuple, and '=' clause exists, replaces with between filter", () => {
        const aggregator = new FilterAggregator({
          op: "and",
          filters: [
            {
              column: "currency",
              op: "=",
              value: "GBP",
            },
            {
              column: "price",
              op: "=",
              value: "100",
            },
          ],
        });

        aggregator.add({ name: "price" }, ["100", "200"]);

        expect(aggregator.filter).toEqual({
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
        });
      });
    });
  });
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
