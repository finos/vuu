import {
  DataSourceConfig,
  DataSourceSubscribedMessage,
  JsonDataSource,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  ColumnDescriptor,
  KeyedColumnDescriptor,
  SelectionChangeHandler,
  TableConfig,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import { VuuRange, VuuSortType } from "@finos/vuu-protocol-types";
import { useTableAndColumnSettings } from "@finos/vuu-table-extras";
import { useDragDropNext as useDragDrop } from "@finos/vuu-ui-controls";
import {
  applySort,
  buildColumnMap,
  isGroupColumn,
  isJsonGroup,
  isValidNumber,
  metadataKeys,
  updateColumn,
  visibleColumnAtIndex,
} from "@finos/vuu-utils";
import { MouseEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  buildContextMenuDescriptors,
  MeasuredProps,
  TableProps,
  useSelection,
  useTableContextMenu,
  useTableViewport,
} from "../table";
import { TableColumnResizeHandler } from "./column-resizing";
import { updateTableConfig } from "./table-config";
import { useDataSource } from "./useDataSource";
import { useInitialValue } from "./useInitialValue";
import { useMeasuredContainer } from "./useMeasuredContainer";
import { useTableContextMenu as useTableContextMenuNext } from "./useTableContextMenu";
import {
  isShowColumnSettings,
  isShowTableSettings,
  PersistentColumnAction,
  useTableModel,
} from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useVirtualViewport } from "./useVirtualViewport";

export interface TableHookProps
  extends MeasuredProps,
    Pick<
      TableProps,
      | "availableColumns"
      | "config"
      | "dataSource"
      | "onAvailableColumnsChange"
      | "onConfigChange"
      | "onFeatureEnabled"
      | "onFeatureInvocation"
      | "onSelectionChange"
      | "renderBufferSize"
    > {
  headerHeight: number;
  rowHeight: number;
  selectionModel: TableSelectionModel;
}

const { KEY, IS_EXPANDED, IS_LEAF } = metadataKeys;

const addColumn = (
  tableConfig: TableConfig,
  column: ColumnDescriptor
): TableConfig => ({
  ...tableConfig,
  columns: tableConfig.columns.concat(column),
});

