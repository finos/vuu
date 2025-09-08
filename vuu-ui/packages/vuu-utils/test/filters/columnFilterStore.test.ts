import { describe, expect, it, vi } from "vitest";
import { ColumnFilterStore } from "../../src/filters/filter-utils";
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
      filterString === 'lastUpdate >= "09:00:00" and lastUpdate <= "10:00:00"'
    ) {
      return {
        op: "and",
        filters: [
          { column: "lastUpdate", op: ">=", value: "09:00:00" },
          { column: "lastUpdate", op: "<=", value: "10:00:00" },
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
        const d = new Date("2025-05-15");
        d.setHours(Number(timeString.split(":")[0]));
        d.setMinutes(Number(timeString.split(":")[1]));
        d.setSeconds(Number(timeString.split(":")[2]));
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
    expect(store.filter).toEqual({ filter: "price >= 10 and price <= 20" });
  });

  it("handles time filter with single value", () => {
    const store = new ColumnFilterStore();
    store.addFilter(lastUpdateDescriptor, "=", "12:34:56");
    expect(store.filter).toEqual({ filter: "lastUpdate = 1747308896000" });
    expect(store.columnValues.get("lastUpdate")).toBe("12:34:56");
  });

  it("handles between operator for time columns", () => {
    const store = new ColumnFilterStore();
    store.addFilter(lastUpdateDescriptor, "between", ["09:00:00", "10:00:00"]);
    expect(store.filter).toEqual({
      filter: "lastUpdate >= 1747296000000 and lastUpdate <= 1747299600000",
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
      filter: 'lastUpdate >= "09:00:00" and lastUpdate <= "10:00:00"',
    };
    expect(store.filter).toEqual({
      filter: "lastUpdate >= 1747296000000 and lastUpdate <= 1747299600000",
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
