import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
  PinLocation,
  TableAttributes,
  TableConfig,
  TableHeadings,
} from "@finos/vuu-datagrid-types";
import {
  applyFilterToColumns,
  applyGroupByToColumns,
  applySortToColumns,
  getCellRenderer,
  getColumnLabel,
  getTableHeadings,
  getValueFormatter,
  hasValidationRules,
  isFilteredColumn,
  isGroupColumn,
  isPinned,
  logger,
  metadataKeys,
  replaceColumn,
  sortPinnedColumns,
  stripFilterFromColumns,
  subscribedOnly,
} from "@finos/vuu-utils";

import { DataSource, DataSourceConfig } from "@finos/vuu-data";
import { TableSchema } from "@finos/vuu-data/src/message-utils";
import { VuuColumnDataType, VuuTable } from "@finos/vuu-protocol-types";
import { buildValidationChecker } from "@finos/vuu-ui-controls";
import { Reducer, useReducer } from "react";

const { info } = logger("useTableModel");

const DEFAULT_COLUMN_WIDTH = 100;
const KEY_OFFSET = metadataKeys.count;

const columnWithoutDataType = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined;

const getDataType = (
  column: ColumnDescriptor,
  tableSchema?: TableSchema
): VuuColumnDataType | undefined => {
  const schemaColumn = tableSchema?.columns.find(
    ({ name }) => name === column.name
  );
  if (schemaColumn) {
    return schemaColumn.serverDataType;
  } else {
    return column.serverDataType;
  }
};

/**
 * TableModel represents state used internally to manage Table. It is
 * derived initially from the TableConfig provided by user, along with the
 * data-related config from DataSource.
 */
export interface TableModel extends TableAttributes {
  columns: RuntimeColumnDescriptor[];
  headings: TableHeadings;
}

/**
 * InternalTableModel describes the state managed within the TableModel
 * reducer. It is the same as TableModel but with the addition of a
 * readonly copy of the original TableConfig.
 */
interface InternalTableModel extends TableModel {
  tableConfig: Readonly<TableConfig>;
}

const numericTypes = ["int", "long", "double"];
const getDefaultAlignment = (serverDataType?: VuuColumnDataType) =>
  serverDataType === undefined
    ? undefined
    : numericTypes.includes(serverDataType)
    ? "right"
    : "left";

export interface ColumnActionInit {
  type: "init";
  tableConfig: TableConfig;
  dataSource: DataSource;
}

export interface ColumnActionHide {
  type: "hideColumns";
  columns: RuntimeColumnDescriptor[];
}

export interface ColumnActionShow {
  type: "showColumns";
  columns: RuntimeColumnDescriptor[];
}
export interface ColumnActionMove {
  type: "moveColumn";
  column: RuntimeColumnDescriptor;
  moveBy?: 1 | -1;
}

export interface ColumnActionPin {
  type: "pinColumn";
  column: ColumnDescriptor;
  pin?: PinLocation;
}

export type ResizePhase = "begin" | "resize" | "end";

export interface ColumnActionResize {
  type: "resizeColumn";
  column: RuntimeColumnDescriptor;
  phase: ResizePhase;
  width?: number;
}

export interface ColumnActionSetTableSchema {
  type: "setTableSchema";
  tableSchema: TableSchema;
}

export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}

export interface ColumnActionUpdateProp {
  align?: ColumnDescriptor["align"];
  column: RuntimeColumnDescriptor;
  hidden?: ColumnDescriptor["hidden"];
  label?: ColumnDescriptor["label"];
  resizing?: RuntimeColumnDescriptor["resizing"];
  type: "updateColumnProp";
  width?: ColumnDescriptor["width"];
}

export interface ColumnActionTableConfig extends DataSourceConfig {
  confirmed?: boolean;
  type: "tableConfig";
}

export interface ColumnActionColumnSettings extends DataSourceConfig {
  type: "columnSettings";
  column: ColumnDescriptor;
  /** required only for calculated coplumns */
  vuuTable?: VuuTable;
}

export interface ColumnActionTableSettings extends DataSourceConfig {
  type: "tableSettings";
}

export const isShowColumnSettings = (
  action: PersistentColumnAction
): action is ColumnActionColumnSettings => action.type === "columnSettings";

export const isShowTableSettings = (
  action: PersistentColumnAction
): action is ColumnActionTableSettings => action.type === "tableSettings";

/**
 * PersistentColumnActions are those actions that require us to persist user changes across sessions
 */
export type PersistentColumnAction =
  | ColumnActionPin
  | ColumnActionHide
  | ColumnActionColumnSettings
  | ColumnActionTableSettings;

