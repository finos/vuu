//TODO stansardise this

import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";
import { Range } from "@vuu-ui/vuu-utils";
export interface DataSourceHookProps {
  dataSource: DataSource;
  instruments: string[];
}

export const useDataSource = ({ dataSource }: DataSourceHookProps) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<DataSourceRow[]>([]);

  const dataWindow = useMemo(
    () => new MovingWindow({ from: 0, to: 10 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      console.table(updates);
      for (const row of updates) {
        dataWindow.add(row);
      }
      data.current = dataWindow.data;
      forceUpdate({});
    },
    [dataWindow],
  );

  const datasourceMessageHandler: DataSourceSubscribeCallback = useCallback(
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
    [setData],
  );

  useEffect(() => {
    console.log("subscribe to dataSource");
    dataSource?.subscribe({ range: Range(0, 10) }, datasourceMessageHandler);
  }, [dataSource, datasourceMessageHandler]);

  return data.current;
};
