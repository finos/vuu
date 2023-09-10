import {
  DataSource,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import {
  GridConfig,
  KeyedColumnDescriptor,
  SelectionChangeHandler,
  TableConfig,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import {
  SetPropsAction,
  useLayoutEffectSkipFirst,
  useLayoutProviderDispatch,
} from "@finos/vuu-layout";
import { useContextMenu as usePopupContextMenu } from "@finos/vuu-popups";
import { VuuRange, VuuSortType } from "@finos/vuu-protocol-types";
import {
  applySort,
  buildColumnMap,
  isValidNumber,
  updateColumn,
  visibleColumnAtIndex,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback, useMemo, useState } from "react";
import {
  MeasuredProps,
  useMeasuredContainer,
  useSelection,
  useTableViewport,
} from "../table";
import { buildContextMenuDescriptors, useTableContextMenu } from "../table";
import { TableColumnResizeHandler } from "./column-resizing";
import { updateTableConfig } from "./table-config";
import { useDataSource } from "./useDataSource";
import { useInitialValue } from "./useInitialValue";
import {
  isShowColumnSettings,
  isShowTableSettings,
  PersistentColumnAction,
  useTableModel,
} from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useVirtualViewport } from "./useVirtualViewport";

export interface TableHookProps extends MeasuredProps {
  config: Omit<GridConfig, "headings">;
  dataSource: DataSource;
  headerHeight: number;
  onConfigChange?: (config: TableConfig) => void;
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
  const dispatchLayoutAction = useLayoutProviderDispatch();
  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const menuBuilder = useMemo(
    () => buildContextMenuDescriptors(dataSource),
    [dataSource]
  );

  const { containerRef, ...containerMeasurements } =
    useMeasuredContainer(measuredProps);

  const {
    columns: modelColumns,
    dispatchColumnAction,
    headings,
  } = useTableModel(config, dataSource.config);

  useLayoutEffectSkipFirst(() => {
    dispatchColumnAction({
      type: "init",
      dataSourceConfig: dataSource.config,
      tableConfig: config,
    });
  }, [config, dataSource.config, dispatchColumnAction]);

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
    // size: containerMeasurements.innerSize ?? containerMeasurements.outerSize,
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
      if (isShowColumnSettings(action)) {
        dispatchLayoutAction({
          type: "set-props",
          path: "#context-panel",
          props: {
            expanded: true,
            context: "column-settings",
            column: action.column,
            title: "Column Settings",
          },
        } as SetPropsAction);
      } else if (isShowTableSettings(action)) {
        dispatchLayoutAction({
          type: "set-props",
          path: "#context-panel",
          props: {
            expanded: true,
            content: {
              type: "TableSettings",
              props: {
                // TODO get this from dataSource
                availableColumns: config.columns.map(
                  ({ name, serverDataType }) => ({ name, serverDataType })
                ),
                onConfigChange,
                tableConfig: config,
              },
            },
            title: "DataGrid Settings",
          },
        } as SetPropsAction);
      } else {
        // expectConfigChangeRef.current = true;
        dispatchColumnAction(action);
      }
    },
    [config, dispatchColumnAction, dispatchLayoutAction, onConfigChange]
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
    (scrollTop: number) => {
      onVerticalScroll(scrollTop);
    },
    [onVerticalScroll]
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
      const headerCell = targetElement.closest(
        ".TableNext-col-header"
      ) as HTMLElement;
      const colIdx = parseInt(headerCell?.dataset.idx ?? "-1");
      const column = visibleColumnAtIndex(columns, colIdx);
      const isAdditive = evt.shiftKey;
      column && handleSort(column, isAdditive);
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

  const onHeaderResize: TableColumnResizeHandler = useCallback(
    (phase, columnName, width) => {
      const column = columns.find((column) => column.name === columnName);
      if (column) {
        if (phase === "resize") {
          if (isValidNumber(width)) {
            setColumnSize(columnName, width);
          }
        } else if (phase === "end") {
          if (isValidNumber(width)) {
            onConfigChange?.(
              updateTableConfig(config, {
                type: "col-size",
                column,
                width,
              })
            );
          }
        } else {
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
    [columns, config, dispatchColumnAction, onConfigChange, setColumnSize]
  );

  return {
    columnMap,
    columns,
    containerRef,
    containerMeasurements,
    data,
    handleContextMenuAction,
    menuBuilder,
    onContextMenu,
    onHeaderClick,
    onHeaderResize,
    onRowClick,
    scrollProps,
    viewportMeasurements,
  };
};
