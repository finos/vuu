import { Filter } from "@finos/vuu-filter-types";
import { addFilter } from "../filter-utils";
import { NumericOperator } from "../filter-clause/operator-utils";

export const isStartsWithValue = (value: string) => /\.\.\.$/.test(value); // Does the value end in elipsis

export const getTypeaheadFilter = (
  column: string,
  filterValues: string[],
  isStartsWithFilter?: boolean
): Filter | undefined => {
  if (filterValues.length === 0) {
    return undefined;
  }

  if (isStartsWithFilter) {
    // multiple starts with filters not currently supported
    const startsWith = filterValues[0].substring(0, filterValues[0].length - 3);
    return {
      column,
      op: "starts",
      value: `"${startsWith}"`,
    };
  }

  return {
    column,
    op: "in",
    values: filterValues.map((value) => `"${value}"`),
  };
};

export const getRangeFilter = (
  column: string,
  startValue?: number,
  endValue?: number
): Filter | undefined => {
  const startFilter: Filter | undefined =
    startValue === undefined
      ? undefined
      : { column, op: ">", value: startValue - 1 };

  const endFilter: Filter | undefined =
    endValue === undefined
      ? undefined
      : { column, op: "<", value: endValue + 1 };

  if (endFilter === undefined) return startFilter;
  return addFilter(startFilter, endFilter, { combineWith: "and" });
};

export const getNumericFilter = (
  column: string,
  operator?: NumericOperator,
  value?: number
): Filter | undefined => {
  if (operator === undefined) return undefined;
  if (value === undefined || isNaN(value)) return undefined;
  return { column, op: operator, value };
};
