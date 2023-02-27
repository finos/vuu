import {
  ColumnDescriptor,
  ColumnType,
  ColumnTypeDescriptor,
  ColumnTypeSimple,
  GroupColumnDescriptor,
  KeyedColumnDescriptor,
  TableHeading,
  TableHeadings,
} from "@finos/vuu-datagrid-types";
import {
  VuuAggregation,
  VuuAggType,
  VuuColumnDataType,
  VuuDataRow,
  VuuGroupBy,
  VuuRowRecord,
  VuuSort,
} from "@finos/vuu-protocol-types";
import { CSSProperties } from "react";

import { DataSourceRow } from "@finos/vuu-data";
import { DataSourceFilter } from "@finos/vuu-data-types";
import { Filter, MultiClauseFilter } from "@finos/vuu-filter-types";
import { isFilterClause, isMultiClauseFilter } from "./filter-utils";

export interface ColumnMap {
  [columnName: string]: number;
}

const SORT_ASC = "asc";
const NO_HEADINGS: TableHeadings = [];

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

export const fromServerDataType = (
  serverDataType: VuuColumnDataType
): ColumnTypeSimple => {
  switch (serverDataType) {
    case "double":
    case "int":
    case "long":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
};

export const isNumericColumn = ({ serverDataType, type }: ColumnDescriptor) => {
  if (
    serverDataType === "int" ||
    serverDataType === "long" ||
    serverDataType === "double"
  ) {
    return true;
  }
  if (typeof type === "string") {
    return type === "number";
  }
  if (typeof type?.name === "string") {
    return type?.name === "number";
  }

  return false;
};

export const notHidden = (column: ColumnDescriptor) => column.hidden !== true;

export const isPinned = (column: ColumnDescriptor) =>
  typeof column.pin === "string";

export const hasHeadings = (column: ColumnDescriptor) =>
  Array.isArray(column.heading) && column.heading.length > 0;

export const isResizing = (column: KeyedColumnDescriptor) => column.resizing;

export const isTextColumn = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined
    ? false
    : serverDataType === "char" || serverDataType === "string";

export const toColumnDescriptor = (name: string): ColumnDescriptor => ({
  name,
});

export const isTypeDescriptor = (
  type?: ColumnType
): type is ColumnTypeDescriptor =>
  typeof type !== "undefined" && typeof type !== "string";

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
  groupBy?: VuuGroupBy,
  confirmed = true
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
      groupConfirmed: confirmed,
      width: groupCols.map((c) => c.width).reduce((a, b) => a + b) + 100,
    } as GroupColumnDescriptor;

    return [groupCol, rest];
  }
  return [null, flattenColumnGroup(columns)];
}

export const isGroupColumn = (
  column: KeyedColumnDescriptor
): column is GroupColumnDescriptor => column.isGroup === true;

export const isJsonAttribute = (value: unknown) =>
  typeof value === "string" && value.endsWith("+");

export const isJsonGroup = (column: KeyedColumnDescriptor, row: VuuDataRow) =>
  (column.type as ColumnTypeDescriptor)?.name === "json" &&
  isJsonAttribute(row[column.key]);

export const isJsonColumn = (column: KeyedColumnDescriptor) =>
  (column.type as ColumnTypeDescriptor)?.name === "json";

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

export const getTableHeadings = (
  columns: KeyedColumnDescriptor[]
): TableHeadings => {
  if (columns.some(hasHeadings)) {
    const maxHeadingDepth = columns.reduce<number>(
      (max, { heading }) => Math.max(max, heading?.length ?? 0),
      0
    );

    let heading: TableHeading | undefined = undefined;
    const tableHeadings: TableHeadings = [];
    let tableHeadingsRow: TableHeading[];
    for (let level = 0; level < maxHeadingDepth; level++) {
      tableHeadingsRow = [];
      columns.forEach(({ heading: columnHeading = NO_HEADINGS }) => {
        const label = columnHeading[level] ?? "";
        if (heading && heading.label === label) {
          heading.span += 1;
        } else {
          heading = { label, span: 1 } as TableHeading;
          tableHeadingsRow.push(heading);
        }
      });
      tableHeadings.push(tableHeadingsRow);
    }

    console.log({ maxHeadingDepth, tableHeadings });

    return tableHeadings;
  }
  return NO_HEADINGS;
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

export const extractFilterForColumn = (
  filter: Filter | undefined,
  columnName: string
) => {
  if (isMultiClauseFilter(filter)) {
    return collectFiltersForColumn(filter, columnName);
  }
  if (isFilterClause(filter)) {
    return filter.column === columnName ? filter : undefined;
  }
  return undefined;
};

const collectFiltersForColumn = (
  filter: MultiClauseFilter,
  columnName: string
) => {
  const { filters, op } = filter;
  const results: Filter[] = [];
  filters.forEach((filter) => {
    const ffc = extractFilterForColumn(filter, columnName);
    if (ffc) {
      results.push(ffc);
    }
  });
  if (results.length === 0) {
    return undefined;
  } else if (results.length === 1) {
    return results[0];
  }
  return {
    op,
    filters: results,
  };
};

export const applyGroupByToColumns = (
  columns: KeyedColumnDescriptor[],
  groupBy: VuuGroupBy,
  confirmed = true
) => {
  if (groupBy.length) {
    const [groupColumn, nonGroupedColumns] = extractGroupColumn(
      columns,
      groupBy,
      confirmed
    );
    if (groupColumn) {
      return [groupColumn as KeyedColumnDescriptor].concat(nonGroupedColumns);
    }
  } else if (columns[0]?.isGroup) {
    return flattenColumnGroup(columns);
  }
  return columns;
};

export const applySortToColumns = (
  colunms: KeyedColumnDescriptor[],
  sort: VuuSort
) =>
  colunms.map((column) => {
    const sorted = getSortType(column, sort);
    if (sorted !== undefined) {
      return {
        ...column,
        sorted,
      };
    } else if (column.sorted) {
      return {
        ...column,
        sorted: undefined,
      };
    } else {
      return column;
    }
  });

export const applyFilterToColumns = (
  columns: KeyedColumnDescriptor[],
  { filterStruct }: DataSourceFilter
) =>
  columns.map((column) => {
    // TODO this gives us a dependency on vuu-filters
    const filter = extractFilterForColumn(filterStruct, column.name);
    if (filter !== undefined) {
      return {
        ...column,
        filter,
      };
    } else if (column.filter) {
      return {
        ...column,
        filter: undefined,
      };
    } else {
      return column;
    }
  });

const getSortType = (column: ColumnDescriptor, { sortDefs }: VuuSort) => {
  const sortDef = sortDefs.find((sortCol) => sortCol.column === column.name);
  if (sortDef) {
    return sortDefs.length > 1
      ? (sortDefs.indexOf(sortDef) + 1) * (sortDef.sortType === "A" ? 1 : -1)
      : sortDef.sortType;
  }
};

// Calculated columns have the formal 'name:datatype:expression'
export const getColumnName = (name: string) => {
  const pos = name.indexOf(":");
  if (pos === -1) {
    return name;
  } else {
    return name.slice(0, pos);
  }
};

export const toDataSourceColumns = (column: ColumnDescriptor) =>
  column.expression
    ? `${column.name}:${column.serverDataType}:${column.expression}`
    : column.name;

export const getRowRecord = (
  row: DataSourceRow,
  columnMap: ColumnMap
): VuuRowRecord => {
  return Object.entries(columnMap).reduce<VuuRowRecord>(
    (map, [colName, key]) => {
      map[colName] = row[key];
      return map;
    },
    {}
  );
};
