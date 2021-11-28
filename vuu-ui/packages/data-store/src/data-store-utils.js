const NO_COLUMNS = [];
const NO_FILTER = { filter: '' };
const NO_SORT = { sortDefs: [] };

export const viewportChanges = (
  {
    columns: currentColumns = NO_COLUMNS,
    filterSpec: currentFilterSpec = NO_FILTER,
    groupBy: currentGroupBy = NO_COLUMNS,
    sort: currentSort = NO_SORT
  },
  {
    columns: newColumns = NO_COLUMNS,
    filterSpec: newFilterSpec = NO_FILTER,
    groupBy: newGroupBy = NO_COLUMNS,
    sort: newSort = NO_SORT
  }
) => {
  const result = {};
  if (!sameColumns(currentColumns, newColumns)) {
    result.columns = true;
  }

  if (!sameSort(currentSort, newSort)) {
    result.sort = true;
  }

  if (!sameColumns(currentGroupBy, newGroupBy)) {
    result.groupBy = true;
  }

  if (currentFilterSpec.filter !== newFilterSpec.filter) {
    result.filter = true;
  }

  return result;
};

function sameColumns(currentColumns, newColumns) {
  if (currentColumns.length !== newColumns.length) {
    return false;
  }
  if (
    currentColumns.some(
      ({ column, sortType }) =>
        !newColumns.find((colDef) => colDef.column === column && colDef.sortType === sortType)
    )
  ) {
    return false;
  }
  return true;
}

function sameSort({ sortDefs: currentSortDefs }, { sortDefs: newSortDefs }) {
  if (currentSortDefs.length !== newSortDefs.length) {
    return false;
  }
  if (
    currentSortDefs.some(({ col, dir }, i) => {
      const { col: newCol, dir: newDir } = newSortDefs[i];
      return newCol === col && newDir === dir;
    })
  ) {
    return false;
  }

  return true;
}
