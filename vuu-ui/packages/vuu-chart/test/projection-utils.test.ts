import { describe, expect, it } from "vitest";
import {
  Aggregator,
  computeMarkLineValue,
  filterRows,
  findFloorIndex,
  sortRowsByNumber,
  toNumber,
} from "../src/chart-data/projection-utils";
import { rowData } from "./fixtures";

describe("toNumber", () => {
  it("converts numbers, numeric strings and bigint", () => {
    expect(toNumber(1.5)).toBe(1.5);
    expect(toNumber("2.5")).toBe(2.5);
    expect(toNumber(BigInt(10))).toBe(10);
  });
  it("returns null for non numeric values", () => {
    expect(toNumber("abc")).toBeNull();
    expect(toNumber("")).toBeNull();
    expect(toNumber(undefined)).toBeNull();
    expect(toNumber(true)).toBeNull();
    expect(toNumber(Number.NaN)).toBeNull();
  });
});

describe("filterRows", () => {
  const { columnMap, rows } = rowData(
    ["side", "price"],
    [
      ["BUY", 1],
      ["SELL", 2],
      ["BUY", 3],
    ],
  );
  it("filters by column values", () => {
    expect(filterRows(rows, columnMap, { side: "BUY" })).toHaveLength(2);
  });
  it("filters by predicate", () => {
    expect(
      filterRows(rows, columnMap, (row, map) => (row[map.price] as number) > 1),
    ).toHaveLength(2);
  });
  it("returns rows when no filter", () => {
    expect(filterRows(rows, columnMap, undefined)).toBe(rows);
  });
});

describe("sortRowsByNumber", () => {
  it("returns same array if already sorted", () => {
    const { columnMap, rows } = rowData(["t"], [[1], [2], [3]]);
    expect(sortRowsByNumber(rows, columnMap, "t")).toBe(rows);
  });
  it("sorts ascending, without mutating", () => {
    const { columnMap, rows } = rowData(["t"], [[3], [1], [2]]);
    expect(sortRowsByNumber(rows, columnMap, "t").map((r) => r[0])).toEqual([
      1, 2, 3,
    ]);
    expect(rows.map((r) => r[0])).toEqual([3, 1, 2]);
  });
});

describe("Aggregator", () => {
  const aggregate = (
    aggregation: ConstructorParameters<typeof Aggregator>[0],
    values: Array<number | null>,
  ) => {
    const agg = new Aggregator(aggregation);
    for (const v of values) agg.add(v);
    return agg.value;
  };
  it("aggregates", () => {
    expect(aggregate("sum", [1, 2, null, 3])).toBe(6);
    expect(aggregate("avg", [1, 2, null, 3])).toBe(2);
    expect(aggregate("min", [4, 2, 3])).toBe(2);
    expect(aggregate("max", [4, 2, 3])).toBe(4);
    expect(aggregate("count", [4, null, 3])).toBe(3);
    expect(aggregate("last", [4, 2, 3])).toBe(3);
    expect(aggregate("sum", [])).toBeNull();
  });
});

describe("computeMarkLineValue", () => {
  const values = [1, null, 3, 2];
  it("computes values", () => {
    expect(computeMarkLineValue({ value: 5 }, values)).toBe(5);
    expect(computeMarkLineValue({ value: "last" }, values)).toBe(2);
    expect(computeMarkLineValue({ value: "min" }, values)).toBe(1);
    expect(computeMarkLineValue({ value: "max" }, values)).toBe(3);
    expect(computeMarkLineValue({ value: "average" }, values)).toBe(2);
    expect(
      computeMarkLineValue(
        { value: { weightedAverage: "qty" } },
        [10, 20],
        [100, -300],
      ),
    ).toBe(17.5);
  });
  it("returns null with no values", () => {
    expect(computeMarkLineValue({ value: "last" }, [])).toBeNull();
  });
});

describe("findFloorIndex", () => {
  it("finds last value <= target", () => {
    const values = [10, 20, 30];
    expect(findFloorIndex(values, 5)).toBe(-1);
    expect(findFloorIndex(values, 10)).toBe(0);
    expect(findFloorIndex(values, 25)).toBe(1);
    expect(findFloorIndex(values, 99)).toBe(2);
  });
});
