import {
  DataSourceRow,
  DataSourceSubscribedMessage,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import { MovingWindow, NULL_RANGE, Range } from "@vuu-ui/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TableProps } from "./Table";
import { VuuRange } from "@vuu-ui/vuu-protocol-types";

export interface DataSourceHookProps
  extends Pick<
    TableProps,
    | "dataSource"
    | "defaultSelectedKeyValues"
    | "renderBufferSize"
    | "revealSelected"
  > {
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
}

export const useDataSource = ({
  dataSource,
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
  const rangeRef = useRef<Range>(NULL_RANGE);
  const totalRowCountRef = useRef(0);

  const dataWindow = useMemo(
    () => new MovingWindow(NULL_RANGE),
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

  const datasourceMessageHandler: DataSourceSubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        onSubscribed?.(message);
      } else if (message.type === "viewport-update") {
        if (typeof message.size === "number") {
          onSizeChange?.(message.size);
          const size = dataWindow.data.length;
          dataWindow.setRowCount(message.size);
          totalRowCountRef.current = message.size;

          if (dataWindow.data.length < size) {
            if (isMounted.current === false) {
              console.log("setting state whilst unmounted");
            }

            forceUpdate({});
          }
        }
        if (message.rows) {
          // Removed because known to cause issues when multiple server requests
          // are handled  - a newer range can be overwritten with an out-of-date
          // range. If we need this for some reason, amke sure server sends up
          // top date range
          // if (message.range) {
          //   if (message.range.to !== dataWindow.range.to) {
          //     dataWindow.setRange(message.range);
          //   }
          // }
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

        if (isMounted.current === false) {
          console.log("setting state whilst unmounted");
        }

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
    (viewportRange: VuuRange) => {
      if (!rangeRef.current.equals(viewportRange)) {
        const range = Range(viewportRange.from, viewportRange.to, {
          renderBufferSize,
          rowCount: totalRowCountRef.current,
        });

        dataWindow.setRange(range);

        if (dataSource.status !== "subscribed") {
          dataSource?.subscribe(
            {
              range,
              revealSelected,
              selectedKeyValues: defaultSelectedKeyValues,
            },
            datasourceMessageHandler,
          );
        } else {
          dataSource.range = rangeRef.current = range;
        }
      }
    },
    [
      dataSource,
      dataWindow,
      datasourceMessageHandler,
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
