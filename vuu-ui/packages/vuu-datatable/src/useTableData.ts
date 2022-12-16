import { DataSource, DataSourceRow } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { KeySet } from "./KeySet";
import { useDataSource } from "./useDataSource";

export interface TableDataHookProps {
  data?: DataSourceRow[];
  dataSource?: DataSource;
}

export const useTableData = ({
  data: dataProp,
  dataSource,
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

  const { data, setRange } = useDataSource({ dataSource, onSizeChange });

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
    data: dataSource ? data : visibleRows,
    setRangeVertical,
    rowCount,
  };
};
