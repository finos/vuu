import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { getColumnsInViewport, itemsChanged } from "@finos/vuu-utils";
import { VuuRange } from "@finos/vuu-protocol-types";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ViewportMeasurements } from "./useTableViewport";

export interface VirtualViewportHookProps {
  columns: KeyedColumnDescriptor[];
  rowHeight: number;
  setRange: (range: VuuRange) => void;
  viewportMeasurements: ViewportMeasurements;
}
export interface VirtualViewportHookResult {
  onHorizontalScroll: (scrollLeft: number) => void;
  onVerticalScroll: (scrollTop: number) => void;
  columnsWithinViewport: KeyedColumnDescriptor[];
  virtualColSpan: number;
}

export const useVirtualViewport = ({
  columns,
  rowHeight,
  setRange,
  viewportMeasurements,
}: VirtualViewportHookProps): VirtualViewportHookResult => {
  const firstRowRef = useRef<number>(-1);
  const {
    rowCount: viewportRowCount,
    scrollContentWidth: contentWidth,
    maxScrollContainerScrollHorizontal,
  } = viewportMeasurements;
  const availableWidth = contentWidth - maxScrollContainerScrollHorizontal;
  const scrollLeftRef = useRef(0);

  const [visibleColumns, preSpan] = useMemo(
    () =>
      getColumnsInViewport(
        columns,
        scrollLeftRef.current,
        scrollLeftRef.current + availableWidth
      ),
    [availableWidth, columns]
  );

  const preSpanRef = useRef(preSpan);

  useEffect(() => {
    setColumnsWithinViewport(visibleColumns);
  }, [visibleColumns]);

  const [columnsWithinViewport, setColumnsWithinViewport] =
    useState<KeyedColumnDescriptor[]>(visibleColumns);

  const handleHorizontalScroll = useCallback(
    (scrollLeft: number) => {
      scrollLeftRef.current = scrollLeft;
      const [visibleColumns, pre] = getColumnsInViewport(
        columns,
        scrollLeft,
        scrollLeft + availableWidth
      );
      if (itemsChanged(columnsWithinViewport, visibleColumns)) {
        preSpanRef.current = pre;

        setColumnsWithinViewport(visibleColumns);
      }
    },
    [availableWidth, columns, columnsWithinViewport]
  );

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      const firstRow = Math.floor(scrollTop / rowHeight);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        setRange({ from: firstRow, to: firstRow + viewportRowCount });
      }
    },
    [rowHeight, setRange, viewportRowCount]
  );

  return {
    columnsWithinViewport,
    onHorizontalScroll: handleHorizontalScroll,
    onVerticalScroll: handleVerticalScroll,
    /** number of leading columns not rendered because of virtualization  */
    virtualColSpan: preSpanRef.current,
  };
};
