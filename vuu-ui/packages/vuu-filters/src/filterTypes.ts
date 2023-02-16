//TODO these are duplicated in vuu-utils, that shoudl probably be the righful source
import {
  AndFilter,
  Filter,
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

// convenience methods to check filter type
export const isNamedFilter = (f?: Filter) =>
  f !== undefined && f.name !== undefined;

// ... with type constraints
export const isSingleValueFilter = (f?: Filter): f is SingleValueFilterClause =>
  f !== undefined &&
  singleValueFilterOps.has(f.op as SingleValueFilterClauseOp);

export const isFilterClause = (
  f?: Filter
): f is SingleValueFilterClause | MultiValueFilterClause =>
  f !== undefined && (isSingleValueFilter(f) || isMultiValueFilter(f));

export const isMultiValueFilter = (f?: Filter): f is MultiValueFilterClause =>
  f !== undefined && f.op === "in";

export const isInFilter = (f: Filter): f is MultiValueFilterClause =>
  f.op === "in";
export const isAndFilter = (f: Filter): f is AndFilter => f.op === "and";
export const isOrFilter = (f: Filter): f is OrFilter => f.op === "or";

export function isMultiClauseFilter(f?: Filter): f is MultiClauseFilter {
  return f !== undefined && (f.op === "and" || f.op === "or");
}
