import {
  DataSource,
  DataSourceSubscribedMessage,
  SubscribeCallback,
} from "@finos/vuu-data";
import { DataSourceRow } from "@finos/vuu-data-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { getFullRange } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";

export interface DataSourceHookProps {
  dataSource: DataSource;
  // onConfigChange?: (message: DataSourceConfigMessage) => void;
  // onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  // onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
  range?: VuuRange;
  renderBufferSize?: number;
  viewportRowCount: number;
}

export const useDataSource = ({
  dataSource,
  onSizeChange,
  onSubscribed,
  range = { from: 0, to: 0 },
  renderBufferSize = 0,
  viewportRowCount,
}: DataSourceHookProps) => {
  const [, forceUpdate] = useState<unknown>(null);
  const data = useRef<DataSourceRow[]>([]);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rafHandle = useRef<number | null>(null);
  const rangeRef = useRef<VuuRange>({ from: 0, to: 0 });

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
      // hasUpdated.current = true;

      forceUpdate({});
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
        // } else if (isVuuFeatureAction(message)) {
        //   onFeatureEnabled?.(message);
        // } else if (isVuuFeatureInvocation(message)) {
        //   onFeatureInvocation?.(message);
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [dataWindow, onSizeChange, onSubscribed, setData]
  );

  useEffect(
    () => () => {
      if (rafHandle.current) {
        cancelAnimationFrame(rafHandle.current);
        rafHandle.current = null;
      }
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

  useMemo(() => {
    dataSource?.subscribe(
      { range: getFullRange(range, renderBufferSize) },
      datasourceMessageHandler
    );
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

  useEffect(() => {
    const { from } = dataSource.range;
    const rowRange = { from, to: from + viewportRowCount };
    setRange(rowRange);
  }, [dataSource.range, setRange, viewportRowCount]);

  return {
    data: data.current,
    range: rangeRef.current,
    setRange,
  };
};
