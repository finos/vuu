import { ColumnDescriptor, TableConfig } from "@finos/vuu-datagrid-types";

export type MoveColumnTableConfigAction = {
  type: "col-move";
  column: ColumnDescriptor;
  fromIndex: number;
  toIndex: number;
};

export type ResizeColumnTableConfigAction = {
  type: "col-size";
  column: ColumnDescriptor;
  width: number;
};

export type SubscribeColumnTableConfigAction = {
  type: "subscribed";
  column: ColumnDescriptor;
  value: boolean;
};

export type UpdateColumnPropertyTableConfigAction = {
  type: "column-prop";
  column: ColumnDescriptor;
  property: keyof ColumnDescriptor;
  value: boolean | number | string;
};

export type TableConfigAction =
  | MoveColumnTableConfigAction
  | ResizeColumnTableConfigAction
  | UpdateColumnPropertyTableConfigAction;

export const updateTableConfig = (
  config: TableConfig,
  action: TableConfigAction
): TableConfig => {
  switch (action.type) {
    case "col-size":
      return {
        ...config,
        columns: config.columns.map((col) =>
          col.name === action.column.name
            ? { ...col, width: action.width }
            : col
        ),
      };
    case "column-prop":
      return {
        ...config,
        columns: config.columns.map((col) =>
          col.name === action.column.name
            ? { ...col, [action.property]: action.value }
            : col
        ),
      };

    default:
      return config;
  }
};
