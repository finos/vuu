import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { extractFilterForColumn, partition, Row } from "@finos/vuu-utils";
import {
  isAndFilter,
  isInFilter,
  isMultiClauseFilter,
  isMultiValueFilter,
  isOrFilter,
  isSingleValueFilter,
} from "./filterTypes";
import {
  AndFilter,
  Filter,
  FilterClause,
  FilterCombinatorOp,
} from "@finos/vuu-filter-types";

export const AND = "and";
export const EQUALS = "=";
export const GREATER_THAN = ">";
export const LESS_THAN = "<";
export const OR = "or";
export const STARTS_WITH = "starts";
export const ENDS_WITH = "ends";
export const IN = "in";

export type FilterType =
  | "and"
  | "="
  | ">"
  | ">="
  | "in"
  | "<="
  | "<"
  | "NOT_IN"
  | "NOT_SW"
  | "or"
  | "SW";

export const filterClauses = (
  filter: Filter | null,
  clauses: FilterClause[] = []
) => {
  if (filter) {
    if (isMultiClauseFilter(filter)) {
      filter.filters.forEach((f) => clauses.push(...filterClauses(f)));
    } else {
      clauses.push(filter);
    }
  }
  return clauses;
};

type AddFilterOptions = {
  combineWith: FilterCombinatorOp;
};

const DEFAULT_ADD_FILTER_OPTS: AddFilterOptions = {
  combineWith: "and",
};

export const addFilter = (
  existingFilter: Filter | undefined,
  filter: Filter,
  { combineWith = AND }: AddFilterOptions = DEFAULT_ADD_FILTER_OPTS
): Filter | undefined => {
  if (includesNoValues(filter)) {
    if (isMultiClauseFilter(filter)) {
      // TODO identify the column that is contributing the no-values filter
    } else {
      existingFilter = removeFilterForColumn(existingFilter, {
        name: filter.column,
      });
    }
  } else if (includesAllValues(filter)) {
    if (isMultiClauseFilter(filter)) {
      // TODO identify the column that is contributing the all-values filter
    }
    return removeFilterForColumn(existingFilter, { name: filter.column ?? "" });
  }

  if (!existingFilter) {
    return filter;
  }
  if (!filter) {
    return existingFilter;
  }
  if (existingFilter.op === AND && filter.op === AND) {
    return {
      op: AND,
      filters: combine(existingFilter.filters, filter.filters),
    };
  }
  if (existingFilter.op === AND) {
    const filters = replaceOrInsert(existingFilter.filters, filter);
    return filters.length > 1 ? { op: AND, filters } : filters[0];
  }
  if (filter.op === AND) {
    return { op: AND, filters: filter.filters.concat(existingFilter) };
  }

  if (filterEquals(existingFilter, filter, true)) {
    return filter;
  }

  if (sameColumn(existingFilter, filter)) {
    return merge(existingFilter, filter);
  }

  return { op: combineWith, filters: [existingFilter, filter] };
};

const includesNoValues = (filter?: Filter | null): boolean => {
  if (!filter) {
    return false;
  }
  if (isInFilter(filter) && filter.values.length === 0) {
    return true;
  }
  return isAndFilter(filter) && filter.filters.some((f) => includesNoValues(f));
};

export const filterAsQuery = (f: Filter, namedFilters = {}): string => {
  if (isMultiClauseFilter(f)) {
    const [clause1, clause2] = f.filters;
    return `${filterAsQuery(clause1, namedFilters)} ${f.op} ${filterAsQuery(
      clause2,
      namedFilters
    )}`;
  }
  if (isMultiValueFilter(f)) {
    return `${f.column} ${f.op} [${f.values.join(",")}]`;
  }
  return `${f.column} ${f.op} ${f.value}`;
};

interface CommonFilter {
  colName?: string;
  otherColFilters?: Filter[];
  mode?: any;
  value?: any;
  values?: any;
  op?: "or" | "and";
  column?: string;
  filters?: Filter[];
}

export interface OtherFilter extends CommonFilter {
  type: FilterType;
  values?: any[];
}

export type RowFilterFn = (row: Row) => boolean;

const includesAllValues = (filter?: Filter | null): boolean => {
  if (!filter) {
    return false;
  }
  if (filter.op === STARTS_WITH && filter.value === "") {
    return true;
  }
  return filter.op === STARTS_WITH && filter.value === "";
};

const replaceOrInsert = (filters: Filter[], filter: Filter) => {
  return filters.concat(filter);
};

const merge = (f1: Filter, f2: Filter): Filter | undefined => {
  if (includesNoValues(f2)) {
    return f2;
  }
  if (isInFilter(f1) && isInFilter(f2)) {
    return {
      ...f1,
      values: [
        ...f1.values,
        ...(f2.values as any[]).filter(
          (v: string | number) => !(f1.values as any[]).includes(v)
        ),
      ],
    };
  }
  if (f1.op === STARTS_WITH && f2.op === STARTS_WITH) {
    return {
      op: OR,
      filters: [f1, f2],
    };
  }
  return f2;
};

