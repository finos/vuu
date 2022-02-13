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
export default function filterRows(rows, columnMap, filter) {
  return applyFilter(rows, functor(columnMap, filter));
}

export function addFilter(existingFilter, filter) {
  if (includesNoValues(filter)) {
    const { colName } = filter;
    existingFilter = removeFilterForColumn(existingFilter, { name: colName });
  } else if (includesAllValues(filter)) {
    // A filter that returns all values is a way to remove filtering for this column
    return removeFilterForColumn(existingFilter, { name: filter.colName });
  }

  if (!existingFilter) {
    return filter;
  } else if (!filter) {
    return existingFilter;
  }

  if (existingFilter.type === AND && filter.type === AND) {
    return { type: AND, filters: combine(existingFilter.filters, filter.filters) };
  } else if (existingFilter.type === AND) {
    const filters = replaceOrInsert(existingFilter.filters, filter);
    return filters.length > 1 ? { type: AND, filters } : filters[0];
  } else if (filter.type === AND) {
    return { type: AND, filters: filter.filters.concat(existingFilter) };
  } else if (filterEquals(existingFilter, filter, true)) {
    return filter;
  } else if (sameColumn(existingFilter, filter)) {
    return merge(existingFilter, filter);
  } else {
    return { type: AND, filters: [existingFilter, filter] };
  }
}

export function includesNoValues(filter) {
  // TODO make sure we catch all cases...
  if (!filter) {
    return false;
  } else if (filter.type === IN && filter.values.length === 0) {
    return true;
  } else if (filter.type === AND && filter.filters.some((f) => includesNoValues(f))) {
    return true;
  } else {
    return false;
  }
}

export function getFilterColumn(column) {
  return column.isGroup ? column.columns[0] : column;
}
export function functor(columnMap, filter) {
  //TODO convert filter to include colIdx ratherthan colName, so we don't have to pass cols
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
      return testAND(columnMap, filter);
    case OR:
      return testOR(columnMap, filter);
    default:
      console.log(`unrecognized filter type ${filter.type}`);
      return () => true;
  }
}

function applyFilter(rows, filter) {
  const results = [];
  for (let i = 0; i < rows.length; i++) {
    if (filter(rows[i])) {
      results.push(rows[i]);
    }
  }
  return results;
}

function testAND(cols, f) {
  const filters = f.filters.map((f1) => functor(cols, f1));
  return (row) => filters.every((fn) => fn(row));
}

function testOR(cols, f) {
  const filters = f.filters.map((f1) => functor(cols, f1));
  return (row) => filters.some((fn) => fn(row));
}

function testSW(cols, f, inversed = false) {
  const value = f.value.toLowerCase();
  return inversed
    ? (row) => row[cols[f.colName]].toLowerCase().indexOf(value) !== 0
    : (row) => row[cols[f.colName]].toLowerCase().indexOf(value) === 0;
}

function testGT(cols, f) {
  return (row) => row[cols[f.colName]] > f.value;
}

function testGE(cols, f) {
  return (row) => row[cols[f.colName]] >= f.value;
}

function testLT(cols, f) {
  return (row) => row[cols[f.colName]] < f.value;
}

function testLE(cols, f) {
  return (row) => row[cols[f.colName]] <= f.value;
}

function testInclude(cols, f) {
  // eslint-disable-next-line eqeqeq
  return (row) => f.values.findIndex((val) => val == row[cols[f.colName]]) !== -1;
}

// faster to convert values to a keyed map
function testExclude(cols, f) {
  // eslint-disable-next-line eqeqeq
  return (row) => f.values.findIndex((val) => val == row[cols[f.colName]]) === -1;
}

function testEQ(cols, f) {
  return (row) => row[cols[f.colName]] === f.value;
}

export function shouldShowFilter(filterColumnName, column) {
  const filterColumn = getFilterColumn(column);
  if (filterColumn.isGroup) {
    return filterColumn.columns.some((col) => col.name === filterColumnName);
  } else {
    return filterColumnName === filterColumn.name;
  }
}

function includesAllValues(filter) {
  if (!filter) {
    return false;
  } else if (filter.type === NOT_IN && filter.values.length === 0) {
    return true;
  } else if (filter.type === STARTS_WITH && filter.value === '') {
    return true;
  } else {
    return false;
  }
}

