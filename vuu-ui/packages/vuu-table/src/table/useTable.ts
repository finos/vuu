import {
  DataSource,
  DataSourceSubscribedMessage,
  JsonDataSource,
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
import { VuuSortType } from "@finos/vuu-protocol-types";
import {
  applySort,
  buildColumnMap,
  isJsonGroup,
  metadataKeys,
  moveItemDeprecated,
} from "@finos/vuu-utils";
import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTableContextMenu } from "./context-menu";
import { TableColumnResizeHandler } from "./dataTableTypes";
import { useDataSource } from "./useDataSource";
import { useDraggableColumn } from "./useDraggableColumn";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { MeasuredProps, useMeasuredContainer } from "./useMeasuredContainer";
import { useSelection } from "./useSelection";
import { PersistentColumnAction, useTableModel } from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useTableViewport } from "../table-next/useTableViewport";
import { useVirtualViewport } from "./useVirtualViewport";

const NO_ROWS = [] as const;

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

const { KEY, IS_EXPANDED, IS_LEAF } = metadataKeys;

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
  const expectConfigChangeRef = useRef(false);

  // When we detect and respond to changes to config below, we need
  // to include current dataSource config when we refresh the model.
  const dataSourceRef = useRef<DataSource>();
  dataSourceRef.current = dataSource;

  if (dataSource === undefined) {
    throw Error("no data source provided to Vuu Table");
  }

  const containerMeasurements = useMeasuredContainer(measuredProps);

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const { columns, dispatchColumnAction, headings } = useTableModel(
    config,
    dataSource.config
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
    size: containerMeasurements.innerSize,
  });

  const onSubscribed = useCallback(
    ({ tableSchema }: DataSourceSubscribedMessage) => {
      if (tableSchema) {
        expectConfigChangeRef.current = true;
        dispatchColumnAction({
          type: "setTableSchema",
          tableSchema,
        });
      } else {
        console.log("usbscription message with no schema");
      }
    },
    [dispatchColumnAction]
  );

  const handleSelectionChange: SelectionChangeHandler = useCallback(
    (selected) => {
      dataSource.select(selected);
      onSelectionChange?.(selected);
    },
    [dataSource, onSelectionChange]
  );

  const handleRowClick = useSelection({
    onSelectionChange: handleSelectionChange,
    selectionModel,
  });

  const { data, getSelectedRows, range, setRange } = useDataSource({
    dataSource,
    onFeatureEnabled,
    onFeatureInvocation,
    onSubscribed,
    onSizeChange: onDataRowcountChange,
    renderBufferSize,
    viewportRowCount: viewportMeasurements.rowCount,
  });

  // Keep a ref to current data. We use it to provide row for context menu actions.
  // We don't want to introduce data as a dependency on the context menu handler, just
  // needs to be correct at runtime when the row is right clicked.
  const dataRef = useRef<DataSourceRow[]>();
  dataRef.current = data;

  const onPersistentColumnOperation = useCallback(
    (action: PersistentColumnAction) => {
      expectConfigChangeRef.current = true;
      console.log(`onPersistentColumnOperation, dispatchColumnAction`, {
        action,
      });
      dispatchColumnAction(action as any);
    },
    [dispatchColumnAction]
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

  const handleColumnResize: TableColumnResizeHandler = useCallback(
    (phase, columnName, width) => {
      const column = columns.find((column) => column.name === columnName);
      if (column) {
        if (phase === "end") {
          expectConfigChangeRef.current = true;
        }
        dispatchColumnAction({
          type: "resizeColumn",
          phase,
          column,
          width,
        });
      } else {
        throw Error(
          `useDataTable.handleColumnResize, column ${columnName} not found`
        );
      }
    },
    [columns, dispatchColumnAction]
  );

  const handleToggleGroup = useCallback(
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

  const {
    onVerticalScroll,
    onHorizontalScroll,
    columnsWithinViewport,
    virtualColSpan,
  } = useVirtualViewport({
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
    onHorizontalScroll,
    onVerticalScroll: handleVerticalScroll,
    viewport: viewportMeasurements,
    viewportHeight:
      (containerMeasurements.innerSize?.height ?? 0) - headerHeight,
  });

  const containerProps = useKeyboardNavigation({
    columnCount: columns.length,
    containerRef: containerMeasurements.containerRef,
    data,
    requestScroll,
    rowCount: dataSource?.size,
    viewportRange: range,
  });

  const handleRemoveColumnFromGroupBy = useCallback(
    (column?: KeyedColumnDescriptor) => {
      if (column) {
        if (dataSource && dataSource.groupBy.includes(column.name)) {
          dataSource.groupBy = dataSource.groupBy.filter(
            (columnName) => columnName !== column.name
          );
        }
      } else {
        dataSource.groupBy = [];
      }
    },
    [dataSource]
  );

  const handleDropColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      const column = dataSource.columns[fromIndex];
      const columns = moveItemDeprecated(dataSource.columns, column, toIndex);
      if (columns !== dataSource.columns) {
        dataSource.columns = columns;
        dispatchColumnAction({ type: "tableConfig", columns });
      }
    },
    [dataSource, dispatchColumnAction]
  );

  const draggableHook = useDraggableColumn({
    onDrop: handleDropColumn,
  });

  useEffect(() => {
    // External config has changed
    if (dataSourceRef.current) {
      expectConfigChangeRef.current = true;
      dispatchColumnAction({
        type: "init",
        tableConfig: config,
        dataSourceConfig: dataSourceRef.current.config,
      });
    }
  }, [config, dispatchColumnAction]);

  useEffect(() => {
    dataSource.on("config", (config, confirmed) => {
      expectConfigChangeRef.current = true;
      dispatchColumnAction({
        type: "tableConfig",
        ...config,
        confirmed,
      });
    });
  }, [dataSource, dispatchColumnAction]);

  useMemo(() => {
    if (expectConfigChangeRef.current) {
      onConfigChange?.({
        ...config,
        columns,
      });
      expectConfigChangeRef.current = false;
    }
  }, [columns, config, onConfigChange]);

  const [showContextMenu] = usePopupContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const { current: currentData } = dataRef;
      const { current: currentDataSource } = dataSourceRef;
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest("div[role='cell']");
      const rowEl = target?.closest(".vuuTableRow");

      if (cellEl && rowEl && currentData && currentDataSource) {
        const { columns, selectedRowsCount } = currentDataSource;
        const columnMap = buildColumnMap(columns);
        const rowIndex = parseInt(rowEl.ariaRowIndex ?? "-1");
        const cellIndex = Array.from(rowEl.childNodes).indexOf(cellEl);
        const row = currentData.find(([idx]) => idx === rowIndex);
        const columnName = columns[cellIndex];

        showContextMenu(evt, "grid", {
          columnMap,
          columnName,
          row,
          selectedRows: selectedRowsCount === 0 ? NO_ROWS : getSelectedRows(),
          viewport: dataSource?.viewport,
        });
      }
    },
    [dataSource?.viewport, getSelectedRows, showContextMenu]
  );

  return {
    columns,
    columnsWithinViewport,
    containerMeasurements,
    containerProps,
    data,
    dispatchColumnAction,
    getRowOffset,
    handleContextMenuAction,
    headings,
    onColumnResize: handleColumnResize,
    onContextMenu,
    onRemoveColumnFromGroupBy: handleRemoveColumnFromGroupBy,
    onRowClick: handleRowClick,
    onSort: handleSort,
    onToggleGroup: handleToggleGroup,
    virtualColSpan,
    scrollProps,
    rowCount,
    viewportMeasurements,
    ...draggableHook,
  };
};
