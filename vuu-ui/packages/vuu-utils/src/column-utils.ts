import type {
  DataSourceRow,
  DataValueType,
  DataValueTypeSimple,
  DateTimeDataValueDescriptor,
  SchemaColumn,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import type {
  VuuAggType,
  VuuAggregation,
  VuuColumnDataType,
  VuuDataRow,
  VuuDataRowDto,
  VuuGroupBy,
  VuuSort,
} from "@vuu-ui/vuu-protocol-types";
import type {
  ColumnAlignment,
  ColumnDescriptor,
  ColumnLayout,
  DataValueTypeDescriptor,
  ColumnTypeFormatting,
  ColumnTypeRendering,
  ColumnTypeWithValidationRules,
  DefaultColumnConfiguration,
  GroupColumnDescriptor,
  LookupRenderer,
  MappedValueTypeRenderer,
  PinLocation,
  RuntimeColumnDescriptor,
  TableCellRendererProps,
  TableConfig,
  TableHeading,
  TableHeadings,
  ValueListRenderer,
} from "@vuu-ui/vuu-table-types";
import { type CSSProperties } from "react";
import { moveItem } from "./array-utils";
import { TableModel } from "@vuu-ui/vuu-table";

/**
 * ColumnMap provides a lookup of the index position of a data item within a row
 * by column name.
 */
export interface ColumnMap {
  [columnName: string]: number;
}

export interface ReverseColumnMap {
  [columnIndex: number]: string;
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
  metadataOffset = 0,
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
  serverDataType?: VuuColumnDataType,
): ColumnAlignment =>
  serverDataType === undefined
    ? "left"
    : numericTypes.includes(serverDataType)
      ? "right"
      : "left";

export const getRuntimeColumnWidth = (
  col: ColumnDescriptor,
  runtimeColumns: RuntimeColumnDescriptor[],
) => {
  const runtimeColumn = runtimeColumns.find(({ name }) => name === col.name);
  if (runtimeColumn) {
    return runtimeColumn.width;
  } else {
    return DEFAULT_COL_WIDTH;
  }
};

// Save the current runtime column widths into the table column config. We do this
// when user has manually resized a column under a fit layout. From this point,
// layout becomes manual - there will be no further automatic column sizing.
export const applyRuntimeColumnWidthsToConfig = (
  tableConfig: TableConfig,
  columns: RuntimeColumnDescriptor[],
): TableConfig => {
  return {
    ...tableConfig,
    columns: columns.map((column) => ({
      ...column,
      width: column.width ?? getRuntimeColumnWidth(column, columns),
    })),
    columnLayout: "manual",
  };
};

export const isValidColumnAlignment = (v: string): v is ColumnAlignment =>
  v === "left" || v === "right";

export const isValidPinLocation = (v: string): v is PinLocation =>
  isValidColumnAlignment(v) || v === "floating" || v === "";

export type CalculatedColumn = {
  name: string;
  expression: string;
  serverDataType: VuuColumnDataType;
};

const VUU_COLUMN_DATA_TYPES: (string | undefined | null)[] = [
  "long",
  "double",
  "int",
  "string",
  "char",
  "boolean",
];

export const isVuuColumnDataType = (
  value: string | undefined | null,
): value is VuuColumnDataType => VUU_COLUMN_DATA_TYPES.includes(value);

export const fromServerDataType = (
  serverDataType: VuuColumnDataType,
): DataValueTypeSimple => {
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

export const isDateTimeDataValue = (
  column: ColumnDescriptor,
): column is DateTimeDataValueDescriptor =>
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
  type?: DataValueType,
): type is DataValueTypeDescriptor =>
  typeof type !== "undefined" && typeof type !== "string";

const EMPTY_COLUMN_MAP = {} as const;

export const isColumnTypeRenderer = (
  renderer?: unknown,
): renderer is ColumnTypeRendering =>
  typeof (renderer as ColumnTypeRendering)?.name !== "undefined";

export const hasCustomRenderer = (
  type?: DataValueType,
): type is DataValueTypeDescriptor =>
  isTypeDescriptor(type) && isColumnTypeRenderer(type.renderer);

export const isLookupRenderer = (
  renderer?: unknown,
): renderer is LookupRenderer =>
  typeof (renderer as LookupRenderer)?.name !== "undefined" &&
  "lookup" in (renderer as LookupRenderer);

export const isValueListRenderer = (
  renderer?: unknown,
): renderer is ValueListRenderer =>
  typeof (renderer as ValueListRenderer)?.name !== "undefined" &&
  Array.isArray((renderer as ValueListRenderer).values);

export const hasValidationRules = (
  type?: DataValueType,
): type is ColumnTypeWithValidationRules =>
  isTypeDescriptor(type) && Array.isArray(type.rules) && type.rules.length > 0;

export const isMappedValueTypeRenderer = (
  renderer?: unknown,
): renderer is MappedValueTypeRenderer =>
  renderer !== undefined &&
  typeof (renderer as MappedValueTypeRenderer)?.map !== "undefined";

export function buildColumnMap(
  columns?: (ColumnDescriptor | SchemaColumn | string)[],
): ColumnMap {
  const start = metadataKeys.count;
  if (columns) {
    return columns.reduce((map, column, i) => {
      if (typeof column === "string") {
        map[column] = start + i;
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

const KEY = 6;

export const metadataKeys = {
  IDX: 0,
  RENDER_IDX: 1,
  IS_LEAF: 2,
  IS_EXPANDED: 3,
  DEPTH: 4,
  COUNT: 5,
  KEY,
  SELECTED: 7,
  TIMESTAMP: 8,
  IS_NEW: 9,
  count: 10,
  // TODO following only used in datamodel
  PARENT_IDX: "parent_idx",
  IDX_POINTER: "idx_pointer",
  FILTER_COUNT: "filter_count",
  NEXT_FILTER_IDX: "next_filter_idx",
} as const;

// This method mutates the passed columns array
const insertColumn = (
  columns: RuntimeColumnDescriptor[],
  column: RuntimeColumnDescriptor,
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
  columns: RuntimeColumnDescriptor[],
): RuntimeColumnDescriptor[] => {
  if (columns[0]?.isGroup) {
    const [groupColumn, ...nonGroupedColumns] = columns as [
      GroupColumnDescriptor,
      ...RuntimeColumnDescriptor[],
    ];
    groupColumn.columns.forEach((groupColumn) => {
      insertColumn(nonGroupedColumns, groupColumn);
    });
    return nonGroupedColumns;
  } else {
    return columns;
  }
};

export function extractGroupColumn({
  availableWidth,
  columns,
  groupBy,
  confirmed = true,
}: ColumnGroupProps): [
  GroupColumnDescriptor | null,
  RuntimeColumnDescriptor[],
] {
  if (groupBy && groupBy.length > 0) {
    const flattenedColumns = flattenColumnGroup(columns);
    // Note: groupedColumns will be in column order, not groupBy order
    const [groupedColumns, rest] = flattenedColumns.reduce<
      [RuntimeColumnDescriptor[], RuntimeColumnDescriptor[]]
    >(
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
      [[], []],
    );
    if (groupedColumns.length !== groupBy.length) {
      throw Error(
        `extractGroupColumn: no column definition found for all groupBy cols ${JSON.stringify(
          groupBy,
        )} `,
      );
    }

    const groupOnly = rest.length === 0;

    const groupCount = groupBy.length;
    const groupCols: RuntimeColumnDescriptor[] = groupBy.map((name, idx) => {
      // Keep the cols in same order defined on groupBy
      const column = groupedColumns.find(
        (col) => col.name === name,
      ) as RuntimeColumnDescriptor;
      return {
        ...column,
        groupLevel: groupCount - idx,
      };
    });

    const width = groupOnly
      ? availableWidth
      : Math.min(
          availableWidth,
          groupCols.map((c) => c.width).reduce((a, b) => a + b) + 100,
        );

    const groupCol = {
      ariaColIndex: 1,
      columns: groupCols,
      heading: ["group-col"],
      isGroup: true,
      groupConfirmed: confirmed,
      name: "group-col",
      width,
    } as GroupColumnDescriptor;

    const withAdjustedAriaIndex: RuntimeColumnDescriptor[] = [];
    let colIndex = 2;
    for (const column of rest) {
      withAdjustedAriaIndex.push({
        ...column,
        ariaColIndex: column.hidden ? -1 : colIndex,
      });
      if (!column.hidden) {
        colIndex += 1;
      }
    }

    return [groupCol, withAdjustedAriaIndex];
  }
  return [null, flattenColumnGroup(columns)];
}

export const isGroupColumn = (
  column: RuntimeColumnDescriptor,
): column is GroupColumnDescriptor => column.isGroup === true;

/**
 *  groupConfirmed is currently the only 'pending' attribute we use. A
 * value of true is only reset by a follow-up value of false. Intermediary
 * values of undefined are discounted.
 */
export const checkConfirmationPending = (previousConfig?: TableModel) => {
  if (previousConfig) {
    const [column] = previousConfig.columns;
    if (column !== undefined && isGroupColumn(column)) {
      return column.groupConfirmed;
    }
  }
};

export const isJsonAttribute = (value: unknown) =>
  typeof value === "string" && (value.endsWith("{") || value.endsWith("["));

export const isJsonGroup = (
  column: RuntimeColumnDescriptor,
  row: VuuDataRow,
  columnMap: ColumnMap,
) =>
  (column.type as DataValueTypeDescriptor)?.name === "json" &&
  isJsonAttribute(row[columnMap[column.name]]);

export const isJsonColumn = (column: RuntimeColumnDescriptor) =>
  (column.type as DataValueTypeDescriptor)?.name === "json";

export const sortPinnedColumns = (
  columns: RuntimeColumnDescriptor[],
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
  selectionEndSize: number,
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
  columns: RuntimeColumnDescriptor[],
): TableHeadings => {
  if (columns.some(hasHeadings)) {
    const maxHeadingDepth = columns.reduce<number>(
      (max, { heading }) => Math.max(max, heading?.length ?? 0),
      0,
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
  column: ColumnDescriptor,
  aggType: VuuAggType,
) => {
  return aggregations
    .filter((agg) => agg.column !== column.name)
    .concat({ column: column.name, aggType });
};

export type ColumnGroupProps = {
  columns: RuntimeColumnDescriptor[];
  groupBy: VuuGroupBy;
  confirmed?: boolean;
  availableWidth: number;
};

export const applyGroupByToColumns = (props: ColumnGroupProps) => {
  if (props.groupBy.length) {
    const [groupColumn, nonGroupedColumns] = extractGroupColumn(props);
    if (groupColumn) {
      return [groupColumn as RuntimeColumnDescriptor].concat(nonGroupedColumns);
    }
  } else if (props.columns[0]?.isGroup) {
    return flattenColumnGroup(props.columns);
  }
  return props.columns;
};

export const applySortToColumns = (
  columns: RuntimeColumnDescriptor[],
  sort: VuuSort,
) =>
  columns.map((column) => {
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

export const removeSort = (columns: RuntimeColumnDescriptor[]) =>
  columns.map((col) => (col.sorted ? { ...col, sorted: undefined } : col));

export const existingSort = (columns: RuntimeColumnDescriptor[]) =>
  columns.some((col) => col.sorted);

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
    const { name } = getCalculatedColumnDetails(column);
    // calculated column name follows pattern: `name:serverDataType:expression`
    return name ?? column.name;
  } else {
    return column.name;
  }
};

export const findColumn = (
  columns: RuntimeColumnDescriptor[],
  columnName: string,
): RuntimeColumnDescriptor | undefined => {
  const column = columns.find((col) => col.name === columnName);
  if (column) {
    return column;
  } else {
    const groupColumn = columns.find(
      (col) => col.isGroup,
    ) as GroupColumnDescriptor;
    if (groupColumn) {
      return findColumn(groupColumn.columns, columnName);
    }
  }
};

export function updateColumn<T extends ColumnDescriptor>(
  columns: T[],
  column: T,
): T[];
export function updateColumn(
  columns: RuntimeColumnDescriptor[],
  column: string,
  options: Partial<ColumnDescriptor>,
): RuntimeColumnDescriptor[];
export function updateColumn(
  columns: RuntimeColumnDescriptor[],
  column: string | RuntimeColumnDescriptor,
  options?: Partial<ColumnDescriptor>,
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
      col.name === replacementColumn.name ? replacementColumn : col,
    );
  } else {
    throw Error("column-utils.replaceColun, column not found");
  }
}

export const toDataSourceColumns = (column: ColumnDescriptor) => column.name;

export const dataSourceRowToDataRowDto = (
  row: DataSourceRow,
  columnMap: ColumnMap,
): VuuDataRowDto => {
  return Object.entries(columnMap).reduce<VuuDataRowDto>(
    (map, [colName, key]) => {
      map[colName] = row[key];
      return map;
    },
    {},
  );
};

export const isDataLoading = (columns: RuntimeColumnDescriptor[]) => {
  return isGroupColumn(columns[0]) && columns[0].groupConfirmed === false;
};

export const getColumnsInViewport = (
  columns: RuntimeColumnDescriptor[],
  vpStart: number,
  vpEnd: number,
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
  index: number,
) => {
  if (columns.every(isNotHidden)) {
    return columns[index];
  } else {
    return columns.filter(isNotHidden).at(index);
  }
};

const { DEPTH, IS_LEAF } = metadataKeys;

export const getGroupIcon = (
  columns: RuntimeColumnDescriptor[],
  row: DataSourceRow,
): string | undefined => {
  const { [DEPTH]: depth, [IS_LEAF]: isLeaf } = row;
  // Depth can be greater tha group columns when we have just removed a column from groupby
  // but new data has not yet been received.
  if (isLeaf || depth > columns.length) {
    return undefined;
  } else if (depth === 0) {
    return undefined;
  } else {
    const { getIcon } = columns[depth - 1];
    return getIcon?.(row);
  }
};

export const getGroupValue = (
  columns: RuntimeColumnDescriptor[],
  row: DataSourceRow,
  columnMap: ColumnMap,
): string | null => {
  const { [DEPTH]: depth, [IS_LEAF]: isLeaf } = row;
  // Depth can be greater tha group columns when we have just removed a column from groupby
  // but new data has not yet been received.
  if (isLeaf || depth > columns.length) {
    return null;
  } else if (depth === 0) {
    return "$root";
  } else {
    // offset allows for $root
    const { name, valueFormatter } = columns[depth - 1];

    const value = valueFormatter(row[columnMap[name]]);
    return value;
  }
};

export const getDefaultColumnType = (
  serverDataType?: VuuColumnDataType,
): DataValueTypeSimple => {
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
  T extends ColumnDescriptor = ColumnDescriptor,
>(
  column: T,
  formatting: ColumnTypeFormatting,
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
  type: DataValueTypeSimple,
): T {
  return isTypeDescriptor(column.type)
    ? { ...column, type: { ...column.type, name: type } }
    : { ...column, type };
}

export const updateColumnRenderProps = <
  T extends ColumnDescriptor = ColumnDescriptor,
>(
  column: T,
  renderer: ColumnTypeRendering,
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
  column: ColumnDescriptor,
): ColumnTypeFormatting => {
  if (isTypeDescriptor(column.type)) {
    return column.type.formatting ?? NO_TYPE_SETTINGS;
  } else {
    return NO_TYPE_SETTINGS;
  }
};

/**
 * Return a filter predicate that will reject columns, names of which
 * are not in provided list. Exception made for columns explicitly
 * configured as client columns.
 */
export const subscribedOnly =
  (columnNames?: string[]) => (column: ColumnDescriptor) =>
    column.source === "client" || columnNames?.includes(column.name);

export const addColumnToSubscribedColumns = (
  subscribedColumns: ColumnDescriptor[],
  availableColumns: SchemaColumn[],
  columnName: string,
) => {
  const byColName =
    (n = columnName) =>
    (column: { name: string }) =>
      column.name === n;
  if (subscribedColumns.findIndex(byColName()) !== -1) {
    throw Error(
      `column-utils, addColumnToSubscribedColumns column ${columnName} is already subscribed`,
    );
  }
  const indexOfAvailableColumn = availableColumns.findIndex(byColName());
  if (indexOfAvailableColumn === -1) {
    throw Error(
      `column-utils, addColumnToSubscribedColumns column ${columnName} is not available`,
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

export const getCalculatedColumnDetails = (
  column: ColumnDescriptor,
): Partial<CalculatedColumn> => {
  if (isCalculatedColumn(column.name)) {
    const [name, serverDataType, expression] = column.name.split(/:=?/);
    if (serverDataType && !isVuuColumnDataType(serverDataType)) {
      throw Error(
        `column-utils, getCalculatedColumnDetails ${serverDataType} is not valid type for column ${column.name}`,
      );
    }
    return {
      name: name ?? "",
      expression: expression ?? "",
      serverDataType: isVuuColumnDataType(serverDataType)
        ? serverDataType
        : undefined,
    };
  } else {
    throw Error(`column.name is nor a calculated column`);
  }
};

export const setCalculatedColumnName = (
  column: ColumnDescriptor,
  name: string,
): ColumnDescriptor => {
  const [, type, expression] = column.name.split(":");
  return {
    ...column,
    name: `${name}:${type}:${expression}`,
  };
};

export const setCalculatedColumnType = (
  column: ColumnDescriptor,
  type: string,
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
  expression: string,
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
  newIndex: number,
) => {
  const index = columns.findIndex((col) => col.name === column.name);
  return moveItem(columns, index, newIndex);
};

export function replaceColumn<
  C extends ColumnDescriptor = RuntimeColumnDescriptor,
>(columns: C[], column: C) {
  return columns.map((col) => (col.name === column.name ? column : col));
}

export const applyDefaultColumnConfig = (
  { columns, table }: TableSchema,
  getDefaultColumnConfig?: DefaultColumnConfiguration,
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

export type columnOptions = {
  availableWidth?: number;
  columnLayout?: ColumnLayout;
  defaultWidth?: number;
  defaultMinWidth?: number;
  defaultMaxWidth?: number;
  defaultFlex?: number;
};

type ColumnLayoutOptions = Pick<
  columnOptions,
  "defaultMinWidth" | "defaultMaxWidth" | "defaultWidth"
>;

interface StaticColumnLayoutOptions extends ColumnLayoutOptions {
  columnLayout: "manual" | "static";
}
interface FitColumnLayoutOptions extends ColumnLayoutOptions {
  availableWidth?: number;
  columnLayout: "fit";
}

type ColumnStats = {
  flexCount: number;
  totalMinWidth: number;
  totalMaxWidth: number;
  totalWidth: number;
};

const measureColumns = (
  columns: RuntimeColumnDescriptor[],
  defaultMaxWidth: number,
  defaultMinWidth: number,
) =>
  columns.reduce<ColumnStats>(
    (aggregated, column) => {
      if (column.hidden !== true) {
        aggregated.totalMinWidth += column.minWidth ?? defaultMinWidth;
        aggregated.totalMaxWidth += column.maxWidth ?? defaultMaxWidth;
        aggregated.totalWidth += column.width;
        aggregated.flexCount += column.flex ?? 0;
      }
      return aggregated;
    },
    { totalMinWidth: 0, totalMaxWidth: 0, totalWidth: 0, flexCount: 0 },
  );

export function applyWidthToColumns(
  columns: RuntimeColumnDescriptor[],
  options: StaticColumnLayoutOptions | FitColumnLayoutOptions,
): RuntimeColumnDescriptor[];

export function applyWidthToColumns(
  columns: RuntimeColumnDescriptor[],
  {
    availableWidth = 0,
    columnLayout = "static",
    defaultWidth = DEFAULT_COL_WIDTH,
    defaultMinWidth = DEFAULT_MIN_WIDTH,
    defaultMaxWidth = DEFAULT_MAX_WIDTH,
  }: // defaultFlex = DEFAULT_FLEX,
  columnOptions,
): RuntimeColumnDescriptor[] {
  if (columnLayout === "fit") {
    const { totalMinWidth, totalMaxWidth, totalWidth, flexCount } =
      measureColumns(columns, defaultMaxWidth, defaultMinWidth);

    if (totalMaxWidth < availableWidth) {
      return assignMaxWidthToAll(columns, defaultMaxWidth);
    } else if (totalMinWidth > availableWidth) {
      return columns;
    } else if (totalWidth > availableWidth) {
      return shrinkColumnsToFitAvailableSpace(
        columns,
        availableWidth,
        totalWidth,
        defaultMinWidth,
        defaultWidth,
        flexCount,
      );
    } else if (totalWidth < availableWidth) {
      return stretchColumnsToFillAvailableSpace(
        columns,
        availableWidth,
        totalWidth,
        defaultMaxWidth,
        defaultWidth,
      );
    }
  }
  return columns;
}

const assignMaxWidthToAll = (
  columns: RuntimeColumnDescriptor[],
  defaultMaxWidth: number,
) => {
  return columns.map((column) => {
    const { maxWidth = defaultMaxWidth } = column;
    if (column.width === maxWidth) {
      return column;
    } else {
      return {
        ...column,
        width: maxWidth,
      };
    }
  });
};

const shrinkColumnsToFitAvailableSpace = (
  columns: RuntimeColumnDescriptor[],
  availableWidth: number,
  totalWidth: number,
  defaultMinWidth: number,
  defaultWidth: number,
  flexCount: number,
) => {
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
};

const hasFlex = ({ flex }: ColumnDescriptor) => typeof flex === "number";

const stretchColumnsToFillAvailableSpace = (
  columns: RuntimeColumnDescriptor[],
  availableWidth: number,
  totalWidth: number,
  defaultMaxWidth: number,
  defaultWidth: number,
) => {
  let freeSpaceToBeFilled = availableWidth - totalWidth;
  let adjustedColumns = columns;

  const canGrow = ({
    width = defaultWidth,
    maxWidth = defaultMaxWidth,
  }: ColumnDescriptor) => width < maxWidth;

  while (freeSpaceToBeFilled > 0) {
    const flexCols = adjustedColumns.filter(
      (col) => hasFlex(col) && canGrow(col),
    );
    const columnsNotYetAtMaxWidth =
      flexCols.length || adjustedColumns.filter(canGrow).length;

    // THis deos not take flex correctly into account
    const additionalWidthPerColumn = Math.ceil(
      freeSpaceToBeFilled / columnsNotYetAtMaxWidth,
    );
    adjustedColumns = columns.map((column) => {
      const {
        maxWidth = defaultMaxWidth,
        width = defaultWidth,
        flex = 0,
      } = column;
      if (flexCols.length > 0 && flex === 0) {
        return column;
      }

      // we rounded the additionalWidthPerColumn up, so make sure
      // we don't over-assign
      const adjustmentAmount = Math.min(
        additionalWidthPerColumn,
        freeSpaceToBeFilled,
      );
      const adjustedWidth = width + adjustmentAmount;
      if (adjustedWidth > maxWidth) {
        freeSpaceToBeFilled -= adjustedWidth - maxWidth;
        return { ...column, width: maxWidth };
      } else {
        freeSpaceToBeFilled -= adjustmentAmount;
        return { ...column, width: adjustedWidth };
      }
    });
  }
  return adjustedColumns;
};

/**
 * A memo compare function for cell renderers. Can be used to suppress
 * render where column and data are both unchanged. Avoids render
 * when row changes, where changes in row are unrelated to this cell.
 * Suitabnle only for readonly cell renderers. See below for editable
 * cell renderers.
 */
export const dataAndColumnUnchanged = (
  p: TableCellRendererProps,
  p1: TableCellRendererProps,
) =>
  p.column === p1.column &&
  p.column.valueFormatter(p.row[p.columnMap[p.column.name]]) ===
    p1.column.valueFormatter(p1.row[p1.columnMap[p1.column.name]]);

/**
 * A memo compare function for cell renderers. Can be used to suppress
 * render where column, row key  and data are all unchanged. Avoids render
 * when row changes, where changes in row are unrelated to this cell.
 * Suitable for editable cells. Including key in compare is not strictly
 * necessary for rendering, but it is important in the event that user
 * edits data - ensures we never have a stale key.
 */
export const dataColumnAndKeyUnchanged = (
  p: TableCellRendererProps,
  p1: TableCellRendererProps,
) =>
  p.column === p1.column &&
  p.row[KEY] === p1.row[KEY] &&
  p.column.valueFormatter(p.row[p.columnMap[p.column.name]]) ===
    p1.column.valueFormatter(p1.row[p1.columnMap[p1.column.name]]);

export const toColumnName = (column: ColumnDescriptor) => column.name;
export const isStringColumn = (column: ColumnDescriptor) =>
  column.serverDataType === "string";

/**
 * Given an ordered list of column names, return column items in same order
 */
export const reorderColumnItems = <
  T extends { name: string } = { name: string },
>(
  columnItems: Array<T>,
  orderedNames: string[],
): T[] => {
  const columns: T[] = [];
  for (const name of orderedNames) {
    const columnItem = columnItems.find((c) => c.name === name);
    if (columnItem) {
      columns.push(columnItem);
    }
  }
  return columns;
};
