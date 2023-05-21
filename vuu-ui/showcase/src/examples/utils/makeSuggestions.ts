import { ArrayDataSource } from "@finos/vuu-data";
import { buildColumnMap, DataItem } from "@finos/vuu-utils";

const cachedValues = new Map<ArrayDataSource, Map<string, DataItem[]>>();

const getUniqueValues = (
  dataSource: ArrayDataSource,
  column: string,
  pattern = ""
) => {
  let uniqueValues;
  const cachedEntry = cachedValues.get(dataSource);
  if (cachedEntry && cachedEntry.has(column)) {
    uniqueValues = cachedEntry.get(column) as DataItem[];
  } else {
    const { columns, data } = dataSource;
    const columnMap = buildColumnMap(columns);
    const key = columnMap[column];
    uniqueValues = [];
    const set = new Set();
    for (const row of data) {
      const value = row[key];
      if (!set.has(value)) {
        set.add(value);
        uniqueValues.push(value);
      }
    }
    if (cachedEntry) {
      cachedEntry.set(column, uniqueValues);
    } else {
      cachedValues.set(dataSource, new Map([[column, uniqueValues]]));
    }
  }
  return pattern
    ? uniqueValues.filter((value) => value.toString().startsWith(pattern))
    : uniqueValues;
};

export const makeSuggestions = (
  dataSource: ArrayDataSource,
  column: string,
  pattern?: string
) => {
  const uniqueValues = getUniqueValues(dataSource, column, pattern);
  if (uniqueValues.length > 20) {
    return uniqueValues?.slice(0, 20);
  } else {
    return uniqueValues;
  }
};