export type GridModelAction =
  | ColumnActionHide
  | ColumnActionInit
  | ColumnActionMove
  | ColumnActionPin
  | ColumnActionResize
  | ColumnActionSetTableSchema
  | ColumnActionShow
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionTableConfig;

export type GridModelReducer = Reducer<InternalTableModel, GridModelAction>;

export type ColumnActionDispatch = (action: GridModelAction) => void;

const columnReducer: GridModelReducer = (state, action) => {
  info?.(`TableModelReducer ${action.type}`);
  switch (action.type) {
    case "init":
      return init(action);
    case "moveColumn":
      return moveColumn(state, action);
    case "resizeColumn":
      return resizeColumn(state, action);
    case "setTableSchema":
      return setTableSchema(state, action);
    case "hideColumns":
      return hideColumns(state, action);
    case "showColumns":
      return showColumns(state, action);
    case "pinColumn":
      return pinColumn(state, action);
    case "updateColumnProp":
      return updateColumnProp(state, action);
    case "tableConfig":
      return updateTableConfig(state, action);
    default:
      console.log(`unhandled action ${action.type}`);
      return state;
  }
};

export const useTableModel = (
  tableConfigProp: TableConfig,
  dataSource: DataSource
) => {
  const [state, dispatchColumnAction] = useReducer<
    GridModelReducer,
    InitialConfig
  >(columnReducer, { tableConfig: tableConfigProp, dataSource }, init);

  const { columns, headings, tableConfig, ...tableAttributes } = state;

  return {
    columns,
    dispatchColumnAction,
    headings,
    tableAttributes,
    tableConfig,
  };
};

type InitialConfig = {
  dataSource: DataSource;
  tableConfig: TableConfig;
};

function init({ dataSource, tableConfig }: InitialConfig): InternalTableModel {
  const { columns, ...tableAttributes } = tableConfig;
  const { config: dataSourceConfig, tableSchema } = dataSource;
  const keyedColumns = columns
    .filter(subscribedOnly(dataSourceConfig?.columns))
    .map(
      columnDescriptorToInternalColumDescriptor(tableAttributes, tableSchema)
    );

  const maybePinnedColumns = keyedColumns.some(isPinned)
    ? sortPinnedColumns(keyedColumns)
    : keyedColumns;
  let state: InternalTableModel = {
    columns: maybePinnedColumns,
    headings: getTableHeadings(maybePinnedColumns),
    tableConfig,
    ...tableAttributes,
  };
  if (dataSourceConfig) {
    const { columns: _, ...rest } = dataSourceConfig;
    state = updateTableConfig(state, {
      type: "tableConfig",
      ...rest,
    });
  }
  return state;
}

const getLabel = (
  label: string,
  columnFormatHeader?: "uppercase" | "capitalize"
): string => {
  if (columnFormatHeader === "uppercase") {
    return label.toUpperCase();
  } else if (columnFormatHeader === "capitalize") {
    return label[0].toUpperCase() + label.slice(1).toLowerCase();
  }
  return label;
};

const columnDescriptorToInternalColumDescriptor =
  (tableAttributes: TableAttributes, tableSchema?: TableSchema) =>
  (
    column: ColumnDescriptor & { key?: number },
    index: number
  ): RuntimeColumnDescriptor => {
    const { columnDefaultWidth = DEFAULT_COLUMN_WIDTH, columnFormatHeader } =
      tableAttributes;
    const serverDataType = getDataType(column, tableSchema);
    const {
      align = getDefaultAlignment(serverDataType),
      key,
      name,
      label = getColumnLabel(column),
      width = columnDefaultWidth,
      ...rest
    } = column;

    const keyedColumnWithDefaults = {
      ...rest,
      align,
      CellRenderer: getCellRenderer(column),
      HeaderCellLabelRenderer: getCellRenderer(column, "col-label"),
      HeaderCellContentRenderer: getCellRenderer(column, "col-content"),
      clientSideEditValidationCheck: hasValidationRules(column.type)
        ? buildValidationChecker(column.type.renderer.rules)
        : undefined,
      label: getLabel(label, columnFormatHeader),
      key: key ?? index + KEY_OFFSET,
      name,
      originalIdx: index,
      serverDataType,
      valueFormatter: getValueFormatter(column),
      width: width,
    };

    if (isGroupColumn(keyedColumnWithDefaults)) {
      keyedColumnWithDefaults.columns = keyedColumnWithDefaults.columns.map(
        (col) =>
          columnDescriptorToInternalColumDescriptor(tableAttributes)(
            col,
            col.key
          )
      );
    }

    return keyedColumnWithDefaults;
  };

