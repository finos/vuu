import {
  ColumnDescriptor,
  ColumnTypeDescriptor,
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

const numericTypes = ["int", "long", "double"];
const getDefaultAlignment = (serverDataType?: VuuColumnDataType) =>
  serverDataType === undefined
    ? undefined
    : numericTypes.includes(serverDataType)
    ? "right"
    : "left";

export interface ColumnActionAdd {
  type: "addColumn";
  columns?: ColumnDescriptor[];
  column?: ColumnDescriptor;
  index?: number;
}

export interface ColumnActionInit {
  type: "init";
  columns: ColumnDescriptor[];
}

export interface ColumnActionMove {
  type: "moveColumn";
  column: KeyedColumnDescriptor;
  moveBy?: 1 | -1;
  moveTo?: number;
}

export interface ColumnActionRemove {
  type: "removeColumn";
  column: ColumnDescriptor;
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
  | ColumnActionInit
  | ColumnActionMove
  | ColumnActionRemove
  | ColumnActionSetTypes
  | ColumnActionUpdate
  | ColumnActionUpdateProp
  | ColumnActionUpdateTypeFormatting;

export type ColumnReducer = Reducer<KeyedColumnDescriptor[], ColumnAction>;

const columnReducer: ColumnReducer = (state, action) => {
  switch (action.type) {
    case "init":
      return init(action.columns);
    // case "addColumn":
    //   return addColumn(state, action);
    case "moveColumn":
      return moveColumn(state, action);
    case "removeColumn":
      return removeColumn(state, action);
    case "setTypes":
      return setTypes(state, action);
    // case "updateColumn":
    //   return state;
    case "updateColumnProp":
      return updateColumnProp(state, action);
    // case "updateColumnTypeFormatting":
    //   return updateColumnTypeFormatting(state, action);
    default:
      console.log(`unhandled action ${action.type}`);
      return state;
  }
};

export const useColumns = () => {
  const [state, dispatchColumnAction] = useReducer<ColumnReducer>(
    columnReducer,
    []
  );

  return {
    columns: state,
    dispatchColumnAction,
  };
};

function init(columns: ColumnDescriptor[]): KeyedColumnDescriptor[] {
  return columns.map(applyDefaultColumnValues);
}

const applyDefaultColumnValues = (
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
  columns: KeyedColumnDescriptor[],
  { column }: ColumnActionRemove
) {
  return columns.filter((col) => col.name !== column.name);
}

function moveColumn(
  state: KeyedColumnDescriptor[],
  { column, moveBy, moveTo }: ColumnActionMove
) {
  if (typeof moveBy === "number") {
    const idx = state.indexOf(column);
    const newColumns = state.slice();
    const [movedColumns] = newColumns.splice(idx, 1);
    newColumns.splice(idx + moveBy, 0, movedColumns);
    return newColumns;
  } else if (typeof moveTo === "number") {
    const index = state.indexOf(column);
    return moveItem(state, index, moveTo);
  }
  return state;
}

function setTypes(
  state: KeyedColumnDescriptor[],
  { columnNames, serverDataTypes }: ColumnActionSetTypes
) {
  if (state.some(columnWithoutDataType)) {
    const cols = state.map((column) => {
      const serverDataType = getDataType(column, columnNames, serverDataTypes);
      return {
        ...column,
        align: column.align ?? getDefaultAlignment(serverDataType),
        serverDataType,
      };
    });
    return cols;
    // return state.map((column) => ({
    //   ...column,
    //   serverDataType: getDataType(column, columnNames, serverDataTypes),
    // }));
  } else {
    return state;
  }
}

function updateColumnProp(
  state: KeyedColumnDescriptor[],
  { align, column, label, width }: ColumnActionUpdateProp
) {
  const targetColumn = state.find((col) => col.name === column.name);
  if (targetColumn) {
    if (align === "left" || align === "right") {
      state = replaceColumn(state, { ...targetColumn, align });
    }
    if (typeof label === "string") {
      state = replaceColumn(state, { ...targetColumn, label });
    }
    if (typeof width === "number") {
      state = replaceColumn(state, { ...targetColumn, width });
    }
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

function replaceColumn(
  state: KeyedColumnDescriptor[],
  column: KeyedColumnDescriptor
) {
  return state.map((col) => (col.name === column.name ? column : col));
}
