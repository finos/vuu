import {
  ColumnDescriptor,
  ColumnTypeDescriptor,
  GridConfig,
} from "@finos/vuu-datagrid-types";
import { Reducer, useReducer } from "react";
import { moveItem } from "@heswell/salt-lab";
import { fromServerDataType } from "@finos/vuu-utils";

export type CalculatedColumnExpression = {
  columName: string;
  expression: string;
};

export interface ColumnActionAdd {
  type: "addColumn";
  columns?: ColumnDescriptor[];
  column?: ColumnDescriptor;
  index?: number;
}
export interface ColumnActionAddCalculatedColumn {
  columnName: string;
  columnType: "string" | "int" | "double" | "boolean";
  expression: string;
  type: "addCalculatedColumn";
}

export interface ColumnActionMove {
  type: "moveColumn";
  column?: ColumnDescriptor;
  moveBy?: 1 | -1;
  moveTo?: number;
  moveFrom?: number;
}

export interface ColumnActionRemove {
  type: "removeColumn";
  column: ColumnDescriptor;
}

export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}
export interface ColumnActionUpdateProp {
  align?: ColumnDescriptor["align"];
  column: ColumnDescriptor;
  hidden?: ColumnDescriptor["hidden"];
  label?: ColumnDescriptor["label"];
  type: "updateColumnProp";
  width?: ColumnDescriptor["width"];
}

export interface ColumnActionUpdateGridSettings {
  type: "updateGridSettings";
  columnDefaultWidth?: number;
  columnFormatHeader?: "capitalize" | "uppercase";
}

export interface ColumnActionUpdateTypeFormatting {
  type: "updateColumnTypeFormatting";
  column: ColumnDescriptor;
  alignOnDecimals?: boolean;
  decimals?: number;
  zeroPad?: boolean;
}

export type ColumnAction =
  | ColumnActionAdd
  | ColumnActionAddCalculatedColumn
  | ColumnActionUpdateGridSettings
  | ColumnActionMove
  | ColumnActionRemove
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionUpdateTypeFormatting;

export type GridSettingsReducer = Reducer<
  Omit<GridConfig, "headings">,
  ColumnAction
>;

const gridSettingsReducer: GridSettingsReducer = (state, action) => {
  console.log(`gridSettingsReducer ${action.type}`);
  switch (action.type) {
    case "addColumn":
      return addColumn(state, action);
    case "addCalculatedColumn":
      return addCalculatedColumn(state, action);
    case "moveColumn":
      return moveColumn(state, action);
    case "removeColumn":
      return removeColumn(state, action);
    case "updateColumn":
      return state;
    case "updateColumnProp":
      return updateColumnProp(state, action);
    case "updateGridSettings":
      return updateGridSettings(state, action);
    case "updateColumnTypeFormatting":
      return updateColumnTypeFormatting(state, action);
    default:
      return state;
  }
};

export const useGridSettings = (config: Omit<GridConfig, "headings">) => {
  const [state, dispatchColumnAction] = useReducer<GridSettingsReducer>(
    gridSettingsReducer,
    config
  );

  return {
    gridSettings: state,
    dispatchColumnAction,
  };
};

function addColumn(
  state: Omit<GridConfig, "headings">,
  { column, columns, index = -1 }: ColumnActionAdd
) {
  const { columns: stateColumns } = state;
  if (index === -1) {
    if (Array.isArray(columns)) {
      return { ...state, columns: stateColumns.concat(columns) };
    } else if (column) {
      return { ...state, columns: stateColumns.concat(column) };
    }
  }
  return state;
}

function addCalculatedColumn(
  state: Omit<GridConfig, "headings">,
  { columnName, columnType, expression }: ColumnActionAddCalculatedColumn
) {
  const { columns: stateColumns } = state;
  const calculatedColumn = {
    name: columnName,
    expression,
    serverDataType: columnType,
  };
  return { ...state, columns: stateColumns.concat(calculatedColumn) };
}

function removeColumn(
  state: Omit<GridConfig, "headings">,
  { column }: ColumnActionRemove
) {
  const { columns: stateColumns } = state;
  return {
    ...state,
    columns: stateColumns.filter((col) => col.name !== column.name),
  };
}

function moveColumn(
  state: Omit<GridConfig, "headings">,
  { column, moveBy, moveFrom, moveTo }: ColumnActionMove
) {
  const { columns: stateColumns } = state;
  if (column && typeof moveBy === "number") {
    const idx = stateColumns.indexOf(column);
    const newColumns = stateColumns.slice();
    const [movedColumns] = newColumns.splice(idx, 1);
    newColumns.splice(idx + moveBy, 0, movedColumns);
    return {
      ...state,
      columns: newColumns,
    };
  } else if (typeof moveFrom === "number" && typeof moveTo === "number") {
    return {
      ...state,
      columns: moveItem(stateColumns, moveFrom, moveTo),
    };
  } else {
    return state;
  }
}

function updateColumnProp(
  state: Omit<GridConfig, "headings">,
  { align, column, hidden, label, width }: ColumnActionUpdateProp
) {
  let { columns: stateColumns } = state;
  if (align === "left" || align === "right") {
    stateColumns = replaceColumn(stateColumns, { ...column, align });
  }
  if (typeof hidden === "boolean") {
    stateColumns = replaceColumn(stateColumns, { ...column, hidden });
  }
  if (typeof label === "string") {
    stateColumns = replaceColumn(stateColumns, { ...column, label });
  }
  if (typeof width === "number") {
    stateColumns = replaceColumn(stateColumns, { ...column, width });
  }
  return {
    ...state,
    columns: stateColumns,
  };
}

function updateGridSettings(
  state: Omit<GridConfig, "headings">,
  { columnFormatHeader }: ColumnActionUpdateGridSettings
) {
  return {
    ...state,
    columnFormatHeader: columnFormatHeader ?? state.columnFormatHeader,
  };
}

function updateColumnTypeFormatting(
  state: Omit<GridConfig, "headings">,
  {
    alignOnDecimals,
    column,
    decimals,
    zeroPad,
  }: ColumnActionUpdateTypeFormatting
) {
  const { columns: stateColumns } = state;
  const targetColumn = stateColumns.find((col) => col.name === column.name);
  if (targetColumn) {
    const {
      serverDataType = "string",
      type: columnType = fromServerDataType(serverDataType),
    } = column;
    const type: ColumnTypeDescriptor =
      typeof columnType === "string"
        ? {
            name: columnType,
          }
        : {
            ...columnType,
          };
    if (typeof alignOnDecimals === "boolean") {
      type.formatting = {
        ...type.formatting,
        alignOnDecimals,
      };
    }
    if (typeof decimals === "number") {
      type.formatting = {
        ...type.formatting,
        decimals,
      };
    }
    if (typeof zeroPad === "boolean") {
      type.formatting = {
        ...type.formatting,
        zeroPad,
      };
    }

    return {
      ...state,
      columns: replaceColumn(stateColumns, { ...column, type }),
    };
  } else {
    return state;
  }
}

function replaceColumn(columns: ColumnDescriptor[], column: ColumnDescriptor) {
  return columns.map((col) => (col.name === column.name ? column : col));
}
