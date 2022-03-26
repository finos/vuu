const EMPTY_MAP = {};

export function sortByToMap(sortCriteria = null) {
  return sortCriteria === null
    ? EMPTY_MAP
    : sortCriteria.reduce((map, col, i) => {
        if (typeof col === 'string') {
          map[col] = i + 1;
        } else if (Array.isArray(col)) {
          // heswell style
          const [colName, sortDir] = col;
          map[colName] = sortDir === 'asc' ? i + 1 : -1 * (i + 1);
        } else {
          // vuu style
          const { column, sortType } = col;
          map[column] = sortType === 'A' ? i + 1 : -1 * (i + 1);
        }
        return map;
      }, {});
}

export function setSortColumn(sortColumns, column, direction) {
  if (!direction) {
    const existingSortState = sortColumns && sortColumns[column.name];
    if (existingSortState === 'asc') {
      direction = 'dsc';
    } else {
      direction = 'asc';
    }
  }
  return { [column.name]: direction };
}

export function addSortColumn(sortColumns, column, direction = 'asc') {
  const existingSortState = sortColumns[column.name];
  if (typeof existingSortState === 'number') {
    // Multi-column sort, reverse sort direction for this column
    return {
      ...sortColumns,
      [column.name]: existingSortState * -1
    };
  } else {
    const [firstSortCol, ...remainingSortCols] = Object.keys(sortColumns);
    if (remainingSortCols.length === 0) {
      // Add this column to existing single-column sort, now we have multi-column sort
      return {
        [firstSortCol]: sortColumns[firstSortCol] === 'asc' ? 1 : -1,
        [column.name]: direction === 'asc' ? 2 : -2
      };
    } else {
      // Add this column to existing multi-column sort
      return {
        ...sortColumns,
        [column.name]: (remainingSortCols.length + 2) * (direction === 'dsc' ? -1 : 1)
      };
    }
  }
}

export function removeSortColumn(sortColumns, column) {
  return Object.keys(sortColumns)
    .filter((columnName) => columnName !== column.name)
    .reduce((map, columnName, _idx, columns) => {
      const sortPos = sortColumns[columnName];
      map[columnName] =
        columns.length === 1
          ? sortPos > 0
            ? 'asc'
            : 'dsc'
          : Math.abs(sortPos) < Math.abs(sortColumns[column.name])
          ? sortPos
          : (Math.abs(sortPos) - 1) * (sortPos < 1 ? -1 : 1);
      return map;
    }, {});
}
