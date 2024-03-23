import {
  DataSourceConfig,
  DataSourceRow,
  DataSourceSubscribedMessage,
  SelectionChangeHandler,
} from "@finos/vuu-data-types";
import {
  ColumnDescriptor,
  DataCellEditHandler,
  TableRowClickHandlerInternal,
  RuntimeColumnDescriptor,
  TableColumnResizeHandler,
  TableConfig,
  TableSelectionModel,
  TableRowSelectHandlerInternal,
} from "@finos/vuu-table-types";
import { VuuRange, VuuSortType } from "@finos/vuu-protocol-types";
import {
  DragStartHandler,
  MeasuredProps,
  MeasuredSize,
  useDragDrop,
} from "@finos/vuu-ui-controls";
import {
  toggleOrApplySort,
  asDataSourceRowObject,
  buildColumnMap,
  getIndexFromRowElement,
  isGroupColumn,
  isJsonGroup,
  isValidNumber,
  metadataKeys,
  updateColumn,
  useLayoutEffectSkipFirst,
} from "@finos/vuu-utils";
import {
  FocusEvent,
  KeyboardEvent,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  buildContextMenuDescriptors,
  useHandleTableContextMenu,
} from "./context-menu";
import { TableProps } from "./Table";
import { updateTableConfig } from "./table-config";
import { useCellEditing } from "./useCellEditing";
import { useDataSource } from "./useDataSource";
import { useInitialValue } from "./useInitialValue";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { useSelection } from "./useSelection";
import { useTableContextMenu } from "./useTableContextMenu";
import {
  ColumnActionHide,
  ColumnActionPin,
  isShowColumnSettings,
  isShowTableSettings,
  PersistentColumnAction,
  useTableModel,
} from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useTableViewport } from "./useTableViewport";
import { useTableAndColumnSettings } from "./useTableAndColumnSettings";
import { useRowClassNameGenerators } from "./useRowClassNameGenerators";

