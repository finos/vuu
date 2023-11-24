import {
  DataSourceConfig,
  DataSourceSubscribedMessage,
  JsonDataSource,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import {
  ColumnDescriptor,
  DataCellEditHandler,
  KeyedColumnDescriptor,
  RowClickHandler,
  SelectionChangeHandler,
  TableConfig,
  TableSelectionModel,
} from "@finos/vuu-datagrid-types";
import { MeasuredSize, useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import { VuuRange, VuuSortType } from "@finos/vuu-protocol-types";
import { useTableAndColumnSettings } from "@finos/vuu-table-extras";
import {
  DragStartHandler,
  useDragDropNext as useDragDrop,
} from "@finos/vuu-ui-controls";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import {
  applySort,
  buildColumnMap,
  isGroupColumn,
  isJsonGroup,
  isValidNumber,
  metadataKeys,
  moveColumnTo,
  updateColumn,
  visibleColumnAtIndex,
} from "@finos/vuu-utils";
import {
  FocusEvent,
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  buildContextMenuDescriptors,
  ColumnActionHide,
  ColumnActionPin,
  MeasuredProps,
  TableProps,
} from "../table";
import { TableColumnResizeHandler } from "./column-resizing";
import { updateTableConfig } from "./table-config";
import { useDataSource } from "./useDataSource";
import { useInitialValue } from "./useInitialValue";
import { useSelection } from "./useSelection";
import { useTableContextMenu } from "./useTableContextMenu";
import { useHandleTableContextMenu } from "./context-menu";
import { useCellEditing } from "./useCellEditing";
import {
  isShowColumnSettings,
  isShowTableSettings,
  PersistentColumnAction,
  useTableModel,
} from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useVirtualViewport } from "./useVirtualViewport";
import { useTableViewport } from "./useTableViewport";

export interface TableHookProps
  extends MeasuredProps,
    Pick<
      TableProps,
      | "allowDragDrop"
      | "availableColumns"
      | "config"
      | "dataSource"
      | "disableFocus"
      | "highlightedIndex"
      | "id"
      | "navigationStyle"
      | "onAvailableColumnsChange"
      | "onConfigChange"
      | "onDragStart"
      | "onDrop"
      | "onFeatureInvocation"
      | "onHighlight"
      | "onSelect"
      | "onSelectionChange"
      | "onRowClick"
      | "renderBufferSize"
    > {
  containerRef: RefObject<HTMLDivElement>;
  headerHeight: number;
  rowHeight: number;
  selectionModel: TableSelectionModel;
}

const { KEY, IS_EXPANDED, IS_LEAF } = metadataKeys;

const NULL_DRAG_DROP = {
  draggable: undefined,
  onMouseDown: undefined,
};
const useNullDragDrop = () => NULL_DRAG_DROP;

const addColumn = (
  tableConfig: TableConfig,
  column: ColumnDescriptor
): TableConfig => ({
  ...tableConfig,
  columns: tableConfig.columns.concat(column),
});

export const useTable = ({
  allowDragDrop = false,
  availableColumns,
  config,
  containerRef,
  dataSource,
  disableFocus,
  headerHeight = 25,
  highlightedIndex: highlightedIndexProp,
  id,
  navigationStyle = "cell",
  onAvailableColumnsChange,
  onConfigChange,
  onDragStart,
  onDrop,
  onFeatureInvocation,
  onHighlight,
  onRowClick: onRowClickProp,
  onSelect,
  onSelectionChange,
  renderBufferSize = 0,
  rowHeight = 20,
  selectionModel,
}: TableHookProps) => {
  const [rowCount, setRowCount] = useState<number>(dataSource.size);
  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }
  // // We track changes to tableConfig. When detected, these trigger an init
  // // of model. We will need dataSource for that, but don't want to trigger
  // // that logic when dataSource itself changes.
  // dataSourceRef.current = dataSource;

  const useRowDragDrop = allowDragDrop ? useDragDrop : useNullDragDrop;

  const [size, setSize] = useState<MeasuredSize | undefined>();
  const handleResize = useCallback((size: MeasuredSize) => {
    setSize(size);
  }, []);

  const menuBuilder = useMemo(
    () => buildContextMenuDescriptors(dataSource),
    [dataSource]
  );

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const {
    columns: modelColumns,
    dispatchColumnAction,
    headings,
    tableAttributes,
    tableConfig,
  } = useTableModel(config, dataSource);

  useLayoutEffectSkipFirst(() => {
    dispatchColumnAction({
      type: "init",
      dataSource,
      tableConfig,
    });
  }, [tableConfig, dataSource, dispatchColumnAction]);

  const applyTableConfigChange = useCallback(
    (config: TableConfig) => {
      dispatchColumnAction({
        type: "init",
        tableConfig: config,
        dataSource,
      });
      onConfigChange?.(config);
    },
    [dataSource, dispatchColumnAction, onConfigChange]
  );

  /**
   * These stateColumns are required only for the duration of a column resize operation
   */
  const [stateColumns, setStateColumns] = useState<KeyedColumnDescriptor[]>();
  const [columns, setColumnSize] = useMemo(() => {
    const setSize = (columnName: string, width: number) => {
      const cols = updateColumn(modelColumns, columnName, { width });
      setStateColumns(cols);
    };
    return [stateColumns ?? modelColumns, setSize];
  }, [modelColumns, stateColumns]);

  const columnMap = useMemo(
    () => buildColumnMap(dataSource.columns),
    [dataSource.columns]
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
    size,
  });

  const initialRange = useInitialValue<VuuRange>({
    from: 0,
    to: viewportMeasurements.rowCount,
  });

  const onSubscribed = useCallback(
    ({ tableSchema }: DataSourceSubscribedMessage) => {
      if (tableSchema) {
        dispatchColumnAction({
          type: "setTableSchema",
          tableSchema,
        });
      } else {
        console.log("subscription message with no schema");
      }
    },
    [dispatchColumnAction]
  );

  const { data, dataRef, getSelectedRows, range, setRange } = useDataSource({
    dataSource,
    onFeatureInvocation,
    renderBufferSize,
    onSizeChange: onDataRowcountChange,
    onSubscribed,
    range: initialRange,
  });

  const handleConfigChanged = useCallback(
    (tableConfig: TableConfig) => {
      // console.log(
      //   `useTableNext handleConfigChanged`,
      //   JSON.stringify(tableConfig, null, 2)
      // );

      dispatchColumnAction({
        type: "init",
        tableConfig,
        dataSource,
      });
      onConfigChange?.(tableConfig);
    },
    [dataSource, dispatchColumnAction, onConfigChange]
  );

  const handleDataSourceConfigChanged = useCallback(
    (dataSourceConfig: DataSourceConfig) => {
      dataSource.config = {
        ...dataSource.config,
        ...dataSourceConfig,
      };
    },
    [dataSource]
  );

  useEffect(() => {
    dataSource.on("config", (config, confirmed) => {
      dispatchColumnAction({
        type: "tableConfig",
        ...config,
        confirmed,
      });
    });
  }, [dataSource, dispatchColumnAction]);

  const handleCreateCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      dataSource.columns = dataSource.columns.concat(column.name);
      applyTableConfigChange(addColumn(tableConfig, column));
    },
    [dataSource, tableConfig, applyTableConfigChange]
  );

  const hideColumns = useCallback(
    (action: ColumnActionHide) => {
      const { columns } = action;
      const hiddenColumns = columns.map((c) => c.name);
      const newTableConfig = {
        ...tableConfig,
        columns: tableConfig.columns.map((col) =>
          hiddenColumns.includes(col.name) ? { ...col, hidden: true } : col
        ),
      };
      applyTableConfigChange(newTableConfig);
    },
    [tableConfig, applyTableConfigChange]
  );

  const pinColumn = useCallback(
    (action: ColumnActionPin) => {
      applyTableConfigChange({
        ...tableConfig,
        columns: updateColumn(tableConfig.columns, {
          ...action.column,
          pin: action.pin,
        }),
      });
    },
    [tableConfig, applyTableConfigChange]
  );

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
        switch (action.type) {
          case "hideColumns":
            return hideColumns(action);
          case "pinColumn":
            return pinColumn(action);
          default:
            dispatchColumnAction(action);
        }
      }
    },
    [
      dispatchColumnAction,
      hideColumns,
      pinColumn,
      showColumnSettingsPanel,
      showTableSettingsPanel,
    ]
  );

  const handleContextMenuAction = useHandleTableContextMenu({
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
            setStateColumns(undefined);
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
    maxScrollLeft: viewportMeasurements.maxScrollContainerScrollHorizontal,
    maxScrollTop: viewportMeasurements.maxScrollContainerScrollVertical,
    rowHeight,
    onVerticalScroll: handleVerticalScroll,
    viewportRowCount: viewportMeasurements.rowCount,
  });

  const {
    highlightedIndexRef,
    navigate,
    onFocus: navigationFocus,
    onKeyDown: navigationKeyDown,
    ...containerProps
  } = useKeyboardNavigation({
    columnCount: columns.filter((c) => c.hidden !== true).length,
    containerRef,
    disableFocus,
    highlightedIndex: highlightedIndexProp,
    navigationStyle,
    requestScroll,
    rowCount: dataSource?.size,
    onHighlight,
    viewportRange: range,
    viewportRowCount: viewportMeasurements.rowCount,
  });

  const {
    onBlur: editingBlur,
    onKeyDown: editingKeyDown,
    onFocus: editingFocus,
  } = useCellEditing({
    navigate,
  });

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      navigationFocus();
      if (!e.defaultPrevented) {
        editingFocus(e);
      }
    },
    [editingFocus, navigationFocus]
  );

  const onContextMenu = useTableContextMenu({
    columns,
    data,
    dataSource,
    getSelectedRows,
  });

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

  const {
    onKeyDown: selectionHookKeyDown,
    onRowClick: selectionHookOnRowClick,
  } = useSelection({
    highlightedIndexRef,
    onSelect,
    onSelectionChange: handleSelectionChange,
    selectionModel,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      navigationKeyDown(e);
      if (!e.defaultPrevented) {
        editingKeyDown(e);
      }
      if (!e.defaultPrevented) {
        selectionHookKeyDown(e);
      }
    },
    [navigationKeyDown, editingKeyDown, selectionHookKeyDown]
  );

  const handleRowClick = useCallback<RowClickHandler>(
    (row, rangeSelect, keepExistingSelection) => {
      selectionHookOnRowClick(row, rangeSelect, keepExistingSelection);
      onRowClickProp?.(row);
    },
    [onRowClickProp, selectionHookOnRowClick]
  );

  useLayoutEffectSkipFirst(() => {
    dispatchColumnAction({
      type: "init",
      tableConfig: config,
      dataSource,
    });
  }, [config, dataSource, dispatchColumnAction]);

  useEffect(() => {
    dataSource.on("config", (config, confirmed) => {
      dispatchColumnAction({
        type: "tableConfig",
        ...config,
        confirmed,
      });
    });
  }, [dataSource, dispatchColumnAction]);

  const handleDropColumnHeader = useCallback(
    (moveFrom: number, moveTo: number) => {
      const column = tableConfig.columns[moveFrom];

      const newTableConfig = {
        ...tableConfig,
        columns: moveColumnTo(tableConfig.columns, column, moveTo),
      };

      dispatchColumnAction({
        type: "init",
        tableConfig: newTableConfig,
        dataSource,
      });
      onConfigChange?.(newTableConfig);
    },
    [dataSource, dispatchColumnAction, onConfigChange, tableConfig]
  );

  const handleDropRow = useCallback(
    (dragDropState) => {
      onDrop?.(dragDropState);
    },
    [onDrop]
  );

  const handleDataEdited = useCallback<DataCellEditHandler>(
    async (row, columnName, value) =>
      dataSource.applyEdit(row, columnName, value),
    [dataSource]
  );

  // Drag Drop column headers
  const {
    onMouseDown: columnHeaderDragMouseDown,
    draggable: draggableColumn,
    ...dragDropHook
  } = useDragDrop({
    allowDragDrop: true,
    containerRef,
    // this is for useDragDropNext
    draggableClassName: `vuuTableNext`,
    // extendedDropZone: overflowedItems.length > 0,
    onDrop: handleDropColumnHeader,
    orientation: "horizontal",
    itemQuery: ".vuuTableNextHeaderCell",
  });

  const handleDragStartRow = useCallback<DragStartHandler>(
    (dragDropState) => {
      const { initialDragElement } = dragDropState;
      const rowIndex = initialDragElement.ariaRowIndex;
      if (rowIndex) {
        const index = parseInt(rowIndex);
        const row = dataRef.current.find((row) => row[0] === index);
        console.log(`handleDragStartRow setPayload`, {
          row,
        });
        if (row) {
          dragDropState.setPayload(row);
        } else {
          // should we abort the operation ?
        }
      }
      onDragStart?.(dragDropState);
    },
    [dataRef, onDragStart]
  );

  // Drag Drop rowss
  const { onMouseDown: rowDragMouseDown, draggable: draggableRow } =
    useRowDragDrop({
      allowDragDrop,
      containerRef,
      draggableClassName: `vuuTableNext`,
      id,
      onDragStart: handleDragStartRow,
      onDrop: handleDropRow,
      orientation: "vertical",
      itemQuery: ".vuuTableNextRow",
    });

  const headerProps = {
    onClick: onHeaderClick,
    onMouseDown: columnHeaderDragMouseDown,
    onResize: onHeaderResize,
  };

  return {
    ...containerProps,
    draggableColumn,
    draggableRow,
    onBlur: editingBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onMouseDown: rowDragMouseDown,
    columnMap,
    columns,
    data,
    handleContextMenuAction,
    headerProps,
    highlightedIndex: highlightedIndexRef.current,
    menuBuilder,
    onContextMenu,
    onDataEdited: handleDataEdited,
    onRemoveGroupColumn,
    onResize: handleResize,
    onRowClick: handleRowClick,
    onToggleGroup,
    scrollProps,
    tableAttributes,
    viewportMeasurements,
    dragDropHook,
  };
};
