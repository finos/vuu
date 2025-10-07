import { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  Filter,
  FilterClause,
  FilterCombinatorOp,
  FilterContainerFilter,
  FilterContainerFilterDescriptor,
  FilterWithPartialClause,
  MultiClauseFilter,
  NumericFilterClauseOp,
} from "@vuu-ui/vuu-filter-types";
import {
  extractFilterForColumn,
  filtersAreEqual,
  isAndFilter,
  isBetweenFilter,
  isInFilter,
  isMultiClauseFilter,
  isMultiValueFilter,
  isOrFilter,
  isSingleValueFilter,
  isTimeDataValue,
  partition,
  Time,
} from "@vuu-ui/vuu-utils";

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
  filter: Partial<Filter> | FilterWithPartialClause | null,
  clauses: Partial<FilterClause>[] = [],
): Partial<FilterClause>[] => {
  if (filter) {
    if (isMultiClauseFilter(filter)) {
      filter.filters.forEach((f) => clauses.push(...filterClauses(f)));
    } else {
      clauses.push(filter as Partial<FilterClause>);
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

export const removeLastClause = (filter: MultiClauseFilter) => {
  const { filters } = filter;
  if (filters.length > 2) {
    return {
      ...filter,
      filters: filter.filters.slice(0, -1),
    };
  } else {
    // must be 2, we never have 1
    return filter.filters[0];
  }
};

/**
  Allows an empty FilterClause to be appended to an existing filter - for use
  in filter editing UI only.
*/
export const addClause = (
  existingFilter: Filter,
  clause: Partial<Filter>,
  { combineWith = AND }: AddFilterOptions = DEFAULT_ADD_FILTER_OPTS,
): FilterWithPartialClause => {
  if (
    isMultiClauseFilter(existingFilter) &&
    existingFilter.op === combineWith
  ) {
    // if (isCompleteFilter(clause)) {
    return {
      ...existingFilter,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      filters: existingFilter.filters.concat(clause),
    };
    // } else {
    //   throw Error(
    //     "filter-utils, replaceFilter, only a valid clause can be added to a filter"
    //   );
    // }
  } else {
    return {
      op: combineWith,
      filters: [existingFilter, clause],
    };
  }
};

export const addFilter = (
  existingFilter: Filter | undefined,
  filter: Filter,
  { combineWith = AND }: AddFilterOptions = DEFAULT_ADD_FILTER_OPTS,
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

  if (canMerge(existingFilter, filter)) {
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

interface CommonFilter {
  colName?: string;
  otherColFilters?: Filter[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mode?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any;
  op?: "or" | "and";
  column?: string;
  filters?: Filter[];
}

export interface OtherFilter extends CommonFilter {
  type: FilterType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  values?: any[];
}

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ...(f2.values as any[]).filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (v: string | number) => !(f1.values as any[]).includes(v),
        ),
      ],
    };
  } else if (isInFilter(f1) && f2.op === EQUALS) {
    return {
      ...f1,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      values: f1.values.concat([f2.value]),
    };
  } else if (f1.op === EQUALS && f2.op === EQUALS) {
    return {
      column: f1.column,
      op: IN,
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      values: [f1.value, f2.value],
    };
  }
  return f2;
};

const combine = (existingFilters: Filter[], replacementFilters: Filter[]) => {
  const equivalentType = ({ op: op1 }: Filter, { op: op2 }: Filter) => {
    return (
      op1 === op2 ||
      (op1[0] === ">" && op2[0] === ">") ||
      (op1[0] === "<" && op2[0] === "<")
    );
  };
  const replaces = (existingFilter: Filter, replacementFilter: Filter) => {
    return (
      existingFilter.column === replacementFilter.column &&
      equivalentType(existingFilter, replacementFilter)
    );
  };
  const stillApplicable = (existingFilter: Filter) =>
    replacementFilters.some((replacementFilter) =>
      replaces(existingFilter, replacementFilter),
    ) === false;
  return existingFilters.filter(stillApplicable).concat(replacementFilters);
};

export const removeFilter = (sourceFilter: Filter, filterToRemove: Filter) => {
  if (filterEquals(sourceFilter, filterToRemove, true)) {
    return null;
  }
  if (sourceFilter.op !== AND) {
    throw Error(
      `removeFilter cannot remove ${JSON.stringify(
        filterToRemove,
      )} from ${JSON.stringify(sourceFilter)}`,
    );
  }
  const filters = sourceFilter.filters.filter(
    (f) => !filterEquals(f, filterToRemove),
  );
  return filters.length > 0 ? { type: AND, filters } : null;
};

export const splitFilterOnColumn = (
  columnName: string,
  filter?: Filter,
): [Filter | undefined, Filter | undefined] => {
  if (!filter) {
    return [undefined, undefined];
  }
  if (filter.column === columnName) {
    return [filter, undefined];
  }
  if (filter.op !== AND) {
    return [undefined, filter];
  }
  const [[columnFilter = undefined], filters] = partition(
    (filter as MultiClauseFilter<"and">).filters,
    (f) => f.column === columnName,
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
  column: ColumnDescriptor,
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
  column: ColumnDescriptor,
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

const canMerge = (f1: Filter, f2: Filter) =>
  f1.column === f2.column &&
  (f1.op === "=" || f1.op === "in") &&
  (f2.op === "=" || f2.op === "in");

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
  if (f1 && f2 && canMerge(f1, f2)) {
    return (
      f1.op === f2.op &&
      ((isSingleValueFilter(f1) &&
        isSingleValueFilter(f2) &&
        f1.value === f2.value) ||
        (isMultiValueFilter(f1) &&
          isMultiValueFilter(f2) &&
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          sameValues(f1.values as any[], f2.values)))
    );
  }
  return false;
};

export const updateFilter = (
  filter: Filter | undefined,
  newFilter: Filter | undefined,
  mode: "add" | "replace",
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

export const getTypeaheadFilter = (
  column: string,
  filterValues: string[],
  isStartsWithFilter?: boolean,
): Filter | undefined => {
  if (filterValues.length === 0) {
    return undefined;
  }

  if (isStartsWithFilter) {
    // multiple starts with filters not currently supported
    const startsWith = filterValues[0].substring(0, filterValues[0].length - 3);
    return {
      column,
      op: "starts",
      value: `"${startsWith}"`,
    };
  }

  return {
    column,
    op: "in",
    values: filterValues.map((value) => `"${value}"`),
  };
};

export const getNumericFilter = (
  column: string,
  op?: NumericFilterClauseOp,
  value?: number,
): FilterClause | undefined => {
  if (op === undefined) return undefined;
  if (value === undefined || isNaN(value)) return undefined;
  return { column, op, value };
};

type FilterClauseList = Array<[string, string]>;

/**
 * Restructure a FilterContainerFilter into a list of [column, value] tuples
 * suitable for display in a text based control.
 */
export const getFilterClausesForDisplay = (
  filter?: FilterContainerFilter,
  columns: ColumnDescriptor[] = [],
  clauses: FilterClauseList = [],
): FilterClauseList => {
  if (filter === undefined) {
    return clauses;
  } else if (isSingleValueFilter(filter)) {
    const column = columns.find((c) => c.name === filter.column);
    if (column) {
      const { name, label = name } = column;
      clauses.push([label, filter.value.toString()]);
    } else {
      clauses.push([filter.column, filter.value.toString()]);
    }
  } else if (isBetweenFilter(filter)) {
    const [f1, f2] = filter.filters;
    const column = columns.find((c) => c.name === f1.column);
    if (
      isTimeDataValue(column) &&
      typeof f1.value === "number" &&
      typeof f2.value === "number"
    ) {
      const { name, label = name } = column;
      clauses.push([
        label,
        `${Time.millisToTimeString(f1.value)} - ${Time.millisToTimeString(f2.value)}`,
      ]);
    } else if (column) {
      const { name, label = name } = column;
      clauses.push([label, `${f1.value} - ${f2.value}`]);
    } else {
      clauses.push([f1.column, `${f1.value} - ${f2.value}`]);
    }
  } else if (isAndFilter(filter)) {
    filter.filters.forEach((f) =>
      getFilterClausesForDisplay(f, columns, clauses),
    );
  }
  return clauses;
};

/**
 * Given a list of FilterContainerFilterDescriptors and a FilterContainerFilter,
 * find filter descriptor from the list with an equal filter. If
 * none exists, return undefined, otherwise return the matched filter descriptor
 */
export const findMatchingFilter = (
  filterDescriptors: FilterContainerFilterDescriptor[],
  filter: FilterContainerFilter,
) =>
  filterDescriptors.find(
    ({ active, filter: f }) =>
      !active && f !== null && f !== filter && filtersAreEqual(f, filter),
  );
