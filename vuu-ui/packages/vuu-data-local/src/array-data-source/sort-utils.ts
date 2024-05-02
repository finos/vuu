import type { DataSourceRow } from "@finos/vuu-data-types";
import type { VuuSort, VuuSortType } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";

type SortDef = [number, VuuSortType];
type SortPredicate = (
  r1: DataSourceRow,
  r2: DataSourceRow,
  sortDefDef: SortDef
) => SortCompareResult;
type SortCompareResult = 0 | 1 | -1;
type RowSortComparatorFactory = (
  sortDefs: SortDef[],
  test?: SortPredicate
) => RowSortComparator;
type RowSortComparator = (
  item1: DataSourceRow,
  item2: DataSourceRow
) => SortCompareResult;

const defaultSortPredicate: SortPredicate = (r1, r2, [i, direction]) => {
  const val1 = direction === "D" ? r2[i] : r1[i];
  const val2 = direction === "D" ? r1[i] : r2[i];
  if (val1 === val2) {
    return 0;
  } else if (val2 === null || val1 > val2) {
    return 1;
  } else {
    return -1;
  }
};

const sortComparator = (sortDefs: SortDef[]): RowSortComparator => {
  if (sortDefs.length === 1) {
    return singleColComparator(sortDefs);
  } else if (sortDefs.length === 2) {
    return twoColComparator(sortDefs);
  } else {
    return multiColComparator(sortDefs);
  }
};

const singleColComparator: RowSortComparatorFactory =
  ([[i, direction]]) =>
  (r1, r2) => {
    const v1 = direction === "D" ? r2[i] : r1[i];
    const v2 = direction === "D" ? r1[i] : r2[i];
    return v1 > v2 ? 1 : v2 > v1 ? -1 : 0;
  };

const twoColComparator: RowSortComparatorFactory =
  ([[idx1, direction1], [idx2, direction2]]) =>
  (r1, r2) => {
    const v1 = direction1 === "D" ? r2[idx1] : r1[idx1];
    const v2 = direction1 === "D" ? r1[idx1] : r2[idx1];
    const v3 = direction2 === "D" ? r2[idx2] : r1[idx2];
    const v4 = direction2 === "D" ? r1[idx2] : r2[idx2];
    return v1 > v2 ? 1 : v2 > v1 ? -1 : v3 > v4 ? 1 : v4 > v3 ? -1 : 0;
  };

const multiColComparator: RowSortComparatorFactory =
  (sortDefs, test = defaultSortPredicate) =>
  (r1, r2) => {
    for (const sortDef of sortDefs) {
      const result = test(r1, r2, sortDef);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };

export const sortRows = (
  rows: readonly DataSourceRow[],
  { sortDefs }: VuuSort,
  columnMap: ColumnMap
) => {
  const indexedSortDefs = sortDefs.map<SortDef>(({ column, sortType }) => [
    columnMap[column],
    sortType,
  ]);
  const comparator = sortComparator(indexedSortDefs);
  return rows.slice().sort(comparator);
};
