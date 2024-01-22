import {
  ColumnDescriptorsByName,
  Filter,
  SingleValueFilterClause,
} from "@finos/vuu-filter-types";
import { isDateTimeColumn } from "../column-utils";
import { isMultiClauseFilter, isMultiValueFilter } from "./utils";

const filterValue = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

const quotedStrings = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

export const filterAsQuery = (
  f: Filter,
  opts?: { columnsByName?: ColumnDescriptorsByName }
): string => {
  if (isMultiClauseFilter(f)) {
    return f.filters.map((filter) => filterAsQuery(filter)).join(` ${f.op} `);
  } else if (isMultiValueFilter(f)) {
    return `${f.column} ${f.op} [${f.values.map(quotedStrings).join(",")}]`;
  } else {
    return singleValueFilterAsQuery(f, opts);
  }
};

function singleValueFilterAsQuery(
  f: SingleValueFilterClause,
  opts?: { columnsByName?: ColumnDescriptorsByName }
): string {
  const column = opts?.columnsByName?.[f.column];
  if (column && isDateTimeColumn(column)) {
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
      return filterAsQuery({ op: "and", filters });
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
      return filterAsQuery({ op: "or", filters });
    }
    default:
      return defaultSingleValueFilterAsQuery(f);
  }
}

const defaultSingleValueFilterAsQuery = (f: SingleValueFilterClause) =>
  `${f.column} ${f.op} ${filterValue(f.value)}`;
