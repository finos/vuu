import {
  DataSource,
  DataSourceConfigMessage,
  DataSourceRow,
  DataSourceSubscribedMessage,
  VuuFeatureInvocationMessage,
  VuuFeatureMessage,
} from "@finos/vuu-data";
import { GridConfig, KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuSortType } from "@finos/vuu-protocol-types";
import { applySort, metadataKeys, moveItem } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  TableColumnResizeHandler,
  tableLayoutType,
  TableSelectionModel,
} from "./dataTableTypes";
import { useDataSource } from "./useDataSource";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { MeasuredProps, useMeasuredContainer } from "./useMeasuredContainer";
import { PersistentColumnAction, useTableModel } from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useTableViewport } from "./useTableViewport";
import { useSelection } from "./useSelection";
import { useContextMenu } from "./context-menu";
import { useDraggableColumn } from "./useDraggableColumn";

export interface DataTableHookProps extends MeasuredProps {
  config: Omit<GridConfig, "headings">;
  dataSource: DataSource;
  headerHeight: number;
  onConfigChange?: (config: Omit<GridConfig, "headings">) => void;
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  renderBufferSize?: number;
  rowHeight: number;
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

  const setSelected = useCallback(
    (selected) => {
      dataSource.select(selected);
    },
    [dataSource]
  );

  const handleRowClick = useSelection({
    setSelected,
    selectionModel,
  });

  const { data, range, setRange } = useDataSource({
    dataSource,
    onConfigChange: handleConfigChangeFromDataSource,
    onFeatureEnabled,
    onFeatureInvocation,
    onSubscribed,
    onSizeChange: onDataRowcountChange,
    renderBufferSize,
    viewportRowCount: viewportMeasurements.rowCount,
  });

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
    console.log(`4) useDataTable change detected to config ...`, {
      config,
    });
    if (expectConfigChangeRef.current) {
      console.log(
        `%c expected so call onConfigChange`,
        "color: red; font-weight: bold;",
        {
          columns,
          config,
        }
      );
      onConfigChange?.({
        ...config,
        columns,
      });

      expectConfigChangeRef.current = false;
    } else {
      console.log(" ...columns changes but we were not expecting it so ignore");
    }
  }, [columns, config, onConfigChange]);

  return {
    containerMeasurements,
    containerProps,
    columns,
    data,
    dispatchColumnAction,
    handleContextMenuAction,
    headings,
    onColumnResize: handleColumnResize,
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
