import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribedMessage,
} from "@finos/vuu-data";
import {
  ColumnDescriptor,
  GridConfig,
  KeyedColumnDescriptor,
  TypeFormatting,
} from "@finos/vuu-datagrid-types";
import { buildColumnMap, roundDecimal } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { ValueFormatter, ValueFormatters } from "./dataTableTypes";
import { KeySet } from "./KeySet";
import { useColumns } from "./useColumns";
import { useDataSource } from "./useDataSource";

export interface DataTableHookProps {
  config: GridConfig;
  data?: DataSourceRow[];
  dataSource?: DataSource;
  onConfigChange?: (config: GridConfig) => void;
}

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
  data: dataProp,
  dataSource,
  onConfigChange,
}: DataTableHookProps) => {
  const keys = useMemo(() => new KeySet({ from: 0, to: 0 }), []);
  const [visibleRows, setVisibleRows] = useState<DataSourceRow[]>([]);
  const [rowCount, setRowCount] = useState<number>(dataProp?.length ?? 0);

  if (dataProp === undefined && dataSource === undefined) {
    throw Error("no data source provided to DataTable");
  }

  const onSizeChange = useCallback((size: number) => {
    setRowCount(size);
  }, []);

  const { columns, dispatchColumnAction } = useColumns();

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

  const columnMap = useMemo(
    () => buildColumnMap(dataSource?.columns),
    [dataSource?.columns]
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
    dispatchColumnAction({ type: "init", columns: config.columns });
  }, [config.columns, dispatchColumnAction]);

  const { data, setRange } = useDataSource({
    dataSource,
    onSubscribed,
    onSizeChange,
  });

  const setRangeVertical = useCallback(
    (from: number, to: number) => {
      if (dataSource) {
        setRange(from, to);
      } else {
        keys.reset({ from, to });
        const visibleRows = dataProp
          ? keys.withKeys(dataProp.slice(from, to))
          : [];
        setVisibleRows(visibleRows);
      }
    },
    [dataProp, dataSource, keys, setRange]
  );

  return {
    valueFormatters,
    columnMap,
    columns,
    data: dataSource ? data : visibleRows,
    dispatchColumnAction,
    setRangeVertical,
    rowCount,
  };
};