function moveColumn(
  state: InternalTableModel,
  // TODO do we ever use this ?
  { column, moveBy }: ColumnActionMove
) {
  const { columns } = state;
  if (typeof moveBy === "number") {
    const idx = columns.indexOf(column);
    const newColumns = columns.slice();
    const [movedColumns] = newColumns.splice(idx, 1);
    newColumns.splice(idx + moveBy, 0, movedColumns);
    return {
      ...state,
      columns: newColumns,
    };
  }
  return state;
}

function hideColumns(state: InternalTableModel, { columns }: ColumnActionHide) {
  if (columns.some((col) => col.hidden !== true)) {
    return columns.reduce<InternalTableModel>((s, c) => {
      if (c.hidden !== true) {
        return updateColumnProp(s, {
          type: "updateColumnProp",
          column: c,
          hidden: true,
        });
      } else {
        return s;
      }
    }, state);
  } else {
    return state;
  }
}
function showColumns(state: InternalTableModel, { columns }: ColumnActionShow) {
  if (columns.some((col) => col.hidden)) {
    return columns.reduce<InternalTableModel>((s, c) => {
      if (c.hidden) {
        return updateColumnProp(s, {
          type: "updateColumnProp",
          column: c,
          hidden: false,
        });
      } else {
        return s;
      }
    }, state);
  } else {
    return state;
  }
}

function resizeColumn(
  state: InternalTableModel,
  { column, phase, width }: ColumnActionResize
) {
  const type = "updateColumnProp";
  const resizing = phase !== "end";
  switch (phase) {
    case "begin":
      return updateColumnProp(state, { type, column, resizing });
    case "end":
      return updateColumnProp(state, { type, column, resizing, width });
    case "resize":
      return updateColumnProp(state, { type, column, width });
    default:
      throw Error(`useTableModel.resizeColumn, invalid resizePhase ${phase}`);
  }
}

function setTableSchema(
  state: InternalTableModel,
  { tableSchema }: ColumnActionSetTableSchema
) {
  const { columns } = state;
  if (columns.some(columnWithoutDataType)) {
    const cols = columns.map((column) => {
      const serverDataType = getDataType(column, tableSchema);
      return {
        ...column,
        align: column.align ?? getDefaultAlignment(serverDataType),
        serverDataType,
      };
    });

    return {
      ...state,
      columns: cols,
    };
  } else {
    return state;
  }
}

function pinColumn(state: InternalTableModel, action: ColumnActionPin) {
  let { columns } = state;
  const { column, pin } = action;
  const targetColumn = columns.find((col) => col.name === column.name);
  if (targetColumn) {
    columns = replaceColumn(columns, { ...targetColumn, pin });
    columns = sortPinnedColumns(columns);
    return {
      ...state,
      columns,
    };
  } else {
    return state;
  }
}
function updateColumnProp(
  state: InternalTableModel,
  action: ColumnActionUpdateProp
) {
  let { columns } = state;
  const { align, column, hidden, label, resizing, width } = action;
  const targetColumn = columns.find((col) => col.name === column.name);
  if (targetColumn) {
    if (align === "left" || align === "right") {
      columns = replaceColumn(columns, { ...targetColumn, align });
    }
    if (typeof label === "string") {
      columns = replaceColumn(columns, { ...targetColumn, label });
    }
    if (typeof resizing === "boolean") {
      columns = replaceColumn(columns, { ...targetColumn, resizing });
    }
    if (typeof hidden === "boolean") {
      columns = replaceColumn(columns, { ...targetColumn, hidden });
    }
    if (typeof width === "number") {
      columns = replaceColumn(columns, { ...targetColumn, width });
    }
  }
  return {
    ...state,
    columns,
  } as InternalTableModel;
}

function updateTableConfig(
  state: InternalTableModel,
  { confirmed, filter, groupBy, sort }: ColumnActionTableConfig
) {
  const hasGroupBy = groupBy !== undefined;
  const hasFilter = typeof filter?.filter === "string";
  const hasSort = sort && sort.sortDefs.length > 0;

  let result = state;

  if (hasGroupBy) {
    result = {
      ...state,
      columns: applyGroupByToColumns(result.columns, groupBy, confirmed),
    };
  }

  if (hasSort) {
    result = {
      ...state,
      columns: applySortToColumns(result.columns, sort),
    };
  }

  if (hasFilter) {
    result = {
      ...state,
      columns: applyFilterToColumns(result.columns, filter),
    };
  } else if (result.columns.some(isFilteredColumn)) {
    result = {
      ...state,
      columns: stripFilterFromColumns(result.columns),
    };
  }

  return result;
}
