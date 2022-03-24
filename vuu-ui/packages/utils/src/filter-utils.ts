import {ColumnMap} from "./column-utils";
import {Row} from "./row-utils";

export const AND = 'and';
export const EQUALS = '=';
export const GREATER_THAN = '>';
export const GREATER_EQ = '>=';
export const IN = 'in';
export const LESS_EQ = '<=';
export const LESS_THAN = '<';
export const NOT_IN = 'NOT_IN';
export const NOT_STARTS_WITH = 'NOT_SW';
export const OR = 'or';
export const STARTS_WITH = 'SW';

export type FilterType = 'and' | '=' | '>' | '>=' | 'in' | '<=' | '<' | 'NOT_IN' | 'NOT_SW' | 'or' | 'SW';

export const SET_FILTER_DATA_COLUMNS = [
  { name: 'name', flex: 1 },
  { name: 'count', width: 40, type: 'number' },
  { name: 'totalCount', width: 40, type: 'number' }
];

export const BIN_FILTER_DATA_COLUMNS = [
  { name: 'bin' },
  { name: 'count' },
  { name: 'bin-lo' },
  { name: 'bin-hi' }
];

export default function filterRows(rows: Row[], columnMap: ColumnMap, filter: Filter) {
  return applyFilter(rows, functor(columnMap, filter));
}

export function addFilter(existingFilter: Filter | null, filter: Filter | null): Filter | null {
  if (filter && includesNoValues(filter)) {
    const { colName } = filter;
    existingFilter = removeFilterForColumn(existingFilter, { name: colName });
  } else if (includesAllValues(filter)) {
    // A filter that returns all values is a way to remove filtering for this column
    return removeFilterForColumn(existingFilter, { name: filter!.colName });
  }

  if (!existingFilter) {
    return filter;
  } else if (!filter) {
    return existingFilter;
  }

  if (isAndFilter(existingFilter) && isAndFilter(filter)) {
    return createAndFilter(combine(existingFilter.filters, filter.filters));
  } else if (isAndFilter(existingFilter)) {
    const filters = replaceOrInsert(existingFilter.filters, filter);
    return filters.length > 1 ? { type: AND, filters } : filters[0];
  } else if (isAndFilter(filter)) {
    return { type: AND, filters: filter.filters.concat(existingFilter) };
  } else if (filterEquals(existingFilter, filter, true)) {
    return filter;
  } else if (sameColumn(existingFilter, filter)) {
    return merge(existingFilter, filter);
  } else {
    return { type: AND, filters: [existingFilter, filter] };
  }
}

export function includesNoValues(filter?: Filter | null): boolean {
  // TODO make sure we catch all cases...
  if (!filter) {
    return false;
  }
  if (isInFilter(filter) && filter.values.length === 0) {
    return true;
  }
  return isAndFilter(filter) && filter.filters!.some((f) => includesNoValues(f));
}

export function isColumnGroup(column: Column | ColumnGroup): column is ColumnGroup {
  return column.isGroup === true;
}

export function getFilterColumn(column: Column | ColumnGroup) {
  return isColumnGroup(column) ? column.columns[0] : column;
}

// TODO types for different types of filters

interface CommonFilter {
  colName?: string;
  otherColFilters?: Filter[];
  // values?: any[];
  mode?: any;
  value?: any;
  values?: any;
  op?: 'or' | 'and';
  column?: string;
  filters?: Filter[];
}

interface CombinedFilter extends CommonFilter {
  type: 'and' | 'or'; // TODO any other types?
  filters: Filter[];
}

// 'and' filter must have 'filters'
export interface AndFilter extends CombinedFilter {
  type: 'and';
}

export function createAndFilter(filters: Filter[]): AndFilter {
  return {
    type: 'and',
    filters
  };
}

// 'or' filter must have 'filters'
export interface OrFilter extends CombinedFilter {
  type: 'or';
}

export interface InFilter extends CommonFilter {
  type: 'in';
  values: any[];
}

export interface NotInFilter extends CommonFilter {
  type: 'NOT_IN';
  values: any[];
}

