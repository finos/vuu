import type { DataSourceFilter } from "@vuu-ui/vuu-data-types";
import {
  ColumnFilterOp,
  ColumnFilterValue,
  ExtendedFilter,
  Filter,
  FilterClauseOp,
  FilterClauseOpBetween,
  FilterContainerFilter,
  FilterWithPartialClause,
  MultiClauseFilter,
  MultiValueFilterClause,
  SingleValueFilterClause,
  SingleValueFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import { SerializableFilter } from "@vuu-ui/vuu-filters/src/filter-container/ExtendedSingleValueFilterClause";
import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
} from "@vuu-ui/vuu-table-types";

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

export const isBetweenOperator = (
  op: ColumnFilterOp,
): op is FilterClauseOpBetween =>
  op === "between" || op === "between-inclusive";

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

export const isSerializableFilter = (f: object): f is SerializableFilter =>
  isSingleValueFilter(f) &&
  "asQuery" in f &&
  typeof f["asQuery"] === "function";

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
  ((f.filters[0].op === ">" && f.filters[1].op === "<") ||
    (f.filters[0].op === ">=" && f.filters[1].op === "<="));

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

export const isExtendedFilter = (f: Filter): f is ExtendedFilter =>
  typeof (f as ExtendedFilter).extendedOptions === "object";

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
      if (operator.startsWith("between")) {
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
    } else if (
      operator.startsWith("between") &&
      isBetweenFilter(filterForColumn)
    ) {
      const [{ value: v1 }, { value: v2 }] = filterForColumn.filters;
      return [`${v1}`, `${v2}`];
    }
  }
  if (operator.startsWith("between")) {
    if (column.type === "time") {
      return ["00:00:00", "23:59:59"];
    } else {
      return ["", ""];
    }
  } else {
    return "";
  }
};

type BetweenFilter = MultiClauseFilter<"and", SingleValueFilterClause>;
type ChildFilterClause = SingleValueFilterClause | BetweenFilter;

const betweenFiltersAreEqual = (f1: BetweenFilter, f2: BetweenFilter) => {
  const [from1, to1] = f1.filters;
  const [from2, to2] = f2.filters;
  return filtersAreEqual(from1, from2) && filtersAreEqual(to1, to2);
};

const singleValueFilterClausesAreEqual = (
  f1: SingleValueFilterClause,
  f2: SingleValueFilterClause,
) => f1.column === f2.column && f1.op === f2.op && f1.value === f2.value;

const findEqualFilter =
  (filters: ChildFilterClause[]) => (filter: ChildFilterClause) => {
    if (isBetweenFilter(filter)) {
      const target = filters.find(
        (f) => isBetweenFilter(f) && betweenFiltersAreEqual(f, filter),
      );
      return target !== undefined;
    } else {
      // A FilterContainerFilter only has one filter clause per column
      const target = filters.find((f) => f.column === filter.column);
      if (target) {
        return target.op === filter.op && target.value === filter.value;
      }
    }
    return false;
  };

export const filtersAreEqual = (
  f1: FilterContainerFilter,
  f2: FilterContainerFilter,
): boolean => {
  if (isSingleValueFilter(f1) && isSingleValueFilter(f2)) {
    return singleValueFilterClausesAreEqual(f1, f2);
  } else if (isBetweenFilter(f1) && isBetweenFilter(f2)) {
    return betweenFiltersAreEqual(f1, f2);
  } else if (isAndFilter(f1) && isAndFilter(f2)) {
    if (f1.filters.length === f2.filters.length) {
      return f1.filters.every(findEqualFilter(f2.filters));
    }
  }

  return false;
};
