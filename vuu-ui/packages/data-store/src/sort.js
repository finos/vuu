import { ASC, DSC, mapSortCriteria } from '@vuu-ui/utils';

export function sortableFilterSet(filterSet) {
  if (filterSet.length === 0) {
    return filterSet;
  } else if (Array.isArray(filterSet[0])) {
    return filterSet;
  } else {
    return filterSet.map((idx) => [idx, null]);
  }
}

export function sortExtend(sortSet, rows, newSortCols, columnMap) {
  sort2ColsAdd1(sortSet, rows, newSortCols, columnMap);
}

export function sort(sortSet, rows, sortCols, columnMap) {
  const sortCriteria = mapSortCriteria(sortCols, columnMap);
  const count = sortCriteria.length;
  const sortFn = count === 1 ? sort1 : count === 2 ? sort2 : count === 3 ? sort3 : sortAll;
  sortFn(sortSet, rows, sortCriteria);
}

function sort2ColsAdd1(sortSet, rows, sortCols, columnMap) {
  const len = sortSet.length;
  const sortCriteria = mapSortCriteria(sortCols, columnMap);
  const [colIdx2] = sortCriteria[1];
  for (let i = 0; i < len; i++) {
    sortSet[i][2] = rows[sortSet[i][0]][colIdx2];
  }
  // This does not take direction into account
  sortSet.sort((a, b) => {
    return a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : a[2] > b[2] ? 1 : b[2] > a[2] ? -1 : 0;
  });
}

function sort1(sortSet, rows, [[colIdx, direction]]) {
  const len = sortSet.length;
  for (let i = 0; i < len; i++) {
    const idx = sortSet[i][0];
    sortSet[i][1] = rows[idx][colIdx];
  }
  if (direction === ASC) {
    sortSet.sort((a, b) => {
      return a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : 0;
    });
  } else {
    sortSet.sort((a, b) => {
      return a[1] > b[1] ? -1 : b[1] > a[1] ? 1 : 0;
    });
  }
}

function sort2(sortSet, rows, sortCriteria) {
  const len = rows.length;
  const [colIdx1] = sortCriteria[0];
  const [colIdx2] = sortCriteria[1];
  for (let i = 0; i < len; i++) {
    sortSet[i][0] = i;
    sortSet[i][1] = rows[i][colIdx1];
    sortSet[i][2] = rows[i][colIdx2];
  }
  sortSet.sort((a, b) => {
    return a[1] > b[1] ? 1 : b[1] > a[1] ? -1 : a[2] > b[2] ? 1 : b[2] > a[2] ? -1 : 0;
  });
}

function sort3(/*sortSet,rows,sortCriteria*/) {}
function sortAll(/*sortSet,rows,sortCriteria*/) {}

export function binarySearch(items, item, comparator) {
  let l = 0;
  let h = items.length - 1;
  let m;
  let comparison;

  while (l <= h) {
    m = (l + h) >>> 1; /* equivalent to Math.floor((l + h) / 2) but faster */
    comparison = comparator(items[m], item);
    if (comparison < 0) {
      l = m + 1;
    } else if (comparison > 0) {
      h = m - 1;
    } else {
      return m;
    }
  }
  return ~l;
}

export function binaryInsert(rows, row, comparator) {
  var i = binarySearch(rows, row, comparator);
  /* if the binarySearch return value was zero or positive, a matching object was found */
  /* if the return value was negative, the bitwise complement of the return value is the correct index for this object */
  if (i < 0) {
    i = ~i;
  }
  rows.splice(i, 0, row);
  return i;
}

function processTail(tail, row, tailGateKeeper, n, compare) {
  const diff = tailGateKeeper === null ? -1 : compare(row, tailGateKeeper);

  if (diff > 0 || tail.length < n) {
    binaryInsert(tail, row, compare);
    if (tail.length > n) {
      tail.shift();
    }
    tailGateKeeper = tail[0];
  }
  return tailGateKeeper;
}