export interface OtherFilter extends CommonFilter {
  type: FilterType;
  values?: any[];
}

export type Filter = AndFilter | OrFilter | InFilter | NotInFilter | OtherFilter;

export type RowFilterFn = (row: Row) => boolean;

export function functor(columnMap: ColumnMap, filter: Filter): RowFilterFn {
  //TODO convert filter to include colIdx rather than colName, so we don't have to pass cols
  switch (filter.type) {
    case IN:
      return testInclude(columnMap, filter);
    case NOT_IN:
      return testExclude(columnMap, filter);
    case EQUALS:
      return testEQ(columnMap, filter);
    case GREATER_THAN:
      return testGT(columnMap, filter);
    case GREATER_EQ:
      return testGE(columnMap, filter);
    case LESS_THAN:
      return testLT(columnMap, filter);
    case LESS_EQ:
      return testLE(columnMap, filter);
    case STARTS_WITH:
      return testSW(columnMap, filter);
    case NOT_STARTS_WITH:
      return testSW(columnMap, filter, true);
    case AND:
      return testAND(columnMap, filter as AndFilter);
    case OR:
      return testOR(columnMap, filter as OrFilter);
    default:
      // TODO
      // console.log(`unrecognized filter type ${filter.type}`);
      return () => true;
  }
}

function applyFilter(rows: Row[], filter: RowFilterFn) {
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    if (filter(rows[i])) {
      results.push(rows[i]);
    }
  }
  return results;
}

function testAND(cols: ColumnMap, f: AndFilter) {
  const filters = f.filters.map((f1) => functor(cols, f1));
  return (row: Row) => filters.every((fn) => fn(row));
}

function testOR(cols: ColumnMap, f: OrFilter) {
  const filters = f.filters.map((f1) => functor(cols, f1));
  return (row: Row) => filters.some((fn) => fn(row));
}

function testSW(cols: ColumnMap, f: Filter, inversed = false) {
  const value = f.value.toLowerCase();
  return inversed
    ? (row: Row) => row[cols[f.colName!]].toLowerCase().indexOf(value) !== 0
    : (row: Row) => row[cols[f.colName!]].toLowerCase().indexOf(value) === 0;
}

function testGT(cols: ColumnMap, f: Filter) {
  return (row: Row) => row[cols[f.colName!]] > f.value;
}

function testGE(cols: ColumnMap, f: Filter) {
  return (row: Row) => row[cols[f.colName!]] >= f.value;
}

function testLT(cols: ColumnMap, f: Filter) {
  return (row: Row) => row[cols[f.colName!]] < f.value;
}

function testLE(cols: ColumnMap, f: Filter) {
  return (row: Row) => row[cols[f.colName!]] <= f.value;
}

function testInclude(cols: ColumnMap, f: Filter) {
  // eslint-disable-next-line eqeqeq
  return (row: Row) => f.values.findIndex((val: any) => val == row[cols[f.colName!]]) !== -1;
}

// faster to convert values to a keyed map
function testExclude(cols: ColumnMap, f: Filter) {
  // eslint-disable-next-line eqeqeq
  return (row: Row) => f.values.findIndex((val: any) => val == row[cols[f.colName!]]) === -1;
}

function testEQ(cols: ColumnMap, f: Filter) {
  return (row: Row) => row[cols[f.colName!]] === f.value; // TODO make colName required?
}

export function shouldShowFilter(filterColumnName: string, column: Column): boolean {
  const filterColumn = getFilterColumn(column);
  if (isColumnGroup(filterColumn)) {
    return filterColumn.columns.some((col) => col.name === filterColumnName);
  } else {
    return filterColumnName === filterColumn.name;
  }
}

function includesAllValues(filter?: Filter | null): boolean {
  if (!filter) {
    return false;
  }
  if (isNotInFilter(filter) && filter.values.length === 0) {
    return true;
  }
  return filter.type === STARTS_WITH && filter.value === '';
}

