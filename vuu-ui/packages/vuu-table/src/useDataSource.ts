import {
  DataSource,
  DataSourceRow,
  DataSourceSubscribedMessage,
  SubscribeCallback,
  VuuFeatureInvocationMessage,
} from "@finos/vuu-data-types";
import { VuuRange } from "@finos/vuu-protocol-types";
import { getFullRange, NULL_RANGE, rangesAreSame } from "@finos/vuu-utils";
import { GridAction } from "@finos/vuu-table-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MovingWindow } from "./moving-window";

export interface DataSourceHookProps {
  dataSource: DataSource;
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
  range?: VuuRange;
  renderBufferSize?: number;
}

export const isVuuFeatureInvocation = (
  action: GridAction
): action is VuuFeatureInvocationMessage =>
  action.type === "vuu-link-created" || action.type === "vuu-link-removed";

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
  const rangeRef = useRef<VuuRange>(range);

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
      } else {
        // do nothing
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

  useEffect(() => {
    isMounted.current = true;
    dataSource.resume?.();
    return () => {
      isMounted.current = false;
      dataSource.suspend?.();
    };
  }, [dataSource]);

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
      if (!rangesAreSame(range, rangeRef.current)) {
        const fullRange = getFullRange(range, renderBufferSize);
        dataWindow.setRange(fullRange);
        dataSource.range = rangeRef.current = fullRange;
        // emit a range event omitting the renderBufferSize
        // This isn't great, we're using the dataSource as a conduit to emit a
        // message that has nothing to do with the dataSource itself. CLient
        // is the DataSourceState component.
        dataSource.emit("range", range);
      }
    },
    [dataSource, dataWindow, renderBufferSize]
  );

  return {
    data: data.current,
    dataRef: data,
    getSelectedRows,
    range: rangeRef.current,
    setRange,
  };
};
