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
import {
  MeasuredProps,
  useMeasuredContainer,
  useTableContextMenu,
  useTableModel,
  useTableViewport,
} from "@finos/vuu-table";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";
import {
  applySort,
  buildColumnMap,
  visibleColumnAtIndex,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useDataSource } from "./useDataSource";
import { useTableScroll } from "./useTableScroll";
import { VuuRange, VuuSortType } from "@finos/vuu-protocol-types";
import { PersistentColumnAction } from "@finos/vuu-table/src/useTableModel";
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
  renderBufferSize = 0,
  rowHeight,
  selectionModel,
  ...measuredProps
}: TableHookProps) => {
  const [rowCount, setRowCount] = useState<number>(dataSource.size);

  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const menuBuilder = useMemo(
    () => buildContextMenuDescriptors(dataSource),
    [dataSource]
  );

  const { containerRef, ...containerMeasurements } =
    useMeasuredContainer(measuredProps);

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const { columns, dispatchColumnAction, headings } = useTableModel(
    config,
    dataSource.config
  );

  const columnMap = useMemo(
    () => buildColumnMap(config.columns.map((col) => col.name)),
    [config.columns]
  );

  useEffect(() => {
    dataSource.on("config", (config, confirmed) => {
      // expectConfigChangeRef.current = true;
      dispatchColumnAction({
        type: "tableConfig",
        ...config,
        confirmed,
      });
    });
  }, [dataSource, dispatchColumnAction]);

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
    size: containerMeasurements.innerSize ?? containerMeasurements.outerSize,
  });

  const initialRange = useInitialValue<VuuRange>({
    from: 0,
    to: viewportMeasurements.rowCount + 1,
  });

  const { data, setRange } = useDataSource({
    dataSource,
    initialRange,
    onSizeChange: onDataRowcountChange,
  });

  useMemo(() => {
    const {
      range: { from, to },
    } = dataSource;
    if (viewportMeasurements.rowCount !== to - 1 - from) {
      dataSource.range = {
        from,
        to: from + viewportMeasurements.rowCount + 1,
      };
    }
  }, [dataSource, viewportMeasurements.rowCount]);

  const onPersistentColumnOperation = useCallback(
    (action: PersistentColumnAction) => {
      // expectConfigChangeRef.current = true;
      dispatchColumnAction(action);
    },
    [dispatchColumnAction]
  );

  const handleContextMenuAction = useTableContextMenu({
    dataSource,
    onPersistentColumnOperation,
  });

  const { onVerticalScroll } = useVirtualViewport({
    columns,
    getRowAtPosition,
    setRange,
    viewportMeasurements,
  });

  const handleVerticalScroll = useCallback(
    (scrollTop: number, pctScrollTop: number) => {
      setPctScrollTop(pctScrollTop);
      onVerticalScroll(scrollTop);
    },
    [onVerticalScroll, setPctScrollTop]
  );

  const { requestScroll, ...scrollProps } = useTableScroll({
    // contentHeight: viewportMeasurements.contentHeight,
    // contentWidth: viewportMeasurements.contentWidth,
    // height: containerMeasurements.innerSize?.height ?? 0,
    // width: containerMeasurements.innerSize?.width ?? 0,

    maxScrollLeft: viewportMeasurements.maxScrollContainerScrollHorizontal,
    maxScrollTop: viewportMeasurements.maxScrollContainerScrollVertical,
    onVerticalScroll: handleVerticalScroll,
  });

  // TOSO ship this out into a hook
  const showContextMenu = usePopupContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      // const { current: currentData } = dataRef;
      // const { current: currentDataSource } = dataSourceRef;
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest("div[role='cell']");
      const rowEl = target?.closest("div[role='row']");
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

  const handleSort = useCallback(
    (
      column: KeyedColumnDescriptor,
      extendSort = false,
      sortType?: VuuSortType
    ) => {
      if (dataSource) {
        dataSource.sort = applySort(
          dataSource.sort,
          column,
          extendSort,
          sortType
        );
      }
    },
    [dataSource]
  );

  const onHeaderClick = useCallback(
    (evt: MouseEvent) => {
      const targetElement = evt.target as HTMLElement;
      if (targetElement.matches(".vuuTable2-col-group-header-close")) {
        const {
          dataset: { columnName },
        } = targetElement;
        console.log(`close column group ${columnName}`);
      } else {
        const headerCell = targetElement.closest(
          ".vuuTable2-col-header"
        ) as HTMLElement;
        const colIdx = parseInt(headerCell?.dataset.idx ?? "-1");
        const column = visibleColumnAtIndex(columns, colIdx);
        const isAdditive = evt.shiftKey;
        column && handleSort(column, isAdditive);
      }
    },
    [columns, handleSort]
  );

  return {
    columnMap,
    columns,
    containerRef,
    containerMeasurements,
    data,
    getRowOffset,
    handleContextMenuAction,
    menuBuilder,
    onContextMenu,
    onHeaderClick,
    scrollProps,
    viewportMeasurements,
  };
};
