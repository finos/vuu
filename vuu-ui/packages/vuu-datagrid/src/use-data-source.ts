import { DataSourceRow, SubscribeCallback } from "@vuu-ui/vuu-data";
import { VuuDataRow, VuuRange } from "../../vuu-protocol-types";
import { getFullRange, metadataKeys, WindowRange } from "@vuu-ui/vuu-utils";
import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import GridContext from "./grid-context";

const { RENDER_IDX } = metadataKeys;

const byKey = (row1: VuuDataRow, row2: VuuDataRow) =>
  row1[RENDER_IDX] - row2[RENDER_IDX];

type SubscriptionDetails = {
  columnNames: string[];
  range: { from: number; to: number };
};

// const uniqueKeys = rows => {
//   const keys = rows.map(row => row[1]).filter(i => i !== undefined);
//   const uniqueKeys = new Set(keys);
//   return uniqueKeys.size === keys.length;
// }

//TODO allow subscription details to be set before subscribe call
export default function useDataSource(
  subscriptionDetails: SubscriptionDetails,
  gridModel,
  onConfigChange,
  onSizeChange
) {
  const { dataSource, dispatchGridAction, dispatchGridModelAction } =
    useContext(GridContext);
  const [, forceUpdate] = useState(null);
  const isMounted = useRef(true);
  const hasUpdated = useRef(false);
  const rafHandle = useRef(null);
  const data = useRef([]);

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
        dispatchGridModelAction({
          type: "set-available-columns",
          columns: message.columns,
        });
        if (message.filter) {
          dispatchGridModelAction({ type: "filter", filter: message.filter });
        }
      } else if (message.type === "viewport-update") {
        const sizeChanged = message.size !== undefined;
        if (sizeChanged) {
          onSizeChange(message.size);
          dataWindow.setRowCount(message.size);
        }
        if (message.rows) {
          setData(message.rows);
        } else if (sizeChanged) {
          // TODO is this right ?
          data.current = dataWindow.data.slice().sort(byKey);
          hasUpdated.current = true;
        }
      } else if (message.type === "sort") {
        const { sort } = message;
        dispatchGridModelAction(message);
        onConfigChange({ sort });
      } else if (message.type === "aggregate") {
        const { aggregations } = message;
        console.log(
          `[useDataSource] aggregations ACKED ${JSON.stringify(aggregations)}`
        );
        dispatchGridModelAction({ type: "set-aggregations", aggregations });
        onConfigChange({ aggregations });
      } else if (message.type === "groupBy") {
        const { groupBy } = message;
        dispatchGridModelAction({ type: "group", groupBy });
        onConfigChange({ group: groupBy });
      } else if (message.type === "filter") {
        const { filter, filterQuery } = message;
        dispatchGridModelAction(message);
        onConfigChange({ filter, filterQuery });
        dataSource.emit("filter", filter);
      } else {
        dispatchGridAction(message);
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
        dataSource.rowCount
      );
      dataSource.setRange(range.from, range.to);
      dataWindow.setRange(range.from, range.to);
    },
    [dataSource, dataWindow, gridModel.renderBufferSize]
  );

  useEffect(() => {
    const { range, ...rest } = subscriptionDetails;
    const { from, to } = getFullRange(range, gridModel.renderBufferSize);
    dataSource.subscribe(
      {
        ...rest,
        range: { from, to },
      },
      datasourceMessageHandler
    );
  }, [
    dataSource,
    datasourceMessageHandler,
    gridModel.renderBufferSize,
    subscriptionDetails,
  ]);

  useEffect(
    () => () => {
      dataSource.unsubscribe();
    },
    [dataSource]
  );

  return [data.current, setRange, dataSource];
}

export class MovingWindow {
  public data: DataSourceRow[];
  public rowCount: number = 0;
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

    // if (rowCount < this.rowCount){
    //   const [overlapFrom, overlapTo] = this.range.overlap(rowCount, this.rowCount);
    //   for (let i=overlapFrom;i<overlapTo;i++){
    //     const rowIndex = i - this.range.from;
    //     if (i === rowCount){
    //       break;
    //     }
    //     this.data[rowIndex] = undefined;
    //   }
    // }
    this.rowCount = rowCount;
  };

  add(data: DataSourceRow) {
    const [index] = data;
    //onsole.log(`ingest row at rowIndex ${index} [${index - this.range.from}]`)
    if (this.isWithinRange(index)) {
      const internalIndex = index - this.range.from;
      this.data[internalIndex] = data;
      // if (!sequential(this.data)){
      //   debugger;
      // }
    }
  }

  getAtIndex(index: number) {
    return this.range.isWithin(index) &&
      this.data[index - this.range.from] != null
      ? this.data[index - this.range.from]
      : undefined;
  }

  isWithinRange(index) {
    return this.range.isWithin(index);
  }

  setRange(from, to) {
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
