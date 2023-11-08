import { DataSource, SubscribeCallback } from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";
export interface DataSourceHookProps {
  dataSource: DataSource;
  instruments: string[];
}

export const useDataSource = ({
  dataSource,
  instruments,
}: DataSourceHookProps) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<DataSourceRow[]>([]);
  const count = instruments.length;

  const dataWindow = useMemo(
    () => new MovingWindow({ from: 0, to: count }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      for (const row of updates) {
        dataWindow.add(row);
      }
      data.current = dataWindow.data;
      forceUpdate({});
    },
    [dataWindow]
  );

  const datasourceMessageHandler: SubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        // onSubscribed?.(message);
      } else if (message.type === "viewport-update") {
        if (message.rows) {
          setData(message.rows);
        }
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [setData]
  );

  useEffect(() => {
    console.log("subscribe to dataSource");
    dataSource?.subscribe(
      { range: { from: 0, to: count } },
      datasourceMessageHandler
    );
  }, [dataSource, datasourceMessageHandler, count]);

  return data.current;
};
