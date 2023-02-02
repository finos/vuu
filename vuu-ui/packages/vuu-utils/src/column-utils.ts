import {
  ColumnDescriptor,
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import {
  VuuAggregation,
  VuuAggType,
  VuuGroupBy,
} from "@finos/vuu-protocol-types";
import { CSSProperties } from "react";
import { Row } from "./row-utils";

export interface ColumnMap {
  [columnName: string]: number;
}

const SORT_ASC = "asc";

export type SortCriteriaItem = string | [string, "asc"]; // TODO where is 'desc'?

export const AggregationType: { [key: string]: VuuAggType } = {
  Average: 2,
  Count: 3,
  Sum: 1,
  High: 4,
  Low: 5,
};

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

export const isKeyedColumn = (
  column: ColumnDescriptor
): column is KeyedColumnDescriptor => {
  return typeof (column as KeyedColumnDescriptor).key === "number";
};

export const isNumericColumn = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined
    ? false
    : serverDataType === "int" ||
      serverDataType === "long" ||
      serverDataType === "double";

export const isTextColumn = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined
    ? false
    : serverDataType === "char" || serverDataType === "string";

export const toColumnDescriptor = (name: string): ColumnDescriptor => ({
  name,
});

const EMPTY_COLUMN_MAP = {} as const;

export function buildColumnMap(
  columns?: (KeyedColumnDescriptor | string)[]
): ColumnMap {
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

// This method mutates the passed columns array
const insertColumn = (
  columns: KeyedColumnDescriptor[],
  column: KeyedColumnDescriptor
) => {
  const { originalIdx } = column;
  if (typeof originalIdx === "number") {
    for (let i = 0; i < columns.length; i++) {
      const { originalIdx: colIdx = -1 } = columns[i];
      if (colIdx > originalIdx) {
        columns.splice(i, 0, column);
        return columns;
      }
    }
  }
  columns.push(column);
  return columns;
};

export const flattenColumnGroup = (
  columns: KeyedColumnDescriptor[]
): KeyedColumnDescriptor[] => {
  if (columns[0]?.isGroup) {
    const [groupColumn, ...nonGroupedColumns] = columns as [
      GroupColumnDescriptor,
      ...KeyedColumnDescriptor[]
    ];
    groupColumn.columns.forEach((groupColumn) => {
      insertColumn(nonGroupedColumns, groupColumn);
    });
    return nonGroupedColumns;
  } else {
    return columns;
  }
};

export function extractGroupColumn(
  columns: KeyedColumnDescriptor[],
  groupBy?: VuuGroupBy
): [GroupColumnDescriptor | null, KeyedColumnDescriptor[]] {
  if (groupBy && groupBy.length > 0) {
    const flattenedColumns = flattenColumnGroup(columns);
    // Note: groupedColumns will be in column order, not groupBy order
    const [groupedColumns, rest] = flattenedColumns.reduce(
      (result, column, i) => {
        const [g, r] = result;
        if (groupBy.includes(column.name)) {
          g.push({
            ...column,
            originalIdx: i,
          });
        } else {
          r.push(column);
        }

        return result;
      },
      [[], []] as [KeyedColumnDescriptor[], KeyedColumnDescriptor[]]
    );
    if (groupedColumns.length !== groupBy.length) {
      throw Error(
        `extractGroupColumn: no column definition found for all groupBy cols ${JSON.stringify(
          groupBy
        )} `
      );
    }
    const groupCount = groupBy.length;
    const groupCols: KeyedColumnDescriptor[] = groupBy.map((name, idx) => {
      // Keep the cols in same order defined on groupBy
      const column = groupedColumns.find(
        (col) => col.name === name
      ) as KeyedColumnDescriptor;
      return {
        ...column,
        groupLevel: groupCount - idx,
      };
    });

    const groupCol = {
      key: -1,
      name: "group-col",
      heading: ["group-col"],
      isGroup: true,
      columns: groupCols,
      width: groupCols.map((c) => c.width).reduce((a, b) => a + b) + 100,
    } as GroupColumnDescriptor;

    return [groupCol, rest];
  }
  return [null, flattenColumnGroup(columns)];
}

export const isGroupColumn = (
  column: KeyedColumnDescriptor
): column is GroupColumnDescriptor => column.isGroup === true;

export const isPinned = (column: ColumnDescriptor) =>
  typeof column.pin === "string";

export const sortPinnedColumns = (
  columns: KeyedColumnDescriptor[]
): KeyedColumnDescriptor[] => {
  const leftPinnedColumns: KeyedColumnDescriptor[] = [];
  const rightPinnedColumns: KeyedColumnDescriptor[] = [];
  const restColumns: KeyedColumnDescriptor[] = [];
  let pinnedWidthLeft = 0;
  for (const column of columns) {
    // prettier-ignore
    switch(column.pin){
      case "left": {
        leftPinnedColumns.push({
          ...column,
          endPin: undefined,
          pinnedOffset: pinnedWidthLeft
        }); 
        pinnedWidthLeft += column.width;
      }
      break;
    // store right pinned columns initially in reverse order      
      case "right": rightPinnedColumns.unshift(column); break;
      default: restColumns.push(column)
    }
  }

  if (leftPinnedColumns.length) {
    leftPinnedColumns.push({
      ...(leftPinnedColumns.pop() as KeyedColumnDescriptor),
      endPin: true,
    });
  }

  const allColumns = leftPinnedColumns.length
    ? leftPinnedColumns.concat(restColumns)
    : restColumns;

  if (rightPinnedColumns.length) {
    const measuredRightPinnedColumns: KeyedColumnDescriptor[] = [];
    let pinnedWidthRight = 0;
    for (const column of rightPinnedColumns) {
      measuredRightPinnedColumns.unshift({
        ...column,
        pinnedOffset: pinnedWidthRight,
      });
      pinnedWidthRight += column.width;
    }
    measuredRightPinnedColumns[0].endPin = true;
    return allColumns.concat(measuredRightPinnedColumns);
  } else {
    return allColumns;
  }
};

export const getColumnPinStyle = (column: KeyedColumnDescriptor) =>
  column.pin === "left"
    ? ({ left: column.pinnedOffset } as CSSProperties)
    : column.pin === "right"
    ? ({ right: column.pinnedOffset } as CSSProperties)
    : undefined;

export const setAggregations = (
  aggregations: VuuAggregation[],
  column: KeyedColumnDescriptor,
  aggType: VuuAggType
) => {
  return aggregations
    .filter((agg) => agg.column !== column.name)
    .concat({ column: column.name, aggType });
};
