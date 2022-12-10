import { DataSourceRow } from "@finos/vuu-data";
import { useCallback, useMemo, useState } from "react";
import { KeySet } from "./KeySet";

export interface TableDataHookProps {
  data: DataSourceRow[];
}

export const useTableData = ({ data }: TableDataHookProps) => {
  const keys = useMemo(() => new KeySet({ from: 0, to: 0 }), []);
  const [visibleRows, setVisibleRows] = useState<DataSourceRow[]>([]);
  const setRangeVertical = useCallback(
    (from: number, to: number) => {
      keys.reset({ from, to });
      const visibleRows = keys.withKeys(data.slice(from, to));
      setVisibleRows(visibleRows);
    },
    [data, keys]
  );

  return {
    data: visibleRows,
    setRangeVertical,
    rowCount: data.length,
  };
};
