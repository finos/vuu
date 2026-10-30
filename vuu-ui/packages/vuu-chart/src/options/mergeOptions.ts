import type { EChartsCoreOption } from "echarts/core";

type PlainObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is PlainObject =>
  value !== null &&
  typeof value === "object" &&
  (Object.getPrototypeOf(value) === Object.prototype ||
    Object.getPrototypeOf(value) === null);

const hasId = (value: unknown): value is PlainObject & { id: unknown } =>
  isPlainObject(value) && value.id !== undefined;

const mergeArrays = (base: unknown[], override: unknown[]): unknown[] => {
  const result = base.slice();
  override.forEach((item, i) => {
    if (hasId(item)) {
      const index = result.findIndex((b) => hasId(b) && b.id === item.id);
      if (index !== -1) {
        result[index] = mergeValues(result[index], item);
      } else {
        result.push(item);
      }
    } else if (i < result.length) {
      result[i] = mergeValues(result[i], item);
    } else {
      result.push(item);
    }
  });
  return result;
};

const mergeValues = (base: unknown, override: unknown): unknown => {
  if (override === undefined) {
    return base;
  }
  if (isPlainObject(base) && isPlainObject(override)) {
    const result: PlainObject = { ...base };
    for (const [key, value] of Object.entries(override)) {
      result[key] = mergeValues(base[key], value);
    }
    return result;
  }
  // Component arrays (series, xAxis, grid, dataZoom etc) are merged by id
  // where items have one, otherwise by index. A single component object may
  // be merged into an array of components and vice versa.
  if (Array.isArray(override) && (Array.isArray(base) || isPlainObject(base))) {
    const baseArray = Array.isArray(base) ? base : [base];
    if (override.every((o) => isPlainObject(o))) {
      return mergeArrays(baseArray, override);
    }
    return override;
  }
  if (Array.isArray(base) && isPlainObject(override)) {
    return mergeArrays(base, [override]);
  }
  return override;
};

/**
 * Deep merge user supplied ECharts options over chart generated options.
 * Plain objects are merged recursively. Arrays of components (e.g. series,
 * xAxis, yAxis, grid, dataZoom) are merged item by item, matched by `id`
 * where present, otherwise by position. Any other value (including data
 * arrays, functions and primitives) in the override replaces the original.
 */
export const mergeEChartsOptions = (
  base: EChartsCoreOption,
  ...overrides: Array<EChartsCoreOption | undefined>
): EChartsCoreOption =>
  overrides.reduce<EChartsCoreOption>(
    (result, override) =>
      override ? (mergeValues(result, override) as EChartsCoreOption) : result,
    base,
  );
