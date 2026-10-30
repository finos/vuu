import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { ColumnMap } from "@vuu-ui/vuu-utils";
import type { ChartTheme } from "../theme/chartTheme";
import { resolveColor } from "../theme/chartTheme";
import type {
  Aggregation,
  ColorBy,
  MarkLineDef,
  RowMatch,
} from "../vuu-chart-types";

export const toNumber = (
  value: VuuRowDataItemType | bigint | undefined,
): number | null => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  } else if (typeof value === "bigint") {
    return Number(value);
  } else if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

export const getColumnValue = (
  row: DataSourceRow,
  columnMap: ColumnMap,
  columnName: string,
): VuuRowDataItemType | undefined => {
  const index = columnMap[columnName];
  return index === undefined ? undefined : row[index];
};

export const getNumber = (
  row: DataSourceRow,
  columnMap: ColumnMap,
  columnName: string,
) => toNumber(getColumnValue(row, columnMap, columnName));

export const filterRows = (
  rows: DataSourceRow[],
  columnMap: ColumnMap,
  where?: RowMatch,
) => {
  if (where === undefined) {
    return rows;
  } else if (typeof where === "function") {
    return rows.filter((row) => where(row, columnMap));
  } else {
    const entries = Object.entries(where);
    return rows.filter((row) =>
      entries.every(
        ([columnName, value]) =>
          getColumnValue(row, columnMap, columnName) === value,
      ),
    );
  }
};

/**
 * Returns rows sorted (stable) by a numeric column, ascending. If rows
 * are already in order (the common case, when the DataSource is sorted),
 * the original array is returned.
 */
export const sortRowsByNumber = (
  rows: DataSourceRow[],
  columnMap: ColumnMap,
  columnName: string,
  descending = false,
) => {
  const index = columnMap[columnName];
  if (index === undefined) {
    return rows;
  }
  const value = (row: DataSourceRow) => toNumber(row[index]) ?? 0;
  const dir = descending ? -1 : 1;
  let sorted = true;
  for (let i = 1; i < rows.length; i++) {
    if (dir * (value(rows[i]) - value(rows[i - 1])) < 0) {
      sorted = false;
      break;
    }
  }
  return sorted
    ? rows
    : rows.slice().sort((r1, r2) => dir * (value(r1) - value(r2)));
};

export const colorForRow = (
  row: DataSourceRow,
  columnMap: ColumnMap,
  colorBy: ColorBy,
  theme: ChartTheme,
) => {
  const value = getColumnValue(row, columnMap, colorBy.columnName);
  const color = colorBy.colors[String(value)] ?? colorBy.defaultColor;
  return resolveColor(color, theme);
};

export class Aggregator {
  #aggregation: Aggregation;
  count = 0;
  #value: number | null = null;

  constructor(aggregation: Aggregation) {
    this.#aggregation = aggregation;
  }

  add(value: number | null) {
    if (this.#aggregation === "count") {
      this.count += 1;
      return;
    }
    if (value === null) {
      return;
    }
    this.count += 1;
    const current = this.#value;
    switch (this.#aggregation) {
      case "sum":
      case "avg":
        this.#value = (current ?? 0) + value;
        break;
      case "min":
        this.#value = current === null ? value : Math.min(current, value);
        break;
      case "max":
        this.#value = current === null ? value : Math.max(current, value);
        break;
      case "last":
        this.#value = value;
        break;
    }
  }

  get value(): number | null {
    switch (this.#aggregation) {
      case "count":
        return this.count;
      case "avg":
        return this.#value === null ? null : this.#value / this.count;
      default:
        return this.#value;
    }
  }
}

export const computeMarkLineValue = (
  def: MarkLineDef,
  values: Array<number | null>,
  weights?: Array<number | null>,
): number | null => {
  const { value } = def;
  if (typeof value === "number") {
    return value;
  }
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length === 0) {
    return null;
  }
  if (value === "last") {
    return nums[nums.length - 1];
  } else if (value === "min") {
    return Math.min(...nums);
  } else if (value === "max") {
    return Math.max(...nums);
  } else if (value === "average") {
    return nums.reduce((s, n) => s + n, 0) / nums.length;
  } else if (weights) {
    let total = 0;
    let totalWeight = 0;
    values.forEach((v, i) => {
      const w = weights[i];
      if (v !== null && w !== null && w !== undefined) {
        total += v * Math.abs(w);
        totalWeight += Math.abs(w);
      }
    });
    return totalWeight === 0 ? null : total / totalWeight;
  }
  return null;
};

/**
 * Binary search, returns the index of the last value <= target, or -1.
 */
export const findFloorIndex = (sortedValues: number[], target: number) => {
  let lo = 0;
  let hi = sortedValues.length - 1;
  let result = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sortedValues[mid] <= target) {
      result = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return result;
};
