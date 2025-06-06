import {
  ColumnDescriptorsByName,
  Filter,
  SingleValueFilterClause,
} from "@vuu-ui/vuu-filter-types";
import type { RuntimeColumnDescriptor } from "@vuu-ui/vuu-table-types";
import { isDateTimeDataValue } from "../column-utils";
import { isMultiClauseFilter, isMultiValueFilter } from "./filter-utils";

const filterValue = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

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
  const column = opts?.columnsByName?.[f.column];
  if (column && isDateTimeDataValue(column)) {
    return dateFilterAsQuery(f as SingleValueFilterClause<number>);
  } else {
    return defaultSingleValueFilterAsQuery(f);
  }
}

const ONE_DAY_IN_MILIS = 1000 * 60 * 60 * 24;
export function dateFilterAsQuery(f: SingleValueFilterClause<number>): string {
  switch (f.op) {
    case "=": {
      const filters: Array<Filter> = [
        { op: ">=", column: f.column, value: f.value },
        {
          op: "<",
          column: f.column,
          value: f.value + ONE_DAY_IN_MILIS,
        },
      ];
      return filterAsQueryCore({ op: "and", filters });
    }
    case "!=": {
      const filters: Array<Filter> = [
        { op: "<", column: f.column, value: f.value },
        {
          op: ">=",
          column: f.column,
          value: f.value + ONE_DAY_IN_MILIS,
        },
      ];
      return filterAsQueryCore({ op: "or", filters });
    }
    default:
      return defaultSingleValueFilterAsQuery(f);
  }
}

const defaultSingleValueFilterAsQuery = (f: SingleValueFilterClause) =>
  `${f.column} ${f.op} ${filterValue(f.value)}`;

export const removeColumnFromFilter = (
  column: RuntimeColumnDescriptor,
  filter: Filter,
): [Filter | undefined, string] => {
  if (isMultiClauseFilter(filter)) {
    const [clause1, clause2] = filter.filters;
    if (clause1.column === column.name) {
      return [clause2, filterAsQuery(clause2)];
    }
    if (clause2.column === column.name) {
      return [clause1, filterAsQuery(clause1)];
    }
  }
  return [undefined, ""];
};
