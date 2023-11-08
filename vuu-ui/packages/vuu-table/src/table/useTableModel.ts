import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
  PinLocation,
  TableConfig,
} from "@finos/vuu-datagrid-types";
import {
  applyFilterToColumns,
  applyGroupByToColumns,
  applySortToColumns,
  findColumn,
  getCellRenderer,
  getColumnName,
  getTableHeadings,
  getValueFormatter,
  isFilteredColumn,
  isGroupColumn,
  isPinned,
  isTypeDescriptor,
  metadataKeys,
  updateColumn,
  sortPinnedColumns,
  stripFilterFromColumns,
  moveItemDeprecated,
  getDefaultAlignment,
  isCalculatedColumn,
  getCalculatedColumnName,
} from "@finos/vuu-utils";

import { Reducer, useReducer } from "react";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { DataSourceConfig } from "@finos/vuu-data";
import { TableSchema } from "@finos/vuu-data/src/message-utils";

const DEFAULT_COLUMN_WIDTH = 100;
const KEY_OFFSET = metadataKeys.count;

const columnWithoutDataType = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined;

const getCellRendererForColumn = (column: ColumnDescriptor) => {
  if (isTypeDescriptor(column.type)) {
    return getCellRenderer(column.type?.renderer);
  }
};

const getServerDataTypeForColumn = (
  column: ColumnDescriptor,
  tableSchema?: TableSchema
): VuuColumnDataType => {
  if (column.serverDataType) {
    return column.serverDataType;
  } else if (tableSchema) {
    const schemaColumn = tableSchema.columns.find(
      (col) => col.name === column.name
    );
    if (schemaColumn) {
      return schemaColumn.serverDataType;
    }
  }
  return "string";
};

export interface TableModel extends Omit<GridConfig, "columns"> {
  columns: KeyedColumnDescriptor[];
  tableSchema?: Readonly<TableSchema>;
}

export interface ColumnActionInit {
  type: "init";
  tableConfig: TableConfig;
  dataSourceConfig?: DataSourceConfig;
}

export interface ColumnActionHide {
  type: "hideColumns";
  columns: KeyedColumnDescriptor[];
}

export interface ColumnActionShow {
  type: "showColumns";
  columns: KeyedColumnDescriptor[];
}
export interface ColumnActionMove {
  type: "moveColumn";
  column: KeyedColumnDescriptor;
  moveBy?: 1 | -1;
  moveTo?: number;
}

export interface ColumnActionPin {
  type: "pinColumn";
  column: ColumnDescriptor;
  pin?: PinLocation;
}
export interface ColumnActionResize {
  type: "resizeColumn";
  column: KeyedColumnDescriptor;
  phase: "begin" | "resize" | "end";
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
  column: KeyedColumnDescriptor;
  hidden?: ColumnDescriptor["hidden"];
  label?: ColumnDescriptor["label"];
  resizing?: KeyedColumnDescriptor["resizing"];
  type: "updateColumnProp";
  width?: ColumnDescriptor["width"];
}

export interface ColumnActionTableConfig extends DataSourceConfig {
  confirmed?: boolean;
  type: "tableConfig";
}
export interface ColumnActionColumnSettings extends DataSourceConfig {
  type: "columnSettings";
  column: KeyedColumnDescriptor;
}

export interface ColumnActionTableSettings extends DataSourceConfig {
  type: "tableSettings";
}

/**
 * PersistentColumnActions are those actions that require us to persist user changes across sessions
 */
export type PersistentColumnAction =
  | ColumnActionPin
  | ColumnActionHide
  | ColumnActionColumnSettings
  | ColumnActionTableSettings;

export const isShowColumnSettings = (
  action: PersistentColumnAction
): action is ColumnActionColumnSettings => action.type === "columnSettings";

export const isShowTableSettings = (
  action: PersistentColumnAction
): action is ColumnActionTableSettings => action.type === "tableSettings";

export type GridModelAction =
  | ColumnActionColumnSettings
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

export type GridModelReducer = Reducer<TableModel, GridModelAction>;

export type ColumnActionDispatch = (action: GridModelAction) => void;

const columnReducer: GridModelReducer = (state, action) => {
  // info?.(`GridModelReducer ${action.type}`);
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
  tableConfig: Omit<GridConfig, "headings">,
  dataSourceConfig?: DataSourceConfig
) => {
  const [state, dispatchColumnAction] = useReducer<
    GridModelReducer,
    InitialConfig
  >(columnReducer, { tableConfig, dataSourceConfig }, init);

  return {
    columns: state.columns,
    dispatchColumnAction,
    headings: state.headings,
  };
};

type InitialConfig = {
  dataSourceConfig?: DataSourceConfig;
  tableConfig: TableConfig;
};

