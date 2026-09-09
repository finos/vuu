import type {
  ColumnDescriptorsByName,
  Filter,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import { isDateTimeDataValue } from "../column-utils";
import { stringIsValidLong } from "../data-utils";
import {
  isMultiClauseFilter,
  isMultiValueFilter,
  isSerializableFilter,
} from "./filter-utils";
import { ScaledDecimal } from "../ScaledDecimal";

const filterValue = (
  value: string | number | boolean | ScaledDecimal,
  columnType?: string,
) => {
  if (typeof value === "string") {
    if (columnType !== undefined) {
      // If we have precise type metadata, format numeric types without quotes,
      // and string-like types with quotes.
      const isNumericType = ["int", "long", "double"].includes(columnType);
      return isNumericType ? value : `"${value}"`;
    }
    // If no metadata is present, do a safe regex boundary check.
    return stringIsValidLong(value) ? value : `"${value}"`;
  }
  return value instanceof ScaledDecimal || typeof value === "bigint"
    ? value.toString()
    : value;
};

const quotedStrings = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

const removeOuterMostParentheses = (s: string) => s.replace(/^\((.*)\)$/, "$1");

export const filterAsQuery = (
  f: Filter,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string => {
  return removeOuterMostParentheses(filterAsQueryCore(f, opts));
};

const filterAsQueryCore = (
  f: Filter,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string => {
  if (isMultiClauseFilter(f)) {
    const multiClauseFilter = f.filters
      .map((filter) => filterAsQueryCore(filter, opts))
      .join(` ${f.op} `);
    return `(${multiClauseFilter})`;
  } else if (isMultiValueFilter(f)) {
    return `${f.column} ${f.op} [${f.values.map(quotedStrings).join(",")}]`;
  } else {
    return singleValueFilterAsQuery(f, opts);
  }
};

function singleValueFilterAsQuery(
  f: SingleValueFilterClause,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string {
  if (isSerializableFilter(f)) {
    return f.asQuery();
  } else {
    const column = opts?.columnsByName?.[f.column];
    if (column && isDateTimeDataValue(column)) {
      return dateFilterAsQuery(f as SingleValueFilterClause<number>, opts);
    } else {
      return defaultSingleValueFilterAsQuery(f, opts);
    }
  }
}

export const ONE_DAY_IN_MILLIS = 1000 * 60 * 60 * 24;
export function dateFilterAsQuery(
  f: SingleValueFilterClause<number>,
  opts?: { columnsByName?: ColumnDescriptorsByName },
): string {
  switch (f.op) {
    case "=": {
      const filters: Array<Filter> = [
        { op: ">=", column: f.column, value: f.value },
        {
          op: "<",
          column: f.column,
          value: f.value + ONE_DAY_IN_MILLIS,
        },
      ];
      return filterAsQueryCore({ op: "and", filters }, opts);
    }
    case "!=": {
      const filters: Array<Filter> = [
        { op: "<", column: f.column, value: f.value },
        {
          op: ">=",
          column: f.column,
          value: f.value + ONE_DAY_IN_MILLIS,
        },
      ];
      return filterAsQueryCore({ op: "or", filters }, opts);
    }
    default:
      return defaultSingleValueFilterAsQuery(f, opts);
  }
}

const defaultSingleValueFilterAsQuery = (
  f: SingleValueFilterClause,
  opts?: { columnsByName?: ColumnDescriptorsByName },
) => {
  const columnType = opts?.columnsByName?.[f.column]?.serverDataType;
  return `${f.column} ${f.op} ${filterValue(f.value, columnType)}`;
};
