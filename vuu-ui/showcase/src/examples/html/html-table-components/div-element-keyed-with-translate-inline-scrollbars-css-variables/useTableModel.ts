import { DataSourceConfig } from "@finos/vuu-data";
import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
  TableHeadings,
} from "@finos/vuu-datagrid-types";
import { VuuColumnDataType } from "@finos/vuu-protocol-types";
import { defaultValueFormatter, metadataKeys } from "@finos/vuu-utils";

const NO_HEADINGS: TableHeadings = [];
const DEFAULT_COLUMN_WIDTH = 100;
const KEY_OFFSET = metadataKeys.count;

const numericTypes = ["int", "long", "double"];
const getDefaultAlignment = (serverDataType?: VuuColumnDataType) =>
  serverDataType === undefined
    ? undefined
    : numericTypes.includes(serverDataType)
    ? "right"
    : "left";

const toKeyedColumWithDefaults =
  (options: Omit<GridConfig, "headings">) =>
  (
    column: ColumnDescriptor & { key?: number },
    index: number
  ): KeyedColumnDescriptor => {
    const { columnDefaultWidth = DEFAULT_COLUMN_WIDTH } = options;
    const {
      align = getDefaultAlignment(column.serverDataType),
      key,
      name,
      label = name,
      width = columnDefaultWidth,
      ...rest
    } = column;

    const keyedColumnWithDefaults = {
      ...rest,
      align,
      // CellRenderer: getCellRendererForColumn(column),
      label,
      key: key ?? index + KEY_OFFSET,
      name,
      originalIdx: index,
      valueFormatter: defaultValueFormatter,
      width: width,
    };

    return keyedColumnWithDefaults;
  };

export const useTableModel = (
  tableConfig: Omit<GridConfig, "headings">,
  dataSourceConfig?: DataSourceConfig
) => {
  const columns = tableConfig.columns.map(
    toKeyedColumWithDefaults(tableConfig)
  );

  return {
    columns,
    headings: NO_HEADINGS,
  };
};
