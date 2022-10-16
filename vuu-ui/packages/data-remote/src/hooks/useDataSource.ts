import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WindowRange, getFullRange } from "@vuu-ui/utils";
import { DataSource, SubscribeCallback } from "../data-source";
import { VuuRange } from "@vuu-ui/data-types";
import { VuuUIRow } from "../vuuUIMessageTypes";

export interface DataSourceHookProps {
  dataSource: DataSource;
  renderBufferSize?: number;
}

export function useDataSource({
  dataSource,
  renderBufferSize = 10,
}: DataSourceHookProps): [
  VuuUIRow[],
  number,
  VuuRange,
  (range: VuuRange) => void
] {
  const [, forceUpdate] = useState(null);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rafHandle = useRef(null);
  const data = useRef<VuuUIRow[]>([]);
  const rangeRef = useRef({ from: 0, to: 10 });

  const dataWindow = useMemo(
    () => new MovingWindow(getFullRange(rangeRef.current, renderBufferSize)),
    [renderBufferSize]
  );

  const setData = useCallback(
    (updates) => {
      if (updates.length > 0 && updates[updates.length - 1] == undefined) {
        console.log(`useDataSource updates have empty data`, { updates });
      }

      for (const row of updates) {
        dataWindow.add(row);
      }
      // Why bother with the slice ?
      data.current = dataWindow.data.slice();
      if (
        data.current.length > 0 &&
        data.current[data.current.length - 1] == undefined
      ) {
        console.log(`dataWindow.data.slice() have empty data`, {
          data: data.current,
        });
      }

      hasUpdated.current = true;
    },
    [dataWindow]
  );

  const datasourceMessageHandler: SubscribeCallback = useCallback(
    (message) => {
      if (message.type === "subscribed") {
        if (message.filter) {
          console.log(`there is a filter ${JSON.stringify(message.filter)}`);
        }
      } else if (message.type === "viewport-update") {
        if (message.size !== undefined) {
          dataWindow.setRowCount(message.size);
        }
        if (message.rows) {
          setData(message.rows);
          console.table(message.rows);
          forceUpdate({});
        } else if (message.size !== undefined) {
          // TODO is this right ?
          data.current = dataWindow.data.slice();
          hasUpdated.current = true;
        }
      } else if (message.type === "filter") {
        const { filter, filterQuery } = message;
        console.log(`filter message ${filterQuery}`);
      }
    },
    [dataSource, dataWindow, setData]
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

  const setRange = useCallback(
    (range) => {
      rangeRef.current = range;
      const { from, to } = getFullRange(rangeRef.current, renderBufferSize);
      dataSource.setRange(from, to);
      dataWindow.setRange(from, to);
    },
    [dataSource]
  );

  // const refreshIfUpdated = useCallback(() => {
  //   if (isMounted.current) {
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
    const { from, to } = rangeRef.current;
    const fullRange = getFullRange({ from, to }, renderBufferSize);
    dataSource.setRange(fullRange.from, fullRange.to);
    dataWindow.setRange(fullRange.from, fullRange.to);
  }, [dataSource, dataWindow, renderBufferSize]);

  useEffect(() => {
    const { from, to } = getFullRange(rangeRef.current, renderBufferSize);
    dataSource.subscribe(
      {
        range: { from, to },
      },
      datasourceMessageHandler
    );
  }, [dataSource, datasourceMessageHandler, renderBufferSize]);

  useEffect(
    () => () => {
      dataSource.unsubscribe();
    },
    [dataSource]
  );

  return [
    data.current,
    dataWindow.rowCount,
    getFullRange(rangeRef.current, renderBufferSize),
    setRange,
  ];
}

export class MovingWindow {
  public data: any[];
  public rowCount: number = 0;

  private range: WindowRange;

  constructor({ from, to }: VuuRange) {
    this.range = new WindowRange(from, to);
    this.data = new Array(to - from);
  }

  setRowCount = (rowCount: number) => {
    if (rowCount < this.data.length) {
      this.data.length = rowCount;
    }
    this.rowCount = rowCount;
  };

  add(data: any[]) {
    const [index] = data;
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      this.data[internalIndex] = data;
      if (index === this.rowCount - 1) {
        this.data.length = internalIndex + 1;
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

  setRange(from: number, to: number) {
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
}
