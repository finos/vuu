import {
  AND,
  filterEquals,
  EQUALS,
  GREATER_THAN,
  IN,
  LESS_THAN,
  isAndFilter,
  isInFilter,
  OR,
  STARTS_WITH
} from '@vuu-ui/utils';

const byColName = (a, b) =>
  a.column === b.column ? 0 : a.column && b.column && a.column < b.column ? -1 : 1;

// does f2 only narrow the resultset from f1
export function extendsFilter(f1 = null, f2 = null) {
  // ignore filters which are identical
  // include or exclude filters which add values
  if (f2 === null) {
    return false;
  } else if (f1 === null) {
    return true;
  }
  if (f1.column && f1.column === f2.column) {
    if (f1.op === f2.op) {
      switch (f1.op) {
        case IN:
          return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
        case STARTS_WITH:
          return f2.value.length > f1.value.length && f2.value.indexOf(f1.value) === 0;
        // more cases here such as GT,LT
        default:
      }
    }
  } else if (f1.column && f2.column) {
    // different columns,always false
    return false;
  } else if (isAndFilter(f2) && extendsFilters(f1, f2)) {
    return true;
  }

  // safe option is to assume false, causing filter to be re-applied to base data
  return false;
}

function extendsFilters(f1, f2) {
  if (f1.column) {
    const matchingFilter = f2.filters.find((f) => f.column === f1.column);
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
      const filter2 = f2.filters.find((f) => f.column === filter1.column);
      return filterEquals(filter1, filter2, true); // could also allow f2 extends f1
    });
  }
}

function filterExtends(f1, f2) {
  if (isInFilter(f1) && isInFilter(f2)) {
    return f2.values.length < f1.values.length && containsAll(f1.values, f2.values);
  } else {
    return false;
  }
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

export function functor(columnMap, filter) {
  //TODO convert filter to include colIdx rather than colName, so we don't have to pass cols
  switch (filter.op) {
    case IN:
      return testInclude(columnMap, filter);
    case EQUALS:
      return testEQ(columnMap, filter);
    case GREATER_THAN:
      return testGT(columnMap, filter);
    case LESS_THAN:
      return testLT(columnMap, filter);
    case STARTS_WITH:
      return testSW(columnMap, filter);
    case AND:
      return testAND(columnMap, filter);
    case OR:
      return testOR(columnMap, filter);
    default:
      // TODO
      // console.log(`unrecognized filter type ${filter.type}`);
      return () => true;
  }
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
    ? (row) => row[cols[f.column]].toLowerCase().indexOf(value) !== 0
    : (row) => row[cols[f.column]].toLowerCase().indexOf(value) === 0;
}

function testGT(cols, f) {
  return (row) => row[cols[f.column]] > f.value;
}

function testLT(cols, f) {
  return (row) => row[cols[f.column]] < f.value;
}

function testInclude(cols, f) {
  return (row) => f.values.findIndex((val) => val == row[cols[f.column]]) !== -1;
}

function testEQ(cols, f) {
  return (row) => row[cols[f.column]] === f.value;
}
