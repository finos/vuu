import type {
  DataSourceFilter,
  DataSourceRow,
  SchemaColumn,
  TableSchema,
} from "@finos/vuu-data-types";
import type { Filter, MultiClauseFilter } from "@finos/vuu-filter-types";
import type {
  VuuAggregation,
  VuuAggType,
  VuuColumnDataType,
  VuuDataRow,
  VuuGroupBy,
  VuuRowRecord,
  VuuSort,
} from "@finos/vuu-protocol-types";
import type {
  ColumnAlignment,
  ColumnDescriptor,
  ColumnType,
  ColumnTypeDescriptor,
  ColumnTypeFormatting,
  ColumnTypeRendering,
  ColumnTypeSimple,
  ColumnTypeWithValidationRules,
  DefaultColumnConfiguration,
  GroupColumnDescriptor,
  LookupRenderer,
  MappedValueTypeRenderer,
  PinLocation,
  RuntimeColumnDescriptor,
  TableHeading,
  TableHeadings,
  ValueListRenderer,
  DateTimeColumnDescriptor,
} from "@finos/vuu-table-types";
import type { CSSProperties } from "react";
import { moveItem } from "./array-utils";
import { isFilterClause, isMultiClauseFilter } from "./filters/utils";

/**
 * ColumnMap provides a lookup of the index position of a data item within a row
 * by column name.
 */
export interface ColumnMap {
  [columnName: string]: number;
}

const SORT_ASC = "asc";
const NO_HEADINGS: TableHeadings = [];
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_MAX_WIDTH = 250;
const DEFAULT_MIN_WIDTH = 50;
// const DEFAULT_FLEX = 0;

export type SortCriteriaItem = string | [string, "asc"]; // TODO where is 'desc'?

