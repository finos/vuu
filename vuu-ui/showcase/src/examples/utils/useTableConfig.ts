import { ArrayDataSource } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType, VuuTable } from "@finos/vuu-protocol-types";
import { useMemo } from "react";
import { ArrayProxy } from "./ArrayProxy";
import { getColumnAndRowGenerator } from "./vuu-row-generator";

const NO_CONFIG = {} as const;
export const useTableConfig = ({
  columnConfig = NO_CONFIG,
  columnCount = 10,
  count = 1000,
  leftPinnedColumns = [],
  rangeChangeRowset = "delta",
  rightPinnedColumns = [],
  renderBufferSize = 0,
  table,
}: {
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> };
  columnCount?: number;
  count?: number;
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  rangeChangeRowset?: "delta" | "full";
  renderBufferSize?: number;
  table?: VuuTable;
} = {}) => {
  return useMemo(() => {
    const [columnGenerator, rowGenerator] = getColumnAndRowGenerator(table);
    const arrayProxy = new ArrayProxy<VuuRowDataItemType[]>(
      count,
      rowGenerator(columnCount)
    );

    const columns = table
      ? columnGenerator([], columnConfig)
      : columnGenerator(columnCount, columnConfig);

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data: arrayProxy,
      rangeChangeRowset,
    });

    return { config: { columns }, dataSource, renderBufferSize };
  }, [
    columnConfig,
    columnCount,
    count,
    leftPinnedColumns,
    rangeChangeRowset,
    renderBufferSize,
    rightPinnedColumns,
    table,
  ]);
};
