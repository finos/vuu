/**
 * This hook measures and calculates the values needed to manage layout
 * and virtualisation of the table. This includes measurements required
 * to support pinned columns.
 */
import { RuntimeColumnDescriptor, TableHeadings } from "@finos/vuu-table-types";
import { MeasuredSize } from "@finos/vuu-ui-controls";
import {
  actualRowPositioning,
  measurePinnedColumns,
  RowAtPositionFunc,
  RowOffsetFunc,
  RowPositioning,
  virtualRowPositioning,
} from "@finos/vuu-utils";
import { useCallback, useMemo, useRef } from "react";

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
  setInSituRowOffset: (rowIndexOffset: number) => void;
  setScrollTop: (scrollTop: number, scrollPct: number) => void;
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
  setInSituRowOffset: () => undefined,
  setScrollTop: () => undefined,
  totalHeaderHeight: 0,
  verticalScrollbarWidth: 0,
  viewportBodyHeight: 0,
};

export const useTableViewport = ({
  columns,
  headerHeight,
  headings,
  rowCount,
  rowHeight,
  size,
}: TableViewportHookProps): TableViewportHookResult => {
  const inSituRowOffsetRef = useRef(0);
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
        const [_getRowOffset, getRowAtPosition, _isVirtual] =
          virtualRowPositioning(rowHeight, virtualisedExtent, pctScrollTopRef);
        const getOffset: RowOffsetFunc = (row) => {
          return _getRowOffset(row, inSituRowOffsetRef.current);
        };
        return [getOffset, getRowAtPosition, _isVirtual];
      } else {
        return actualRowPositioning(rowHeight);
      }
    }, [virtualisedExtent, rowHeight]);

  const setScrollTop = useCallback((_: number, scrollPct: number) => {
    pctScrollTopRef.current = scrollPct;
  }, []);

  /**
   * The inSituRowOffset is used to simulate scrolling through a very large dataset
   * without actually moving the scroll position. It is triggered by keyboard
   * navigation. A simulated scroll operation will always be of one or more rows.
   * A value of zero is a request to reset the offset.
   */
  const setInSituRowOffset = useCallback((rowIndexOffset: number) => {
    if (rowIndexOffset === 0) {
      inSituRowOffsetRef.current = 0;
    } else {
      inSituRowOffsetRef.current = Math.max(
        0,
        inSituRowOffsetRef.current + rowIndexOffset
      );
    }
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
        setInSituRowOffset,
        setScrollTop,
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
    setInSituRowOffset,
    setScrollTop,
    size,
    virtualContentHeight,
  ]);
};
