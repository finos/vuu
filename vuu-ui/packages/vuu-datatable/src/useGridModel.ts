import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid-types";
import { moveItem } from "@heswell/salt-lab";
import { metadataKeys } from "@finos/vuu-utils";

import { Reducer, useReducer } from "react";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";

const DEFAULT_COLUMN_WIDTH = 100;
const KEY_OFFSET = metadataKeys.count;

const columnWithoutDataType = ({ serverDataType }: ColumnDescriptor) =>
  serverDataType === undefined;

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
  config: GridConfig;
}

export interface ColumnActionMove {
  type: "moveColumn";
  column: KeyedColumnDescriptor;
  moveBy?: 1 | -1;
  moveTo?: number;
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
  type: "updateColumnProp";
  column: KeyedColumnDescriptor;
  align?: ColumnDescriptor["align"];
  label?: ColumnDescriptor["label"];
  width?: ColumnDescriptor["width"];
}

export interface ColumnActionUpdateGridConfig {
  type: "updateGridConfig";
  formatColumnHeaders?: GridConfig["columnFormatHeader"];
}

export type GridModelAction =
  | ColumnActionInit
  | ColumnActionMove
  | ColumnActionSetTypes
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionUpdateGridConfig;

export type GridModelReducer = Reducer<GridModel, GridModelAction>;

const columnReducer: GridModelReducer = (state, action) => {
  switch (action.type) {
    case "init":
      return init(action.config);
    case "moveColumn":
      return moveColumn(state, action);
    case "setTypes":
      return setTypes(state, action);
    case "updateColumnProp":
      return updateColumnProp(state, action);
    default:
      console.log(`unhandled action ${action.type}`);
      return state;
  }
};

export const useGridModel = (config: GridConfig) => {
  const [state, dispatchColumnAction] = useReducer<
    GridModelReducer,
    GridConfig
  >(columnReducer, config, init);
  return {
    columns: state.columns,
    dispatchColumnAction,
  };
};

function init(config: GridConfig): GridModel {
  console.log(`init, columns`, {
    columns: config.columns,
  });

  return {
    columns: config.columns.map(toKeyedColumWithDefaults),
  };
}

const toKeyedColumWithDefaults = (
  column: ColumnDescriptor,
  index: number
): KeyedColumnDescriptor => {
  const {
    align = getDefaultAlignment(column.serverDataType),
    name,
    label = name,
    width = DEFAULT_COLUMN_WIDTH,
    ...rest
  } = column;
  return {
    ...rest,
    align,
    label,
    key: index + KEY_OFFSET,
    name,
    width,
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

function setTypes(
  state: GridModel,
  { columnNames, serverDataTypes }: ColumnActionSetTypes
) {
  console.log(`setTypes, existing columns`, {
    state,
  });
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

function updateColumnProp(
  state: GridModel,
  { align, column, label, width }: ColumnActionUpdateProp
) {
  let { columns } = state;
  const targetColumn = columns.find((col) => col.name === column.name);
  if (targetColumn) {
    if (align === "left" || align === "right") {
      columns = replaceColumn(columns, { ...targetColumn, align });
    }
    if (typeof label === "string") {
      columns = replaceColumn(columns, { ...targetColumn, label });
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

function replaceColumn(
  state: KeyedColumnDescriptor[],
  column: KeyedColumnDescriptor
) {
  return state.map((col) => (col.name === column.name ? column : col));
}
