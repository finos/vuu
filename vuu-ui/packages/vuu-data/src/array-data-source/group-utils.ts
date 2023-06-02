import { VuuGroupBy } from "@finos/vuu-protocol-types";
import { ColumnMap } from "@finos/vuu-utils";
import { DataSourceRow } from "../data-source";

type RowSortComparator = (
  item1: DataSourceRow,
  item2: DataSourceRow
) => 0 | -1 | 1;

const sortComparator =
  (idx: number): RowSortComparator =>
  (row1, row2) => {
    const v1 = row1[idx];
    const v2 = row2[idx];
    return v1 > v2 ? 1 : v2 > v1 ? -1 : 0;
  };

export const groupRows = (
  rows: readonly DataSourceRow[],
  groupBy: VuuGroupBy,
  columnMap: ColumnMap
): DataSourceRow[] => {
  const sortIndices = groupBy.map<number>((colName) => columnMap[colName]);
  // 1) sort the data
  const sortedRows = rows.slice().sort(sortComparator(sortIndices[0]));

  // 2) collapse int groups

  return sortedRows;
};
