import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribedMessage,
} from "@finos/vuu-data";
import { GridConfig } from "@finos/vuu-datagrid-types";
import { buildColumnMap } from "@finos/vuu-utils";
import { useCallback, useMemo, useState } from "react";
import { KeySet } from "./KeySet";
import { useColumns } from "./useColumns";
import { useDataSource } from "./useDataSource";

export interface TableDataHookProps {
  config: GridConfig;
  data?: DataSourceRow[];
  dataSource?: DataSource;
  onConfigChange?: (config: GridConfig) => void;
}

export const useTableData = ({
  config,
  data: dataProp,
  dataSource,
  onConfigChange,
}: TableDataHookProps) => {
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
    columnMap,
    columns,
    data: dataSource ? data : visibleRows,
    dispatchColumnAction,
    setRangeVertical,
    rowCount,
  };
};
