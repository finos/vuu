import type { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterOp,
  ColumnFilterValue,
  Filter,
  FilterClauseOp,
  FilterContainerFilter,
  FilterWithPartialClause,
  MultiClauseFilter,
  MultiValueFilterClause,
  SingleValueFilterClause,
  SingleValueFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { getTypedValue } from "../form-utils";
import { isTypeDescriptor } from "../column-utils";

const singleValueFilterOps = new Set<SingleValueFilterClauseOp>([
  "=",
  "!=",
  ">",
  ">=",
  "<",
  "<=",
  "contains",
  "starts",
  "ends",
]);

export const isValidFilterClauseOp = (op?: string): op is FilterClauseOp =>
  op === "in" || singleValueFilterOps.has(op as SingleValueFilterClauseOp);

export const isNamedFilter = (f?: Filter) =>
  f !== undefined && f.name !== undefined;

// ... with type constraints
export const isSingleValueFilter = (
  f?: Partial<Filter>,
): f is SingleValueFilterClause =>
  f !== undefined &&
  singleValueFilterOps.has(f.op as SingleValueFilterClauseOp);

export const isFilterClause = (
  f?: Partial<Filter>,
): f is SingleValueFilterClause | MultiValueFilterClause =>
  f !== undefined && (isSingleValueFilter(f) || isMultiValueFilter(f));

export const isMultiValueFilter = (
  f?: Partial<Filter>,
): f is MultiValueFilterClause => f !== undefined && f.op === "in";

export const isInFilter = (f: Partial<Filter>): f is MultiValueFilterClause =>
  f.op === "in";
export const isAndFilter = (
  f?: Partial<Filter>,
): f is MultiClauseFilter<"and"> => f?.op === "and";

export const isBetweenFilter = (
  f?: Filter,
): f is MultiClauseFilter<"and", SingleValueFilterClause> =>
  isAndFilter(f) &&
  f.filters.length === 2 &&
  f.filters[0].column === f.filters[1].column &&
  f.filters[0].op === ">" &&
  f.filters[1].op === "<";

export const isOrFilter = (f?: Partial<Filter>): f is MultiClauseFilter<"or"> =>
  f?.op === "or";

export const isCompleteFilter = (filter: Partial<Filter>): filter is Filter =>
  isSingleValueFilter(filter) &&
  filter.column !== undefined &&
  filter.op !== undefined &&
  filter.value !== undefined;

export function isMultiClauseFilter(
  f?: Partial<Filter> | FilterWithPartialClause,
): f is MultiClauseFilter {
  return f !== undefined && (f.op === "and" || f.op === "or");
}

export const applyFilterToColumns = (
  columns: RuntimeColumnDescriptor[],
  { filterStruct }: DataSourceFilter,
) =>
  columns.map((column) => {
    // TODO this gives us a dependency on vuu-filters
    const filter = extractFilterForColumn(filterStruct, column.name);
    if (filter !== undefined) {
      return {
        ...column,
        filter,
      };
    } else if (column.filter) {
      return {
        ...column,
        filter: undefined,
      };
    } else {
      return column;
    }
  });

export const isFilteredColumn = (column: RuntimeColumnDescriptor) =>
  column.filter !== undefined;

export const stripFilterFromColumns = (columns: RuntimeColumnDescriptor[]) =>
  columns.map((col) => {
    const { filter, ...rest } = col;
    return filter ? rest : col;
  });

export const extractFilterForColumn = (
  filter: Filter | undefined,
  columnName: string,
) => {
  if (isMultiClauseFilter(filter)) {
    return collectFiltersForColumn(filter, columnName);
  }
  if (isFilterClause(filter)) {
    return filter.column === columnName ? filter : undefined;
  }
  return undefined;
};

const collectFiltersForColumn = (
  filter: MultiClauseFilter,
  columnName: string,
) => {
  const { filters, op } = filter;
  const results: Filter[] = [];
  filters.forEach((filter) => {
    const ffc = extractFilterForColumn(filter, columnName);
    if (ffc) {
      results.push(ffc);
    }
  });
  if (results.length === 0) {
    return undefined;
  } else if (results.length === 1) {
    return results[0];
  }
  return {
    op,
    filters: results,
  };
};

// Just until we fully support bool values in filters
const stringifyBoolean = (value: string | number | boolean) =>
  typeof value === "boolean" ? "${filter.value}" : value;

export const getColumnValueFromFilter = (
  column: ColumnDescriptor,
  operator: ColumnFilterOp,
  filter?: FilterContainerFilter,
): ColumnFilterValue => {
  if (isSingleValueFilter(filter)) {
    if (filter.column === column.name) {
      if (operator === "between") {
        if (filter.op === "=") {
          return [`${filter.value}`, ""];
        } else if (filter.op === "<") {
          return ["", `${filter.value}`];
        }
      } else {
        return stringifyBoolean(filter.value);
      }
    }
  } else if (isBetweenFilter(filter)) {
    if (filter.filters[0].column === column.name) {
      const [{ value: v1 }, { value: v2 }] = filter.filters;
      return [`${v1}`, `${v2}`];
    } else {
      return ["", ""];
    }
  } else if (isAndFilter(filter)) {
    const filterForColumn = filter.filters.find((f) =>
      isBetweenFilter(f)
        ? f.filters[0].column === column.name
        : f.column === column.name,
    );
    if (isSingleValueFilter(filterForColumn)) {
      return stringifyBoolean(filterForColumn.value);
    } else if (operator === "between" && isBetweenFilter(filterForColumn)) {
      const [{ value: v1 }, { value: v2 }] = filterForColumn.filters;
      return [`${v1}`, `${v2}`];
    }
  }
  if (operator === "between") {
    if (column.type === "time") {
      return ["00:00:00", "23:59:59"];
    } else {
      return ["", ""];
    }
  } else {
    return "";
  }
};

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
    if (isSingleValueFilter(filter)) {
      this.#filters.set(filter.column, filter);
    } else if (isBetweenFilter(filter)) {
      this.#filters.set(filter.filters[0].column, filter);
    } else if (isAndFilter(filter)) {
      filter.filters.forEach((f) => {
        if (isBetweenFilter(f)) {
          this.#filters.set(f.filters[0].column, f);
        } else {
          this.#filters.set(f.column, f);
        }
      });
    }
  }

  add(column: ColumnDescriptor, value: ColumnFilterValue) {
    const { serverDataType = "string", type } = column;
    const dataType = isTypeDescriptor(type)
      ? type.name
      : (type ?? serverDataType);
    console.log(
      `FilterAggregator add ${column.name} ${serverDataType} ${JSON.stringify(type)} ${JSON.stringify(value)}`,
    );
    if (Array.isArray(value)) {
      const value1 = getTypedValue(value[0].toString(), dataType);
      const value2 = getTypedValue(value[1].toString(), dataType);

      if (value1 !== undefined && value2 !== undefined) {
        this.#filters.set(column.name, {
          op: "and",
          filters: [
            { column: column.name, op: ">", value: value1 },
            { column: column.name, op: "<", value: value2 },
          ],
        });
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
