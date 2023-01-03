import {
  ColumnDescriptor,
  ColumnTypeDescriptor,
} from "@finos/vuu-datagrid-types";
import { Reducer, useReducer } from "react";
import { moveItem } from "@heswell/salt-lab";

export interface ColumnActionAdd {
  type: "addColumn";
  columns?: ColumnDescriptor[];
  column?: ColumnDescriptor;
  index?: number;
}

export interface ColumnActionMove {
  type: "moveColumn";
  column: ColumnDescriptor;
  moveBy?: 1 | -1;
  moveTo?: number;
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
  type: "updateColumnProp";
  column: ColumnDescriptor;
  align?: ColumnDescriptor["align"];
  label?: ColumnDescriptor["label"];
  width?: ColumnDescriptor["width"];
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
  | ColumnActionMove
  | ColumnActionRemove
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionUpdateTypeFormatting;

export type ColumnReducer = Reducer<ColumnDescriptor[], ColumnAction>;

const columnReducer: ColumnReducer = (state, action) => {
  switch (action.type) {
    case "addColumn":
      return addColumn(state, action);
    case "moveColumn":
      return moveColumn(state, action);
    case "removeColumn":
      return removeColumn(state, action);
    case "updateColumn":
      return state;
    case "updateColumnProp":
      return updateColumnProp(state, action);
    case "updateColumnTypeFormatting":
      return updateColumnTypeFormatting(state, action);
    default:
      return state;
  }
};

export const useColumns = (columns: ColumnDescriptor[]) => {
  const [state, dispatchColumnAction] = useReducer<ColumnReducer>(
    columnReducer,
    columns
  );

  return {
    columns: state,
    dispatchColumnAction,
  };
};

function addColumn(
  state: ColumnDescriptor[],
  { column, columns, index = -1 }: ColumnActionAdd
) {
  if (index === -1) {
    if (Array.isArray(columns)) {
      return state.concat(columns);
    } else if (column) {
      return state.concat(column);
    }
  }
  return state;
}

function removeColumn(
  columns: ColumnDescriptor[],
  { column }: ColumnActionRemove
) {
  return columns.filter((col) => col.name !== column.name);
}

function moveColumn(
  columns: ColumnDescriptor[],
  { column, moveBy, moveTo }: ColumnActionMove
) {
  if (typeof moveBy === "number") {
    const idx = columns.indexOf(column);
    const newColumns = columns.slice();
    const [movedColumns] = newColumns.splice(idx, 1);
    newColumns.splice(idx + moveBy, 0, movedColumns);
    return newColumns;
  } else if (typeof moveTo === "number") {
    const index = columns.indexOf(column);
    return moveItem(columns, index, moveTo);
  } else {
    return columns;
  }
}

function updateColumnProp(
  state: ColumnDescriptor[],
  { align, column, label, width }: ColumnActionUpdateProp
) {
  if (align === "left" || align === "right") {
    state = replaceColumn(state, { ...column, align });
  }
  if (typeof label === "string") {
    state = replaceColumn(state, { ...column, label });
  }
  if (typeof width === "number") {
    state = replaceColumn(state, { ...column, width });
  }
  return state;
}

function updateColumnTypeFormatting(
  state: ColumnDescriptor[],
  {
    alignOnDecimals,
    column,
    decimals,
    zeroPad,
  }: ColumnActionUpdateTypeFormatting
) {
  const targetColumn = state.find((col) => col.name === column.name);
  if (targetColumn) {
    const { serverDataType = "string", type: columnType = serverDataType } =
      column;
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

    return replaceColumn(state, { ...column, type });
  } else {
    return state;
  }
}

function replaceColumn(state: ColumnDescriptor[], column: ColumnDescriptor) {
  return state.map((col) => (col.name === column.name ? column : col));
}
