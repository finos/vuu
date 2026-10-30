import { describe, expect, it } from "vitest";
import { mergeEChartsOptions } from "../src/options/mergeOptions";

describe("mergeEChartsOptions", () => {
  it("deep merges plain objects", () => {
    expect(
      mergeEChartsOptions(
        { tooltip: { show: true, textStyle: { color: "red", fontSize: 12 } } },
        { tooltip: { textStyle: { color: "blue" } } },
      ),
    ).toEqual({
      tooltip: { show: true, textStyle: { color: "blue", fontSize: 12 } },
    });
  });

  it("merges arrays of components by id", () => {
    const merged = mergeEChartsOptions(
      {
        series: [
          { id: "a", type: "line", data: [1] },
          { id: "b", type: "bar", data: [2] },
        ],
      },
      { series: [{ id: "b", stack: "x" }] },
    );
    expect(merged.series).toEqual([
      { id: "a", type: "line", data: [1] },
      { id: "b", type: "bar", data: [2], stack: "x" },
    ]);
  });

  it("appends components with unknown id", () => {
    const merged = mergeEChartsOptions(
      { series: [{ id: "a", type: "line" }] },
      { series: [{ id: "c", type: "scatter" }] },
    );
    expect(merged.series).toHaveLength(2);
  });

  it("merges arrays without ids by index", () => {
    const merged = mergeEChartsOptions(
      { yAxis: [{ type: "value" }, { type: "value" }] },
      { yAxis: [{}, { min: 0 }] },
    );
    expect(merged.yAxis).toEqual([
      { type: "value" },
      { type: "value", min: 0 },
    ]);
  });

  it("merges a single object into the first array item and vice versa", () => {
    expect(
      mergeEChartsOptions(
        { grid: [{ id: "main", top: 10 }] },
        { grid: { top: 40 } },
      ).grid,
    ).toEqual([{ id: "main", top: 40 }]);
    expect(
      mergeEChartsOptions({ title: { text: "a" } }, { title: [{ left: 0 }] })
        .title,
    ).toEqual([{ text: "a", left: 0 }]);
  });

  it("replaces primitive arrays and values", () => {
    expect(
      mergeEChartsOptions(
        { color: ["red"], animation: false },
        {
          color: ["blue", "green"],
          animation: true,
        },
      ),
    ).toEqual({ color: ["blue", "green"], animation: true });
  });

  it("does not mutate inputs", () => {
    const base = { series: [{ id: "a", data: [1] }] };
    mergeEChartsOptions(base, { series: [{ id: "a", data: [2] }] });
    expect(base).toEqual({ series: [{ id: "a", data: [1] }] });
  });

  it("ignores undefined overrides", () => {
    expect(mergeEChartsOptions({ a: 1 }, undefined)).toEqual({ a: 1 });
  });
});
