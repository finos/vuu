import {
  ColumnFilterValue,
  ExtendedFilterOptions,
  FilterClauseOp,
  FilterContainerFilter,
} from "@vuu-ui/vuu-filter-types";
import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  getTypedRange,
  getTypedValue,
  isAndFilter,
  isBetweenFilter,
  isExtendedFilter,
  isMultiClauseFilter,
  isSingleValueFilter,
  isTypeDescriptor,
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
    op: FilterClauseOp | "between" | "between-inclusive",
    extendedFilterOptions?: ExtendedFilterOptions,
  ) {
    const { serverDataType = "string", type } = column;
    const isInclusive = op === "between-inclusive";
    const dataType = isTypeDescriptor(type)
      ? type.name
      : (type ?? serverDataType);
    if (Array.isArray(value)) {
      const [value1, value2] = getTypedRange(
        value,
        dataType,
        extendedFilterOptions,
      );
      if (value1 !== undefined && value2 !== undefined) {
        const filter: FilterContainerFilter = extendedFilterOptions
          ? {
              op: "and",
              filters: [
                new ExtendedSingleValueFilterClause(
                  column.name,
                  isInclusive ? ">=" : ">",
                  value1,
                  extendedFilterOptions,
                ),
                new ExtendedSingleValueFilterClause(
                  column.name,
                  isInclusive ? "<=" : "<",
                  value2,
                  extendedFilterOptions,
                ),
              ],
            }
          : {
              op: "and",
              filters: [
                { column: column.name, op: ">", value: value1 },
                { column: column.name, op: "<", value: value2 },
              ],
            };

        this.#filters.set(column.name, filter);
      } else if (value1 !== undefined) {
        this.#filters.set(column.name, {
          column: column.name,
          op: "=",
          value: value1,
        });
      } else if (value2 !== undefined) {
        this.#filters.set(column.name, {
          column: column.name,
          op: "<",
          value: value2,
        });
      }
    } else {
      const typedValue = getTypedValue(value.toString(), dataType, true);

      this.#filters.set(column.name, {
        column: column.name,
        op: "=",
        value: typedValue,
      });
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
