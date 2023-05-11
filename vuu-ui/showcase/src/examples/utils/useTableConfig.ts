import { ArrayDataSource } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuRowDataItemType } from "@finos/vuu-protocol-types";
import { useMemo } from "react";
import { ArrayProxy } from "./ArrayProxy";
import { VuuRowGenerator } from "./vuu-row-generator";

const NO_CONFIG = {} as const;
export const useTableConfig = ({
  columnConfig = NO_CONFIG,
  columnCount = 10,
  count = 1000,
  leftPinnedColumns = [],
  rightPinnedColumns = [],
  renderBufferSize = 0,
}: {
  columnConfig?: { [key: string]: Partial<ColumnDescriptor> };
  columnCount?: number;
  count?: number;
  leftPinnedColumns?: number[];
  rightPinnedColumns?: number[];
  renderBufferSize?: number;
} = {}) => {
  return useMemo(() => {
    const arrayProxy = new ArrayProxy<VuuRowDataItemType[]>(
      count,
      VuuRowGenerator(columnCount)
    );

    const columns: ColumnDescriptor[] = [
      { name: "row number", width: 150 },
    ].concat(
      Array(columnCount)
        .fill(true)
        .map((base, i) => {
          const name = `column ${i + 1}`;
          return { name, width: 100, ...columnConfig[name] };
        })
    );

    leftPinnedColumns.forEach((index) => (columns[index].pin = "left"));
    rightPinnedColumns.forEach((index) => (columns[index].pin = "right"));

    const dataSource = new ArrayDataSource({
      columnDescriptors: columns,
      data: arrayProxy,
    });

    return { config: { columns }, dataSource, renderBufferSize };
  }, [
    columnConfig,
    columnCount,
    count,
    leftPinnedColumns,
    renderBufferSize,
    rightPinnedColumns,
  ]);
};
