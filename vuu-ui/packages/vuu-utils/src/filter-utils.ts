//Note these are duplicated in vuu-filter, those should probably be removed.

import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import {
  AndFilter,
  Filter,
  FilterClauseOp,
  FilterWithPartialClause,
  MultiClauseFilter,
  MultiValueFilterClause,
  OrFilter,
  SingleValueFilterClause,
  SingleValueFilterClauseOp,
} from "@finos/vuu-filter-types";

const singleValueFilterOps = new Set<SingleValueFilterClauseOp>([
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "starts",
  "ends",
]);

export const isValidFilterClauseOp = (op?: string): op is FilterClauseOp =>
  op === "in" || singleValueFilterOps.has(op as SingleValueFilterClauseOp);

export const isNamedFilter = (f?: Filter) =>
  f !== undefined && f.name !== undefined;

// ... with type constraints
export const isSingleValueFilter = (
  f?: Partial<Filter>
): f is SingleValueFilterClause =>
  f !== undefined &&
  singleValueFilterOps.has(f.op as SingleValueFilterClauseOp);

export const isFilterClause = (
  f?: Partial<Filter>
): f is SingleValueFilterClause | MultiValueFilterClause =>
  f !== undefined && (isSingleValueFilter(f) || isMultiValueFilter(f));

export const isMultiValueFilter = (
  f?: Partial<Filter>
): f is MultiValueFilterClause => f !== undefined && f.op === "in";

export const isInFilter = (f: Partial<Filter>): f is MultiValueFilterClause =>
  f.op === "in";
export const isAndFilter = (f: Partial<Filter>): f is AndFilter =>
  f.op === "and";
export const isOrFilter = (f: Partial<Filter>): f is OrFilter => f.op === "or";

export const isCompleteFilter = (filter: Partial<Filter>): filter is Filter =>
  isSingleValueFilter(filter) &&
  filter.column !== undefined &&
  filter.op !== undefined &&
  filter.value !== undefined;

export function isMultiClauseFilter(
  f?: Partial<Filter> | FilterWithPartialClause
): f is MultiClauseFilter {
  return f !== undefined && (f.op === "and" || f.op === "or");
}

const filterValue = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

const quotedStrings = (value: string | number | boolean) =>
  typeof value === "string" ? `"${value}"` : value;

export const filterAsQuery = (f: Filter): string => {
  if (isMultiClauseFilter(f)) {
    return f.filters.map((filter) => filterAsQuery(filter)).join(` ${f.op} `);
  } else if (isMultiValueFilter(f)) {
    return `${f.column} ${f.op} [${f.values.map(quotedStrings).join(",")}]`;
  } else {
    return `${f.column} ${f.op} ${filterValue(f.value)}`;
  }
};

export const removeColumnFromFilter = (
  column: KeyedColumnDescriptor,
  filter: Filter
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