const combine = (existingFilters: Filter[], replacementFilters: Filter[]) => {
  const equivalentType = ({ op: t1 }: Filter, { op: t2 }: Filter) => {
    return t1 === t2 || t1[0] === t2[0];
  };
  const replaces = (existingFilter: Filter, replacementFilter: Filter) => {
    return (
      existingFilter.column === replacementFilter.column &&
      equivalentType(existingFilter, replacementFilter)
    );
  };
  const stillApplicable = (existingFilter: Filter) =>
    replacementFilters.some((replacementFilter) =>
      replaces(existingFilter, replacementFilter)
    ) === false;
  return existingFilters.filter(stillApplicable).concat(replacementFilters);
};

export const removeColumnFromFilter = (
  column: KeyedColumnDescriptor,
  filter: Filter
): [Filter | undefined, string] => {
  if (isMultiClauseFilter(filter)) {
    const [clause1, clause2] = filter.filters;
    if (clause1.column === column.name) {
      return [clause2, filterAsQuery(clause2)];
    }
    if (clause2.column === column.name) {
      return [clause1, filterAsQuery(clause1)];
    }
  }
  return [undefined, ""];
};

export const removeFilter = (sourceFilter: Filter, filterToRemove: Filter) => {
  if (filterEquals(sourceFilter, filterToRemove, true)) {
    return null;
  }
  if (sourceFilter.op !== AND) {
    throw Error(
      `removeFilter cannot remove ${JSON.stringify(
        filterToRemove
      )} from ${JSON.stringify(sourceFilter)}`
    );
  }
  const filters = sourceFilter.filters.filter(
    (f) => !filterEquals(f, filterToRemove)
  );
  return filters.length > 0 ? { type: AND, filters } : null;
};

export const splitFilterOnColumn = (
  filter: Filter | null,
  columnName: string
): [Filter | null, Filter | null] => {
  if (!filter) {
    return [null, null];
  }
  if (filter.column === columnName) {
    return [filter, null];
  }
  if (filter.op !== AND) {
    return [null, filter];
  }
  const [[columnFilter = null], filters] = partition(
    (filter as AndFilter).filters,
    (f) => f.column === columnName
  );
  return filters.length === 1
    ? [columnFilter, filters[0]]
    : [columnFilter, { op: AND, filters }];
};

export const overrideColName = (filter: Filter, column: string): Filter => {
  if (isMultiClauseFilter(filter)) {
    return {
      op: filter.op,
      filters: filter.filters.map((f) => overrideColName(f, column)),
    };
  }
  return { ...filter, column };
};

export const filterIncludesColumn = (
  filter: Filter,
  column: KeyedColumnDescriptor
): boolean => {
  if (!filter) {
    return false;
  }
  const { op, column: filterColName } = filter;
  switch (op) {
    case AND:
    case OR:
      return (
        filter.filters != null &&
        filter.filters.some((f) => filterIncludesColumn(f, column))
      );
    default:
      return filterColName === column.name;
  }
};

const removeFilterForColumn = (
  sourceFilter: Filter | undefined,
  column: ColumnDescriptor
): Filter | undefined => {
  const colName = column.name;
  if (!sourceFilter) {
    return undefined;
  }
  if (sourceFilter.column === colName) {
    return undefined;
  }
  if (isAndFilter(sourceFilter) || isOrFilter(sourceFilter)) {
    const { op } = sourceFilter;
    const filters = sourceFilter.filters;
    const otherColFilters = filters.filter((f) => f.column !== colName);
    switch (otherColFilters.length) {
      case 0:
        return undefined;
      case 1:
        return otherColFilters[0];
      default:
        return { op, filters: otherColFilters };
    }
  }
  return sourceFilter;
};

const sameColumn = (f1: Filter, f2: Filter) => f1.column === f2.column;

const sameValues = <T>(arr1: T[], arr2: T[]) => {
  if (arr1 === arr2) {
    return true;
  }
  if (arr1.length === arr2.length) {
    const a = arr1.slice().sort();
    const b = arr2.slice().sort();
    return a.join("|") === b.join("|");
  }
  return false;
};

export const filterEquals = (f1?: Filter, f2?: Filter, strict = false) => {
  if (!strict) {
    return true;
  }
  if (f1 && f2 && sameColumn(f1, f2)) {
    return (
      f1.op === f2.op &&
      ((isSingleValueFilter(f1) &&
        isSingleValueFilter(f2) &&
        f1.value === f2.value) ||
        (isMultiValueFilter(f1) &&
          isMultiValueFilter(f2) &&
          sameValues(f1.values as any[], f2.values)))
    );
  }
  return false;
};

export const updateFilter = (
  filter: Filter | undefined,
  newFilter: Filter | undefined,
  mode: "add" | "replace"
): Filter | undefined => {
  if (filter && newFilter) {
    if (mode === "replace") {
      return newFilter;
    }
    if (filter.op === "and") {
      return {
        ...filter,
        filters: filter.filters.concat(newFilter),
      };
    }
    const { column: columnName } = newFilter;
    if (columnName) {
      const existingClause = newFilter.column
        ? extractFilterForColumn(filter, columnName)
        : undefined;
      if (existingClause && columnName) {
        // The filter already contains a clause for this column, replace
        // with the new clause
        const result = removeFilterForColumn(filter, { name: columnName });
        return updateFilter(result, newFilter, "add");
      }
    }
    return {
      op: "and",
      filters: [filter, newFilter],
    };
  }
  if (newFilter) {
    return newFilter;
  }
  return filter;
};
