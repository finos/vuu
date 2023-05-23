import {
  DataSource,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import {
  GridConfig,
  KeyedColumnDescriptor,
  SelectionChangeHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { MeasuredProps, useMeasuredContainer } from "@finos/vuu-table";
import { useTableModel } from "./useTableModel";
import { actualRowPositioning, buildColumnMap } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { useDataSource } from "./useDataSource";
import { useScroll } from "./useScroll";
import { useTableScroll } from "./useTableScroll-deprecated";
import { useTableViewport } from "./useTableViewport";
import { useVirtualViewport } from "./useVirtualViewport-deprecated";
import { useInitialValue } from "./useInitialValue";
import { VuuRange } from "@finos/vuu-protocol-types";

export interface TableHookProps extends MeasuredProps {
  config: Omit<GridConfig, "headings">;
  dataSource: DataSource;
  headerHeight: number;
  onConfigChange?: (config: Omit<GridConfig, "headings">) => void;
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  renderBufferSize?: number;
  rowHeight: number;
  onSelectionChange?: SelectionChangeHandler;
  selectionModel: TableSelectionModel;
}

export const useTable = ({
  config,
  dataSource,
  headerHeight,
  onConfigChange,
  onFeatureEnabled,
  onFeatureInvocation,
  onSelectionChange,
  renderBufferSize = 0,
  rowHeight,
  selectionModel,
  ...measuredProps
}: TableHookProps) => {
  const [rowCount, setRowCount] = useState<number>(dataSource.size);

  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const containerMeasurements = useMeasuredContainer(measuredProps);

  const { headings } = useTableModel();

  const [getRowOffset, getRowAtPosition] = actualRowPositioning(30);
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
    headings,
    rowCount,
    rowHeight,
    // Note: innerSize will take border into account, whereas outerSize will not
    size: containerMeasurements.innerSize ?? containerMeasurements.outerSize,
  });

  const initialRange = useInitialValue<VuuRange>({
    from: 0,
    to: viewportMeasurements.rowCount + 1,
  });

  const { data, setRange } = useDataSource({
    dataSource,
    initialRange,
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
    viewportHeight: viewportMeasurements.viewportBodyHeight,
    visibleRowCount: viewportMeasurements.rowCount,
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
