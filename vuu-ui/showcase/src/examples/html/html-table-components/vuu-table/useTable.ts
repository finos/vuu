import {
  DataSource,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  GridConfig,
  KeyedColumnDescriptor,
  SelectionChangeHandler,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";
import { VuuRange, VuuSortType } from "@finos/vuu-protocol-types";
import {
  buildContextMenuDescriptors,
  MeasuredProps,
  TableColumnResizeHandler,
  useMeasuredContainer,
  useSelection,
  useTableContextMenu,
  useTableModel,
  useTableViewport,
} from "@finos/vuu-table";
import {
  isShowColumnSettings,
  isShowTableSettings,
  PersistentColumnAction,
} from "@finos/vuu-table/src/table/useTableModel";
import {
  applySort,
  buildColumnMap,
  isValidNumber,
  metadataKeys,
  updateColumn,
  visibleColumnAtIndex,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useDataSource } from "./useDataSource";
import { useInitialValue } from "./useInitialValue";
import { useTableScroll } from "./useTableScroll";
import { useVirtualViewport } from "./useVirtualViewport";

const { KEY, IS_EXPANDED } = metadataKeys;

export interface TableHookProps extends MeasuredProps {
  config: Omit<GridConfig, "headings">;
  dataSource: DataSource;
  headerHeight: number;
  onConfigChange?: (config: Omit<GridConfig, "headings">) => void;
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  onSelectionChange?: SelectionChangeHandler;
  renderBufferSize?: number;
  rowHeight: number;
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

  const {
    columns: modelColumns,
    dispatchColumnAction,
    headings,
  } = useTableModel(config, dataSource.config);

  const [stateColumns, setStateColumns] = useState<KeyedColumnDescriptor[]>();
  const [columns, setColumnSize] = useMemo(() => {
    const setSize = (columnName: string, width: number) => {
      const cols = updateColumn(modelColumns, columnName, { width });
      setStateColumns(cols);
    };
    return [stateColumns ?? modelColumns, setSize];
  }, [modelColumns, stateColumns]);

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
    size: containerMeasurements.innerSize,
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
      if (isShowColumnSettings(action)) {
        // onShowConfigEditor?.(action.column);
      } else if (isShowTableSettings(action)) {
        console.log("dispatch table settings");
      } else {
        dispatchColumnAction(action);
      }
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
  const [showContextMenu] = usePopupContextMenu();

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

  const handleSelectionChange: SelectionChangeHandler = useCallback(
    (selected) => {
      dataSource.select(selected);
      onSelectionChange?.(selected);
    },
    [dataSource, onSelectionChange]
  );

  const onRowClick = useSelection({
    onSelectionChange: handleSelectionChange,
    selectionModel,
  });

  const onToggleGroup = useCallback(
    (row: DataSourceRow /*, column: KeyedColumnDescriptor*/) => {
      // const isJson = isJsonGroup(column, row);
      const key = row[KEY];

      if (row[IS_EXPANDED]) {
        dataSource.closeTreeNode(key, true);
        // if (isJson) {
        //   const idx = columns.indexOf(column);
        //   const rows = (dataSource as JsonDataSource).getRowsAtDepth(idx + 1);
        //   if (!rows.some((row) => row[IS_EXPANDED] || row[IS_LEAF])) {
        //     dispatchColumnAction({
        //       type: "hideColumns",
        //       columns: columns.slice(idx + 2),
        //     });
        //   }
        // }
      } else {
        dataSource.openTreeNode(key);
        // if (isJson) {
        //   const childRows = (dataSource as JsonDataSource).getChildRows(key);
        //   const idx = columns.indexOf(column) + 1;
        //   const columnsToShow = [columns[idx]];
        //   if (childRows.some((row) => row[IS_LEAF])) {
        //     columnsToShow.push(columns[idx + 1]);
        //   }
        //   if (columnsToShow.some((col) => col.hidden)) {
        //     dispatchColumnAction({
        //       type: "showColumns",
        //       columns: columnsToShow,
        //     });
        //   }
        // }
      }
    },
    [dataSource]
  );

  const onHeaderResize: TableColumnResizeHandler = useCallback(
    (phase, columnName, width) => {
      const column = columns.find((column) => column.name === columnName);
      if (column) {
        if (phase === "resize") {
          if (isValidNumber(width)) {
            setColumnSize(columnName, width);
          }
        } else {
          if (phase === "end") {
            // onConfigChange?.("col-size", column.name, width);
          }
          setStateColumns(undefined);
          dispatchColumnAction({
            type: "resizeColumn",
            phase,
            column,
            width,
          });
        }
      } else {
        throw Error(
          `useDataTable.handleColumnResize, column ${columnName} not found`
        );
      }
    },
    [columns, dispatchColumnAction, setColumnSize]
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
    onHeaderResize,
    onContextMenu,
    onHeaderClick,
    onRowClick,
    onToggleGroup,
    scrollProps,
    viewportMeasurements,
  };
};
