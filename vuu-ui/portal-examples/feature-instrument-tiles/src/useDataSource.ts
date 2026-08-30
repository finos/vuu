import type {
  DataSource,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import type { DataSourceRow } from "@vuu-ui/vuu-data-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";
import { Range } from "@vuu-ui/vuu-utils";
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <we only care about the initial count value>
  const dataWindow = useMemo(
    () => new MovingWindow({ from: 0, to: count }),
    [],
  );

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
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
    dataSource?.subscribe({ range: Range(0, count) }, datasourceMessageHandler);
  }, [dataSource, datasourceMessageHandler, count]);

  return data.current;
};