function init({ dataSourceConfig, tableConfig }: InitialConfig): TableModel {
  const columns = tableConfig.columns.map(
    toKeyedColumWithDefaults(tableConfig)
  );
  const maybePinnedColumns = columns.some(isPinned)
    ? sortPinnedColumns(columns)
    : columns;
  const state = {
    columns: maybePinnedColumns,
    headings: getTableHeadings(maybePinnedColumns),
  };
  if (dataSourceConfig) {
    const { columns, ...rest } = dataSourceConfig;
    return updateTableConfig(state, {
      type: "tableConfig",
      ...rest,
    });
  } else {
    return state;
  }
}

const labelFromName = (column: ColumnDescriptor) => {
  if (isCalculatedColumn(column.name)) {
    return getCalculatedColumnName(column);
  } else {
    return column.name;
  }
};

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

const toKeyedColumWithDefaults =
  (options: Partial<TableModel> | Partial<GridConfig>) =>
  (
    column: ColumnDescriptor & { key?: number },
    index: number
  ): KeyedColumnDescriptor => {
    const serverDataType = getServerDataTypeForColumn(
      column,
      (options as Partial<TableModel>).tableSchema
    );
    const { columnDefaultWidth = DEFAULT_COLUMN_WIDTH, columnFormatHeader } =
      options;
    const {
      align = getDefaultAlignment(serverDataType),
      key,
      name,
      label = labelFromName(column),
      width = columnDefaultWidth,
      ...rest
    } = column;

    const keyedColumnWithDefaults = {
      ...rest,
      align,
      CellRenderer: getCellRendererForColumn(column),
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
        (col) => toKeyedColumWithDefaults(options)(col, col.key)
      );
    }

    return keyedColumnWithDefaults;
  };

function moveColumn(
  state: TableModel,
  { column, moveBy, moveTo }: ColumnActionMove
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
  } else if (typeof moveTo === "number") {
    return {
      ...state,
      columns: moveItemDeprecated(columns, column, moveTo),
    };
  }
  return state;
}

function hideColumns(state: TableModel, { columns }: ColumnActionHide) {
  if (columns.some((col) => col.hidden !== true)) {
    return columns.reduce<TableModel>((s, c) => {
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
function showColumns(state: TableModel, { columns }: ColumnActionShow) {
  if (columns.some((col) => col.hidden)) {
    return columns.reduce<TableModel>((s, c) => {
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
  state: TableModel,
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
  state: TableModel,
  { tableSchema }: ColumnActionSetTableSchema
) {
  const { columns } = state;
  if (columns.some(columnWithoutDataType)) {
    const cols = columns.map((column) => {
      const serverDataType = getServerDataTypeForColumn(column, tableSchema);
      return {
        ...column,
        align: column.align ?? getDefaultAlignment(serverDataType),
        serverDataType,
      };
    });

    return {
      ...state,
      columns: cols,
      tableSchema,
    };
  } else {
    return {
      ...state,
      tableSchema,
    };
  }
}

function pinColumn(state: TableModel, action: ColumnActionPin) {
  let { columns } = state;
  const { column, pin } = action;
  columns = updateColumn(columns, column.name, { pin });
  columns = sortPinnedColumns(columns);
  console.log({ withPins: columns });
  return {
    ...state,
    columns,
  };
}
function updateColumnProp(state: TableModel, action: ColumnActionUpdateProp) {
  let { columns } = state;
  const { align, column, hidden, label, resizing, width } = action;
  const options: Partial<KeyedColumnDescriptor> = {};

  if (align === "left" || align === "right") {
    options.align = align;
  }
  if (typeof label === "string") {
    options.label = label;
  }
  if (typeof resizing === "boolean") {
    options.resizing = resizing;
  }
  if (typeof hidden === "boolean") {
    options.hidden = hidden;
  }
  if (typeof width === "number") {
    options.width = width;
  }

  columns = updateColumn(columns, column.name, options);

  return {
    ...state,
    columns,
  };
}

function updateTableConfig(
  state: TableModel,
  { columns, confirmed, filter, groupBy, sort }: ColumnActionTableConfig
) {
  const hasColumns = columns && columns.length > 0;
  const hasGroupBy = groupBy !== undefined;
  const hasFilter = typeof filter?.filter === "string";
  const hasSort = sort && sort.sortDefs.length > 0;

  //TODO check if just confirmed has changed

  let result = state;

  if (hasColumns) {
    result = {
      ...state,
      columns: columns.map((colName, index) => {
        const columnName = getColumnName(colName);
        const key: number = index + KEY_OFFSET;
        const col = findColumn(result.columns, columnName);
        if (col) {
          if (col.key === key) {
            return col;
          } else {
            return {
              ...col,
              key,
            };
          }
        } else {
          // we have a column which was not previously included.
          // TODO How do we get the serverDataType
          // TODO it needs to be available in availableCOlumns or allColumns in state
          return toKeyedColumWithDefaults(state)(
            {
              name: colName,
            },
            index
          );
        }
        throw Error(`useTableModel column ${colName} not found`);
      }),
    };
  }

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