// does f2 only narrow the resultset from f1
export function extendsFilter(f1 = null, f2 = null) {
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
          return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
        case NOT_IN:
          return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
        case STARTS_WITH:
          return f2.value.length > f1.value.length && f2.value.indexOf(f1.value) === 0;
        // more cases here such as GT,LT
        default:
      }
    }
  } else if (f1.colname && f2.colName) {
    // different columns,always false
    return false;
  } else if (f2.type === AND && extendsFilters(f1, f2)) {
    return true;
  }

  // safe option is to assume false, causing filter to be re-applied to base data
  return false;
}

const byColName = (a, b) => (a.colName === b.colName ? 0 : a.colName < b.colName ? -1 : 1);

function extendsFilters(f1, f2) {
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
function replaceOrInsert(filters, filter) {
  const { type, colName, values } = filter;
  if (type === IN || type === NOT_IN) {
    const otherType = type === IN ? NOT_IN : IN;
    // see if we have an 'other' entry
    let idx = filters.findIndex((f) => f.type === otherType && f.colName === colName);
    if (idx !== -1) {
      const { values: existingValues } = filters[idx];
      if (values.every((value) => existingValues.indexOf(value) !== -1)) {
        if (values.length === existingValues.length) {
          // we simply remove the existing 'other' filter ...
          return filters.filter((f, i) => i !== idx);
        } else {
          // ... or strip the matching values from the 'other' filter values
          let newValues = existingValues.filter((value) => !values.includes(value));
          return filters.map((filter, i) =>
            i === idx ? { ...filter, values: newValues } : filter
          );
        }
      } else if (values.some((value) => existingValues.indexOf(value) !== -1)) {
        console.log(`partial overlap between IN and NOT_IN`);
      }
    } else {
      idx = filters.findIndex((f) => f.type === type && f.colName === filter.colName);
      if (idx !== -1) {
        return filters.map((f, i) => (i === idx ? merge(f, filter) : f));
      }
    }
  }

  return filters.concat(filter);
}

function merge(f1, f2) {
  const { type: t1 } = f1;
  const { type: t2 } = f2;
  const sameType = t1 === t2 ? t1 : '';

  if (includesNoValues(f2)) {
    return f2;
  } else if ((t1 === IN && t2 === NOT_IN) || (t1 === NOT_IN && t2 === IN)) {
    // do the two sets cancel each other out ?
    if (f1.values.length === f2.values.length && f1.values.every((v) => f2.values.includes(v))) {
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
      if (f2.values.every((v) => f1.values.includes(v))) {
        return {
          ...f1,
          values: f1.values.filter((v) => !f2.values.includes(v))
        };
      }
    }
  } else if (sameType === IN || sameType === NOT_IN) {
    return {
      ...f1,
      values: f1.values.concat(f2.values.filter((v) => !f1.values.includes(v)))
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

function combine(existingFilters, replacementFilters) {
  // TODO need a safer REGEX here
  function equivalentType({ type: t1 }, { type: t2 }) {
    return t1 === t2 || t1[0] === t2[0];
  }

  const replaces = (existingFilter, replacementFilter) => {
    return (
      existingFilter.colName === replacementFilter.colName &&
      equivalentType(existingFilter, replacementFilter)
    );
  };

  const stillApplicable = (existingFilter) =>
    replacementFilters.some((replacementFilter) => replaces(existingFilter, replacementFilter)) ===
    false;

  return existingFilters.filter(stillApplicable).concat(replacementFilters);
}

export function removeColumnFromFilter(column, filter) {
  // RODO need to recurse into nested and/or
  const { op, filters } = filter;
  if (op === 'and' || op === 'or') {
    const [clause1, clause2] = filters;
    if (clause1.column === column.name) {
      return clause2;
    } else if (clause2.column === column.name) {
      return clause1;
    } else {
      return null;
    }
  }
}

export function removeFilter(sourceFilter, filterToRemove) {
  if (filterEquals(sourceFilter, filterToRemove, true)) {
    return null;
  } else if (sourceFilter.type !== AND) {
    throw Error(
      `removeFilter cannot remove ${JSON.stringify(filterToRemove)} from ${JSON.stringify(
        sourceFilter
      )}`
    );
  } else {
    const filters = sourceFilter.filters.filter((f) => !filterEquals(f, filterToRemove));
    return filters.length > 0 ? { type: AND, filters } : null;
  }
}

export function splitFilterOnColumn(filter, columnName) {
  if (!filter) {
    return [null, null];
  } else if (filter.colName === columnName) {
    return [filter, null];
  } else if (filter.type !== AND) {
    return [null, filter];
  } else {
    const [[columnFilter = null], filters] = partition(
      filter.filters,
      (f) => f.colName === columnName
    );
    return filters.length === 1
      ? [columnFilter, filters[0]]
      : [columnFilter, { type: AND, filters }];
  }
}

export const overrideColName = (filter, colName) => {
  const { type } = filter;
  if (type === AND || type === OR) {
    return {
      type,
      filters: filter.filters.map((f) => overrideColName(f, colName))
    };
  } else {
    return { ...filter, colName };
  }
};

export function extractFilterForColumn(filter, columnName) {
  if (!filter) {
    return null;
  }
  const { type, colName } = filter;
  switch (type) {
    case AND:
    case OR:
      return collectFiltersForColumn(type, filter.filters, columnName);

    default:
      return colName === columnName ? filter : null;
  }
}

function collectFiltersForColumn(type, filters, columName) {
  const results = [];
  filters.forEach((filter) => {
    const ffc = extractFilterForColumn(filter, columName);
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

export function filterIncludesColumn(filter, column) {
  if (!filter) {
    return false;
  }
  const { op, column: filterColName, filters } = filter;
  switch (op) {
    case AND:
    case OR:
      return filters.some((f) => filterIncludesColumn(f, column));
    default:
      return filterColName === column.name;
  }
}

export function removeFilterForColumn(sourceFilter, column) {
  const colName = column.name;
  if (!sourceFilter) {
    return null;
  } else if (sourceFilter.colName === colName) {
    return null;
  } else if (sourceFilter.type === AND || sourceFilter.type === OR) {
    const { type, filters } = sourceFilter;
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

const sameColumn = (f1, f2) => f1.colName === f2.colName;

export function filterEquals(f1, f2, strict = false) {
  if (f1 && f1) {
    const isSameColumn = sameColumn(f1, f2);
    if (!strict) {
      return isSameColumn;
    } else {
      return (
        isSameColumn &&
        f1.type === f2.type &&
        f1.mode === f2.mode &&
        f1.value === f2.value &&
        sameValues(f1.values, f2.values)
      );
    }
  } else {
    return false;
  }
}

// does f2 extend f1 ?
function filterExtends(f1, f2) {
  if (f1.type === IN && f2.type === IN) {
    return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
  } else if (f1.type === NOT_IN && f2.type === NOT_IN) {
    return f2.values.length > f1.values.length && containsAll(f2.values, f1.values);
  } else {
    return false;
  }
}

//TODO roll this into next function
export function projectFilterData(filterRows) {
  return filterRows.map((row, idx) => [idx, 0, 0, null, row.name, row.count]);
}

// The folowing are array utilities but they are defined here as they are not suitable for large arrays, so we'll
// keep them local to filters
function containsAll(superList, subList) {
  for (let i = 0, len = subList.length; i < len; i++) {
    if (superList.indexOf(subList[i]) === -1) {
      return false;
    }
  }
  return true;
}

// only suitable for small arrays of simple types (e.g. filter values)
function sameValues(arr1, arr2) {
  if (arr1 === arr2) {
    return true;
  } else if (arr1.length === arr2.length) {
    const a = arr1.slice().sort();
    const b = arr2.slice().sort();
    return a.join('|') === b.join('|');
  }
  return false;
}

function partition(list, test1, test2 = null) {
  const results1 = [];
  const misses = [];
  const results2 = test2 === null ? null : [];

  for (let i = 0; i < list.length; i++) {
    if (test1(list[i])) {
      results1.push(list[i]);
    } else if (test2 !== null && test2(list[i])) {
      results2.push(list[i]);
    } else {
      misses.push(list[i]);
    }
  }

  return test2 === null ? [results1, misses] : [results1, results2, misses];
}
