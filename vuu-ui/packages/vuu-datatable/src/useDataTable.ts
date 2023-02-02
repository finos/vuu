import {
  DataSource,
  DataSourceConfigMessage,
  DataSourceRow,
  DataSourceSubscribedMessage,
} from "@finos/vuu-data";
import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
  TypeFormatting,
} from "@finos/vuu-datagrid-types";
import { VuuSortType } from "@finos/vuu-protocol-types";
import { applySort, metadataKeys, roundDecimal } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import {
  TableColumnResizeHandler,
  TableSelectionModel,
  ValueFormatter,
  ValueFormatters,
} from "./dataTableTypes";
import { useDataSource } from "./useDataSource";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { MeasuredProps, useMeasuredContainer } from "./useMeasuredContainer";
import { useTableModel } from "./useTableModel";
import { useTableScroll } from "./useTableScroll";
import { useTableViewport } from "./useTableViewport";
import { useSelection } from "./useSelection";

export interface DataTableHookProps extends MeasuredProps {
  config: GridConfig;
  dataSource: DataSource;
  headerHeight: number;
  onConfigChange?: (config: GridConfig) => void;
  renderBufferSize?: number;
  rowHeight: number;
  selectionModel: TableSelectionModel;
}

const { KEY, IS_EXPANDED } = metadataKeys;
const DEFAULT_NUMERIC_FORMAT: TypeFormatting = {};
const defaultValueFormatter = (value: unknown) =>
  value == null ? "" : typeof value === "string" ? value : value.toString();
const numericFormatter = ({ align = "right", type }: ColumnDescriptor) => {
  if (type === undefined || typeof type === "string") {
    return defaultValueFormatter;
  } else {
    const {
      alignOnDecimals = false,
      decimals,
      zeroPad = false,
    } = type.formatting ?? DEFAULT_NUMERIC_FORMAT;
    return (value: unknown) => {
      if (
        typeof value === "string" &&
        (value.startsWith("Σ") || value.startsWith("["))
      ) {
        return value;
      }
      const number =
        typeof value === "number"
          ? value
          : typeof value === "string"
          ? parseFloat(value)
          : undefined;
      return roundDecimal(number, align, decimals, zeroPad, alignOnDecimals);
    };
  }
};

const getValueFormatter = (column: KeyedColumnDescriptor): ValueFormatter => {
  const { serverDataType } = column;
  if (serverDataType === "string" || serverDataType === "char") {
    return (value: unknown) => value as string;
  } else if (serverDataType === "double") {
    return numericFormatter(column);
  }
  return defaultValueFormatter;
};

export const useDataTable = ({
  config,
  dataSource,
  headerHeight,
  onConfigChange,
  renderBufferSize = 0,
  rowHeight,
  selectionModel,
  ...measuredProps
}: DataTableHookProps) => {
  const [rowCount, setRowCount] = useState<number>(0);

  if (dataSource === undefined) {
    throw Error("no data source provided to DataTable");
  }

  const containerMeasurements = useMeasuredContainer(measuredProps);

  const onDataRowcountChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const { columns, dispatchColumnAction } = useTableModel(config);

  const viewportMeasurements = useTableViewport({
    columns,
    headerHeight,
    rowCount,
    rowHeight,
    size: containerMeasurements.innerSize,
  });

  const onSubscribed = useCallback(
    (subscription: DataSourceSubscribedMessage) => {
      if (subscription.tableMeta) {
        const { columns: columnNames, dataTypes: serverDataTypes } =
          subscription.tableMeta;
        dispatchColumnAction({
          type: "setTypes",
          columnNames,
          serverDataTypes,
        });
      }
    },
    [dispatchColumnAction]
  );

  const valueFormatters = useMemo(() => {
    return columns.reduce<ValueFormatters>(
      (map, column) => ((map[column.name] = getValueFormatter(column)), map),
      {}
    );
  }, [columns]);

  useMemo(() => {
    onConfigChange?.({
      ...config,
      columns,
    });
  }, [columns, config, onConfigChange]);

  useMemo(() => {
    dispatchColumnAction({ type: "init", config });
  }, [config, dispatchColumnAction]);

  const handleConfigChangeFromDataSource = useCallback(
    (message: DataSourceConfigMessage) => {
      switch (message.type) {
        case "groupBy":
          return dispatchColumnAction({
            type: "tableConfig",
            groupBy: message.groupBy,
          });
        case "filter":
          return dispatchColumnAction({
            type: "tableConfig",
            filter: message.filter,
          });
        case "sort":
          return dispatchColumnAction({
            type: "tableConfig",
            sort: message.sort,
          });
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
    onSubscribed,
    onSizeChange: onDataRowcountChange,
    renderBufferSize,
    viewportRowCount: viewportMeasurements.rowCount,
  });

  const setRangeVertical = useCallback(
    (from: number, to: number) => {
      // const fullRange = getFullRange({ from, to }, renderBufferSize);
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

  return {
    containerMeasurements,
    containerProps,
    columns,
    data,
    dispatchColumnAction,
    onColumnResize: handleColumnResize,
    onRemoveColumnFromGroupBy: handleRemoveColumnFromGroupBy,
    onRowClick: handleRowClick,
    onSort: handleSort,
    onToggleGroup: handleToggleGroup,
    scrollProps,
    rowCount,
    valueFormatters,
    viewportMeasurements,
  };
};
