import { DataSourceRow } from "@finos/vuu-data";
import { VuuSortCol } from "../../vuu-protocol-types";
import { AgGridFilter } from "./AgGridFilterUtils";
import { ColumnMap, metadataKeys } from "@finos/vuu-utils";

// export type AgGridDataRow = Record<string, number | string | boolean>;
export type AgGridDataSet = { [key: number]: AgDataRow };

type ColumnVO = {
  id: string;
};

type IServerSideGetRowsRequest = {
  endRow: number;
  filterModel: AgGridFilter;
  groupKeys: string[];
  rowGroupCols: ColumnVO[];
  sortModel: SortModelItem[];
  startRow: number;
};

type SortModelItem = {
  colId: string;
};

type ColumnState = {
  colId: string;
  sort?: unknown;
  sortIndex?: number;
};

const { DEPTH, IS_LEAF, IS_EXPANDED, KEY } = metadataKeys;
export const convertToAgGridDataSet = (
  rows: DataSourceRow[],
  columnMap: ColumnMap
): AgGridDataSet => {
  const result: AgGridDataSet = {};
  rows.forEach((row) => {
    const [rowIdx] = row;
    result[rowIdx] = toAgGridRow(row, columnMap);
  });
  return result;
};

export const convertToAgGridDataRows = (
  rows: DataSourceRow[],
  columnMap: ColumnMap
): AgDataRow[] => {
  const result: AgDataRow[] = [];
  rows.forEach((row) => {
    result.push(toAgGridRow(row, columnMap));
  });
  return result;
};

export type AgDataItem = string | number | boolean;
export type AgDataRow = {
  vuuKey: string;
  [key: string]: AgDataItem;
};

export type AgViewportRows = { [key: string]: AgDataRow };

export const toAgViewportRow = (data: DataSourceRow, columnMap: ColumnMap) => {
  const {
    [DEPTH]: depth,
    [IS_EXPANDED]: isExpanded,
    [IS_LEAF]: isLeaf,
    [KEY]: key,
  } = data;
  // TODO precompute the keys once
  const row: AgDataRow = toAgGridRow(data, columnMap);

  if (!isLeaf) {
    row.groupKey = key;
    row.groupKeys = key;
    row.expanded = isExpanded;
    row.groupRow = true;
    row.level = depth - 1;
  }
  return row;
};

export const convertToAgViewportRows = (
  rows: DataSourceRow[],
  columnMap: ColumnMap
): AgViewportRows => {
  const result: AgViewportRows = {};
  rows.forEach((row) => {
    const [rowIndex] = row;
    result[rowIndex] = toAgViewportRow(row, columnMap);
  });
  return result;
};

export const toAgGridRow = (data: DataSourceRow, columnMap: ColumnMap) => {
  const { [KEY]: key } = data;
  const row: AgDataRow = { vuuKey: key };
  // TODO precompute the keys once
  for (const colName of Object.keys(columnMap)) {
    row[colName] = data[columnMap[colName]];
  }
  return row;
};

export type Changes = {
  range?: boolean;
  filterModel?: boolean;
  groupKeys?: boolean;
  rowGroupCols?: boolean;
  sortModel?: boolean;
};

// TODO make this more efficient
const filterChanged = (previousFilter: AgGridFilter, filter: AgGridFilter) =>
  JSON.stringify(previousFilter) !== JSON.stringify(filter);

const groupKeysChanged = (previousGroup: string[], group: string[]) =>
  previousGroup.length !== group.length ||
  previousGroup.some((s, i) => group[i] !== s);

const rowGroupColsChanged = (previousGroup: ColumnVO[], group: ColumnVO[]) =>
  previousGroup.length !== group.length ||
  previousGroup.some((s, i) => group[i].id !== s.id);

const sortModelChanged = (
  previousSortModel: SortModelItem[],
  sortModel: SortModelItem[]
) =>
  previousSortModel.length !== sortModel.length ||
  previousSortModel.some((s, i) => sortModel[i].colId !== s.colId);

export const whatHasChangedinAgGridRequest = (
  request: IServerSideGetRowsRequest,
  previousRequest?: IServerSideGetRowsRequest
): Changes => {
  const {
    startRow = 0,
    endRow = 100,
    filterModel,
    sortModel,
    groupKeys,
    rowGroupCols,
  } = request;

  if (previousRequest === undefined) {
    return {
      filterModel: Object.keys(filterModel).length > 0,
      groupKeys: groupKeys.length > 0,
      range: true,
      rowGroupCols: rowGroupCols.length > 0,
      sortModel: sortModel.length > 0,
    };
  } else {
    return {
      filterModel: filterChanged(previousRequest.filterModel, filterModel),
      groupKeys: groupKeysChanged(previousRequest.groupKeys, groupKeys),
      range:
        previousRequest.startRow !== startRow ||
        previousRequest.endRow !== endRow,
      rowGroupCols: rowGroupColsChanged(
        previousRequest.rowGroupCols,
        rowGroupCols
      ),
      sortModel: sortModelChanged(previousRequest.sortModel, sortModel),
    };
  }
};

export const isSortedColumn = ({ sortIndex }: ColumnState) =>
  typeof sortIndex === "number";
export const toSortDef = ({
  colId: column,
  sort,
}: ColumnState): VuuSortCol => ({
  column,
  sortType: sort === "desc" ? "D" : "A",
});
export const bySortIndex = (
  { sortIndex: s1 }: ColumnState,
  { sortIndex: s2 }: ColumnState
) =>
  s1 == null && s2 == null ? 0 : s1 == null ? 1 : s2 == null ? -1 : s1 - s2;

export const buildVuuTreeNodeKey = (groupCols: string[], data: any) =>
  groupCols.reduce<string>((key, colId) => {
    const groupKey = data[colId];
    return groupKey === undefined ? key : `${key}|${groupKey}`;
  }, "$root");
