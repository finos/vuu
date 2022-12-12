import { partition } from "@vuu-ui/vuu-utils/src/array-utils";
import {
  AndFilter,
  Filter,
  FilterClause,
  FilterCombinatorOp,
  isMultiClauseFilter,
  isMultiValueFilter,
  isAndFilter,
  isOrFilter,
  isInFilter,
  OrFilter,
  isSingleValueFilter,
} from "./filterTypes";
import { Row } from "@vuu-ui/vuu-utils/src/row-utils";
import { KeyedColumnDescriptor } from "@vuu-ui/vuu-datagrid/src/grid-model";

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

export const SET_FILTER_DATA_COLUMNS = [
  { name: "name", flex: 1 },
  { name: "count", width: 40, type: "number" },
  { name: "totalCount", width: 40, type: "number" },
];

export const BIN_FILTER_DATA_COLUMNS = [
  { name: "bin" },
  { name: "count" },
  { name: "bin-lo" },
  { name: "bin-hi" },
];

export const filterClauses = (
  filter: Filter | null,
  clauses: FilterClause[] = []
) => {
  if (filter) {
    if (isMultiClauseFilter(filter)) {
      filter.filters.forEach((f) => clauses.push(...filterClauses(f)));
    } else {
      // TODO why did we originally stringify 'values' ?
      // clauses.push({ column, op, value: value ?? values?.join(',') });
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

export function addFilter(
  existingFilter: Filter | null,
  filter: Filter,
  { combineWith = AND }: AddFilterOptions = DEFAULT_ADD_FILTER_OPTS
): Filter | null {
  if (includesNoValues(filter)) {
    if (isMultiClauseFilter(filter)) {
      // TODO identify the column that is contributing the no-values filter
    } else {
      existingFilter = removeFilterForColumn(existingFilter, {
        name: filter.column,
      });
    }
  } else if (includesAllValues(filter)) {
    // A filter that returns all values is a way to remove filtering for this column
    if (isMultiClauseFilter(filter)) {
      // TODO identify the column that is contributing the all-values filter
    } else {
      return removeFilterForColumn(existingFilter, { name: filter.column });
    }
  }

  if (!existingFilter) {
    return filter;
  } else if (!filter) {
    return existingFilter;
  }

  if (existingFilter.op === AND && filter.op === AND) {
    return {
      op: AND,
      filters: combine(existingFilter.filters, filter.filters),
    };
  } else if (existingFilter.op === AND) {
    const filters = replaceOrInsert(existingFilter.filters, filter);
    return filters.length > 1 ? { op: AND, filters } : filters[0];
  } else if (filter.op === AND) {
    return { op: AND, filters: filter.filters.concat(existingFilter) };
  } else if (filterEquals(existingFilter, filter, true)) {
    return filter;
  } else if (sameColumn(existingFilter, filter)) {
    return merge(existingFilter, filter);
  } else {
    return { op: combineWith, filters: [existingFilter, filter] };
  }
}

function includesNoValues(filter?: Filter | null): boolean {
  // TODO make sure we catch all cases...
  if (!filter) {
    return false;
  }
  if (isInFilter(filter) && filter.values.length === 0) {
    return true;
  }
  return (
    isAndFilter(filter) && filter.filters!.some((f) => includesNoValues(f))
  );
}

export function getFilterColumn(column: Column | ColumnGroup) {
  return isColumnGroup(column) ? column.columns[0] : column;
}

//TODO might need some refinement for Quotes etc
export const filterAsQuery = (f: Filter, namedFilters = {}): string => {
  if (isMultiClauseFilter(f)) {
    const [clause1, clause2] = f.filters;
    return `${filterAsQuery(clause1, namedFilters)} ${f.op} ${filterAsQuery(
      clause2,
      namedFilters
    )}`;
  } else if (isMultiValueFilter(f)) {
    return `${f.column} ${f.op} [${f.values.join(",")}]`;
  } else {
    return `${f.column} ${f.op} ${f.value}`;
  }
};

// TODO types for different types of filters

interface CommonFilter {
  colName?: string;
  otherColFilters?: Filter[];
  // values?: any[];
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

// export function shouldShowFilter(filterColumnName: string, column: Column): boolean {
//   const filterColumn = getFilterColumn(column);
//   if (isColumnGroup(filterColumn)) {
//     return filterColumn.columns.some((col) => col.name === filterColumnName);
//   } else {
//     return filterColumnName === filterColumn.name;
//   }
// }

function includesAllValues(filter?: Filter | null): boolean {
  if (!filter) {
    return false;
  } else if (filter.op === STARTS_WITH && filter.value === "") {
    return true;
  }
  return filter.op === STARTS_WITH && filter.value === "";
}

// If we add an IN filter and there is an existing NOT_IN, we would always expect the IN
// values to exist in the NOT_IN set (as long as user interaction is driving the filtering)
function replaceOrInsert(filters: Filter[], filter: Filter) {
  // const { type, column, values } = filter;
  // if (type === IN) {
  //   let idx = filters.findIndex((f) => f.type === EQUALS && f.column === column);
  //   if (idx !== -1) {
  //     const { values: existingValues } = filters[idx];
  //     if (values.every((value) => existingValues.indexOf(value) !== -1)) {
  //       if (values.length === existingValues.length) {
  //         // we simply remove the existing 'other' filter ...
  //         return filters.filter((f, i) => i !== idx);
  //       } else {
  //         // ... or strip the matching values from the 'other' filter values
  //         let newValues = existingValues.filter((value) => !values.includes(value));
  //         return filters.map((filter, i) =>
  //           i === idx ? { ...filter, values: newValues } : filter
  //         );
  //       }
  //     } else if (values.some((value) => existingValues.indexOf(value) !== -1)) {
  //       console.log(`partial overlap between IN and NOT_IN`);
  //     }
  //   } else {
  //     idx = filters.findIndex((f) => f.type === type && f.colName === filter.colName);
  //     if (idx !== -1) {
  //       return filters.map((f, i) => (i === idx ? merge(f, filter) : f));
  //     }
  //   }
  // }

  return filters.concat(filter);
}

function merge(f1: Filter, f2: Filter): Filter | null {
  const { op: t1 } = f1;
  const { op: t2 } = f2;

  if (includesNoValues(f2)) {
    return f2;
  } else if (isInFilter(f1) && isInFilter(f2)) {
    return {
      ...f1,
      values: f1.values.concat(
        f2.values.filter((v: any) => !f1.values.includes(v))
      ),
    };
  } else if (f1.op === STARTS_WITH && f2.op === STARTS_WITH) {
    return {
      op: OR,
      filters: [f1, f2],
    };
  }

  return f2;
}

function combine(existingFilters: Filter[], replacementFilters: Filter[]) {
  // TODO need a safer REGEX here
  function equivalentType({ op: t1 }: Filter, { op: t2 }: Filter) {
    return t1 === t2 || t1[0] === t2[0];
  }

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
}

export function removeColumnFromFilter(
  column: KeyedColumnDescriptor,
  filter: Filter
): [Filter | undefined, string] {
  // TODO need to recurse into nested and/or
  if (isMultiClauseFilter(filter)) {
    const [clause1, clause2] = filter.filters;
    if (clause1.column === column.name) {
      return [clause2, filterAsQuery(clause2)];
    } else if (clause2.column === column.name) {
      return [clause1, filterAsQuery(clause1)];
    }
  }
  return [undefined, ""];
}

export function removeFilter(sourceFilter: Filter, filterToRemove: Filter) {
  if (filterEquals(sourceFilter, filterToRemove, true)) {
    return null;
  } else if (sourceFilter.op !== AND) {
    throw Error(
      `removeFilter cannot remove ${JSON.stringify(
        filterToRemove
      )} from ${JSON.stringify(sourceFilter)}`
    );
  } else {
    const filters = (sourceFilter as AndFilter).filters.filter(
      (f) => !filterEquals(f, filterToRemove)
    );
    return filters.length > 0 ? { type: AND, filters } : null;
  }
}

export function splitFilterOnColumn(
  filter: Filter | null,
  columnName: string
): [Filter | null, Filter | null] {
  if (!filter) {
    return [null, null];
  } else if (filter.column === columnName) {
    return [filter, null];
  } else if (filter.op !== AND) {
    return [null, filter];
  } else {
    const [[columnFilter = null], filters] = partition(
      (filter as AndFilter).filters,
      (f) => f.column === columnName
    );
    return filters.length === 1
      ? [columnFilter, filters[0]]
      : [columnFilter, { op: AND, filters }];
  }
}

export const overrideColName = (filter: Filter, column: string): Filter => {
  if (isMultiClauseFilter(filter)) {
    return {
      op: filter.op,
      filters: filter.filters.map((f) => overrideColName(f, column)),
    };
  } else {
    return { ...filter, column };
  }
};

export function extractFilterForColumn(
  filter: Filter | null,
  columnName: string
) {
  if (!filter) {
    return null;
  }
  const { op, column } = filter;
  switch (op) {
    case AND:
    case OR:
      return collectFiltersForColumn(
        op,
        (filter as AndFilter | OrFilter).filters,
        columnName
      );
    default:
      return column === columnName ? filter : null;
  }
}

function collectFiltersForColumn(
  op: "and" | "or",
  filters: Filter[],
  columnName: string
) {
  const results: Filter[] = [];
  filters.forEach((filter) => {
    const ffc = extractFilterForColumn(filter, columnName);
    if (ffc !== null) {
      results.push(ffc);
    }
  });
  if (results.length === 1) {
    return results[0];
  } else {
    return {
      op,
      filters: results,
    };
  }
}

export function filterIncludesColumn(
  filter: Filter,
  column: KeyedColumnDescriptor
): boolean {
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
}

function removeFilterForColumn(
  sourceFilter: Filter | null,
  column: Column
): Filter | null {
  const colName = column.name;
  if (!sourceFilter) {
    return null;
  } else if (sourceFilter.column === colName) {
    return null;
  } else if (isAndFilter(sourceFilter) || isOrFilter(sourceFilter)) {
    const { op } = sourceFilter;
    const filters = sourceFilter.filters;
    const otherColFilters = filters.filter((f) => f.column !== colName);
    switch (otherColFilters.length) {
      case 0:
        return null;
      case 1:
        return otherColFilters[0];
      default:
        return { op, filters: otherColFilters };
    }
  } else {
    return sourceFilter;
  }
}

const sameColumn = (f1: Filter, f2: Filter) => f1.column === f2.column;

export function filterEquals(f1?: Filter, f2?: Filter, strict = false) {
  if (f1 && f2 && sameColumn(f1, f2)) {
    if (!strict) {
      return true;
    } else {
      return (
        f1.op === f2.op &&
        ((isSingleValueFilter(f1) &&
          isSingleValueFilter(f2) &&
          f1.value === f2.value) ||
          (isMultiValueFilter(f1) &&
            isMultiValueFilter(f2) &&
            sameValues(f1.values, f2.values)))
      );
    }
  } else {
    return false;
  }
}

//TODO roll this into next function
export function projectFilterData(filterRows: Row[]) {
  return filterRows.map((row, idx) => [idx, 0, 0, null, row.name, row.count]);
}

// only suitable for small arrays of simple types (e.g. filter values)
function sameValues<T>(arr1: T[], arr2: T[]) {
  if (arr1 === arr2) {
    return true;
  } else if (arr1.length === arr2.length) {
    const a = arr1.slice().sort();
    const b = arr2.slice().sort();
    return a.join("|") === b.join("|");
  }
  return false;
}

export const updateFilter = (
  filter: Filter | undefined,
  newFilter: Filter,
  mode: "add" | "replace"
): Filter => {
  if (mode === "replace" || filter === undefined) {
    return newFilter;
  } else if (filter.op === "and") {
    return {
      ...filter,
      filters: filter.filters.concat(newFilter),
    };
  } else {
    return {
      op: "and",
      filters: [filter, newFilter],
    };
  }
};
