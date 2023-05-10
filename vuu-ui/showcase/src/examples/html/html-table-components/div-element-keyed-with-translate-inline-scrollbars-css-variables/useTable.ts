import { DataSource } from "@finos/vuu-data";
import { GridConfig, KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { RefObject, useCallback, useMemo, useState } from "react";
import { useDataSource } from "./useDataSource";
import { useMeasuredContainer } from "./useMeasuredContainer";
import { useScroll } from "./useScroll";
import { useTableViewport } from "./useTableViewport";
import { buildColumnMap } from "@finos/vuu-utils";
import { useTableScroll } from "./useTableScroll-deprecated";
import { useVirtualViewport } from "./useVirtualViewport-deprecated";
import { actualRowPositioning } from "@finos/vuu-utils";

export const useTable = ({
  config,
  dataSource,
  headerHeight,
  renderBufferSize = 0,
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
  const [getRowOffset, getRowAtPosition] = actualRowPositioning(30);
  const [rowCount, setRowCount] = useState<number>(0);
  const containerMeasurements = useMeasuredContainer();
  const columnMap = useMemo(
    () => buildColumnMap(config.columns.map((col) => col.name)),
    [config.columns]
  );
  const columns: KeyedColumnDescriptor[] = useMemo(
    () => config.columns.map((col) => ({ ...col, key: columnMap[col.name] })),
    [columnMap, config.columns]
  );

  const viewportMeasurements = useTableViewport({
    columns: config.columns,
    headerHeight,
    rowCount,
    rowHeight,
    size: containerMeasurements.innerSize,
  });

  const { data, setRange } = useDataSource({
    dataSource,
    range: { from: 0, to: viewportMeasurements.visibleRowCount + 1 },
  });

  const { onVerticalScroll } = useVirtualViewport({
    getRowAtPosition,
    setRange,
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

  // dataSource.range = { from: firstRowIndex, to: lastRowIndex };

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      onVerticalScroll(scrollTop);
    },
    [onVerticalScroll]
  );

  const { requestScroll, ...scrollProps } = useTableScroll({
    onVerticalScroll: handleVerticalScroll,
    viewportHeight: 645 - 30,
  });

  return {
    columnMap,
    columns,
    containerMeasurements,
    data,
    handleScroll,
    firstRowIndex,
    lastRowIndex,
    offscreenContentHeight,
    scrollProps,
    spacerEndRef,
    spacerStartRef,
    viewportMeasurements,
  };
};
