export type SingleValueFilterClauseOp =
  | "="
  | "!="
  | ">"
  | ">="
  | "<="
  | "<"
  | "starts"
  | "ends";
export type MultipleValueFilterClauseOp = "in";
export type FilterClauseOp =
  | SingleValueFilterClauseOp
  | MultipleValueFilterClauseOp;
export type FilterCombinatorOp = "and" | "or";
export type FilterOp = FilterClauseOp | FilterCombinatorOp;

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

export interface SingleValueFilterClause {
  op: SingleValueFilterClauseOp;
  column: string;
  value: string | number;
}
export interface MultiValueFilterClause {
  op: MultipleValueFilterClauseOp;
  column: string;
  values: string[] | number[];
}

export type FilterClause = SingleValueFilterClause | MultiValueFilterClause;

export interface MultiClauseFilter {
  column?: never;
  op: FilterCombinatorOp;
  filters: Filter[];
}

export interface AndFilter extends MultiClauseFilter {
  op: "and";
}
export interface OrFilter extends MultiClauseFilter {
  op: "or";
}

export type Filter = FilterClause | MultiClauseFilter;

export const isSingleValueFilter = (f: Filter): f is SingleValueFilterClause =>
  singleValueFilterOps.has(f.op as SingleValueFilterClauseOp);

export const isFilterClause = (
  f: Filter
): f is SingleValueFilterClause | MultiValueFilterClause =>
  isSingleValueFilter(f) || isMultiClauseFilter(f);

export const isMultiValueFilter = (f: Filter): f is MultiValueFilterClause =>
  f.op === "in";

export const isInFilter = (f: Filter): f is MultiValueFilterClause =>
  f.op === "in";
export const isAndFilter = (f: Filter): f is AndFilter => f.op === "and";
export const isOrFilter = (f: Filter): f is OrFilter => f.op === "or";

export function isMultiClauseFilter(f: Filter): f is MultiClauseFilter {
  return f.op === "and" || f.op === "or";
}
