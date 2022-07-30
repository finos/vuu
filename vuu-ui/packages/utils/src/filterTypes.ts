export type FilterClauseOp = '=' | '>' | '>=' | 'in' | '<=' | '<' | 'starts' | 'ends';
export type FilterCombinatorOp = 'and' | 'or';
export type FilterOp = FilterClauseOp | FilterCombinatorOp;

const singleValueFilterOps = new Set(['=', '>', '>=', '<', '<=', 'starts', 'ends']);

export interface SingleValueFilterClause {
  op: '=' | '>' | '>=' | '<' | '<=' | 'starts' | 'ends';
  column: string;
  value: any;
}
export interface MultiValueFilterClause {
  op: 'in';
  column: string;
  values: any[];
}

export type FilterClause = SingleValueFilterClause | MultiValueFilterClause;

export interface MultiClauseFilter {
  column?: never;
  op: 'and' | 'or';
  filters: Filter[];
}

export interface AndFilter extends MultiClauseFilter {
  op: 'and';
}
export interface OrFilter extends MultiClauseFilter {
  op: 'or';
}

export type Filter = FilterClause | MultiClauseFilter;

export const isMultiClauseFilter = (f: Filter): f is MultiClauseFilter =>
  Array.isArray((f as MultiClauseFilter).filters);

export const isSingleValueFilter = (f: Filter): f is SingleValueFilterClause =>
  singleValueFilterOps.has(f.op);

export const isFilterClause = (f: Filter): f is SingleValueFilterClause | MultiValueFilterClause =>
  isSingleValueFilter(f) || isMultiClauseFilter(f);

export const isMultiValueFilter = (f: Filter): f is MultiValueFilterClause => f.op === 'in';

export const isInFilter = (f: Filter): f is MultiValueFilterClause => f.op === 'in';
export const isAndFilter = (f: Filter): f is AndFilter => f.op === 'and';
export const isOrFilter = (f: Filter): f is OrFilter => f.op === 'or';
