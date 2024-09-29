import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribedMessage,
  SubscribeCallback,
} from "@finos/vuu-data-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { getFullRange, NULL_RANGE, rangesAreSame } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";

export interface DataSourceHookProps {
  dataSource: DataSource;
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
  renderBufferSize?: number;
}

export const useDataSource = ({
  dataSource,
  onSizeChange,
  onSubscribed,
  renderBufferSize = 0,
}: DataSourceHookProps) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<DataSourceRow[]>([]);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rangeRef = useRef<VuuRange>(NULL_RANGE);

  const dataWindow = useMemo(
    () => new MovingWindow(getFullRange(NULL_RANGE, renderBufferSize)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      for (const row of updates) {
        dataWindow.add(row);
      }
      data.current = dataWindow.data;
      if (isMounted.current) {
        // TODO do we ever need to worry about missing updates here ?
        forceUpdate({});
      }
    },
    [dataWindow],
  );

  const datasourceMessageHandler: SubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        onSubscribed?.(message);
      } else if (message.type === "viewport-update") {
        if (typeof message.size === "number") {
          onSizeChange?.(message.size);
          const size = dataWindow.data.length;
          dataWindow.setRowCount(message.size);
          if (dataWindow.data.length < size) {
            forceUpdate({});
          }
        }
        if (message.rows) {
          setData(message.rows);
        } else if (message.size === 0) {
          setData([]);
        } else if (typeof message.size === "number") {
          data.current = dataWindow.data;
          hasUpdated.current = true;
        }
      } else if (message.type === "viewport-clear") {
        onSizeChange?.(0);
        dataWindow.setRowCount(0);
        setData([]);
        forceUpdate({});
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [dataWindow, onSizeChange, onSubscribed, setData],
  );

  const getSelectedRows = useCallback(() => {
    return dataWindow.getSelectedRows();
  }, [dataWindow]);

  useEffect(() => {
    isMounted.current = true;
    if (dataSource.status !== "initialising") {
      dataSource.resume?.(datasourceMessageHandler);
    }
    return () => {
      isMounted.current = false;
      dataSource.suspend?.();
    };
  }, [dataSource, datasourceMessageHandler]);

  useEffect(() => {
    if (dataSource.status === "disabled") {
      dataSource.enable?.(datasourceMessageHandler);
    }
  }, [dataSource, datasourceMessageHandler, renderBufferSize]);

  const setRange = useCallback(
    (range: VuuRange) => {
      if (!rangesAreSame(range, rangeRef.current)) {
        const fullRange = getFullRange(range, renderBufferSize);
        dataWindow.setRange(fullRange);

        if (dataSource.status !== "subscribed") {
          dataSource?.subscribe({ range: fullRange }, datasourceMessageHandler);
        } else {
          dataSource.range = rangeRef.current = fullRange;
        }
        // emit a range event omitting the renderBufferSize
        // This isn't great, we're using the dataSource as a conduit to emit a
        // message that has nothing to do with the dataSource itself. Client
        // is the DataSourceState component.
        // WHY CANT THIS BE DONE WITHIN DataSOurce ?
        dataSource.emit("range", range);
      }
    },
    [dataSource, dataWindow, datasourceMessageHandler, renderBufferSize],
  );

  return {
    data: data.current,
    dataRef: data,
    getSelectedRows,
    range: rangeRef.current,
    setRange,
  };
};
