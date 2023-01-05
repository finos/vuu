import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Reducer, useReducer } from "react";

export interface ColumnActionAdd {
  type: "addColumn";
  column: ColumnDescriptor;
  index?: number;
}
export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}

export type ColumnAction = ColumnActionAdd | ColumnActionUpdate;
export type ColumnReducer = Reducer<ColumnDescriptor[], ColumnAction>;

const columnReducer: ColumnReducer = (state, action) => {
  switch (action.type) {
    case "addColumn":
      return addColumn(state, action);
    case "updateColumn":
      return state;
    default:
      return state;
  }
};

export const useColumns = (columns: ColumnDescriptor[]) => {
  const [state, dispatch] = useReducer<ColumnReducer>(columnReducer, columns);

  return {
    columns: state,
    dispatch,
  };
};

function addColumn(
  columns: ColumnDescriptor[],
  { column, index = -1 }: ColumnActionAdd
) {
  if (index === -1) {
    return columns.concat(column);
  } else {
    return columns;
  }
}
