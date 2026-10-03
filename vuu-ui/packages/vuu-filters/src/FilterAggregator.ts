import {
  ColumnFilterValue,
  ExtendedFilterOptions,
  FilterClauseOp,
  FilterContainerFilter,
  SingleValueFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  EpochTimestamp,
  getTemporalInfo,
  getTypedValueForDescriptor,
  isAndFilter,
  isBetweenFilter,
  isExtendedFilter,
  isMultiClauseFilter,
  isSingleValueFilter,
  type TemporalInfo,
} from "@vuu-ui/vuu-utils";
import { ExtendedSingleValueFilterClause } from "./filter-container/ExtendedSingleValueFilterClause";

function installExtendedFilters<
  F extends FilterContainerFilter = FilterContainerFilter,
>(filter: F, throwIfUndefined: true): F;
function installExtendedFilters<
  F extends FilterContainerFilter = FilterContainerFilter,
>(filter: F | undefined, throwIfUndefined?: false): F | undefined;

function installExtendedFilters(
  filter: FilterContainerFilter | undefined,
  throwIfUndefined = false,
): FilterContainerFilter | undefined {
  if (filter !== undefined) {
    if (isExtendedFilter(filter)) {
      const { column, op, value, extendedOptions } = filter;
      return new ExtendedSingleValueFilterClause(
        column,
        op,
        value,
        extendedOptions,
      );
    } else if (isMultiClauseFilter(filter)) {
      if (filter.filters.some(isExtendedFilter)) {
        return {
          op: filter.op,
          filters: filter.filters.map((f) => installExtendedFilters(f, true)),
        };
      } else {
        return filter;
      }
    } else {
      return filter;
    }
  }
  if (throwIfUndefined) {
    throw Error("filter is undefined");
  }
}

/**
 * Time of day columns are filtered using TimeString values, resolved against
 * today's date when the filter query is created (unless client provides
 * alternative options). This ensures a persisted time filter is not tied to
 * the date on which it was created.
 */
const getExtendedFilterOptions = (
  temporalInfo: TemporalInfo | undefined,
  extendedFilterOptions?: ExtendedFilterOptions,
): ExtendedFilterOptions | undefined => {
  if (temporalInfo?.kind === "time") {
    return {
      type: "TimeString",
      date: "today",
      encoding: temporalInfo.encoding,
      timeZone: temporalInfo.timeZone,
      ...extendedFilterOptions,
    } as ExtendedFilterOptions;
  }
  return extendedFilterOptions;
};

const getFilterValue = (
  column: ColumnDescriptor,
  value: string,
  temporalInfo: TemporalInfo | undefined,
  options: ExtendedFilterOptions | undefined,
  throwIfInvalid: boolean,
): VuuRowDataItemType | undefined => {
  if (value === "") {
    if (throwIfInvalid && !temporalInfo) {
      return getTypedValueForDescriptor(
        value,
        column,
        true,
      ) as VuuRowDataItemType;
    }
    return undefined;
  } else if (options?.type === "TimeString") {
    return asFilterTimeString(value, temporalInfo, throwIfInvalid);
  } else {
    return getTypedValueForDescriptor(value, column, throwIfInvalid) as
      | VuuRowDataItemType
      | undefined;
  }
};

const timeOfDayPattern = /^\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?$/;

/**
 * Accepts a TimeString (hh:mm or hh:mm:ss[.fff]) or, for backward compatibility,
 * an epoch value (e.g from a filter persisted by an earlier version), which is
 * converted to the equivalent time of day.
 */
const asFilterTimeString = (
  value: string,
  temporalInfo: TemporalInfo | undefined,
  throwIfInvalid: boolean,
): string | undefined => {
  if (timeOfDayPattern.test(value)) {
    return value.length === 5 ? `${value}:00` : value;
  }
  const timestamp = EpochTimestamp.fromWire(
    value,
    temporalInfo?.encoding ?? "epochMillis",
  );
  if (timestamp && /^\d+$/.test(value)) {
    const { hour, minute, second } = timestamp.getFields(
      temporalInfo?.timeZone,
    );
    const pad = (n: number) => `${n}`.padStart(2, "0");
    return `${pad(hour)}:${pad(minute)}:${pad(second)}`;
  }
  if (throwIfInvalid) {
    throw Error(`[FilterAggregator] value ${value} is not a valid time`);
  }
};

