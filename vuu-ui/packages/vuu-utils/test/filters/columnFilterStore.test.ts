import { describe, expect, it, vi } from "vitest";
import { ColumnFilterStore } from "../../src/filters/filter-utils";
import { toColumnDescriptor } from "../../src/column-utils";

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

describe("ColumnFilterStore", () => {
  it("adds a filter to the store", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ"' });
  });

  it("removes a filter from the store", () => {
    const store = new ColumnFilterStore();
    const column = toColumnDescriptor("ric");
    store.addFilter(column, "=", "AAOQ.OQ");
    store.removeFilter(column);
    expect(store.filter).toEqual({ filter: "" });
  });

  it("resets all filters", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    store.addFilter(toColumnDescriptor("price"), ">", 100);
    store.resetFilters();
    expect(store.filter).toEqual({ filter: "" });
  });

  it("handles multiple filters with AND", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    store.addFilter(toColumnDescriptor("price", "double"), ">", 100);
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ" and price > 100' });
  });

  it("handles between operator for numeric columns", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("price"), "between", ["10", "20"]);
    expect(store.filter).toEqual({ filter: "price >= 10 and price <= 20" });
  });

  it("handles time filter with single value", () => {
    const store = new ColumnFilterStore();
    store.addFilter(
      { name: "lastUpdate", serverDataType: "long", type: "time" },
      "=",
      "12:34:56",
    );
    expect(store.filter).toEqual({ filter: "lastUpdate = 1757244896000" });
    expect(store.columnValues.get("lastUpdate")).toBe("12:34:56");
  });

  it("handles between operator for time columns", () => {
    const store = new ColumnFilterStore();
    store.addFilter(
      { name: "lastUpdate", serverDataType: "long", type: "time" },
      "between",
      ["09:00:00", "10:00:00"],
    );
    expect(store.filter).toEqual({
      filter: "lastUpdate >= 1757232000000 and lastUpdate <= 1757235600000",
    });
  });

  it("loads filter from query string for text field", () => {
    const store = new ColumnFilterStore();
    store.filter = { filter: 'ric = "AAOQ.OQ" and price > 100' };
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ" and price > 100' });
  });

  it("loads filter from query string for time range", () => {
    const store = new ColumnFilterStore();
    store.filter = {
      filter: 'lastUpdate >= "09:00:00" and lastUpdate <= "10:00:00"',
    };
    expect(store.filter).toEqual({
      filter: "lastUpdate >= 1757232000000 and lastUpdate <= 1757235600000",
    });
  });

  it("set filter clears previous filters", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    store.filter = { filter: "price > 100" };
    expect(store.filter).toEqual({ filter: "price > 100" });
  });

  it("emits onChange when filter is added", () => {
    const store = new ColumnFilterStore();
    const onChange = vi.fn();
    store.on("onChange", onChange);
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    expect(onChange).toHaveBeenCalledWith({ filter: 'ric = "AAOQ.OQ"' });
  });

  it("emits onChange when filter is removed", () => {
    const store = new ColumnFilterStore();
    const column = toColumnDescriptor("ric");
    const onChange = vi.fn();
    store.on("onChange", onChange);
    store.addFilter(column, "=", "AAOQ.OQ");
    store.removeFilter(column);
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
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    store.addFilter(toColumnDescriptor("price"), "between", ["10", "20"]);
    store.addFilter(
      { name: "lastUpdate", serverDataType: "long", type: "time" },
      "between",
      ["09:00:00", "10:00:00"],
    );
    const values = store.columnValues;
    expect(values.get("ric")).toBe("AAOQ.OQ");
    expect(values.get("price")).toEqual(["10", "20"]);
    expect(values.get("lastUpdate")).toEqual(["09:00:00", "10:00:00"]);
    expect(Array.from(values.keys())).toEqual(["ric", "price", "lastUpdate"]);
  });

  it("returns empty columnValues after reset", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    store.resetFilters();
    expect(store.columnValues.size).toBe(0);
  });
});
