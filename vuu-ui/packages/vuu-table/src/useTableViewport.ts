/**
 * This hook measures and calculates the values needed to manage layout
 * and virtualisation of the table. This includes measurements required
 * to support pinned columns.
 */
import { RuntimeColumnDescriptor, TableHeadings } from "@finos/vuu-table-types";
import { useCallback, useMemo, useRef } from "react";
import { MeasuredSize } from "@finos/vuu-layout";
import {
  actualRowPositioning,
  RowAtPositionFunc,
  RowOffsetFunc,
  RowPositioning,
  virtualRowPositioning,
} from "@finos/vuu-utils";

export interface TableViewportHookProps {
  columns: RuntimeColumnDescriptor[];
  headerHeight: number;
  headings: TableHeadings;
  rowCount: number;
  rowHeight: number;
  size: MeasuredSize | undefined;
}

export interface ViewportMeasurements {
  appliedPageSize: number;
  contentHeight: number;
  horizontalScrollbarHeight: number;
  isVirtualScroll: boolean;
  maxScrollContainerScrollHorizontal: number;
  maxScrollContainerScrollVertical: number;
  pinnedWidthLeft: number;
  pinnedWidthRight: number;
  rowCount: number;
  contentWidth: number;
  totalHeaderHeight: number;
  verticalScrollbarWidth: number;
  viewportBodyHeight: number;
}

export interface TableViewportHookResult extends ViewportMeasurements {
  getRowAtPosition: RowAtPositionFunc;
  getRowOffset: RowOffsetFunc;
  setPctScrollTop: (scrollPct: number) => void;
}

// Too simplistic, it depends on rowHeight
// const MAX_RAW_ROWS = 1_000_000;
const MAX_RAW_ROWS = 100_000;

const UNMEASURED_VIEWPORT: TableViewportHookResult = {
  appliedPageSize: 0,
  contentHeight: 0,
  contentWidth: 0,
  getRowAtPosition: () => -1,
  getRowOffset: () => -1,
  horizontalScrollbarHeight: 0,
  isVirtualScroll: false,
  maxScrollContainerScrollHorizontal: 0,
  maxScrollContainerScrollVertical: 0,
  pinnedWidthLeft: 0,
  pinnedWidthRight: 0,
  rowCount: 0,
  setPctScrollTop: () => undefined,
  totalHeaderHeight: 0,
  verticalScrollbarWidth: 0,
  viewportBodyHeight: 0,
};

const measurePinnedColumns = (columns: RuntimeColumnDescriptor[]) => {
  let pinnedWidthLeft = 0;
  let pinnedWidthRight = 0;
  let unpinnedWidth = 0;
  for (const column of columns) {
    const { hidden, pin, width } = column;
    const visibleWidth = hidden ? 0 : width;
    if (pin === "left") {
      pinnedWidthLeft += visibleWidth;
    } else if (pin === "right") {
      pinnedWidthRight += visibleWidth;
    } else {
      unpinnedWidth += visibleWidth;
    }
  }
  return {
    pinnedWidthLeft: pinnedWidthLeft + 4,
    pinnedWidthRight: pinnedWidthRight + 4,
    unpinnedWidth,
  };
};

export const useTableViewport = ({
  columns,
  headerHeight,
  headings,
  rowCount,
  rowHeight,
  size,
}: TableViewportHookProps): TableViewportHookResult => {
  const pctScrollTopRef = useRef(0);
  // TODO we are limited by pixels not an arbitraty number of rows
  const pixelContentHeight = rowHeight * Math.min(rowCount, MAX_RAW_ROWS);
  const virtualContentHeight = rowCount * rowHeight;
  const virtualisedExtent = virtualContentHeight - pixelContentHeight;

  const { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth } = useMemo(
    () => measurePinnedColumns(columns),
    [columns]
  );

  const totalHeaderHeightRef = useRef(headerHeight);
  useMemo(() => {
    totalHeaderHeightRef.current = headerHeight * (1 + headings.length);
  }, [headerHeight, headings.length]);

  const [getRowOffset, getRowAtPosition, isVirtualScroll] =
    useMemo<RowPositioning>(() => {
      if (virtualisedExtent) {
        return virtualRowPositioning(
          rowHeight,
          virtualisedExtent,
          pctScrollTopRef
        );
      } else {
        return actualRowPositioning(rowHeight);
      }
    }, [virtualisedExtent, rowHeight]);

  const setPctScrollTop = useCallback((scrollPct: number) => {
    pctScrollTopRef.current = scrollPct;
  }, []);

  return useMemo(() => {
    if (size) {
      const { current: totalHeaderHeight } = totalHeaderHeightRef;
      // TODO determine this at runtime
      const scrollbarSize = 15;
      const contentWidth = pinnedWidthLeft + unpinnedWidth + pinnedWidthRight;
      const horizontalScrollbarHeight =
        contentWidth > size.width ? scrollbarSize : 0;
      const maxScrollContainerScrollVertical =
        pixelContentHeight -
        ((size?.height ?? 0) - horizontalScrollbarHeight) +
        totalHeaderHeight;
      const maxScrollContainerScrollHorizontal =
        contentWidth - size.width + pinnedWidthLeft;
      const visibleRows = (size.height - headerHeight) / rowHeight;
      const count = Number.isInteger(visibleRows)
        ? visibleRows
        : Math.ceil(visibleRows);
      const viewportBodyHeight = size.height - totalHeaderHeight;
      const verticalScrollbarWidth =
        pixelContentHeight > viewportBodyHeight ? scrollbarSize : 0;

      const appliedPageSize =
        count * rowHeight * (pixelContentHeight / virtualContentHeight);

      return {
        appliedPageSize,
        contentHeight: pixelContentHeight,
        contentWidth,
        getRowAtPosition,
        getRowOffset,
        isVirtualScroll,
        horizontalScrollbarHeight,
        maxScrollContainerScrollHorizontal,
        maxScrollContainerScrollVertical,
        pinnedWidthLeft,
        pinnedWidthRight,
        rowCount: count,
        setPctScrollTop,
        totalHeaderHeight,
        verticalScrollbarWidth,
        viewportBodyHeight,
      };
    } else {
      return UNMEASURED_VIEWPORT;
    }
  }, [
    getRowAtPosition,
    getRowOffset,
    headerHeight,
    isVirtualScroll,
    pinnedWidthLeft,
    unpinnedWidth,
    pinnedWidthRight,
    pixelContentHeight,
    rowHeight,
    setPctScrollTop,
    size,
    virtualContentHeight,
  ]);
};