// does f2 only narrow the resultset from f1
export function extendsFilter(f1: Filter | null = null, f2: Filter | null = null): boolean {
  // ignore filters which are identical
  // include or exclude filters which add values
  if (f2 === null) {
    return false;
  } else if (f1 === null) {
    return true;
  }
  if (f1.colName && f1.colName === f2.colName) {
    if (f1.type === f2.type) {
      switch (f1.type) {
        case IN:
          return f2.values.length < (f1 as InFilter).values.length && containsAll((f1 as InFilter).values, f2.values);
        case NOT_IN:
          return f2.values.length > (f1 as NotInFilter).values.length && containsAll(f2.values, (f1 as NotInFilter).values);
        case STARTS_WITH:
          return f2.value.length > f1.value.length && f2.value.indexOf(f1.value) === 0;
        // more cases here such as GT,LT
        default:
      }
    }
  } else if (f1.colName && f2.colName) {
    // different columns,always false
    return false;
  } else if (isAndFilter(f2) && extendsFilters(f1 as CombinedFilter, f2)) {
    return true;
  }

  // safe option is to assume false, causing filter to be re-applied to base data
  return false;
}

const byColName = (a: Filter, b: Filter) =>
  (a.colName === b.colName
    ? 0
    : a.colName && b.colName && a.colName < b.colName ? -1 : 1);

function extendsFilters(f1: CombinedFilter, f2: CombinedFilter) {
  if (f1.colName) {
    const matchingFilter = f2.filters.find((f) => f.colName === f1.colName);
    return filterEquals(matchingFilter, f1, true);
  } else if (f1.filters.length === f2.filters.length) {
    // if the only differences are extra values in an excludes filter or fewer values in an includes filter
    // then we are still extending the filter (i.e. narrowing the resultset)
    const a = f1.filters.sort(byColName);
    const b = f2.filters.slice().sort(byColName);

    for (let i = 0; i < a.length; i++) {
      if (!filterEquals(a[i], b[i], true) && !filterExtends(a[i], b[i])) {
        return false;
      }
    }
    return true;
  } else if (f2.filters.length > f1.filters.length) {
    return f1.filters.every((filter1) => {
      const filter2 = f2.filters.find((f) => f.colName === filter1.colName);
      return filterEquals(filter1, filter2, true); // could also allow f2 extends f1
    });
  }
}

// If we add an IN filter and there is an existing NOT_IN, we would always expect the IN
// values to exist in the NOT_IN set (as long as user interaction is driving the filtering)
function replaceOrInsert(filters: Filter[], filter: Filter): Filter[] {
  const { type, colName, values } = filter;
  if (type === IN || type === NOT_IN) {
    const otherType = type === IN ? NOT_IN : IN;
    // see if we have an 'other' entry
    let idx = filters.findIndex((f) => f.type === otherType && f.colName === colName);
    if (idx !== -1) {
      const { values: existingValues } = filters[idx];
      if (values.every((value: any) => existingValues.indexOf(value) !== -1)) {
        if (values.length === existingValues.length) {
          // we simply remove the existing 'other' filter ...
          return filters.filter((f, i) => i !== idx);
        } else {
          // ... or strip the matching values from the 'other' filter values
          let newValues = existingValues.filter((value: any) => !values.includes(value));
          return filters.map((filter, i) =>
            i === idx ? { ...filter, values: newValues } : filter
          );
        }
      } else if (values.some((value: any) => existingValues.indexOf(value) !== -1)) {
        console.log(`partial overlap between IN and NOT_IN`);
      }
    } else {
      idx = filters.findIndex((f) => f.type === type && f.colName === filter.colName);
      if (idx !== -1) {
        return filters.map((f, i) => (i === idx ? merge(f, filter) as Filter : f));
      }
    }
  }

  return filters.concat(filter);
}

