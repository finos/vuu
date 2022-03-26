import { functor, overrideColName } from './filter-utils';
import {Row} from "./row-utils";

const SORT_ASC = 'asc';

export type SortCriteriaItem = string | [string, 'asc']; // TODO where is 'desc'?

export interface ColumnMap {
  [columnName: string]: number;
}

export function mapSortCriteria(
  sortCriteria: SortCriteriaItem[],
  columnMap: ColumnMap,
  metadataOffset = 0
): [number, 'asc'][] {
  return sortCriteria.map((s) => {
    if (typeof s === 'string') {
      return [columnMap[s] + metadataOffset, 'asc'];
    } else if (Array.isArray(s)) {
      const [columnName, sortDir] = s;
      return [columnMap[columnName] + metadataOffset, sortDir || SORT_ASC];
    } else {
      throw Error('columnUtils.mapSortCriteria invalid input');
    }
  });
}

export interface Column {
  key?: number;
  name: string;
  type?: {
    name: string;
  } | string | null;
}

export interface KeyedColumn {
  key: number;
  name: string;
  type?: {
    name: string;
  } | string | null;
}

export function isKeyedColumn(column: Column): column is KeyedColumn {
  return typeof column.key === 'number';
}

export const toKeyedColumn = (column: string | Column, key: number): KeyedColumn => {
  if (typeof column === 'string') {
    return {key, name: column};
  }
  if (isKeyedColumn(column)) {
    return column;
  }
  return {...column, key};
}

export function buildColumnMap(columns?: Column[]): ColumnMap | null {
  const start = metadataKeys.count;
  if (columns) {
    return columns.reduce((map, column, i) => {
      if (typeof column === 'string') {
        map[column] = start + i;
      } else if (typeof column.key === 'number') {
        map[column.name] = column.key;
      } else {
        map[column.name] = start + i;
      }
      return map;
    }, {} as ColumnMap);
  } else {
    return null;
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

export function projectColumns(tableRowColumnMap: ColumnMap, columns: Column[]) {
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

export function projectColumnsFilter(map, columns: Column[], meta: Meta, filter) {
  const length = columns.length;
  const { IDX, RENDER_IDX, DEPTH, COUNT, KEY, SELECTED } = meta;

  // this is filterset specific where first col is always value
  const fn = filter ? functor(map, overrideColName(filter, 'name')) : () => true;
  return (startIdx) => (row, i) => {
    const out = [];
    for (let i = 0; i < length; i++) {
      const colIdx = map[columns[i].name];
      out[i] = row[colIdx];
    }
    // assume row[0] is key for now
    // out.push(startIdx+i, 0, 0, row[0]);
    out[IDX] = startIdx + i;
    out[RENDER_IDX] = 0;
    out[DEPTH] = 0;
    out[COUNT] = 0;
    out[KEY] = row[map.KEY];
    out[SELECTED] = fn(row) ? 1 : 0;

    return out;
  };
}

export function getFilterType(column) {
  return column.filter || filterTypeFromColumnType(column);
}

// {name: 'Price', 'type': {name: 'price'}, 'aggregate': 'avg'},
// {name: 'MarketCap', 'type': {name: 'number','format': 'currency'}, 'aggregate': 'sum'},

const filterTypeFromColumnType = (column: Column) => {
  // TODO add remaining filter types
  switch (getDataType(column)) {
    case 'number':
      return 'number';
    default:
      return 'set';
  }
};

export function getDataType({ type = null }: Column ) {
  if (type === null) {
    return 'set';
  } else if (typeof type === 'string') {
    return type;
  } else {
    switch (type!.name) {
      case 'price':
        return 'number';
      default:
        return type.name;
    }
  }
}

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
  PARENT_IDX: 'parent_idx',
  IDX_POINTER: 'idx_pointer',
  FILTER_COUNT: 'filter_count',
  NEXT_FILTER_IDX: 'next_filter_idx'
};
