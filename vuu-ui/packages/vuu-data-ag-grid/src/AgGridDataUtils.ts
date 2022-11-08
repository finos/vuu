import { DataSourceRow } from "@vuu-ui/vuu-data";
import { VuuSortCol } from "../../vuu-protocol-types";
import {
  ColumnState,
  ColumnVO,
  IServerSideGetRowsRequest,
  SortModelItem,
} from "ag-grid-community";
import { AgGridFilter } from "./AgGridFilterUtils";

export type AgGridDataRow = Record<string, number | string | boolean>;
export type AgGridDataSet = { [key: number]: AgGridDataRow };

export const convertToAgGridDataSet = (
  rows: DataSourceRow[]
): AgGridDataSet => {
  const result: AgGridDataSet = {};
  rows.forEach((row) => {
    const [rowIdx] = row;
    result[rowIdx] = toAgGridRow(row);
  });
  return result;
};

export const convertToAgGridDataRows = (
  rows: DataSourceRow[]
): AgGridDataRow[] => {
  const result: AgGridDataRow[] = [];
  rows.forEach((row) => {
    result.push(toAgGridRow(row));
  });
  return result;
};

// TODO compute the col names
export const toAgGridRow = (data: DataSourceRow) => {
  return {
    bbg: data[8],
    currency: data[9],
    description: data[10],
    exchange: data[11],
    isin: data[12],
    lotSize: data[13],
    ric: data[14],
  };
};

export type Changes = {
  range?: boolean;
  filterModel?: boolean;
  groupKeys?: boolean;
  rowGroupCols?: boolean;
  sortModel?: boolean;
};

// TODO make this more efficient
const filterChanged = (previousFilter: AgGridFilter, filter: AgGridFilter[]) =>
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
