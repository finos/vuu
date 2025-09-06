import { describe, expect, it, vi } from "vitest";
import { ColumnFilterStore } from "../filters/filter-utils";
import { toColumnDescriptor } from "../column-utils";

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
    return {};
  },
}));

//TODO - Add time/time range tests
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
    store.addFilter(toColumnDescriptor("price"), ">", 100);
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ" and price > 100' });
  });

  it("handles between operator", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("price"), "between", ["10", "20"]);
    expect(store.filter).toEqual({ filter: "price >= 10 and price <= 20" });
  });

  it("loads filter from query string", () => {
    const store = new ColumnFilterStore();
    store.filter = { filter: 'ric = "AAOQ.OQ" and price > 100' };
    expect(store.filter).toEqual({ filter: 'ric = "AAOQ.OQ" and price > 100' });
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
    const values = store.columnValues;
    expect(values.get("ric")).toBe("AAOQ.OQ");
    expect(values.get("price")).toEqual(["10", "20"]);
    expect(Array.from(values.keys())).toEqual(["ric", "price"]);
  });

  it("returns empty columnValues after reset", () => {
    const store = new ColumnFilterStore();
    store.addFilter(toColumnDescriptor("ric"), "=", "AAOQ.OQ");
    store.resetFilters();
    expect(store.columnValues.size).toBe(0);
  });
});
