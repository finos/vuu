import {
  ColumnDescriptor,
  KeyedColumnDescriptor,
} from "@vuu-ui/vuu-datagrid/src/grid-model/gridModelTypes";
import { Row } from "./row-utils";

export interface ColumnMap {
  [columnName: string]: number;
}

const SORT_ASC = "asc";

export type SortCriteriaItem = string | [string, "asc"]; // TODO where is 'desc'?

export function mapSortCriteria(
  sortCriteria: SortCriteriaItem[],
  columnMap: ColumnMap,
  metadataOffset = 0
): [number, "asc"][] {
  return sortCriteria.map((s) => {
    if (typeof s === "string") {
      return [columnMap[s] + metadataOffset, "asc"];
    } else if (Array.isArray(s)) {
      const [columnName, sortDir] = s;
      return [columnMap[columnName] + metadataOffset, sortDir || SORT_ASC];
    } else {
      throw Error("columnUtils.mapSortCriteria invalid input");
    }
  });
}

export function isKeyedColumn(
  column: ColumnDescriptor
): column is KeyedColumnDescriptor {
  return typeof (column as KeyedColumnDescriptor).key === "number";
}

export const toColumnDescriptor = (name: string): ColumnDescriptor => ({
  name,
});

export const toKeyedColumn = (
  column: string | ColumnDescriptor,
  key: number
): KeyedColumnDescriptor => {
  if (typeof column === "string") {
    return { key, name: column };
  }
  if (isKeyedColumn(column)) {
    return column;
  }
  return { ...column, key };
};

const EMPTY_COLUMN_MAP = {} as const;

export function buildColumnMap(columns?: (Column | string)[]): ColumnMap {
  const start = metadataKeys.count;
  if (columns) {
    return columns.reduce((map, column, i) => {
      if (typeof column === "string") {
        map[column] = start + i;
      } else if (typeof column.key === "number") {
        map[column.name] = column.key;
      } else {
        map[column.name] = start + i;
      }
      return map;
    }, {} as ColumnMap);
  } else {
    return EMPTY_COLUMN_MAP;
  }
}

export function projectUpdates(updates: number[]): number[] {
  const results: number[] = [];
  const metadataOffset = metadataKeys.count - 2;
  for (let i = 0; i < updates.length; i += 3) {
    results[i] = updates[i] + metadataOffset;
    results[i + 1] = updates[i + 1];
    results[i + 2] = updates[i + 2];
  }
  return results;
}

export function projectColumns(
  tableRowColumnMap: ColumnMap,
  columns: ColumnDescriptor[]
) {
  const columnCount = columns.length;
  const { IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED, count } = metadataKeys;
  return (startIdx: number, offset: number, selectedRows: Row[] = []) =>
    (row: Row, i: number) => {
      // selectedRows are indices of rows within underlying dataset (not sorted or filtered)
      // row is the original row from this set, with original index in IDX pos, which might
      // be overwritten with a different value below if rows are sorted/filtered
      const baseRowIdx: any = row[IDX]; // TODO
      const out = [];
      for (let i = 0; i < columnCount; i++) {
        const colIdx = tableRowColumnMap[columns[i].name];
        out[count + i] = row[colIdx];
      }

      out[IDX] = startIdx + i + offset;
      out[RENDER_IDX] = 0;
      out[DEPTH] = 0;
      out[COUNT] = 0;
      out[KEY] = row[tableRowColumnMap.KEY];
      out[SELECTED] = selectedRows.includes(baseRowIdx) ? 1 : 0;
      return out;
    };
}

export type Meta = {
  [key: string]: any;
} & any[];

export const metadataKeys = {
  IDX: 0,
  RENDER_IDX: 1,
  IS_LEAF: 2,
  IS_EXPANDED: 3,
  DEPTH: 4,
  COUNT: 5,
  KEY: 6,
  SELECTED: 7,
  count: 8,
  // TODO following only used in datamodel
  PARENT_IDX: "parent_idx",
  IDX_POINTER: "idx_pointer",
  FILTER_COUNT: "filter_count",
  NEXT_FILTER_IDX: "next_filter_idx",
} as const;
