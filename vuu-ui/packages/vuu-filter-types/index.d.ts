export declare type SingleValueFilterClauseOp =
  | "="
  | "!="
  | ">"
  | ">="
  | "<="
  | "<"
  | "starts"
  | "ends";

export declare type MultipleValueFilterClauseOp = "in";

export declare type FilterClauseOp =
  | SingleValueFilterClauseOp
  | MultipleValueFilterClauseOp;

export declare type FilterCombinatorOp = "and" | "or";

export declare type FilterOp = FilterClauseOp | FilterCombinatorOp;

export interface NamedFilter {
  name?: string;
}

export interface SingleValueFilterClause<T = string | number | boolean>
  extends NamedFilter {
  op: SingleValueFilterClauseOp;
  column: string;
  value: T;
}

export interface MultiValueFilterClause extends NamedFilter {
  op: MultipleValueFilterClauseOp;
  column: string;
  values: string[] | number[] | boolean[];
}

export declare type FilterClause =
  | SingleValueFilterClause
  | MultiValueFilterClause;

export interface MultiClauseFilter extends NamedFilter {
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
/**
 * A Filter structure that can represent any of the filters supported by the Vuu server.
 * Note that a filter in this form is never passed directly to the Vuu server. For that,
 * a string based filter language is used. Any filter can be expressed in string form 
 * or the structure described here.
 * an example of a simple filter expressed in both formats:
 * 
 * 'currency = "EUR"'
 * 
  {
   op: "=".
   column: 'currency'
   value: 'EUR'
  }
 */
export declare type Filter = FilterClause | MultiClauseFilter;

export declare type FilterState = {
  filter: Filter | undefined;
  filterQuery: string;
  filterName?: string;
};
