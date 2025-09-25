import { DataValueDescriptor } from "@vuu-ui/vuu-data-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

export declare type NumericFilterClauseOp =
  | "="
  | "!="
  | ">"
  | ">="
  | "<="
  | "<";

export declare type SingleValueFilterClauseOp =
  | NumericFilterClauseOp
  | "contains"
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

export interface MultiValueFilterClause<T = string[] | number[] | boolean[]>
  extends NamedFilter {
  op: MultipleValueFilterClauseOp;
  column: string;
  values: T;
}

export declare type FilterClause =
  | SingleValueFilterClause
  | MultiValueFilterClause;

export interface MultiClauseFilter<
  T extends FilterCombinatorOp = FilterCombinatorOp,
  F extends Filter = Filter,
> extends NamedFilter {
  column?: never;
  op: T;
  filters: F[];
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

/**
 This interface is only valid for a Filter that is being edioted
 */
export interface FilterWithPartialClause extends MultiClauseFilter {
  filters: Array<Partial<Filter>>;
}

export declare type ColumnDescriptorsByName = Record<string, ColumnDescriptor>;

export declare type FilterState = {
  filters: Filter[];
  activeIndices: number[];
};

export declare type FilterChangeHandler = (filter: Filter | undefined) => void;

export declare type ColumnFilterValue = string | number | [string, string];

export declare type ColumnFilterOp = FilterClauseOp | "between";

export declare type ColumnFilterDescriptor = {
  column: ColumnDescriptor;
  op: ColumnFilterOp;
  filterValue: ColumnFilterValue;
};

export declare type ColumnFilterChangeHandler = (
  value: string | number,
  column: ColumnDescriptor,
  op: ColumnFilterOp,
) => void;

export type ColumnFilterVariant = "pick" | "search" | "range";
export interface ColumnFilterDescriptor extends DataValueDescriptor {
  defaultValue: ColumnFilterValue;
  op?: ColumnFilterOp;
  variant?: ColumnFilterVariant;
}
