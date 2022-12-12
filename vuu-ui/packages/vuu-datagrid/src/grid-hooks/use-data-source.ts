import {
  ConfigChangeHandler,
  DataSourceRow,
  SubscribeCallback,
} from "@vuu-ui/vuu-data";
import {
  VuuDataRow,
  VuuRange,
  VuuSort,
  VuuSortCol,
} from "@vuu-ui/vuu-protocol-types";
import {
  getFullRange,
  metadataKeys,
  toColumnDescriptor,
  WindowRange,
} from "@vuu-ui/vuu-utils";
import { useViewContext } from "@vuu-ui/vuu-layout";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useGridContext } from "../grid-context";
import { GridModelType } from "../grid-model/gridModelTypes";

const { RENDER_IDX } = metadataKeys;

const byKey = (row1: VuuDataRow, row2: VuuDataRow) =>
  row1[RENDER_IDX] - row2[RENDER_IDX];

export type SubscriptionDetails = {
  columnNames?: string[];
  range: { from: number; to: number };
  sort?: VuuSortCol[];
};

//TODO allow subscription details to be set before subscribe call
export function useDataSource(
  subscriptionDetails: SubscriptionDetails,
  gridModel: GridModelType,
  onConfigChange?: ConfigChangeHandler,
  onSizeChange?: (size: number) => void
) {
  const { dataSource, dispatchGridAction, dispatchGridModelAction } =
    useGridContext();
  const { title } = useViewContext();
  const [, forceUpdate] = useState<unknown>(null);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rafHandle = useRef<number | null>(null);
  const data = useRef<DataSourceRow[]>([]);

  const dataWindow = useMemo(
    () =>
      new MovingWindow(
        getFullRange(subscriptionDetails.range, gridModel.renderBufferSize)
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gridModel.renderBufferSize]
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
        dispatchGridModelAction?.({
          type: "set-available-columns",
          columns: message.columns.map(toColumnDescriptor),
        });
        if (message.filter) {
          dispatchGridModelAction?.({ type: "filter", filter: message.filter });
        }
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
      } else if (
        message.type === "sort" ||
        message.type === "aggregate" ||
        message.type === "filter" ||
        message.type === "groupBy"
      ) {
        dispatchGridModelAction?.(message);
        onConfigChange?.(message);
        if (message.type === "filter") {
          dataSource?.emit("filter", message.filter);
        }
      } else {
        // TODO
        dispatchGridAction?.(message as any);
      }
    },
    [
      dataSource,
      dataWindow,
      dispatchGridAction,
      dispatchGridModelAction,
      onConfigChange,
      onSizeChange,
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

  const setRange = useCallback(
    (from, to) => {
      const range = getFullRange(
        { from, to },
        gridModel.renderBufferSize,
        dataSource?.rowCount
      );
      dataSource?.setRange(range.from, range.to);
      dataWindow.setRange(range.from, range.to);
    },
    [dataSource, dataWindow, gridModel.renderBufferSize]
  );

  useEffect(() => {
    const { range, ...rest } = subscriptionDetails;
    const { from, to } = getFullRange(range, gridModel.renderBufferSize);
    dataSource?.subscribe(
      {
        ...rest,
        range: { from, to },
        title,
      },
      datasourceMessageHandler
    );
  }, [
    dataSource,
    datasourceMessageHandler,
    gridModel.renderBufferSize,
    subscriptionDetails,
    title,
  ]);

  return {
    data: data.current,
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
