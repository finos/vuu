import {
  DataSourceConfig,
  DataSourceConfigChangeHandler,
  DataSourceRow,
  DataSourceSubscribedMessage,
  SelectionChangeHandler,
} from "@vuu-ui/vuu-data-types";
import { VuuRowDataItemType, VuuSortType } from "@vuu-ui/vuu-protocol-types";
import {
  ColumnDisplayActionHandler,
  columnSettingsFromColumnMenuPermissions,
  TableSettingsActionHandler,
  tableSettingsFromColumnMenuPermissions,
  useColumnActions,
  useTableAndColumnSettings,
} from "@vuu-ui/vuu-table-extras";
import {
  ColumnDescriptor,
  ColumnMoveHandler,
  DataCellEditEvent,
  RuntimeColumnDescriptor,
  TableColumnResizeHandler,
  TableConfig,
  TableRowClickHandlerInternal,
  TableRowSelectHandlerInternal,
  TableRowSelectionChangeHandlerInternal,
  TableSelectionModel,
} from "@vuu-ui/vuu-table-types";
import {
  DragStartHandler,
  MeasuredProps,
  MeasuredSize,
  useDragDrop,
} from "@vuu-ui/vuu-ui-controls";
import {
  asDataSourceRowObject,
  buildColumnMap,
  isGroupColumn,
  isJsonGroup,
  isValidNumber,
  logUnhandledMessage,
  metadataKeys,
  toggleOrApplySort,
  updateColumn,
  useLayoutEffectSkipFirst,
} from "@vuu-ui/vuu-utils";
import {
  FocusEvent,
  KeyboardEvent,
  MouseEventHandler,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { TableCellBlock } from "./cell-block/cellblock-utils";
import { useCellBlockSelection } from "./cell-block/useCellBlockSelection";
import { CellFocusState } from "./CellFocusState";
import { TableProps } from "./Table";
import { updateTableConfig } from "./table-config";
import { getAriaRowIndex, getHeaderCell } from "./table-dom-utils";
import { useCellEditing } from "./useCellEditing";
import { FocusCell, useCellFocus } from "./useCellFocus";
import { useDataSource } from "./useDataSource";
import {
  GroupToggleHandler,
  useKeyboardNavigation,
} from "./useKeyboardNavigation";
import { useRowClassNameGenerators } from "./useRowClassNameGenerators";
import { useSelection } from "./useSelection";
import { useTableContextMenu } from "./useTableContextMenu";
import {
  ColumnActionHide,
  ColumnActionPin,
  useTableModel,
} from "./useTableModel";
import { ScrollRequestHandler, useTableScroll } from "./useTableScroll";
import { useTableViewport } from "./useTableViewport";

type HeaderState = {
  height: number;
  count: number;
};

const nullHeaderState = {
  height: -1,
  count: -1,
};
const zeroHeaderState = {
  height: 0,
  count: 0,
};

const stripInternalProperties = (tableConfig: TableConfig): TableConfig => {
  return tableConfig;
};

export interface TableHookProps
  extends MeasuredProps,
    Pick<
      TableProps,
      | "allowCellBlockSelection"
      | "allowDragDrop"
      | "availableColumns"
      | "config"
      | "dataSource"
      | "defaultSelectedIndexValues"
      | "defaultSelectedKeyValues"
      | "disableFocus"
      | "highlightedIndex"
      | "id"
      | "navigationStyle"
      | "onAvailableColumnsChange"
      | "onConfigChange"
      | "onDataEdited"
      | "onDragStart"
      | "onDrop"
      | "onHighlight"
      | "onSelect"
      | "onSelectCellBlock"
      | "onSelectionChange"
      | "onRowClick"
      | "renderBufferSize"
      | "revealSelected"
      | "rowToObject"
      | "scrollingApiRef"
      | "selectionBookendWidth"
      | "showColumnHeaderMenus"
      | "showColumnHeaders"
      | "showPaginationControls"
    > {
  containerRef: RefObject<HTMLDivElement | null>;
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
  column: ColumnDescriptor,
): TableConfig => ({
  ...tableConfig,
  columns: tableConfig.columns.concat(column),
});

export const useTable = ({
  allowCellBlockSelection,
  allowDragDrop = false,
  availableColumns,
  config,
  containerRef,
  dataSource,
  defaultSelectedIndexValues,
  defaultSelectedKeyValues,
  disableFocus,
  highlightedIndex: highlightedIndexProp,
  id,
  navigationStyle = "cell",
  onAvailableColumnsChange,
  onConfigChange,
  onDataEdited: onDataEditedProp,
  onDragStart,
  onDrop,
  onHighlight,
  onRowClick: onRowClickProp,
  onSelect,
  onSelectCellBlock,
  onSelectionChange,
  renderBufferSize = 0,
  revealSelected,
  rowHeight = 20,
  rowToObject = asDataSourceRowObject,
  scrollingApiRef,
  selectionBookendWidth = 4,
  selectionModel,
  showColumnHeaderMenus = true,
  showColumnHeaders,
  showPaginationControls,
  size,
}: TableHookProps) => {
  const tableConfigRef = useRef<TableConfig>(config);
  // avoids a hook dependency on requestScroll, important to avoid re-registering config handler
  const requestScrollRef = useRef<ScrollRequestHandler | undefined>(undefined);
  useMemo(() => {
    tableConfigRef.current = config;
  }, [config]);

  // state is mutated, so make every component gets a fresh copy
  const initialState = useMemo(() => new CellFocusState(), []);

  const cellFocusStateRef = useRef<CellFocusState>(initialState);
  // Needed to avoid circular dependency between useTableScroll and useCellFocus
  const focusCellRef = useRef<FocusCell>(undefined);

  const [headerState, setHeaderState] = useState<HeaderState>(
    showColumnHeaders ? nullHeaderState : zeroHeaderState,
  );
  const [rowCount, setRowCount] = useState<number>(dataSource.size);
  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const virtualContentHeight = rowHeight * rowCount;
  const viewportBodyHeight =
    size.height - (headerState.height === -1 ? 0 : headerState.height);
  const verticalScrollbarWidth =
    virtualContentHeight > viewportBodyHeight ? 10 : 0;
  const availableWidth =
    size.width - (verticalScrollbarWidth + 2 * selectionBookendWidth);

  const rowClassNameGenerator = useRowClassNameGenerators(config);

  const useRowDragDrop = allowDragDrop ? useDragDrop : useNullDragDrop;

  const {
    columns,
    dispatchTableModelAction,
    headings,
    tableAttributes,
    tableConfig,
  } = useTableModel({ config, dataSource, selectionModel, availableWidth });

  // this is realy here to capture changes to available Width - typically when we get
  // rowcount so add allowance for vertical scrollbar, reducing available width
  // including dataSource is causing us to do unnecessary work in useTableModel
  // split this into multiple effects
  useLayoutEffectSkipFirst(() => {
    dispatchTableModelAction({
      availableWidth,
      selectionModel,
      type: "init",
      tableConfig: tableConfigRef.current,
      dataSource,
    });
  }, [
    availableWidth,
    config,
    dataSource,
    dispatchTableModelAction,
    selectionModel,
  ]);

  const applyTableConfigChange = useCallback(
    (config: TableConfig) => {
      dispatchTableModelAction({
        availableWidth,
        selectionModel,
        type: "init",
        tableConfig: config,
        dataSource,
      });
      tableConfigRef.current = config;
      onConfigChange?.(stripInternalProperties(config));
    },
    [
      availableWidth,
      dataSource,
      dispatchTableModelAction,
      onConfigChange,
      selectionModel,
    ],
  );

  const columnMap = useMemo(
    () => buildColumnMap(dataSource.columns),
    [dataSource.columns],
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
    [dispatchTableModelAction],
  );

  const {
    getRowAtPosition,
    getRowOffset,
    setInSituRowOffset: viewportHookSetInSituRowOffset,
    setScrollTop: viewportHookSetScrollTop,
    ...viewportMeasurements
  } = useTableViewport({
    columns,
    headerHeight: headerState.height,
    rowCount,
    rowHeight,
    selectionEndSize: selectionBookendWidth,
    size: size,
    showPaginationControls,
  });

  const { data, dataRef, getSelectedRows, range, setRange } = useDataSource({
    dataSource,
    defaultSelectedIndexValues,
    defaultSelectedKeyValues,
    renderBufferSize,
    revealSelected,
    onSizeChange: onDataRowcountChange,
    onSubscribed,
  });

  const { requestScroll, ...scrollProps } = useTableScroll({
    cellFocusStateRef,
    columns,
    focusCell: focusCellRef.current,
    getRowAtPosition,
    rowHeight,
    scrollingApiRef,
    setRange,
    showPaginationControls,
    onVerticalScroll: viewportHookSetScrollTop,
    onVerticalScrollInSitu: viewportHookSetInSituRowOffset,
    viewportMeasurements,
  });
  // avoids a hook dependency on requestScroll, important to avoid re-registering config handler
  requestScrollRef.current = requestScroll;

  // TODO does this belong here ?
  const handleConfigEditedInSettingsPanel = useCallback(
    (tableConfig: TableConfig) => {
      dispatchTableModelAction({
        availableWidth,
        dataSource,
        selectionModel,
        tableConfig,
        type: "init",
      });
      tableConfigRef.current = tableConfig;
      onConfigChange?.(stripInternalProperties(tableConfig));
    },
    [
      availableWidth,
      dataSource,
      dispatchTableModelAction,
      onConfigChange,
      selectionModel,
    ],
  );

  const handleDataSourceConfigChanged = useCallback(
    (dataSourceConfig: DataSourceConfig) => {
      dataSource.config = {
        ...dataSource.config,
        ...dataSourceConfig,
      };
    },
    [dataSource],
  );

  const handleConfigChange = useCallback<DataSourceConfigChangeHandler>(
    (config, range, confirmed, changes) => {
      const scrollSensitiveChanges =
        changes?.filterChanged || changes?.groupByChanged;
      if (scrollSensitiveChanges && range.from > 0) {
        requestScrollRef.current?.({
          type: "scroll-end",
          direction: "home",
        });
      }
      dispatchTableModelAction({
        type: "tableConfig",
        ...config,
        confirmed,
      });
    },
    [dispatchTableModelAction],
  );

  useEffect(() => {
    dataSource.on("config", handleConfigChange);
    return () => {
      dataSource.removeListener("config", handleConfigChange);
    };
  }, [dataSource, dispatchTableModelAction, handleConfigChange]);

  const handleCreateCalculatedColumn = useCallback(
    (column: ColumnDescriptor) => {
      dataSource.columns = dataSource.columns.concat(column.name);
      applyTableConfigChange(addColumn(tableConfig, column));
    },
    [dataSource, tableConfig, applyTableConfigChange],
  );

  const hideColumns = useCallback(
    (action: ColumnActionHide) => {
      const { columns } = action;
      const hiddenColumns = columns.map((c) => c.name);
      const newTableConfig = {
        ...tableConfig,
        columns: tableConfig.columns.map((col) =>
          hiddenColumns.includes(col.name) ? { ...col, hidden: true } : col,
        ),
      };
      applyTableConfigChange(newTableConfig);
    },
    [tableConfig, applyTableConfigChange],
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
    [tableConfig, applyTableConfigChange],
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
      settingsPermissions: {
        allowColumnSettings: columnSettingsFromColumnMenuPermissions(
          showColumnHeaderMenus,
        ),
        allowTableSettings: tableSettingsFromColumnMenuPermissions(
          showColumnHeaderMenus,
        ),
      },
      tableConfig,
    });

  const handleColumnDisplayAction = useCallback<ColumnDisplayActionHandler>(
    (action) => {
      const { type } = action;
      switch (type) {
        case "hideColumn":
          return hideColumns({
            type: "hideColumns",
            columns: [action.column],
          });
        case "pinColumn":
          return pinColumn(action);
        default:
          logUnhandledMessage(type, "[vuu-table] handleColumnDisplayAction");
      }
      // }
    },
    [hideColumns, pinColumn],
  );

  const handleDisplaySettingsAction = useCallback<TableSettingsActionHandler>(
    (action) => {
      if (action.type === "column-settings") {
        showColumnSettingsPanel(action);
      } else {
        showTableSettingsPanel();
      }
    },
    [showColumnSettingsPanel, showTableSettingsPanel],
  );

  const handleColumnAction = useColumnActions({
    dataSource,
    onColumnDisplayAction: handleColumnDisplayAction,
    onDisplaySettingsAction: handleDisplaySettingsAction,
  });

  const handleSort = useCallback(
    (column: ColumnDescriptor, extendSort = false, sortType?: VuuSortType) => {
      if (dataSource) {
        dataSource.sort = toggleOrApplySort(
          dataSource.sort,
          column,
          extendSort,
          sortType,
        );
      }
    },
    [dataSource],
  );

  const resizeCells = useRef<HTMLElement[] | undefined>(undefined);

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
                  columns,
                  width,
                }),
              ),
            );
          }
        } else {
          const byColIndex = `[aria-colindex='${column.ariaColIndex}']`;
          resizeCells.current = Array.from(
            containerRef.current?.querySelectorAll(
              `.vuuTableCell${byColIndex},.vuuTableHeaderCell${byColIndex},.vuuTableGroupHeaderCell${byColIndex}`,
            ) ?? [],
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
          `useDataTable.handleColumnResize, column ${columnName} not found`,
        );
      }
    },
    [
      columns,
      dispatchTableModelAction,
      onConfigChange,
      tableConfig,
      containerRef,
    ],
  );

  const onToggleGroup = useCallback(
    (row: DataSourceRow, column: RuntimeColumnDescriptor) => {
      const isJson = isJsonGroup(column, row, columnMap);
      const key = row[KEY];

      if (row[IS_EXPANDED]) {
        dataSource.closeTreeNode(key, true);
        if (isJson) {
          // TODO could this be instigated by an event emitted by the JsonDataSOurce ? "hide-columns" ?
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
    [columnMap, columns, dataSource, dispatchTableModelAction],
  );

  // TODO combine with aboue
  const handleToggleGroup = useCallback<GroupToggleHandler>(
    (treeNodeOperation, rowIdx) => {
      if (treeNodeOperation === "expand") {
        dataSource.openTreeNode(rowIdx);
      } else {
        dataSource.closeTreeNode(rowIdx);
      }
    },
    [dataSource],
  );

  const {
    focusCell,
    focusCellPlaceholderKeyDown,
    focusCellPlaceholderRef,
    setTableBodyRef: tableBodyRef,
  } = useCellFocus({
    cellFocusStateRef,
    containerRef,
    disableFocus,
    requestScroll,
  });

  focusCellRef.current = focusCell;

  const columnCount = columns.filter((c) => c.hidden !== true).length;

  const {
    highlightedIndexRef,
    navigateCell: navigate,
    onFocus: navigationFocus,
    onKeyDown: navigationKeyDown,
    ...containerProps
  } = useKeyboardNavigation({
    cellFocusStateRef,
    columnCount,
    containerRef,
    disableFocus,
    focusCell,
    headerCount: headerState.count,
    highlightedIndex: highlightedIndexProp,
    navigationStyle,
    requestScroll,
    rowCount,
    onHighlight,
    onToggleGroup: handleToggleGroup,
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
    [editingFocus, navigationFocus],
  );

  const onContextMenu = useTableContextMenu({
    columns,
    data,
    dataSource,
    getSelectedRows,
    headerCount: headerState.count,
  });

  const onMoveGroupColumn = useCallback(
    (columns: ColumnDescriptor[]) => {
      dataSource.groupBy = columns.map((col) => col.name);
    },
    [dataSource],
  );

  const onRemoveGroupColumn = useCallback(
    (column: RuntimeColumnDescriptor) => {
      if (isGroupColumn(column)) {
        dataSource.groupBy = [];
      } else {
        if (dataSource && dataSource.groupBy?.includes(column.name)) {
          dataSource.groupBy = dataSource.groupBy.filter(
            (columnName) => columnName !== column.name,
          );
        }
      }
    },
    [dataSource],
  );

  const handleSelectionChange: SelectionChangeHandler =
    useCallback<TableRowSelectionChangeHandlerInternal>(
      (selectRequest) => {
        dataSource.select?.(selectRequest);
        // onSelectionChange?.(selected);
      },
      [dataSource, onSelectionChange],
    );

  const handleSelect = useCallback<TableRowSelectHandlerInternal>(
    (row) => {
      if (onSelect) {
        onSelect(row === null ? null : rowToObject(row, columnMap));
      }
    },
    [columnMap, onSelect, rowToObject],
  );

  const {
    onKeyDown: selectionHookKeyDown,
    onRowClick: selectionHookOnRowClick,
  } = useSelection({
    containerRef,
    defaultSelectedIndexValues: defaultSelectedIndexValues,
    highlightedIndexRef,
    onSelect: handleSelect,
    onSelectionChange: handleSelectionChange,
    selectionModel,
  });

  const handleSelectCellBlock = useCallback(
    (cellBlock: TableCellBlock) => {
      handleSelectionChange([]);
      onSelectCellBlock?.(cellBlock);
    },
    [handleSelectionChange, onSelectCellBlock],
  );

  const {
    onMouseDown: cellBlockHookMouseDown,
    cellBlock,
    onKeyDown: cellBlockSelectionKeyDown,
  } = useCellBlockSelection({
    allowCellBlockSelection,
    columnCount,
    containerRef,
    onSelectCellBlock: handleSelectCellBlock,
    rowCount,
  });

  const handleRowClick = useCallback<TableRowClickHandlerInternal>(
    (evt, row, rangeSelect, keepExistingSelection) => {
      selectionHookOnRowClick(evt, row, rangeSelect, keepExistingSelection);
      onRowClickProp?.(evt, rowToObject(row, columnMap));
    },
    [columnMap, onRowClickProp, rowToObject, selectionHookOnRowClick],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      cellBlockSelectionKeyDown?.(e);
      if (!e.defaultPrevented) {
        navigationKeyDown(e);
      }
      if (!e.defaultPrevented) {
        editingKeyDown(e);
      }
      if (!e.defaultPrevented) {
        selectionHookKeyDown(e);
      }
    },
    [
      cellBlockSelectionKeyDown,
      navigationKeyDown,
      editingKeyDown,
      selectionHookKeyDown,
    ],
  );

  const onMoveColumn = useCallback<ColumnMoveHandler>(
    (columnName, columns) => {
      const newTableConfig = {
        ...tableConfig,
        columns,
      };

      tableConfigRef.current = newTableConfig;

      dispatchTableModelAction({
        availableWidth,
        type: "init",
        tableConfig: newTableConfig,
        dataSource,
      });
      onConfigChange?.(stripInternalProperties(newTableConfig));

      setTimeout(() => {
        const headerCell = getHeaderCell(containerRef, columnName);
        if (headerCell) {
          const { ariaColIndex } = headerCell;
          const { ariaRowIndex } = headerCell.parentElement as HTMLDivElement;
          const col = parseInt(ariaColIndex ?? "-1");
          const row = parseInt(ariaRowIndex ?? "-1");
          if (!isNaN(col) && col !== -1 && !isNaN(row) && row !== -1) {
            focusCell([row, col]);
          }
        }
      }, 300);
    },
    [
      availableWidth,
      containerRef,
      dataSource,
      dispatchTableModelAction,
      focusCell,
      onConfigChange,
      tableConfig,
    ],
  );

  const handleDropRow = useCallback(
    // TODO - this should be GlobalDropHandler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (dragDropState: any) => {
      onDrop?.(dragDropState);
    },
    [onDrop],
  );

  const handleDataEdited = useCallback(
    async (editState: DataCellEditEvent) => {
      const {
        editType = "commit",
        isValid = true,
        row,
        columnName,
        value,
      } = editState;
      let result = undefined;
      if (editType === "commit" && isValid) {
        result = await dataSource.applyEdit(
          row[KEY],
          columnName,
          value as VuuRowDataItemType,
        );
        onDataEditedProp?.({ ...editState, isValid: result === true });
        return result;
      } else {
        onDataEditedProp?.(editState);
      }
    },
    [dataSource, onDataEditedProp],
  );

  const handleDragStartRow = useCallback<DragStartHandler>(
    (dragDropState) => {
      const { initialDragElement } = dragDropState;
      const rowIndex =
        getAriaRowIndex(initialDragElement) - headerState.count - 1;
      const row = dataRef.current.find((row) => row[0] === rowIndex);
      if (row) {
        dragDropState.setPayload(row);
      } else {
        // should we abort the operation ?
      }
      onDragStart?.(dragDropState);
    },
    [dataRef, headerState.count, onDragStart],
  );

  const onHeaderHeightMeasured = useCallback(
    (height: number, count: number) => {
      setHeaderState({ height, count });
    },
    [],
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

  const handleMouseDown = useCallback<MouseEventHandler>(
    (evt) => {
      rowDragMouseDown?.(evt);
      if (!evt.isPropagationStopped()) {
        cellBlockHookMouseDown?.(evt);
      }
    },
    [rowDragMouseDown, cellBlockHookMouseDown],
  );

  return {
    ...containerProps,
    "aria-rowcount": dataSource.size,
    cellBlock,
    columnMap,
    columns,
    data,
    draggableRow,
    focusCellPlaceholderKeyDown,
    focusCellPlaceholderRef,
    getRowOffset,
    handleColumnAction,
    headerState,
    headings,
    highlightedIndex: highlightedIndexRef.current,
    onBlur: editingBlur,
    onDoubleClick: editingDoubleClick,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onMouseDown: handleMouseDown,
    onContextMenu,
    onDataEdited: handleDataEdited,
    onHeaderHeightMeasured,
    onMoveColumn,
    onMoveGroupColumn,
    onRemoveGroupColumn,
    onRowClick: handleRowClick,
    onSortColumn: handleSort,
    onResizeColumn,
    onToggleGroup,
    rowClassNameGenerator,
    scrollProps,
    // TODO don't think we need these ...
    tableAttributes,
    tableBodyRef,
    tableConfig,
    viewportMeasurements,
  };
};
