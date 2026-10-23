import type { DataValueDescriptor, ScaledDecimal } from "@vuu-ui/vuu-data-types";
import type { ColumnDescriptor, RoundingRule } from "@vuu-ui/vuu-table-types";

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

export interface SingleValueFilterClause<
  T = string | number | boolean | ScaledDecimal,
> extends NamedFilter {
  extendedOptions?: ExtendedFilterOptions;
  op: SingleValueFilterClauseOp;
  column: string;
  value: T;
}

export interface SerializableSingleValueFilterClause
  extends SingleValueFilterClause {
  asQuery: () => string;
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

export interface ExtendedFilter extends SingleValueFilterClause {
  extendedOptions: ExtendedFilterOptions;
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
 * General type for callback props invoked with a filter
 */
export declare type FilterHandler = (filter: Filter) => void;

/**
 * Common options for extended filters on temporal columns. These allow the
 * filter to be serialized without reference to the column descriptor.
 */
export declare type TemporalFilterOptions = {
  /**
   * Encoding of the column values, epochNanos for epochtimestampnano
   * columns. Default is epochMillis
   */
  encoding?: "epochMillis" | "epochNanos";
  /**
   * IANA time zone (or 'local' | 'UTC') in which time of day values are
   * interpreted. Defaults to the application default time zone.
   */
  timeZone?: string;
};

/**
 * Filter values are TimeStrings (hh:mm:ss), resolved against today's date
 * at the time the filter query is created. A persisted filter therefore
 * always applies to 'today'.
 */
export declare type TimeTodayFilterOptions = TemporalFilterOptions & {
  date: "today";
  type: "TimeString";
};
/**
 * Filter values are TimeStrings (hh:mm:ss), resolved against the given date
 * Note: date was previously typed as a Date object, it is now an ISO date
 * string (yyyy-mm-dd) so the options can be safely persisted as JSON.
 */
export declare type TimeDateFilterOptions = TemporalFilterOptions & {
  date: "yesterday" | `${number}-${number}-${number}`;
  type: "TimeString";
};

/**
 * Options for a clause on a scaled decimal column. Where the column displays
 * fewer decimal places than its scale, a value entered at (or below) the
 * displayed precision matches every value that displays as that value, e.g with
 * 2 decimals displayed (rounded), notional = 1.23 matches 1.225 <= notional < 1.235.
 * A value with more decimal places than are displayed is matched at its own
 * precision, e.g 1.234 matches 1.2335 <= notional < 1.2345. A value with as many
 * decimal places as the column holds is matched exactly.
 */
export declare type ScaledDecimalFilterOptions = {
  type: "ScaledDecimal";
  /** The number of decimal places held by the column (scaleddecimal2 etc). */
  scale: 2 | 4 | 6 | 8;
  /** The number of decimal places displayed. Undefined means all. */
  decimals?: number;
  /** How displayed values are rounded. Defaults to 'round'. */
  roundingRule?: RoundingRule;
};

export declare type ExtendedFilterOptions =
  | TimeTodayFilterOptions
  | TimeDateFilterOptions
  | ScaledDecimalFilterOptions;

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

// export declare type ColumnFilterValue = string | number | [string, string];
export declare type ColumnFilterValue<
  T extends string | number | [string, string] =
  | string
  | number
  | [string, string],
> = T;

export declare type FilterClauseOpBetween = "between" | "between-inclusive";

export declare type ColumnFilterOp = FilterClauseOp | FilterClauseOpBetween;

// export declare type ColumnFilterDescriptor = {
//   column: ColumnDescriptor;
//   op: ColumnFilterOp;
//   filterValue: ColumnFilterValue;
// };

export declare type ColumnFilterChangeHandler = (
  value: ColumnFilterValue,
  column: ColumnDescriptor,
  op: ColumnFilterOp,
) => void;

export declare type ColumnFilterCommitHandler = (
  column: ColumnDescriptor,
  op: FilterClauseOp | "between" | "between-inclusive",
  value: ColumnFilterValue,
  extendedFilterOptions?: ExtendedFilterOptions,
) => void;

export declare type ColumnFilterVariant = "pick" | "search" | "range";
export interface ColumnFilterDescriptor extends DataValueDescriptor {
  defaultValue: ColumnFilterValue;
  op?: ColumnFilterOp;
  variant?: ColumnFilterVariant;
}

/**
 * A limited subset of all possible filters that is currently
 * supported by a FilterContainer
 */
export declare type FilterContainerFilter =
  | SingleValueFilterClause
  | MultiClauseFilter<
    "and",
    | SingleValueFilterClause
    | MultiClauseFilter<"and", SingleValueFilterClause>
  >;

/**
 * Defines a filter that is managed by a FilterProvider/FilterContainer
 * and can be persisted.
 */
export interface FilterContainerFilterDescriptor {
  active: boolean;
  filter: FilterContainerFilter | null;
  id: string;
}

export interface FilterContainerFilterDescriptorWithFilter
  extends FilterContainerFilterDescriptor {
  filter: FilterContainerFilter;
}
