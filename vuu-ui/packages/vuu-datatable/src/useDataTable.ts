import {
  DataSource,
  DataSourceConfigMessage,
  DataSourceRow,
  DataSourceSubscribedMessage,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
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
  metadataKeys,
  moveItem,
} from "@finos/vuu-utils";
import {
  MouseEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useContextMenu } from "./context-menu";
import { TableColumnResizeHandler, tableLayoutType } from "./dataTableTypes";
import { useDataSource } from "./useDataSource";
import { useDraggableColumn } from "./useDraggableColumn";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { MeasuredProps, useMeasuredContainer } from "./useMeasuredContainer";
import { useSelection } from "./useSelection";
import { PersistentColumnAction, useTableModel } from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useTableViewport } from "./useTableViewport";

const NO_ROWS = [] as const;

export interface DataTableHookProps extends MeasuredProps {
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
  tableLayout: tableLayoutType;
}

const { KEY, IS_EXPANDED } = metadataKeys;

export const useDataTable = ({
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
  tableLayout,
  ...measuredProps
}: DataTableHookProps) => {
  const [rowCount, setRowCount] = useState<number>(0);
  const expectConfigChangeRef = useRef(false);

  // When we detect and respond to changes to config below, we need
  // to include current dataSource config when we refresh the model.
  const dataSourceRef = useRef<DataSource>();
  dataSourceRef.current = dataSource;

  if (dataSource === undefined) {
    throw Error("no data source provided to DataTable");
  }

  const containerMeasurements = useMeasuredContainer(measuredProps);

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const { columns, dispatchColumnAction, headings } = useTableModel(
    config,
    dataSource.config
  );

  const handlePersistentColumnOperation = useCallback(
    (action: PersistentColumnAction) => {
      expectConfigChangeRef.current = true;
      dispatchColumnAction(action);
    },
    [dispatchColumnAction]
  );

  const handleContextMenuAction = useContextMenu({
    dataSource,
    onPersistentColumnOperation: handlePersistentColumnOperation,
  });

  const viewportMeasurements = useTableViewport({
    columns,
    headerHeight,
    headings,
    rowCount,
    rowHeight,
    size: containerMeasurements.innerSize,
  });

  const onSubscribed = useCallback(
    (subscription: DataSourceSubscribedMessage) => {
      if (subscription.tableMeta) {
        const { columns: columnNames, dataTypes: serverDataTypes } =
          subscription.tableMeta;
        expectConfigChangeRef.current = true;
        dispatchColumnAction({
          type: "setTypes",
          columnNames,
          serverDataTypes,
        });
      }
    },
    [dispatchColumnAction]
  );

  const handleConfigChangeFromDataSource = useCallback(
    (message: DataSourceConfigMessage) => {
      const { type } = message;
      switch (type) {
        case "groupBy":
        case "filter":
        case "sort":
        case "columns": {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const payload = message[type];
          return dispatchColumnAction({
            type: "tableConfig",
            [type]: payload,
          });
        }
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
    onConfigChange: handleConfigChangeFromDataSource,
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

  const setRangeVertical = useCallback(
    (from: number, to: number) => {
      setRange({ from, to });
    },
    [setRange]
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
    (row: DataSourceRow) => {
      if (dataSource) {
        if (row[IS_EXPANDED]) {
          dataSource.closeTreeNode(row[KEY]);
        } else {
          dataSource.openTreeNode(row[KEY]);
        }
      }
    },
    [dataSource]
  );

  const handleRemoveColumnFromGroupBy = useCallback(
    (column: KeyedColumnDescriptor) => {
      if (dataSource && dataSource.groupBy.includes(column.name)) {
        dataSource.groupBy = dataSource.groupBy.filter(
          (columnName) => columnName !== column.name
        );
      }
    },
    [dataSource]
  );

  const { requestScroll, ...scrollProps } = useTableScroll({
    onRangeChange: setRangeVertical,
    rowHeight,
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

  const handleDropColumn = useCallback(
    (fromIndex: number, toIndex: number) => {
      const column = dataSource.columns[fromIndex];
      const columns = moveItem(dataSource.columns, column, toIndex);
      if (columns !== dataSource.columns) {
        dataSource.columns = columns;
        dispatchColumnAction({ type: "tableConfig", columns });
      }
    },
    [dataSource, dispatchColumnAction]
  );

  const draggableHook = useDraggableColumn({
    onDrop: handleDropColumn,
    tableContainerRef: scrollProps.tableContainerRef,
    tableLayout,
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

  useMemo(() => {
    if (expectConfigChangeRef.current) {
      onConfigChange?.({
        ...config,
        columns,
      });

      expectConfigChangeRef.current = false;
    }
  }, [columns, config, onConfigChange]);

  const showContextMenu = usePopupContextMenu();

  const onContextMenu = useCallback(
    (evt: MouseEvent<HTMLElement>) => {
      const { current: currentData } = dataRef;
      const { current: currentDataSource } = dataSourceRef;
      const target = evt.target as HTMLElement;
      const cellEl = target?.closest("td");
      const rowEl = target?.closest("tr");

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
    containerMeasurements,
    containerProps,
    columns,
    data,
    dispatchColumnAction,
    handleContextMenuAction,
    headings,
    onColumnResize: handleColumnResize,
    onContextMenu,
    onRemoveColumnFromGroupBy: handleRemoveColumnFromGroupBy,
    onRowClick: handleRowClick,
    onSort: handleSort,
    onToggleGroup: handleToggleGroup,
    scrollProps,
    rowCount,
    viewportMeasurements,
    ...draggableHook,
  };
};
