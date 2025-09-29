import type { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterDescriptor,
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
import { EventEmitter } from "../event-emitter";
import { VuuFilter } from "@vuu-ui/vuu-protocol-types";
import { getTypedValue } from "../form-utils";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";
import {
  asTimeString,
  isValidTimeString,
  Time,
  TimeString,
  toCalendarDate,
} from "../date";
import {
  isDateTimeDataValue,
  isTimeDataValue,
  toColumnDescriptor,
} from "../column-utils";

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
  filter?: FilterContainerFilter,
): ColumnFilterValue => {
  if (isSingleValueFilter(filter)) {
    if (filter?.column === column.name) {
      return stringifyBoolean(filter.value);
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
    }
  }

  return "";
};

export class FilterAggregator {
  #filters = new Map<
    string,
    SingleValueFilterClause | MultiClauseFilter<"and", SingleValueFilterClause>
  >();

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
    const { serverDataType = "string" } = column;
    if (Array.isArray(value)) {
      const value1 = getTypedValue(value[0].toString(), serverDataType);
      const value2 = getTypedValue(value[1].toString(), serverDataType);

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
      const typedValue = getTypedValue(value.toString(), serverDataType, true);

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

  /**
   * Remove filter for this colun. Return false if no filter found, otw true
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
      };
    }
  }
}

const convertValueToServerFormat = (
  column: ColumnDescriptor,
  value: ColumnFilterValue,
): ColumnFilterValue | Time => {
  if (isValidTimeString(value)) {
    return Time(value as TimeString)
      .asDate()
      .getTime();
  } else if (isDateTimeDataValue(column)) {
    return new Date(value as number).getTime(); //value is already in utc milliseconds? conversion may not be required
  }
  return value;
};

const convertValueToUIFormat = (
  column: ColumnDescriptor,
  value: ColumnFilterValue,
): ColumnFilterValue => {
  if (isTimeDataValue(column)) {
    return asTimeString(value, false);
  } else if (isDateTimeDataValue(column)) {
    return toCalendarDate(new Date(value as number)).toString();
  } else {
    return value;
  }
};

//TODO extend this to support <= and >=
const buildBetweenQueryString = (column: ColumnDescriptor, range: string[]) => {
  const lowerRange: string | undefined =
    range[0] !== undefined && range[0].length > 0
      ? `${column.name} > ${convertValueToServerFormat(column, range[0])}`
      : undefined;

  const upperRange: string | undefined =
    range[1] !== undefined && range[1].length > 0
      ? `${column.name} < ${convertValueToServerFormat(column, range[1])}`
      : undefined;

  if (lowerRange === undefined) return lowerRange;
  if (upperRange === undefined) return lowerRange;
  return `${lowerRange} and ${upperRange}`;
};

//Supports only SingleValue & Range filters
export const buildColumnFilterString = (
  column: ColumnDescriptor,
  op: ColumnFilterOp,
  value: ColumnFilterValue,
) => {
  if (Array.isArray(value)) {
    return buildBetweenQueryString(column, value);
  }
  return typeof value === "string" && !isValidTimeString(value)
    ? `${column.name} ${op} "${value}"`
    : `${column.name} ${op} ${convertValueToServerFormat(column, value)}`;
};

export type ColumnFilterStoreEvents = {
  onChange: (filter: VuuFilter) => void;
};
export class ColumnFilterStore extends EventEmitter<ColumnFilterStoreEvents> {
  #columns = new Map<string, ColumnDescriptor>();
  #filters = new Map<string, ColumnFilterDescriptor>();
  #values = new Map<string, ColumnFilterValue>();

  constructor(
    query: VuuFilter = { filter: "" },
    columnDescriptors: ColumnDescriptor[] = [],
  ) {
    super();
    this.filter = query;
    this.loadColumnDescriptors(columnDescriptors);
  }

  private loadColumnDescriptors(columnDescriptors: ColumnDescriptor[]) {
    columnDescriptors.forEach((descriptor) => {
      this.#columns.set(descriptor.name, descriptor);
    });
  }

  addFilter(
    column: ColumnDescriptor,
    op: ColumnFilterOp,
    value: ColumnFilterValue,
  ) {
    if (!this.#columns.has(column.name)) {
      this.#columns.set(column.name, column);
    }

    const { serverDataType = "string" } = column;
    const typedValue = Array.isArray(value)
      ? value
      : (getTypedValue(
          value.toString(),
          serverDataType,
          true,
        ) as ColumnFilterValue);

    this.#values.set(column.name, typedValue);
    this.#filters.set(column.name, {
      column,
      op,
      filterValue: typedValue,
    });
    this.emit("onChange", this.filter);
  }

  removeFilter(column: ColumnDescriptor) {
    if (this.#columns.has(column.name)) {
      this.#columns.delete(column.name);
      this.#filters.delete(column.name);
      this.#values.delete(column.name);
      this.emit("onChange", this.filter);
      return true;
    } else {
      this.emit("onChange", this.filter);
      return false;
    }
  }

  resetFilters() {
    this.#columns.clear();
    this.#filters.clear();
    this.#values.clear();
    this.emit("onChange", this.filter);
  }

  get columnValues(): Map<string, ColumnFilterValue> {
    return this.#values;
  }

  get filter(): VuuFilter {
    const { size } = this.#filters;
    if (size === 0) {
      return { filter: "" };
    } else {
      const result = Array.from(this.#filters.entries())
        .map(([column, descriptor]) => {
          const columnDescriptor = this.#columns.get(column);
          if (columnDescriptor)
            return buildColumnFilterString(
              columnDescriptor,
              descriptor.op,
              descriptor.filterValue,
            );
        })
        .filter((value) => value !== undefined);
      return {
        filter: result.join(result.length > 1 ? " and " : ""),
      };
    }
  }

  set filter(query: VuuFilter) {
    this.#columns.clear();
    this.#filters.clear();
    this.#values.clear();

    if (query.filter) {
      const f = parseFilter(query.filter);

      const addToStore = (f: Filter) => {
        if (f.column) {
          const defaultColumnDescriptor = toColumnDescriptor(f.column);
          if (!this.#columns.has(f.column)) {
            this.#columns.set(f.column, defaultColumnDescriptor);
          }
          const columnDescriptor: ColumnDescriptor =
            this.#columns.get(f.column) || defaultColumnDescriptor;

          const existing = this.#filters.get(f.column);
          if (isSingleValueFilter(f)) {
            const v = existing
              ? [
                  existing.filterValue as string,
                  convertValueToUIFormat(columnDescriptor, f.value as string),
                ]
              : convertValueToUIFormat(
                  columnDescriptor,
                  f.value as ColumnFilterValue,
                );

            this.#values.set(f.column, v as ColumnFilterValue);
            this.#filters.set(f.column, {
              column: columnDescriptor,
              op: f.op,
              filterValue: v as ColumnFilterValue,
            });
          }
        }
      };

      if (isMultiClauseFilter(f)) {
        f.filters.forEach((f) => addToStore(f));
      } else if (isFilterClause(f)) {
        addToStore(f);
      }
    }
  }
}
