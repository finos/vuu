import {
  DataSource,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import {
  GridConfig,
  SelectionChangeHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import {
  MeasuredProps,
  useMeasuredContainer,
  useTableContextMenu,
  useTableViewport,
} from "@finos/vuu-table";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";
import { buildColumnMap } from "@finos/vuu-utils";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import { useDataSource } from "./useDataSource";
import { useTableModel } from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
// import { useTableViewport } from "./useTableViewport";
import { VuuRange } from "@finos/vuu-protocol-types";
import { PersistentColumnAction } from "@finos/vuu-table/src/table/useTableModel";
import { useInitialValue } from "./useInitialValue";
import { useVirtualViewport } from "./useVirtualViewport";
import { buildContextMenuDescriptors } from "@finos/vuu-table";

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
  rowHeight,
  selectionModel,
  ...measuredProps
}: TableHookProps) => {
  const [rowCount] = useState<number>(dataSource.size);

  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const menuBuilder = useMemo(
    () => buildContextMenuDescriptors(dataSource),
    [dataSource]
  );

  const containerMeasurements = useMeasuredContainer(measuredProps);

  const { columns, headings } = useTableModel(config, dataSource.config);

  const columnMap = useMemo(
    () => buildColumnMap(config.columns.map((col) => col.name)),
    [config.columns]
  );

  const {
    getRowAtPosition,
    getRowOffset,
    setPctScrollTop,
    ...viewportMeasurements
  } = useTableViewport({
    columns,
    headerHeight,
    headings,
    rowCount,
    rowHeight,
    // Note: innerSize will take border into account, whereas outerSize will not
    size: containerMeasurements.innerSize,
  });

  const initialRange = useInitialValue<VuuRange>({
    from: 0,
    to: viewportMeasurements.rowCount + 1,
  });

  const { data, setRange } = useDataSource({
    dataSource,
    initialRange,
  });

  const handlePersistentColumnOperation = useCallback(
    (action: PersistentColumnAction) => {
      console.log(`handlePersistentColumnOperation ${JSON.stringify(action)}`);
      // expectConfigChangeRef.current = true;
      // dispatchColumnAction(action);
    },
    []
  );

  const handleContextMenuAction = useTableContextMenu({
    dataSource,
    onPersistentColumnOperation: handlePersistentColumnOperation,
  });

  const { onVerticalScroll } = useVirtualViewport({
    columns,
    getRowAtPosition,
    setRange,
    viewportMeasurements,
  });

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

  // TOSO ship this out into a hook
  const [showContextMenu] = usePopupContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      // const { current: currentData } = dataRef;
      // const { current: currentDataSource } = dataSourceRef;
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest("div[role='cell']");
      const rowEl = target?.closest("div[role='row']");
      console.log("onContextMenu", {
        cellEl,
        rowEl,
      });
      if (cellEl && rowEl /*&& currentData && currentDataSource*/) {
        //   const { columns, selectedRowsCount } = currentDataSource;
        const columnMap = buildColumnMap(columns);
        // const rowIndex = parseInt(rowEl.ariaRowIndex ?? "-1");
        const cellIndex = Array.from(rowEl.childNodes).indexOf(cellEl);
        //   const row = currentData.find(([idx]) => idx === rowIndex);
        const columnName = columns[cellIndex];
        showContextMenu(evt, "grid", {
          columnMap,
          columnName,
          // row,
          // selectedRows: selectedRowsCount === 0 ? NO_ROWS : getSelectedRows(),
          // viewport: dataSource?.viewport,
        });
      }
    },
    [columns, showContextMenu]
  );

  return {
    columnMap,
    columns,
    containerMeasurements,
    data,
    handleContextMenuAction,
    menuBuilder,
    onContextMenu,
    scrollProps,
    viewportMeasurements,
  };
};