function merge(f1: Filter, f2: Filter): Filter | null {
  const { type: t1 } = f1;
  const { type: t2 } = f2;
  const sameType = t1 === t2 ? t1 : '';

  if (includesNoValues(f2)) {
    return f2;
  } else if ((t1 === IN && t2 === NOT_IN) || (t1 === NOT_IN && t2 === IN)) {
    // do the two sets cancel each other out ?
    if (f1.values.length === f2.values.length && f1.values.every((v: any) => f2.values.includes(v))) {
      if (t1 === IN && t2 === NOT_IN) {
        return {
          colName: f1.colName,
          type: IN,
          values: []
        };
      } else {
        return null;
      }
    } else if (f1.values.length > f2.values.length) {
      if (f2.values.every((v: any) => f1.values.includes(v))) {
        return {
          ...f1,
          values: f1.values.filter((v: any) => !f2.values.includes(v))
        };
      }
    }
  } else if (sameType === IN || sameType === NOT_IN) {
    return {
      ...f1,
      values: f1.values.concat(f2.values.filter((v: any) => !f1.values.includes(v)))
    };
  } else if (sameType === STARTS_WITH) {
    return {
      type: OR,
      filters: [f1, f2]
    };
  } else if (sameType === NOT_STARTS_WITH) {
    return {
      type: AND,
      filters: [f1, f2]
    };
  }

  return f2;
}

function combine(existingFilters: Filter[], replacementFilters: Filter[]) {
  // TODO need a safer REGEX here
  function equivalentType({ type: t1 }: Filter, { type: t2 }: Filter) {
    return t1 === t2 || t1[0] === t2[0];
  }

  const replaces = (existingFilter: Filter, replacementFilter: Filter) => {
    return (
      existingFilter.colName === replacementFilter.colName &&
      equivalentType(existingFilter, replacementFilter)
    );
  };

  const stillApplicable = (existingFilter: Filter) =>
    replacementFilters.some((replacementFilter) => replaces(existingFilter, replacementFilter)) ===
    false;

  return existingFilters.filter(stillApplicable).concat(replacementFilters);
}

export function removeColumnFromFilter(column: Column, filter: Filter) {
  // RODO need to recurse into nested and/or
  const { op, filters } = filter;
  if (op === 'and' || op === 'or') {
    const [clause1, clause2] = filters!;
    if (clause1.column === column.name) {
      return clause2;
    } else if (clause2.column === column.name) {
      return clause1;
    } else {
      return null;
    }
  }
}

export function removeFilter(sourceFilter: Filter, filterToRemove: Filter) {
  if (filterEquals(sourceFilter, filterToRemove, true)) {
    return null;
  } else if (sourceFilter.type !== AND) {
    throw Error(
      `removeFilter cannot remove ${JSON.stringify(filterToRemove)} from ${JSON.stringify(
        sourceFilter
      )}`
    );
  } else {
    const filters = (sourceFilter as AndFilter).filters.filter((f) => !filterEquals(f, filterToRemove));
    return filters.length > 0 ? { type: AND, filters } : null;
  }
}

export function splitFilterOnColumn(
  filter: Filter | null,
  columnName: string
): [Filter | null, Filter | null] {
  if (!filter) {
    return [null, null];
  } else if (filter.colName === columnName) {
    return [filter, null];
  } else if (filter.type !== AND) {
    return [null, filter];
  } else {
    const [[columnFilter = null], filters] = partition(
      (filter as AndFilter).filters,
      (f) => f.colName === columnName
    );
    return filters.length === 1
      ? [columnFilter, filters[0]]
      : [columnFilter, { type: AND, filters }];
  }
}

export const overrideColName = (filter: Filter, colName: string): Filter => {
  const { type } = filter;
  if (type === AND || type === OR) {
    return {
      type,
      filters: (filter as AndFilter | OrFilter).filters.map((f) => overrideColName(f, colName))
    };
  } else {
    return { ...filter, colName };
  }
};

export function extractFilterForColumn(filter: Filter | null, columnName: string) {
  if (!filter) {
    return null;
  }
  const { type, colName } = filter;
  switch (type) {
    case AND:
    case OR:
      return collectFiltersForColumn(type, (filter as AndFilter | OrFilter).filters, columnName);
    default:
      return colName === columnName ? filter : null;
  }
}

function collectFiltersForColumn(type: FilterType, filters: Filter[], columnName: string) {
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
      type,
      filters: results
    };
  }
}