const singleValueOps: SingleValueFilterClauseOp[] = [
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "contains",
  "starts",
  "ends",
];
const asSingleValueOp = (op: string): SingleValueFilterClauseOp =>
  singleValueOps.includes(op as SingleValueFilterClauseOp)
    ? (op as SingleValueFilterClauseOp)
    : "=";

/**
 * Manages a filter that can be updated one clause at a time.
 * Works with FilterContainer to aggregate multiple filter
 * clauses edited via individual controls. It is just a wrapper
 * around a Map, does not support switching filters - create a
 * new FilterAggregator for a new filter.
 *
 */
export class FilterAggregator {
  #filters = new Map<string, FilterContainerFilter>();

  constructor(filter?: FilterContainerFilter) {
    const runtimeFilter = installExtendedFilters(filter);
    if (isSingleValueFilter(runtimeFilter)) {
      this.#filters.set(runtimeFilter.column, runtimeFilter);
    } else if (isBetweenFilter(runtimeFilter)) {
      this.#filters.set(runtimeFilter.filters[0].column, runtimeFilter);
    } else if (isAndFilter(runtimeFilter)) {
      runtimeFilter.filters.forEach((f) => {
        if (isBetweenFilter(f)) {
          this.#filters.set(f.filters[0].column, f);
        } else {
          this.#filters.set(f.column, f);
        }
      });
    }
  }

  add(
    column: ColumnDescriptor,
    value: ColumnFilterValue,
    op: FilterClauseOp | "between" | "between-inclusive" = "=",
    extendedFilterOptions?: ExtendedFilterOptions,
  ) {
    const temporalInfo = getTemporalInfo(column);
    const options = getExtendedFilterOptions(
      temporalInfo,
      extendedFilterOptions,
    );
    const isInclusive = op === "between-inclusive";

    const createClause = (
      op: SingleValueFilterClauseOp,
      value: VuuRowDataItemType,
    ): FilterContainerFilter =>
      options
        ? new ExtendedSingleValueFilterClause(column.name, op, value, options)
        : { column: column.name, op, value };

    if (Array.isArray(value)) {
      const [value1, value2] = value.map((v) =>
        getFilterValue(column, v, temporalInfo, options, false),
      );
      if (value1 !== undefined && value2 !== undefined) {
        this.#filters.set(column.name, {
          op: "and",
          filters: [
            createClause(isInclusive ? ">=" : ">", value1),
            createClause(isInclusive ? "<=" : "<", value2),
          ],
        } as FilterContainerFilter);
      } else if (value1 !== undefined) {
        this.#filters.set(column.name, createClause("=", value1));
      } else if (value2 !== undefined) {
        this.#filters.set(
          column.name,
          createClause(isInclusive ? "<=" : "<", value2),
        );
      }
    } else {
      const typedValue = getFilterValue(
        column,
        value.toString(),
        temporalInfo,
        options,
        true,
      );
      if (typedValue === undefined) {
        // an empty temporal value clears the filter
        this.#filters.delete(column.name);
      } else {
        // Only temporal filters honour op, others always use '='
        this.#filters.set(
          column.name,
          createClause(temporalInfo ? asSingleValueOp(op) : "=", typedValue),
        );
      }
    }
  }

  has({ name }: ColumnDescriptor) {
    return this.#filters.has(name);
  }

  get({ name }: ColumnDescriptor) {
    return this.#filters.get(name);
  }

  clear() {
    this.#filters.clear();
  }

  /**
   * Remove filter for this column. Return false if no filter found, otw true
   */
  remove(column: ColumnDescriptor) {
    if (this.#filters.has(column.name)) {
      this.#filters.delete(column.name);
      return true;
    } else {
      return false;
    }
  }

  get isEmpty() {
    return this.#filters.size === 0;
  }

  /**
   * Count of the number of columns for which filters are stored
   */
  get count() {
    return this.#filters.size;
  }

  get filter(): FilterContainerFilter | undefined {
    const { size } = this.#filters;
    if (size === 0) {
      return undefined;
    } else if (size === 1) {
      const [filter] = this.#filters.values();
      return filter;
    } else {
      return {
        op: "and",
        filters: Array.from(this.#filters.values()),
      } as FilterContainerFilter;
    }
  }
}
