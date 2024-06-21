import {
  ColumnDescriptor,
  RuntimeColumnDescriptor,
  TableConfig,
} from "@finos/vuu-table-types";
import { getRuntimeColumnWidth } from "@finos/vuu-utils";

export type MoveColumnTableConfigAction = {
  type: "col-move";
  column: ColumnDescriptor;
  fromIndex: number;
  toIndex: number;
};

export type ResizeColumnTableConfigAction = {
  type: "col-size";
  column: ColumnDescriptor;
  columns: RuntimeColumnDescriptor[];
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
    case "col-size": {
      const { columns: runtimeColumns, width } = action;
      const isFit = config.columnLayout === "fit";
      return {
        ...config,
        columnLayout: isFit ? "manual" : config.columnLayout,
        columns: config.columns.map((col) => {
          if (isFit) {
            // When user resizes a column and 'fit' column layout is in effect,
            // column layout becomes 'manual' and all columns are set to
            // their current widths (unless subsequently resized by user).
            return col.name === action.column.name
              ? { ...col, width }
              : col.width
              ? col
              : { ...col, width: getRuntimeColumnWidth(col, runtimeColumns) };
          } else {
            return col.name === action.column.name
              ? { ...col, width: action.width }
              : col;
          }
        }),
      };
    }
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