export function filterIncludesColumn(filter: Filter, column: Column): boolean {
  if (!filter) {
    return false;
  }
  const { op, column: filterColName, filters } = filter;
  switch (op) {
    case AND:
    case OR:
      return filters != null && filters.some((f) => filterIncludesColumn(f, column));
    default:
      return filterColName === column.name;
  }
}

export function isAndFilter(filter: Filter): filter is AndFilter {
  return filter.type === 'and';
}

export function isOrFilter(filter: Filter): filter is OrFilter {
  return filter.type === 'or';
}

export function isInFilter(filter: Filter): filter is InFilter {
  return filter.type === 'in';
}

export function isNotInFilter(filter: Filter): filter is NotInFilter {
  return filter.type === 'NOT_IN';
}

export function removeFilterForColumn(sourceFilter: Filter | null, column: Column): Filter | null {
  const colName = column.name;
  if (!sourceFilter) {
    return null;
  } else if (sourceFilter.colName === colName) {
    return null;
  } else if (isAndFilter(sourceFilter) || isOrFilter(sourceFilter)) {
    const { type } = sourceFilter;
    const filters = sourceFilter.filters;
    const otherColFilters = filters.filter((f) => f.colName !== colName);
    switch (otherColFilters.length) {
      case 0:
        return null;
      case 1:
        return otherColFilters[0];
      default:
        return { type, otherColFilters };
    }
  } else {
    return sourceFilter;
  }
}

const sameColumn = (f1: Filter, f2: Filter) => f1.colName === f2.colName;

export function filterEquals(f1?: Filter, f2?: Filter, strict = false) {
  if (f1 && f2) {
    const isSameColumn = sameColumn(f1, f2);
    if (!strict) {
      return isSameColumn;
    } else {
      return (
        isSameColumn &&
        f1.type === f2.type &&
        f1.mode === f2.mode &&
        f1.value === f2.value &&
        f1.values &&
        f2.values &&
        sameValues(f1.values, f2.values)
      );
    }
  } else {
    return false;
  }
}

// does f2 extend f1 ?
function filterExtends(f1: Filter, f2: Filter): boolean {
  if (isInFilter(f1) && isInFilter(f2)) {
    return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
  } else if (isNotInFilter(f1) && isNotInFilter(f2)) {
    return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
  } else {
    return false;
  }
}

//TODO roll this into next function
export function projectFilterData(filterRows: Row[]) {
  return filterRows.map((row, idx) => [idx, 0, 0, null, row.name, row.count]);
}

// The folowing are array utilities but they are defined here as they are not suitable for large arrays, so we'll
// keep them local to filters
function containsAll<T>(superList: T[], subList: T[]): boolean {
  for (let i = 0, len = subList.length; i < len; i++) {
    if (superList.indexOf(subList[i]) === -1) {
      return false;
    }
  }
  return true;
}

// only suitable for small arrays of simple types (e.g. filter values)
function sameValues<T>(arr1: T[], arr2: T[]) {
  if (arr1 === arr2) {
    return true;
  } else if (arr1.length === arr2.length) {
    const a = arr1.slice().sort();
    const b = arr2.slice().sort();
    return a.join('|') === b.join('|');
  }
  return false;
}

// TODO unify all 'partition' implementations

type Predicate<T> = (x: T) => boolean;

function partition<T>(
  list: T[],
  test1: Predicate<T>,
  test2: Predicate<T> | null = null
): [T[], T[]] | [T[], T[], T[]] {
  const results1: T[] = [];
  const misses: T[] = [];
  const results2: T[] | null = test2 === null ? null : [];

  for (let i = 0; i < list.length; i++) {
    if (test1(list[i])) {
      results1.push(list[i]);
    } else if (test2 !== null && test2(list[i])) {
      results2!.push(list[i]);
    } else {
      misses.push(list[i]);
    }
  }

  return test2 === null
    ? [results1, misses] as [T[], T[]]
    : [results1, results2, misses] as [T[], T[], T[]];
}
