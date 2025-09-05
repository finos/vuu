import type { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import {
  AndFilter,
  ColumnFilterDescriptor,
  ColumnFilterOp,
  ColumnFilterValue,
  Filter,
  FilterClauseOp,
  FilterWithPartialClause,
  MultiClauseFilter,
  MultiValueFilterClause,
  OrFilter,
  SingleValueFilterClause,
  SingleValueFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";
import { EventEmitter } from "../event-emitter";
import { VuuFilter, VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { getTypedValue } from "../form-utils";
import { parseFilter } from "@vuu-ui/vuu-filter-parser";

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
export const isAndFilter = (f: Partial<Filter>): f is AndFilter =>
  f.op === "and";
export const isOrFilter = (f: Partial<Filter>): f is OrFilter => f.op === "or";

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

export type FilterEvents = {
  filter: (vuuFilter: VuuFilter) => void;
};

const createFilterClause = (column: string, value: VuuRowDataItemType) =>
  typeof value === "string"
    ? `${column} contains "${value}"`
    : `${column} = ${value}`;

export class FilterAggregator extends EventEmitter<FilterEvents> {
  #columns = new Map<string, ColumnDescriptor>();
  #filters = new Map<string, VuuRowDataItemType>();

  addFilter(column: ColumnDescriptor, value: string | number) {
    this.#columns.set(column.name, column);
    const { serverDataType = "string" } = column;
    const typedValue = getTypedValue(value.toString(), serverDataType, true);

    this.#filters.set(column.name, typedValue);
    // this.emit("filter", this.filter);
  }

  removeFilter(column: ColumnDescriptor) {
    if (this.#columns.has(column.name)) {
      this.#columns.delete(column.name);
      this.#filters.delete(column.name);
      return true;
    } else {
      return false;
    }
  }

  get filter(): VuuFilter {
    const { size } = this.#filters;
    if (size === 0) {
      return { filter: "" };
    } else {
      return {
        filter: Array.from(this.#filters.entries())
          .map((args) => createFilterClause(...args))
          .join(" and "),
      };
    }
  }
}

export type ColumnFilterStoreEvents = {
  onAdd: (filter: VuuFilter) => void;
  onRemove: (filter: VuuFilter) => void;
  onReset: (filter: VuuFilter) => void;
  onLoad: (values: [string, ColumnFilterValue][]) => void;
};

const buildBetweenQueryString = (columnName: string, range: string[]) => {
  const lowerRange: string | undefined =
    range[0] !== undefined && range[0].length > 0
      ? `${columnName} >= ${range[0]}`
      : undefined;

  const upperRange: string | undefined =
    range[1] !== undefined && range[1].length > 0
      ? `${columnName} <= ${range[1]}`
      : undefined;

  if (lowerRange === undefined) return lowerRange;
  if (upperRange === undefined) return lowerRange;
  return `${lowerRange} and ${upperRange}`;
};

//Supports only SingleValue & Range filters
export const buildColumnFilterString = (
  columnName: string,
  op: ColumnFilterOp,
  value: ColumnFilterValue,
) => {
  if (Array.isArray(value)) return buildBetweenQueryString(columnName, value);
  return typeof value === "string"
    ? `${columnName} ${op} "${value}"`
    : `${columnName} ${op} ${value}`;
};

export class ColumnFilterStore extends EventEmitter<ColumnFilterStoreEvents> {
  #columns = new Map<string, ColumnDescriptor>();
  #filters = new Map<string, ColumnFilterDescriptor>();

  loadStore(query: VuuFilter) {
    // Clear previous state
    this.#columns.clear();
    this.#filters.clear();
    const values = new Map<string, ColumnFilterValue>();

    if (query.filter) {
      const f = parseFilter(query.filter);

      const addToStore = (f: Filter) => {
        if (f.column) {
          const columnDescriptor: ColumnDescriptor = { name: f.column }; //serverDataType?
          this.#columns.set(f.column, columnDescriptor);

          const existing = this.#filters.get(f.column);
          if (isSingleValueFilter(f)) {
            const v = existing
              ? [existing.filterValue as string, f.value as string]
              : (f.value as ColumnFilterValue);

            values.set(f.column, v);
            this.#filters.set(f.column, {
              column: columnDescriptor,
              op: f.op,
              filterValue: v,
            });
          }
        }
      };

      if (isMultiClauseFilter(f)) {
        f.filters.forEach((f) => addToStore(f));
      } else if (isFilterClause(f)) {
        addToStore(f);
      }
      this.emit("onLoad", values.size > 0 ? Array.from(values.entries()) : []);
    }
  }

  addFilter(
    column: ColumnDescriptor,
    op: ColumnFilterOp,
    value: ColumnFilterValue,
  ) {
    this.#columns.set(column.name, column);
    const { serverDataType = "string" } = column;
    const typedValue = Array.isArray(value)
      ? value
      : getTypedValue(value.toString(), serverDataType, true);

    this.#filters.set(column.name, { column, op, filterValue: typedValue });
    this.emit("onAdd", this.filter);
  }

  removeFilter(column: ColumnDescriptor) {
    if (this.#columns.has(column.name)) {
      this.#columns.delete(column.name);
      this.#filters.delete(column.name);
      this.emit("onRemove", this.filter);
      return true;
    } else {
      this.emit("onRemove", this.filter);
      return false;
    }
  }

  resetFilters() {
    this.#columns.clear();
    this.#filters.clear();
    this.emit("onReset", this.filter);
  }

  get filter(): VuuFilter {
    const { size } = this.#filters;
    if (size === 0) {
      return { filter: "" };
    } else {
      return {
        filter: Array.from(this.#filters.entries())
          .map(([column, descriptor]) =>
            buildColumnFilterString(
              column,
              descriptor.op,
              descriptor.filterValue,
            ),
          )
          .join(" and "),
      };
    }
  }
}
