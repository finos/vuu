import { DataSourceRow } from "@vuu-ui/vuu-data-types";

const checkPattern = (value: string, pattern: string) => {
  return new RegExp(`^${pattern}`, "i").test(value);
};
// No caching here for now, just a brute force recalc every call.
// because the data from any given dataSource may change (filters)
// we cannot assume too much. If perf is an issue, we could return
// some kind of cacheKey. If same key is provided with repeat request
// we use cached values.
const getUniqueValues = (
  data: DataSourceRow[],
  columnIndex: number,
  pattern = "",
) => {
  const uniqueValues = [];
  const set = new Set();
  for (const row of data) {
    const value = row[columnIndex];
    if (value !== undefined && !set.has(value)) {
      set.add(value);
      uniqueValues.push(value);
    }
  }
  uniqueValues.sort();

  return pattern
    ? uniqueValues
        .filter((value) => checkPattern(value.toString(), pattern))
        .slice(0, 10)
    : uniqueValues.slice(0, 10);
};

export const makeSuggestions = (
  data: DataSourceRow[],
  columnIndex: number,
  pattern?: string,
): Promise<string[]> =>
  new Promise((resolve) => {
    const uniqueValues = getUniqueValues(data, columnIndex, pattern);
    const result =
      uniqueValues.length > 20
        ? uniqueValues?.slice(0, 20).map((v) => v.toString())
        : uniqueValues.map((v) => v.toString());
    setTimeout(() => resolve(result), 100);
  });