const stripInternalProperties = (tableConfig: TableConfig): TableConfig => {
  return tableConfig;
};

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
      | "scrollingApiRef"
    > {
  containerRef: RefObject<HTMLDivElement>;
  headerHeight: number;
  rowHeight: number;
  selectionModel: TableSelectionModel;
  size: MeasuredSize;
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
  scrollingApiRef,
  selectionModel,
  size,
}: TableHookProps) => {
  const [rowCount, setRowCount] = useState<number>(dataSource.size);
  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const rowClassNameGenerator = useRowClassNameGenerators(config);

  const useRowDragDrop = allowDragDrop ? useDragDrop : useNullDragDrop;

  const menuBuilder = useMemo(
    () => buildContextMenuDescriptors(dataSource),
    [dataSource]
  );

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const {
    columns,
    dispatchTableModelAction,
    headings,
    tableAttributes,
    tableConfig,
  } = useTableModel(config, dataSource);

  useLayoutEffectSkipFirst(() => {
    dispatchTableModelAction({
      type: "init",
      tableConfig: config,
      dataSource,
    });
  }, [config, dataSource, dispatchTableModelAction]);

  const applyTableConfigChange = useCallback(
    (config: TableConfig) => {
      dispatchTableModelAction({
        type: "init",
        tableConfig: config,
        dataSource,
      });
      onConfigChange?.(stripInternalProperties(config));
    },
    [dataSource, dispatchTableModelAction, onConfigChange]
  );

  const columnMap = useMemo(
    () => buildColumnMap(dataSource.columns),
    [dataSource.columns]
  );

  const onSubscribed = useCallback(
    ({ tableSchema }: DataSourceSubscribedMessage) => {
      if (tableSchema) {
        dispatchTableModelAction({
          type: "setTableSchema",
          tableSchema,
        });
      } else {
        console.log("subscription message with no schema");
      }
    },
    [dispatchTableModelAction]
  );

  const {
    getRowAtPosition,
    getRowOffset,
    setInSituRowOffset: viewportHookSetInSituRowOffset,
    setScrollTop: viewportHookSetScrollTop,
    ...viewportMeasurements
  } = useTableViewport({
    columns,
    headerHeight,
    headings,
    rowCount,
    rowHeight,
    size: size,
  });

  const initialRange = useInitialValue<VuuRange>({
    from: 0,
    to: viewportMeasurements.rowCount,
  });

  const { data, dataRef, getSelectedRows, range, setRange } = useDataSource({
    dataSource,
    // We need to factor this out of Table
    onFeatureInvocation,
    renderBufferSize,
    onSizeChange: onDataRowcountChange,
    onSubscribed,
    range: initialRange,
  });

  const { requestScroll, ...scrollProps } = useTableScroll({
    columns,
    getRowAtPosition,
    rowHeight,
    scrollingApiRef,
    setRange,
    onVerticalScroll: viewportHookSetScrollTop,
    onVerticalScrollInSitu: viewportHookSetInSituRowOffset,
    viewportMeasurements,
  });

  // TODO does this belong here ?
  const handleConfigEditedInSettingsPanel = useCallback(
    (tableConfig: TableConfig) => {
      dispatchTableModelAction({
        type: "init",
        tableConfig,
        dataSource,
      });
      onConfigChange?.(stripInternalProperties(tableConfig));
    },
    [dataSource, dispatchTableModelAction, onConfigChange]
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
    dataSource.on("config", (config, confirmed, changes) => {
      const scrollSensitiveChanges =
        changes?.filterChanged || changes?.groupByChanged;
      if (scrollSensitiveChanges && dataSource.range.from > 0) {
        requestScroll({
          type: "scroll-end",
          direction: "home",
        });
      }
      dispatchTableModelAction({
        type: "tableConfig",
        ...config,
        confirmed,
      });
    });
  }, [dataSource, dispatchTableModelAction, requestScroll]);

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
      onConfigChange: handleConfigEditedInSettingsPanel,
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
            dispatchTableModelAction(action);
        }
      }
    },
    [
      dispatchTableModelAction,
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
    (column: ColumnDescriptor, extendSort = false, sortType?: VuuSortType) => {
      if (dataSource) {
        dataSource.sort = toggleOrApplySort(
          dataSource.sort,
          column,
          extendSort,
          sortType
        );
      }
    },
    [dataSource]
  );

  const resizeCells = useRef<HTMLElement[] | undefined>();

  const onResizeColumn: TableColumnResizeHandler = useCallback(
    (phase, columnName, width) => {
      const column = columns.find((column) => column.name === columnName);
      if (column) {
        if (phase === "resize") {
          resizeCells.current?.forEach((cell) => {
            cell.style.width = `${width}px`;
          });
        } else if (phase === "end") {
          resizeCells.current = undefined;
          if (isValidNumber(width)) {
            dispatchTableModelAction({
              type: "resizeColumn",
              phase,
              column,
              width,
            });
            onConfigChange?.(
              stripInternalProperties(
                updateTableConfig(tableConfig, {
                  type: "col-size",
                  column,
                  width,
                })
              )
            );
          }
        } else {
          const byColIndex = `[aria-colindex='${column.index}']`;
          resizeCells.current = Array.from(
            containerRef.current?.querySelectorAll(
              `.vuuTableCell${byColIndex},.vuuTableHeaderCell${byColIndex}`
            ) ?? []
          );
          dispatchTableModelAction({
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
    [
      columns,
      dispatchTableModelAction,
      onConfigChange,
      tableConfig,
      containerRef,
    ]
  );

  const onToggleGroup = useCallback(
    (row: DataSourceRow, column: RuntimeColumnDescriptor) => {
      const isJson = isJsonGroup(column, row, columnMap);
      const key = row[KEY];

      if (row[IS_EXPANDED]) {
        dataSource.closeTreeNode(key, true);
        if (isJson) {
          const idx = columns.indexOf(column);
          const rows = dataSource.getRowsAtDepth?.(idx + 1);
          if (rows && !rows.some((row) => row[IS_EXPANDED] || row[IS_LEAF])) {
            dispatchTableModelAction({
              type: "hideColumns",
              columns: columns.slice(idx + 2),
            });
          }
        }
      } else {
        dataSource.openTreeNode(key);
        if (isJson) {
          const childRows = dataSource.getChildRows?.(key);
          const idx = columns.indexOf(column) + 1;
          const columnsToShow = [columns[idx]];
          if (childRows && childRows.some((row) => row[IS_LEAF])) {
            columnsToShow.push(columns[idx + 1]);
          }
          if (columnsToShow.some((col) => col.hidden)) {
            dispatchTableModelAction({
              type: "showColumns",
              columns: columnsToShow,
            });
          }
        }
      }
    },
    [columnMap, columns, dataSource, dispatchTableModelAction]
  );

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
    onDoubleClick: editingDoubleClick,
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

  const onMoveGroupColumn = useCallback(
    (columns: ColumnDescriptor[]) => {
      dataSource.groupBy = columns.map((col) => col.name);
    },
    [dataSource]
  );

  const onRemoveGroupColumn = useCallback(
    (column: RuntimeColumnDescriptor) => {
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

  const handleSelect = useCallback<TableRowSelectHandlerInternal>(
    (row) => {
      if (onSelect) {
        onSelect(row === null ? null : asDataSourceRowObject(row, columnMap));
      }
    },
    [columnMap, onSelect]
  );

  const {
    onKeyDown: selectionHookKeyDown,
    onRowClick: selectionHookOnRowClick,
  } = useSelection({
    highlightedIndexRef,
    onSelect: handleSelect,
    onSelectionChange: handleSelectionChange,
    selectionModel,
  });

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (evt, row, rangeSelect, keepExistingSelection) => {
      selectionHookOnRowClick(evt, row, rangeSelect, keepExistingSelection);
      onRowClickProp?.(evt, asDataSourceRowObject(row, columnMap));
    },
    [columnMap, onRowClickProp, selectionHookOnRowClick]
  );

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

  const onMoveColumn = useCallback(
    (columns: ColumnDescriptor[]) => {
      const newTableConfig = {
        ...tableConfig,
        columns,
      };

      dispatchTableModelAction({
        type: "init",
        tableConfig: newTableConfig,
        dataSource,
      });
      onConfigChange?.(stripInternalProperties(newTableConfig));
    },
    [dataSource, dispatchTableModelAction, onConfigChange, tableConfig]
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

  const handleDragStartRow = useCallback<DragStartHandler>(
    (dragDropState) => {
      const { initialDragElement } = dragDropState;
      const rowIndex = getIndexFromRowElement(initialDragElement);
      const row = dataRef.current.find((row) => row[0] === rowIndex);
      if (row) {
        dragDropState.setPayload(row);
      } else {
        // should we abort the operation ?
      }
      onDragStart?.(dragDropState);
    },
    [dataRef, onDragStart]
  );

  // Drag Drop rows
  const { onMouseDown: rowDragMouseDown, draggable: draggableRow } =
    useRowDragDrop({
      allowDragDrop,
      containerRef,
      draggableClassName: `vuuTable`,
      id,
      onDragStart: handleDragStartRow,
      onDrop: handleDropRow,
      orientation: "vertical",
      itemQuery: ".vuuTableRow",
    });

  return {
    ...containerProps,
    "aria-rowcount": dataSource.size,
    rowClassNameGenerator,
    draggableRow,
    onBlur: editingBlur,
    onDoubleClick: editingDoubleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onMouseDown: rowDragMouseDown,
    columnMap,
    columns,
    data,
    getRowOffset,
    handleContextMenuAction,
    headings,
    highlightedIndex: highlightedIndexRef.current,
    menuBuilder,
    onContextMenu,
    onDataEdited: handleDataEdited,
    onMoveColumn,
    onMoveGroupColumn,
    onRemoveGroupColumn,
    onRowClick: handleRowClick,
    onSortColumn: handleSort,
    onResizeColumn,
    onToggleGroup,
    scrollProps,
    // TODO don't think we need these ...
    tableAttributes,
    tableConfig,
    viewportMeasurements,
  };
};