export const AggregationType: { [key: string]: VuuAggType } = {
  Average: 2,
  Count: 3,
  Distinct: 6,
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

const numericTypes = ["int", "long", "double"];
export const getDefaultAlignment = (
  serverDataType?: VuuColumnDataType
): ColumnAlignment =>
  serverDataType === undefined
    ? "left"
    : numericTypes.includes(serverDataType)
    ? "right"
    : "left";

export const isValidColumnAlignment = (v: string): v is ColumnAlignment =>
  v === "left" || v === "right";

export const isValidPinLocation = (v: string): v is PinLocation =>
  isValidColumnAlignment(v) || v === "floating" || v === "";

export const isKeyedColumn = (
  column: ColumnDescriptor
): column is RuntimeColumnDescriptor => {
  return typeof (column as RuntimeColumnDescriptor).key === "number";
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

export const isDateTimeColumn = (
  column: ColumnDescriptor
): column is DateTimeColumnDescriptor =>
  (isTypeDescriptor(column.type) ? column.type.name : column.type) ===
  "date/time";

export const isPinned = (column: ColumnDescriptor) =>
  typeof column.pin === "string";

export const hasHeadings = (column: ColumnDescriptor) =>
  Array.isArray(column.heading) && column.heading.length > 0;

export const isResizing = (column: RuntimeColumnDescriptor) => column.resizing;

export const isTextColumn = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined
    ? false
    : serverDataType === "char" || serverDataType === "string";

export const toColumnDescriptor = (name: string): ColumnDescriptor => ({
  name,
});

/**
 *
 */
export const isTypeDescriptor = (
  type?: ColumnType
): type is ColumnTypeDescriptor =>
  typeof type !== "undefined" && typeof type !== "string";

const EMPTY_COLUMN_MAP = {} as const;

export const isColumnTypeRenderer = (
  renderer?: unknown
): renderer is ColumnTypeRendering =>
  typeof (renderer as ColumnTypeRendering)?.name !== "undefined";

export const isLookupRenderer = (
  renderer?: unknown
): renderer is LookupRenderer =>
  typeof (renderer as LookupRenderer)?.name !== "undefined" &&
  "lookup" in (renderer as LookupRenderer);

export const isValueListRenderer = (
  renderer?: unknown
): renderer is ValueListRenderer =>
  typeof (renderer as ValueListRenderer)?.name !== "undefined" &&
  Array.isArray((renderer as ValueListRenderer).values);

export const hasValidationRules = (
  type?: ColumnType
): type is ColumnTypeWithValidationRules =>
  isTypeDescriptor(type) &&
  isColumnTypeRenderer(type.renderer) &&
  Array.isArray(type.renderer.rules) &&
  type.renderer.rules.length > 0;

export const isMappedValueTypeRenderer = (
  renderer?: unknown
): renderer is MappedValueTypeRenderer =>
  renderer !== undefined &&
  typeof (renderer as MappedValueTypeRenderer)?.map !== "undefined";

export function buildColumnMap(
  columns?: (RuntimeColumnDescriptor | SchemaColumn | string)[]
): ColumnMap {
  const start = metadataKeys.count;
  if (columns) {
    return columns.reduce((map, column, i) => {
      if (typeof column === "string") {
        map[column] = start + i;
      } else if (isKeyedColumn(column)) {
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
  columns: RuntimeColumnDescriptor[],
  column: RuntimeColumnDescriptor
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
  columns: RuntimeColumnDescriptor[]
): RuntimeColumnDescriptor[] => {
  if (columns[0]?.isGroup) {
    const [groupColumn, ...nonGroupedColumns] = columns as [
      GroupColumnDescriptor,
      ...RuntimeColumnDescriptor[]
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
  columns: RuntimeColumnDescriptor[],
  groupBy?: VuuGroupBy,
  confirmed = true
): [GroupColumnDescriptor | null, RuntimeColumnDescriptor[]] {
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
      [[], []] as [RuntimeColumnDescriptor[], RuntimeColumnDescriptor[]]
    );
    if (groupedColumns.length !== groupBy.length) {
      throw Error(
        `extractGroupColumn: no column definition found for all groupBy cols ${JSON.stringify(
          groupBy
        )} `
      );
    }
    const groupCount = groupBy.length;
    const groupCols: RuntimeColumnDescriptor[] = groupBy.map((name, idx) => {
      // Keep the cols in same order defined on groupBy
      const column = groupedColumns.find(
        (col) => col.name === name
      ) as RuntimeColumnDescriptor;
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
  column: RuntimeColumnDescriptor
): column is GroupColumnDescriptor => column.isGroup === true;

export const isJsonAttribute = (value: unknown) =>
  typeof value === "string" && value.endsWith("+");

export const isJsonGroup = (column: RuntimeColumnDescriptor, row: VuuDataRow) =>
  (column.type as ColumnTypeDescriptor)?.name === "json" &&
  isJsonAttribute(row[column.key]);

export const isJsonColumn = (column: RuntimeColumnDescriptor) =>
  (column.type as ColumnTypeDescriptor)?.name === "json";

export const sortPinnedColumns = (
  columns: RuntimeColumnDescriptor[]
): RuntimeColumnDescriptor[] => {
  const leftPinnedColumns: RuntimeColumnDescriptor[] = [];
  const rightPinnedColumns: RuntimeColumnDescriptor[] = [];
  const restColumns: RuntimeColumnDescriptor[] = [];
  // 4 is the selectionEndSize, need to consider how we make this available
  let pinnedWidthLeft = 4;
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
      ...(leftPinnedColumns.pop() as RuntimeColumnDescriptor),
      endPin: true,
    });
  }

  const allColumns = leftPinnedColumns.length
    ? leftPinnedColumns.concat(restColumns)
    : restColumns;

  if (rightPinnedColumns.length) {
    const measuredRightPinnedColumns: RuntimeColumnDescriptor[] = [];
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

export const measurePinnedColumns = (
  columns: RuntimeColumnDescriptor[],
  selectionEndSize: number
) => {
  let pinnedWidthLeft = 0;
  let pinnedWidthRight = 0;
  let unpinnedWidth = 0;
  for (const column of columns) {
    const { hidden, pin, width } = column;
    const visibleWidth = hidden ? 0 : width;
    if (pin === "left") {
      pinnedWidthLeft += visibleWidth;
    } else if (pin === "right") {
      pinnedWidthRight += visibleWidth;
    } else {
      unpinnedWidth += visibleWidth;
    }
  }
  return {
    pinnedWidthLeft: pinnedWidthLeft + selectionEndSize,
    pinnedWidthRight: pinnedWidthRight + selectionEndSize,
    unpinnedWidth,
  };
};

export const getTableHeadings = (
  columns: RuntimeColumnDescriptor[]
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
      columns.forEach(({ heading: columnHeading = NO_HEADINGS, width }) => {
        const label = columnHeading[level] ?? "";
        if (heading && heading.label === label) {
          heading.width += width;
        } else {
          heading = { label, width } as TableHeading;
          tableHeadingsRow.push(heading);
        }
      });
      tableHeadings.push(tableHeadingsRow);
    }

    return tableHeadings;
  }
  return NO_HEADINGS;
};

export const getColumnStyle = ({
  pin,
  // the 4 is `selectionEndSize`, unfortunate if we need to be passed it from cell
  // need to think about how to make this available
  pinnedOffset = pin === "left" ? 0 : 4,
  width,
}: RuntimeColumnDescriptor) =>
  pin === "left"
    ? ({
        left: pinnedOffset,
        width,
        "--pin-width": `${pinnedOffset + width - 3}px`,
      } as CSSProperties)
    : pin === "right"
    ? ({
        right: pinnedOffset,
        width,
        "--pin-width": `${pinnedOffset + width}px`,
      } as CSSProperties)
    : { width };

export const setAggregations = (
  aggregations: VuuAggregation[],
  column: RuntimeColumnDescriptor,
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
  columns: RuntimeColumnDescriptor[],
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
      return [groupColumn as RuntimeColumnDescriptor].concat(nonGroupedColumns);
    }
  } else if (columns[0]?.isGroup) {
    return flattenColumnGroup(columns);
  }
  return columns;
};

export const applySortToColumns = (
  colunms: RuntimeColumnDescriptor[],
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
  columns: RuntimeColumnDescriptor[],
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

export const isFilteredColumn = (column: RuntimeColumnDescriptor) =>
  column.filter !== undefined;

export const stripFilterFromColumns = (columns: RuntimeColumnDescriptor[]) =>
  columns.map((col) => {
    const { filter, ...rest } = col;
    return filter ? rest : col;
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

export const getColumnLabel = (column: ColumnDescriptor) => {
  if (column.label) {
    return column.label;
  } else if (isCalculatedColumn(column.name)) {
    return getCalculatedColumnName(column);
  } else {
    return column.name;
  }
};

export const findColumn = (
  columns: RuntimeColumnDescriptor[],
  columnName: string
): RuntimeColumnDescriptor | undefined => {
  const column = columns.find((col) => col.name === columnName);
  if (column) {
    return column;
  } else {
    const groupColumn = columns.find(
      (col) => col.isGroup
    ) as GroupColumnDescriptor;
    if (groupColumn) {
      return findColumn(groupColumn.columns, columnName);
    }
  }
};

export function updateColumn<T extends ColumnDescriptor>(
  columns: T[],
  column: T
): T[];
export function updateColumn(
  columns: RuntimeColumnDescriptor[],
  column: string,
  options: Partial<ColumnDescriptor>
): RuntimeColumnDescriptor[];
export function updateColumn(
  columns: RuntimeColumnDescriptor[],
  column: string | RuntimeColumnDescriptor,
  options?: Partial<ColumnDescriptor>
) {
  const targetColumn =
    typeof column === "string"
      ? columns.find((col) => col.name === column)
      : column;
  if (targetColumn) {
    const replacementColumn = options
      ? { ...targetColumn, ...options }
      : targetColumn;
    return columns.map((col) =>
      col.name === replacementColumn.name ? replacementColumn : col
    );
  } else {
    throw Error("column-utils.replaceColun, column not found");
  }
}

export const toDataSourceColumns = (column: ColumnDescriptor) => column.name;

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

export const isDataLoading = (columns: RuntimeColumnDescriptor[]) => {
  return isGroupColumn(columns[0]) && columns[0].groupConfirmed === false;
};

export const getColumnsInViewport = (
  columns: RuntimeColumnDescriptor[],
  vpStart: number,
  vpEnd: number
): [RuntimeColumnDescriptor[], number] => {
  const visibleColumns: RuntimeColumnDescriptor[] = [];
  let preSpan = 0;
  let rightPinnedOnly = false;

  for (let columnOffset = 0, i = 0; i < columns.length; i++) {
    const column = columns[i];
    // TODO if we were to measure the pinned columns first,
    // might be able to save rendering some columns ?
    if (column.hidden) {
      continue;
    } else if (rightPinnedOnly) {
      if (column.pin === "right") {
        visibleColumns.push(column);
      }
    } else if (columnOffset + column.width < vpStart) {
      if (column.pin === "left") {
        visibleColumns.push(column);
      } else if (
        columnOffset + column.width + columns[i + 1]?.width >
        vpStart
      ) {
        visibleColumns.push(column);
      } else {
        preSpan += column.width;
      }
    } else if (columnOffset > vpEnd) {
      rightPinnedOnly = true;
    } else {
      visibleColumns.push(column);
    }
    columnOffset += column.width;
  }

  return [visibleColumns, preSpan];
};

export const isNotHidden = (column: RuntimeColumnDescriptor) =>
  column.hidden !== true;

export const visibleColumnAtIndex = (
  columns: RuntimeColumnDescriptor[],
  index: number
) => {
  if (columns.every(isNotHidden)) {
    return columns[index];
  } else {
    return columns.filter(isNotHidden).at(index);
  }
};

const { DEPTH, IS_LEAF } = metadataKeys;
// Get the value for a specific columns within a grouped column
export const getGroupValueAndOffset = (
  columns: RuntimeColumnDescriptor[],
  row: DataSourceRow
): [unknown, number] => {
  const { [DEPTH]: depth, [IS_LEAF]: isLeaf } = row;
  // Depth can be greater tha group columns when we have just removed a column from groupby
  // but new data has not yet been received.
  if (isLeaf || depth > columns.length) {
    return [null, depth === null ? 0 : Math.max(0, depth - 1)];
  } else if (depth === 0) {
    return ["$root", 0];
  } else {
    // offset 1 for now to allow for $root
    const { key, valueFormatter } = columns[depth - 1];
    const value = valueFormatter(row[key]);
    return [value, depth - 1];
  }
};

export const getDefaultColumnType = (
  serverDataType?: VuuColumnDataType
): ColumnTypeSimple => {
  switch (serverDataType) {
    case "int":
    case "long":
    case "double":
      return "number";
    case "boolean":
      return "boolean";
    default:
      return "string";
  }
};

export const updateColumnFormatting = <
  T extends ColumnDescriptor = ColumnDescriptor
>(
  column: T,
  formatting: ColumnTypeFormatting
): T => {
  const { serverDataType, type = getDefaultColumnType(serverDataType) } =
    column;

  if (isTypeDescriptor(type)) {
    return { ...column, type: { ...type, formatting } };
  } else {
    return { ...column, type: { name: type, formatting } };
  }
};

export function updateColumnType<T extends ColumnDescriptor = ColumnDescriptor>(
  column: T,
  type: ColumnTypeSimple
): T {
  return isTypeDescriptor(column.type)
    ? { ...column, type: { ...column.type, name: type } }
    : { ...column, type };
}

export const updateColumnRenderProps = <
  T extends ColumnDescriptor = ColumnDescriptor
>(
  column: T,
  renderer: ColumnTypeRendering
): T => {
  const { serverDataType, type = getDefaultColumnType(serverDataType) } =
    column;

  if (isTypeDescriptor(type)) {
    return {
      ...column,
      type: {
        ...type,
        // TODO do we need to preserve any existing attributes from renderer ?
        renderer,
      },
    };
  } else {
    return { ...column, type: { name: type, renderer } };
  }
};

const NO_TYPE_SETTINGS = {};
export const getTypeFormattingFromColumn = (
  column: ColumnDescriptor
): ColumnTypeFormatting => {
  if (isTypeDescriptor(column.type)) {
    return column.type.formatting ?? NO_TYPE_SETTINGS;
  } else {
    return NO_TYPE_SETTINGS;
  }
};

/**
 *
 * return a filter predicate that will reject columns, names of which
 * are not in provided list.
 */
export const subscribedOnly =
  (columnNames?: string[]) => (column: ColumnDescriptor) =>
    columnNames?.includes(column.name);

export const addColumnToSubscribedColumns = (
  subscribedColumns: ColumnDescriptor[],
  availableColumns: SchemaColumn[],
  columnName: string
) => {
  const byColName =
    (n = columnName) =>
    (column: { name: string }) =>
      column.name === n;
  if (subscribedColumns.findIndex(byColName()) !== -1) {
    throw Error(
      `column-utils, addColumnToSubscribedColumns column ${columnName} is already subscribed`
    );
  }
  const indexOfAvailableColumn = availableColumns.findIndex(byColName());
  if (indexOfAvailableColumn === -1) {
    throw Error(
      `column-utils, addColumnToSubscribedColumns column ${columnName} is not available`
    );
  }

  const newColumn = {
    ...availableColumns[indexOfAvailableColumn],
  } as ColumnDescriptor;

  // find the nearest preceding available column which is subscribed
  let index = -1;
  for (let i = indexOfAvailableColumn - 1; i >= 0; i--) {
    const { name } = availableColumns[i];
    index = subscribedColumns.findIndex(byColName(name));
    if (index !== -1) {
      break;
    }
  }

  if (index === -1) {
    return [newColumn].concat(subscribedColumns);
  } else {
    const results: ColumnDescriptor[] = [];
    for (let i = 0; i < subscribedColumns.length; i++) {
      results.push(subscribedColumns[i]);
      if (i === index) {
        results.push(newColumn);
        index = Number.MAX_SAFE_INTEGER;
      }
    }
    return results;
  }
};

const CalculatedColumnPattern = /.*:.*:.*/;

export const isCalculatedColumn = (columnName?: string) =>
  columnName !== undefined && CalculatedColumnPattern.test(columnName);

export const getCalculatedColumnDetails = (column: ColumnDescriptor) => {
  if (isCalculatedColumn(column.name)) {
    return column.name.split(/:=?/);
  } else {
    throw Error(
      `column-utils, getCalculatedColumnDetails column name ${column.name} is not valid calculated column`
    );
  }
};

export const getCalculatedColumnName = (column: ColumnDescriptor) =>
  getCalculatedColumnDetails(column)[0];
export const getCalculatedColumnType = (column: ColumnDescriptor) =>
  getCalculatedColumnDetails(column)[1] as VuuColumnDataType;
export const getCalculatedColumnExpression = (column: ColumnDescriptor) =>
  getCalculatedColumnDetails(column)[2];

export const setCalculatedColumnName = (
  column: ColumnDescriptor,
  name: string
): ColumnDescriptor => {
  const [, type, expression] = column.name.split(":");
  return {
    ...column,
    name: `${name}:${type}:${expression}`,
  };
};

export const setCalculatedColumnType = (
  column: ColumnDescriptor,
  type: string
): ColumnDescriptor => {
  const [name, , expression] = column.name.split(":");
  return {
    ...column,
    name: `${name}:${type}:${expression}`,
  };
};

// TODO should we validate the expression here ?
export const setCalculatedColumnExpression = (
  column: ColumnDescriptor,
  expression: string
): ColumnDescriptor => {
  const [name, type] = column.name.split(":");
  return {
    ...column,
    name: `${name}:${type}:=${expression}`,
  };
};

export const moveColumnTo = (
  columns: ColumnDescriptor[],
  column: ColumnDescriptor,
  newIndex: number
) => {
  const index = columns.findIndex((col) => col.name === column.name);
  return moveItem(columns, index, newIndex);
};

export function replaceColumn<
  C extends ColumnDescriptor = RuntimeColumnDescriptor
>(columns: C[], column: C) {
  return columns.map((col) => (col.name === column.name ? column : col));
}

export const applyDefaultColumnConfig = (
  { columns, table }: TableSchema,
  getDefaultColumnConfig?: DefaultColumnConfiguration
) => {
  if (typeof getDefaultColumnConfig === "function") {
    return columns.map((column) => {
      const config = getDefaultColumnConfig(table.table, column.name);
      if (config) {
        return {
          ...column,
          ...config,
        };
      } else {
        return column;
      }
    });
  } else {
    return columns;
  }
};

export const getColumnByName = (
  schema: TableSchema,
  name?: string
): SchemaColumn | undefined => {
  if (name === undefined) {
    return undefined;
  } else {
    const column = schema.columns.find((col) => col.name === name);
    if (column) {
      return column;
    } else {
      throw Error(
        `getColumnByName no column '${name}' in schema for ${schema.table.table}`
      );
    }
  }
};

//New added column functionality issue #639

export type ColumnLayout = "Static" | "Fit";

export type columnOptions = {
  availableWidth?: number;
  columnLayout?: ColumnLayout;
  defaultWidth?: number;
  defaultMinWidth?: number;
  defaultMaxWidth?: number;
  defaultFlex?: number;
};

export function applyWidthToColumns(
  columns: RuntimeColumnDescriptor[],
  options:
    | {
        columnLayout: "Static";
        defaultMinWidth?: number;
        defaultMaxWidth?: number;
        defaultWidth?: number;
      }
    | {
        columnLayout: "Fit";
        availableWidth?: number;
        defaultMinWidth?: number;
        defaultMaxWidth?: number;
        defaultWidth?: number;
      }
): RuntimeColumnDescriptor[];

export function applyWidthToColumns(
  columns: RuntimeColumnDescriptor[],
  options: columnOptions & { defaultMinWidth?: number }
): RuntimeColumnDescriptor[] {
  const {
    availableWidth = 0,
    columnLayout = "Static",
    defaultWidth = DEFAULT_COL_WIDTH,
    defaultMinWidth = DEFAULT_MIN_WIDTH,
    defaultMaxWidth = DEFAULT_MAX_WIDTH,
    // defaultFlex = DEFAULT_FLEX,
  } = options;

  if (columnLayout === "Static") {
    return columns.map((column) => {
      if (typeof column.width === "number") {
        return column;
      } else {
        return {
          ...column,
          width: defaultWidth,
        };
      }
    });
  } else if (columnLayout === "Fit") {
    const { totalMinWidth, totalMaxWidth, totalWidth, flexCount } =
      columns.reduce(
        (aggregated, column) => {
          const { totalMinWidth, totalMaxWidth, totalWidth, flexCount } =
            aggregated;
          const {
            minWidth = defaultMinWidth,
            maxWidth = defaultMaxWidth,
            width = defaultWidth,
            flex = 0,
          } = column;
          return {
            totalMinWidth: totalMinWidth + minWidth,
            totalMaxWidth: totalMaxWidth + maxWidth,
            totalWidth: totalWidth + width,
            flexCount: flexCount + flex,
          };
        },
        { totalMinWidth: 0, totalMaxWidth: 0, totalWidth: 0, flexCount: 0 }
      );

    if (totalMinWidth > availableWidth || totalMaxWidth < availableWidth) {
      return columns;
    } else if (totalWidth > availableWidth) {
      const excessWidth = totalWidth - availableWidth;
      const inFlexMode = flexCount > 0;
      let excessWidthPerColumn = excessWidth / (flexCount || columns.length);
      let columnsNotYetAtMinWidth = columns.length;
      let unassignedExcess = 0;
      let newColumns = columns.map<RuntimeColumnDescriptor>((column) => {
        const {
          minWidth = defaultMinWidth,
          width = defaultWidth,
          flex = 0,
        } = column;
        if (inFlexMode && flex === 0) {
          return column;
        }
        const adjustedWidth = width - excessWidthPerColumn;
        if (adjustedWidth < minWidth) {
          columnsNotYetAtMinWidth -= 1;
          unassignedExcess += minWidth - adjustedWidth;
          return { ...column, width: minWidth };
        } else {
          return { ...column, width: adjustedWidth };
        }
      });
      if (unassignedExcess === 0) {
        return newColumns;
      } else {
        excessWidthPerColumn = unassignedExcess / columnsNotYetAtMinWidth;
        newColumns = newColumns.map((column) => {
          const adjustedWidth = column.width - excessWidthPerColumn;
          if (column.width !== column.minWidth) {
            return { ...column, width: adjustedWidth };
          } else {
            return column;
          }
        });
        return newColumns;
      }
    } else if (totalWidth < availableWidth) {
      {
        const additionalWidth = availableWidth - totalWidth;
        const inFlexMode = flexCount > 0;
        let additionalWidthPerColumn =
          additionalWidth / (flexCount || columns.length);
        // let columnsNotYetReachedMaxWidth = columns.length;
        // let unassignedAdditionalWidth = 0;
        let newColumns = columns.map((column) => {
          const {
            maxWidth = defaultMaxWidth,
            width = defaultWidth,
            flex = 0,
          } = column;
          if (inFlexMode && flex === 0) {
            return column;
          }
          const adjustedWidth = width + additionalWidthPerColumn;
          if (adjustedWidth > maxWidth) {
            // columnsNotYetReachedMaxWidth -= 1;
            // unassignedAdditionalWidth += adjustedWidth - maxWidth;
            return { ...column, width: maxWidth };
          } else {
            return { ...column, width: adjustedWidth, canStretch: true };
          }
        });
        const unassignedAdditionalColumnWidth =
          additionalWidth - newColumns.reduce((sum, col) => sum + col.width, 0);
        const columnsNotYetAtMaxWidth = newColumns.filter(
          (col) => col.canStretch
        ).length;
        if (unassignedAdditionalColumnWidth > columnsNotYetAtMaxWidth) {
          additionalWidthPerColumn =
            unassignedAdditionalColumnWidth / columnsNotYetAtMaxWidth;
          newColumns = newColumns.map<RuntimeColumnDescriptor>((column) => {
            if (column.canStretch) {
              const adjustedWidth = Math.min(
                column.width + additionalWidthPerColumn
              );
              return { ...column, width: adjustedWidth };
            } else {
              return column;
            }
          });
        }
        return newColumns.map(({ canStretch, ...column }) => column);
      }
    }
  }
  return columns;
}