// this is always called with a single col sort
export function sortedLowestAndHighest(rows, sortCriteria, offset, n = 1000) {
  const s1 = new Date().getTime();
  const compare = sortBy(sortCriteria);
  const head = rows.slice(0, n).sort(compare);
  const tail = [];
  const len = rows.length;

  let headGateKeeper = head[n - 1];
  let tailGateKeeper = null;

  for (let i = n; i < len; i++) {
    if (compare(rows[i], headGateKeeper) < 0) {
      binaryInsert(head, rows[i], compare);
      // We need to remove largest item from head, does it belong in tail ?
      tailGateKeeper = processTail(tail, head.pop(), tailGateKeeper, n, compare);
      headGateKeeper = head[n - 1];
    } else {
      tailGateKeeper = processTail(tail, rows[i], tailGateKeeper, n, compare);
    }
  }

  for (let i = 0; i < head.length; i++) {
    const row = head[i].slice();
    row[0] = i + offset;
    head[i] = row;
  }

  for (let i = 0, idx = len - n; i < tail.length; i++, idx++) {
    const row = tail[i].slice();
    row[0] = idx + offset;
    tail[i] = row;
  }

  const s2 = new Date().getTime();
  console.log(`lowest ${n} took ${s2 - s1} ms , producing ${head.length} lowest `);

  return [head, tail];
}

export function sortReversed(cols1, cols2, colCount = cols1.length) {
  if (cols1 && cols2 && cols1.length > 0 && cols2.length === colCount) {
    for (let i = 0; i < colCount; i++) {
      let [col1, direction1 = ASC] = cols1[i];
      let [col2, direction2 = ASC] = cols2[i];
      if (col1 !== col2 || direction1 === direction2) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

export function GROUP_ROW_TEST(group, row, [colIdx, direction]) {
  if (group === row) {
    return 0;
  } else {
    let a1 = direction === DSC ? row[colIdx] : group[colIdx];
    let b1 = direction === DSC ? group[colIdx] : row[colIdx];
    if (b1 === null || a1 > b1) {
      return 1;
    } else if (a1 == null || a1 < b1) {
      return -1;
    }
  }
}

function ROW_SORT_TEST(a, b, [colIdx, direction]) {
  if (a === b) {
    return 0;
  } else {
    let a1 = direction === DSC ? b[colIdx] : a[colIdx];
    let b1 = direction === DSC ? a[colIdx] : b[colIdx];
    if (b1 === null || a1 > b1) {
      return 1;
    } else if (a1 == null || a1 < b1) {
      return -1;
    }
  }
}

// sort null as low. not high
export function sortBy(cols, test = ROW_SORT_TEST) {
  return function (a, b) {
    for (let i = 0, result = 0, len = cols.length; i < len; i++) {
      // eslint-disable-next-line no-cond-assign
      if ((result = test(a, b, cols[i]))) {
        return result;
      }
    }
    return 0;
  };
}

// sorter is the sort comparator used to sort rows, we want to know
// where row would be positioned in this sorted array. Return the
// last valid position.
export function sortPosition(rows, sorter, row, positionWithinRange = 'last-available') {
  function selectFromRange(pos) {
    const len = rows.length;
    const matches = (p) => sorter(rows[p], row) === 0;

    //TODO this will depend on the sort direction
    if (positionWithinRange === 'last-available') {
      while (pos < len && matches(pos)) {
        pos += 1;
      }
    } else if (positionWithinRange === 'first-available') {
      while (pos > 0 && matches(pos - 1)) {
        pos -= 1;
      }
    }

    return pos;
  }

  function find(lo, hi) {
    let mid = lo + Math.floor((hi - lo) / 2);
    let pos = sorter(rows[mid], row);

    if (lo === mid) {
      return selectFromRange(pos >= 0 ? lo : hi);
    }
    if (pos >= 0) {
      hi = mid;
    } else {
      lo = mid;
    }
    return find(lo, hi);
  }

  if (rows.length === 0) {
    return 0;
  } else {
    return find(0, rows.length);
  }
}
