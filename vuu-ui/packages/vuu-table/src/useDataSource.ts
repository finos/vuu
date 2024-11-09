import {
  DataSourceRow,
  DataSourceSubscribedMessage,
  SubscribeCallback,
} from "@finos/vuu-data-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { getFullRange, NULL_RANGE, rangesAreSame } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";
import { TableProps } from "./Table";

export interface DataSourceHookProps
  extends Pick<
    TableProps,
    | "dataSource"
    | "defaultSelectedIndexValues"
    | "defaultSelectedKeyValues"
    | "renderBufferSize"
    | "revealSelected"
  > {
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
}

export const useDataSource = ({
  dataSource,
  defaultSelectedIndexValues,
  defaultSelectedKeyValues,
  onSizeChange,
  onSubscribed,
  renderBufferSize = 0,
  revealSelected,
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

  useMemo(() => {
    dataSource.on("resumed", () => {
      // When we resume a dataSource (after switching tabs etc)
      // client will receive rows. We may not have received any
      // setRange calls at this point so dataWindow range will
      //not yet be set. If the dataWindow range is already set,
      // this is a no-op.
      const { range } = dataSource;
      if (range.to !== 0) {
        dataWindow.setRange(dataSource.range);
      }
    });
  }, [dataSource, dataWindow]);

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
          if (message.range) {
            if (message.range.to !== dataWindow.range.to) {
              dataWindow.setRange(message.range);
            }
          }
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
          dataSource?.subscribe(
            {
              range: fullRange,
              revealSelected,
              selectedIndexValues: defaultSelectedIndexValues,
              selectedKeyValues: defaultSelectedKeyValues,
            },
            datasourceMessageHandler,
          );
        } else {
          dataSource.range = rangeRef.current = fullRange;
        }
        // emit a range event omitting the renderBufferSize
        // This isn't great, we're using the dataSource as a conduit to emit a
        // message that has nothing to do with the dataSource itself. Client
        // is the DataSourceState component.
        // WHY CANT THIS BE DONE WITHIN DataSource ?
        dataSource.emit("range", range);
      }
    },
    [
      dataSource,
      dataWindow,
      datasourceMessageHandler,
      defaultSelectedIndexValues,
      defaultSelectedKeyValues,
      renderBufferSize,
      revealSelected,
    ],
  );

  return {
    data: data.current,
    dataRef: data,
    getSelectedRows,
    range: rangeRef.current,
    setRange,
  };
};
