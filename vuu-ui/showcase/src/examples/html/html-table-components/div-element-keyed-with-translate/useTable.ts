import { DataSource } from "@finos/vuu-data";
import { GridConfig, KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { RefObject, useMemo } from "react";
import { useDataSource } from "./useDataSource";
import { useMeasuredContainer } from "./useMeasuredContainer";
import { useScroll } from "./useScroll";
import { useTableViewport } from "./useTableViewport";
import { buildColumnMap } from "@finos/vuu-utils";

export const useTable = ({
  config,
  dataSource,
  rowHeight = 30,
  tableRef,
}: {
  config: Omit<GridConfig, "headings">;
  dataSource: DataSource;
  headerHeight: number;
  renderBufferSize?: number;
  rowHeight?: number;
  tableRef: RefObject<HTMLDivElement>;
}) => {
  const containerMeasurements = useMeasuredContainer();
  const columnMap = useMemo(
    () => buildColumnMap(config.columns.map((col) => col.name)),
    [config.columns]
  );
  const columns: KeyedColumnDescriptor[] = useMemo(
    () =>
      config.columns.map((col) => ({
        ...col,
        key: columnMap[col.name],
        label: col.name,
        valueFormatter: undefined,
        width: col.width ?? 100,
      })),
    [columnMap, config.columns]
  );

  const viewportMeasurements = useTableViewport();

  const { data } = useDataSource({
    dataSource,
  });

  const {
    handleScroll,
    firstRowIndex,
    lastRowIndex,
    offscreenContentHeight,
    spacerEndRef,
    spacerStartRef,
  } = useScroll({
    bufferCount: 5,
    dataRowCount: dataSource.size,
    rowHeight,
    table: tableRef,
    viewportHeight: viewportMeasurements.height,
    visibleRowCount: viewportMeasurements.visibleRowCount,
  });

  dataSource.range = { from: firstRowIndex, to: lastRowIndex };

  return {
    columnMap,
    columns,
    containerMeasurements,
    data,
    handleScroll,
    firstRowIndex,
    lastRowIndex,
    offscreenContentHeight,
    spacerEndRef,
    spacerStartRef,
    viewportMeasurements,
  };
};