export const useTable = ({
  availableColumns,
  config,
  dataSource,
  headerHeight = 25,
  onAvailableColumnsChange,
  onConfigChange,
  onFeatureEnabled,
  onFeatureInvocation,
  onSelectionChange,
  renderBufferSize = 0,
  rowHeight = 20,
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
    tableAttributes,
    tableConfig,
  } = useTableModel(config, dataSource.config);

  useLayoutEffectSkipFirst(() => {
    dispatchColumnAction({
      type: "init",
      dataSourceConfig: dataSource.config,
      tableConfig,
    });
  }, [tableConfig, dataSource.config, dispatchColumnAction]);

  const [stateColumns, setStateColumns] = useState<KeyedColumnDescriptor[]>();
  const [columns, setColumnSize] = useMemo(() => {
    const setSize = (columnName: string, width: number) => {
      const cols = updateColumn(modelColumns, columnName, { width });
      setStateColumns(cols);
    };
    return [stateColumns ?? modelColumns, setSize];
  }, [modelColumns, stateColumns]);

  const columnMap = useMemo(
    () => buildColumnMap(tableConfig.columns.map((col) => col.name)),
    [tableConfig.columns]
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
    to: viewportMeasurements.rowCount,
  });

  const onSubscribed = useCallback(
    ({ tableSchema }: DataSourceSubscribedMessage) => {
      if (tableSchema) {
        // expectConfigChangeRef.current = true;
        // dispatchColumnAction({
        //   type: "setTableSchema",
        //   tableSchema,
        // });
      } else {
        console.log("usbscription message with no schema");
      }
    },
    []
  );

  const { data, setRange } = useDataSource({
    dataSource,
    onFeatureEnabled,
    onFeatureInvocation,
    renderBufferSize,
    onSizeChange: onDataRowcountChange,
    onSubscribed,
    range: initialRange,
  });

  const handleConfigChanged = useCallback(
    (tableConfig: TableConfig) => {
      console.log(`useTableNext handleConfigChanged`, {
        tableConfig,
      });
      dispatchColumnAction({
        type: "init",
        tableConfig,
        dataSourceConfig: dataSource.config,
      });
      onConfigChange?.(tableConfig);
    },
    [dataSource.config, dispatchColumnAction, onConfigChange]
  );

  const handleDataSourceConfigChanged = useCallback(
    (dataSourceConfig: DataSourceConfig) => {
      console.log("config changed", {
        dataSourceConfig,
      });
      dataSource.config = {
        ...dataSource.config,
        ...dataSourceConfig,
      };
    },
    [dataSource]
  );

  const handleCreateCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      console.log(`useTableNext handleCreateCalculatedColumn`, {
        column,
      });
      dataSource.columns = dataSource.columns.concat(column.name);
      const newTableConfig = addColumn(tableConfig, column);
      dispatchColumnAction({
        type: "init",
        tableConfig: newTableConfig,
        dataSourceConfig: dataSource.config,
      });
      onConfigChange?.(newTableConfig);
    },
    [dataSource, dispatchColumnAction, onConfigChange, tableConfig]
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

  const { showColumnSettingsPanel, showTableSettingsPanel } =
    useTableAndColumnSettings({
      availableColumns:
        availableColumns ??
        tableConfig.columns.map(({ name, serverDataType = "string" }) => ({
          name,
          serverDataType,
        })),
      onAvailableColumnsChange,
      onConfigChange: handleConfigChanged,
      onCreateCalculatedColumn: handleCreateCalculatedColumn,
      onDataSourceConfigChange: handleDataSourceConfigChanged,
      tableConfig,
    });

  const onPersistentColumnOperation = useCallback(
    (action: PersistentColumnAction) => {
      if (isShowColumnSettings(action)) {
        showColumnSettingsPanel(action);
      } else if (isShowTableSettings(action)) {
        showTableSettingsPanel();
      } else {
        // expectConfigChangeRef.current = true;
        dispatchColumnAction(action);
      }
    },
    [dispatchColumnAction, showColumnSettingsPanel, showTableSettingsPanel]
  );

  const handleContextMenuAction = useTableContextMenu({
    dataSource,
    onPersistentColumnOperation,
  });

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
            dispatchColumnAction({
              type: "resizeColumn",
              phase,
              column,
              width,
            });
            onConfigChange?.(
              updateTableConfig(tableConfig, {
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
    [columns, tableConfig, dispatchColumnAction, onConfigChange, setColumnSize]
  );

  const onToggleGroup = useCallback(
    (row: DataSourceRow, column: KeyedColumnDescriptor) => {
      const isJson = isJsonGroup(column, row);
      const key = row[KEY];

      if (row[IS_EXPANDED]) {
        (dataSource as JsonDataSource).closeTreeNode(key, true);
        if (isJson) {
          const idx = columns.indexOf(column);
          const rows = (dataSource as JsonDataSource).getRowsAtDepth(idx + 1);
          if (!rows.some((row) => row[IS_EXPANDED] || row[IS_LEAF])) {
            dispatchColumnAction({
              type: "hideColumns",
              columns: columns.slice(idx + 2),
            });
          }
        }
      } else {
        dataSource.openTreeNode(key);
        if (isJson) {
          const childRows = (dataSource as JsonDataSource).getChildRows(key);
          const idx = columns.indexOf(column) + 1;
          const columnsToShow = [columns[idx]];
          if (childRows.some((row) => row[IS_LEAF])) {
            columnsToShow.push(columns[idx + 1]);
          }
          if (columnsToShow.some((col) => col.hidden)) {
            dispatchColumnAction({
              type: "showColumns",
              columns: columnsToShow,
            });
          }
        }
      }
    },
    [columns, dataSource, dispatchColumnAction]
  );

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

  const onContextMenu = useTableContextMenuNext({ columns, data });

  const onHeaderClick = useCallback(
    (evt: MouseEvent) => {
      const targetElement = evt.target as HTMLElement;
      const headerCell = targetElement.closest(
        ".vuuTableNextHeaderCell"
      ) as HTMLElement;
      const colIdx = parseInt(headerCell?.dataset.index ?? "-1");
      const column = visibleColumnAtIndex(columns, colIdx);
      const isAdditive = evt.shiftKey;
      column && handleSort(column, isAdditive);
    },
    [columns, handleSort]
  );

  const onRemoveGroupColumn = useCallback(
    (column: KeyedColumnDescriptor) => {
      if (isGroupColumn(column)) {
        dataSource.groupBy = [];
      } else {
        if (dataSource && dataSource.groupBy.includes(column.name)) {
          dataSource.groupBy = dataSource.groupBy.filter(
            (columnName) => columnName !== column.name
          );
        }
      }
    },
    [dataSource]
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

  const handleDrop = useCallback(
    (moveFrom: number, moveTo: number) => {
      // onMoveColumn?.(fromIndex, toIndex);
      const column = columns[moveFrom];

      dispatchColumnAction({
        type: "moveColumn",
        column,
        moveTo,
      });
    },
    [columns, dispatchColumnAction]
  );

  const { onMouseDown: dragDropHookHandleMouseDown, ...dragDropHook } =
    useDragDrop({
      allowDragDrop: true,
      containerRef,
      // this is for useDragDropNext
      draggableClassName: `vuuTableNext`,
      // extendedDropZone: overflowedItems.length > 0,
      onDrop: handleDrop,
      orientation: "horizontal",
      itemQuery: ".vuuTableNextHeaderCell",
    });

  const headerProps = {
    onClick: onHeaderClick,
    onMouseDown: dragDropHookHandleMouseDown,
    onResize: onHeaderResize,
  };

  return {
    columnMap,
    columns,
    containerRef,
    containerMeasurements,
    data,
    handleContextMenuAction,
    headerProps,
    menuBuilder,
    onContextMenu,
    onRemoveGroupColumn,
    onRowClick,
    onToggleGroup,
    scrollProps,
    tableAttributes,
    viewportMeasurements,
    dragDropHook,
  };
};
