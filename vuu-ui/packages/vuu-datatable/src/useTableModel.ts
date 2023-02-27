import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
  PinLocation,
} from "@finos/vuu-datagrid-types";
import { moveItem } from "@heswell/salt-lab";
import {
  applyFilterToColumns,
  applyGroupByToColumns,
  applySortToColumns,
  getCellRenderer,
  getColumnName,
  getTableHeadings,
  getValueFormatter,
  isPinned,
  isTypeDescriptor,
  metadataKeys,
  sortPinnedColumns,
} from "@finos/vuu-utils";

import { Reducer, useReducer } from "react";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { DataSourceConfig } from "@finos/vuu-data";

const DEFAULT_COLUMN_WIDTH = 100;
const KEY_OFFSET = metadataKeys.count;

const columnWithoutDataType = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined;

const getCellRendererForColumn = (column: ColumnDescriptor) => {
  if (isTypeDescriptor(column.type)) {
    return getCellRenderer(column.type?.renderer?.name);
  }
};

const getDataType = (
  column: ColumnDescriptor,
  columnNames: string[],
  dataTypes: VuuColumnDataType[]
): VuuColumnDataType => {
  const index = columnNames.indexOf(column.name);
  if (index !== -1 && dataTypes[index]) {
    return dataTypes[index];
  } else {
    return column.serverDataType ?? "string";
  }
};

export interface GridModel extends Omit<GridConfig, "columns"> {
  columns: KeyedColumnDescriptor[];
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
  tableConfig: Omit<GridConfig, "headings">;
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

export interface ColumnActionSetTypes {
  type: "setTypes";
  columnNames: string[];
  serverDataTypes: VuuColumnDataType[];
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

/**
 * PersistentColumnActions are those actions that require us to persist user changes across sessions
 */
export type PersistentColumnAction = ColumnActionPin | ColumnActionHide;

export type GridModelAction =
  | ColumnActionHide
  | ColumnActionInit
  | ColumnActionMove
  | ColumnActionPin
  | ColumnActionResize
  | ColumnActionSetTypes
  | ColumnActionShow
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionTableConfig;

export type GridModelReducer = Reducer<GridModel, GridModelAction>;

export type ColumnActionDispatch = (action: GridModelAction) => void;

const columnReducer: GridModelReducer = (state, action) => {
  switch (action.type) {
    case "init":
      return init(action);
    case "moveColumn":
      return moveColumn(state, action);
    case "resizeColumn":
      return resizeColumn(state, action);
    case "setTypes":
      return setTypes(state, action);
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
  tableConfig: Omit<GridConfig, "headings">;
};

function init({ dataSourceConfig, tableConfig }: InitialConfig): GridModel {
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
    return updateTableConfig(state, {
      type: "tableConfig",
      ...dataSourceConfig,
    });
  } else {
    return state;
  }
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

const toKeyedColumWithDefaults =
  ({
    columnDefaultWidth = DEFAULT_COLUMN_WIDTH,
    columnFormatHeader,
  }: Omit<GridConfig, "headings">) =>
  (column: ColumnDescriptor, index: number): KeyedColumnDescriptor => {
    const {
      align = getDefaultAlignment(column.serverDataType),
      name,
      label = name,
      width = columnDefaultWidth,
      ...rest
    } = column;
    return {
      ...rest,
      align,
      CellRenderer: getCellRendererForColumn(column),
      label: getLabel(label, columnFormatHeader),
      key: index + KEY_OFFSET,
      name,
      originalIdx: index,
      valueFormatter: getValueFormatter(column),
      width: width,
    };
  };

function moveColumn(
  state: GridModel,
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
    const index = columns.indexOf(column);
    return {
      ...state,
      columns: moveItem(columns, index, moveTo),
    };
  }
  return state;
}

function hideColumns(state: GridModel, { columns }: ColumnActionHide) {
  if (columns.some((col) => col.hidden !== true)) {
    return columns.reduce<GridModel>((s, c) => {
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
function showColumns(state: GridModel, { columns }: ColumnActionShow) {
  if (columns.some((col) => col.hidden)) {
    return columns.reduce<GridModel>((s, c) => {
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
  state: GridModel,
  { column, phase, width }: ColumnActionResize
) {
  const type = "updateColumnProp";
  const resizing = phase !== "end";

  switch (phase) {
    case "begin":
    case "end":
      return updateColumnProp(state, { type, column, resizing });
    case "resize":
      return updateColumnProp(state, { type, column, width });
    default:
      throw Error(`useTableModel.resizeColumn, invalid resizePhase ${phase}`);
  }
}

function setTypes(
  state: GridModel,
  { columnNames, serverDataTypes }: ColumnActionSetTypes
) {
  const { columns } = state;
  if (columns.some(columnWithoutDataType)) {
    const cols = columns.map((column) => {
      const serverDataType = getDataType(column, columnNames, serverDataTypes);
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

function pinColumn(state: GridModel, action: ColumnActionPin) {
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
function updateColumnProp(state: GridModel, action: ColumnActionUpdateProp) {
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
  };
}

function updateTableConfig(
  state: GridModel,
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
        const key = index + KEY_OFFSET;
        const col = result.columns.find((col) => col.name === columnName);
        if (col) {
          if (col.key === key) {
            return col;
          } else {
            return {
              ...col,
              key,
            };
          }
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
  }

  return result;
}

function replaceColumn(
  state: KeyedColumnDescriptor[],
  column: KeyedColumnDescriptor
) {
  return state.map((col) => (col.name === column.name ? column : col));
}
