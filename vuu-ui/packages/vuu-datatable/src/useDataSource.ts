import {
  DataSource,
  DataSourceConfigMessage,
  DataSourceRow,
  DataSourceSubscribedMessage,
  SubscribeCallback,
  VuuFeatureMessage,
  isDataSourceConfigMessage,
  isVuuFeatureAction,
  VuuFeatureInvocationMessage,
  isVuuFeatureInvocation,
} from "@finos/vuu-data";
import { VuuDataRow, VuuRange, VuuSortCol } from "@finos/vuu-protocol-types";
import { getFullRange, metadataKeys, WindowRange } from "@finos/vuu-utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const { RENDER_IDX, SELECTED } = metadataKeys;

const byKey = (row1: VuuDataRow, row2: VuuDataRow) =>
  row1[RENDER_IDX] - row2[RENDER_IDX];

export type SubscriptionDetails = {
  columnNames?: string[];
  range: { from: number; to: number };
  sort?: VuuSortCol[];
};

export interface DataSourceHookProps {
  dataSource: DataSource;
  onConfigChange?: (message: DataSourceConfigMessage) => void;
  onFeatureEnabled?: (message: VuuFeatureMessage) => void;
  onFeatureInvocation?: (message: VuuFeatureInvocationMessage) => void;
  onSizeChange: (size: number) => void;
  onSubscribed: (subscription: DataSourceSubscribedMessage) => void;
  range?: VuuRange;
  renderBufferSize?: number;
  viewportRowCount: number;
}

//TODO allow subscription details to be set before subscribe call
export function useDataSource({
  dataSource,
  onConfigChange,
  onFeatureEnabled,
  onFeatureInvocation,
  onSizeChange,
  onSubscribed,
  range = { from: 0, to: 0 },
  renderBufferSize = 0,
  viewportRowCount,
}: DataSourceHookProps) {
  const [, forceUpdate] = useState<unknown>(null);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rangeRef = useRef<VuuRange>({ from: 0, to: 0 });
  const rafHandle = useRef<number | null>(null);
  const data = useRef<DataSourceRow[]>([]);

  const dataWindow = useMemo(
    () => new MovingWindow(getFullRange(range)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const setData = useCallback(
    (updates: DataSourceRow[]) => {
      //     onsole.log(`%c[useDataSource] setData
      // [${updates.map(d => d[0]).join(',')}]`,'color:blue')
      for (const row of updates) {
        dataWindow.add(row);
      }

      // Why bother with the slice ?
      data.current = dataWindow.data.slice().sort(byKey);
      //     onsole.log(`%c[useDataSource] data.current has ${data.current.length} records
      // [${data.current.map(d => d[0]).join(',')}]
      //     `, 'color:blue;')
      hasUpdated.current = true;
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
          // TODO is this right ??????
          data.current = dataWindow.data.slice().sort(byKey);
          hasUpdated.current = true;
        }
      } else if (isVuuFeatureAction(message)) {
        onFeatureEnabled?.(message);
      } else if (isVuuFeatureInvocation(message)) {
        onFeatureInvocation?.(message);
      } else {
        console.log(`useDataSource unexpected message ${message.type}`);
      }
    },
    [
      dataWindow,
      onFeatureEnabled,
      onFeatureInvocation,
      onSizeChange,
      onSubscribed,
      setData,
    ]
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

  const refreshIfUpdated = useCallback(() => {
    if (isMounted.current) {
      if (hasUpdated.current) {
        forceUpdate({});
        hasUpdated.current = false;
      }
      rafHandle.current = requestAnimationFrame(refreshIfUpdated);
    }
  }, [forceUpdate]);

  useEffect(() => {
    rafHandle.current = requestAnimationFrame(refreshIfUpdated);
  }, [refreshIfUpdated]);

  const adjustRange = useCallback(
    (rowCount: number) => {
      const { from } = dataSource.range;
      const fullRange = getFullRange(
        { from, to: from + rowCount },
        renderBufferSize
      );
      dataSource.range = rangeRef.current = fullRange;
      dataWindow.setRange(fullRange);
    },
    [dataSource, dataWindow, renderBufferSize]
  );

  const setRange = useCallback(
    (range: VuuRange) => {
      const fullRange = getFullRange(range, renderBufferSize);
      dataSource.range = rangeRef.current = fullRange;
      dataWindow.setRange(fullRange);
    },
    [dataSource, dataWindow, renderBufferSize]
  );

  const getSelectedRows = useCallback(() => {
    return dataWindow.getSelectedRows();
  }, [dataWindow]);

  // Note: we do not call unsubscribe in a cleanup function here.
  // Thats because we do not want to unsubscribe in the event that
  // our view is unmounts due to a layout drag drop operation. In
  // that scenario, we disable the viewport. THis is handles at the
  // View level. Might need to revisit this - what if Table is not
  // nested within a View ?
  useEffect(() => {
    dataSource?.subscribe(
      {
        range: rangeRef.current,
      },
      datasourceMessageHandler
    );
  }, [dataSource, datasourceMessageHandler, onConfigChange]);

  useEffect(() => {
    console.log(`adjust range with viewportRowCount ${viewportRowCount}`);
    adjustRange(viewportRowCount);
  }, [adjustRange, viewportRowCount]);

  return {
    data: data.current,
    getSelectedRows,
    range: rangeRef.current,
    setRange,
    dataSource,
  };
}

export class MovingWindow {
  public data: DataSourceRow[];
  public rowCount = 0;
  private range: WindowRange;

  constructor({ from, to }: VuuRange) {
    this.range = new WindowRange(from, to);
    //internal data is always 0 based, we add range.from to determine an offset
    this.data = new Array(to - from);
    this.rowCount = 0;
  }

  setRowCount = (rowCount: number) => {
    if (rowCount < this.data.length) {
      this.data.length = rowCount;
    }

    this.rowCount = rowCount;
  };

  add(data: DataSourceRow) {
    const [index] = data;
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      this.data[internalIndex] = data;

      // assign 'pre-selected' selection state. This allows us to assign a className
      // to a non selected row that immediately precedes a selected row. Useful for
      // styling. This cannot be achieved any other way as document order of row
      // elements does not necessarily reflect data order.
      const isSelected = data[SELECTED];
      const preSelected = this.data[internalIndex - 1]?.[SELECTED];
      if (preSelected === 0 && isSelected) {
        this.data[internalIndex - 1][SELECTED] = 2;
      } else if (preSelected === 2 && !isSelected) {
        this.data[internalIndex - 1][SELECTED] = 0;
      }
    }
  }

  getAtIndex(index: number) {
    return this.range.isWithin(index) &&
      this.data[index - this.range.from] != null
      ? this.data[index - this.range.from]
      : undefined;
  }

  isWithinRange(index: number) {
    return this.range.isWithin(index);
  }

  setRange({ from, to }: VuuRange) {
    if (from !== this.range.from || to !== this.range.to) {
      const [overlapFrom, overlapTo] = this.range.overlap(from, to);
      const newData = new Array(to - from);
      for (let i = overlapFrom; i < overlapTo; i++) {
        const data = this.getAtIndex(i);
        if (data) {
          const index = i - from;
          newData[index] = data;
        }
      }
      this.data = newData;
      this.range.from = from;
      this.range.to = to;
    }
  }

  getSelectedRows() {
    return this.data.filter((row) => row[SELECTED] === 1);
  }
}
