import {
  DataSource,
  DataSourceSubscribedMessage,
  isVuuFeatureInvocation,
  SubscribeCallback,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { getFullRange, NULL_RANGE } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";

export interface DataSourceHookProps {
  dataSource: DataSource;
  // onConfigChange?: (message: DataSourceConfigMessage) => void;
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
  range?: VuuRange;
  renderBufferSize?: number;
}

export const useDataSource = ({
  dataSource,
  onFeatureInvocation,
  onSizeChange,
  onSubscribed,
  range = NULL_RANGE,
  renderBufferSize = 0,
}: DataSourceHookProps) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<DataSourceRow[]>([]);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  // const rafHandle = useRef<number | null>(null);
  const rangeRef = useRef<VuuRange>(NULL_RANGE);

  const dataWindow = useMemo(
    () => new MovingWindow(getFullRange(range, renderBufferSize)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
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
    [dataWindow]
  );

  const datasourceMessageHandler: SubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        onSubscribed?.(message);
      } else if (message.type === "viewport-update") {
        if (typeof message.size === "number") {
          onSizeChange?.(message.size);
          dataWindow.setRowCount(message.size);
        }
        if (message.rows) {
          setData(message.rows);
        } else if (typeof message.size === "number") {
          data.current = dataWindow.data;
          hasUpdated.current = true;
        }
      } else if (isVuuFeatureInvocation(message)) {
        onFeatureInvocation?.(message);
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [dataWindow, onFeatureInvocation, onSizeChange, onSubscribed, setData]
  );

  const getSelectedRows = useCallback(() => {
    return dataWindow.getSelectedRows();
  }, [dataWindow]);

  useEffect(
    () => () => {
      isMounted.current = true;
      // if (rafHandle.current) {
      //   cancelAnimationFrame(rafHandle.current);
      //   rafHandle.current = null;
      // }
      isMounted.current = false;
    },
    []
  );

  // Keep until we'tre sure we don't need it for updates
  // const refreshIfUpdated = useCallback(() => {
  //   if (isMounted.current) {
  //     console.log(`RAF updated data ? ${hasUpdated.current}`);
  //     if (hasUpdated.current) {
  //       forceUpdate({});
  //       hasUpdated.current = false;
  //     }
  //     rafHandle.current = requestAnimationFrame(refreshIfUpdated);
  //   }
  // }, [forceUpdate]);
  // useEffect(() => {
  //   rafHandle.current = requestAnimationFrame(refreshIfUpdated);
  // }, [refreshIfUpdated]);

  useEffect(() => {
    if (dataSource.status === "disabled") {
      dataSource.enable?.(datasourceMessageHandler);
    } else {
      //TODO could we improve this by using a ref for range ?
      dataSource?.subscribe(
        { range: getFullRange(range, renderBufferSize) },
        datasourceMessageHandler
      );
    }
  }, [dataSource, datasourceMessageHandler, range, renderBufferSize]);

  const setRange = useCallback(
    (range: VuuRange) => {
      const fullRange = getFullRange(range, renderBufferSize);
      dataWindow.setRange(fullRange);
      dataSource.range = rangeRef.current = fullRange;
      dataSource.emit("range", range);
    },
    [dataSource, dataWindow, renderBufferSize]
  );

  return {
    data: data.current,
    getSelectedRows,
    range: rangeRef.current,
    setRange,
  };
};
