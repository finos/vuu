/**
 * This hook measures and calculates the values needed to manage layout
 * and virtualisation of the table. This includes measurements required
 * to support pinned columns.
 */
import { RuntimeColumnDescriptor } from "@finos/vuu-table-types";
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
  rowCount: number;
  rowHeight: number;
  /**
   * this is the solid left/right `border` rendered on the selection block
   */
  selectionEndSize?: number;
  size: MeasuredSize | undefined;
}

export interface ViewportMeasurements {
  appliedPageSize: number;
  contentHeight: number;
  horizontalScrollbarHeight: number;
  isVirtualScroll: boolean;
  pinnedWidthLeft: number;
  pinnedWidthRight: number;
  rowCount: number;
  contentWidth: number;
  totalHeaderHeight: number;
  verticalScrollbarWidth: number;
  viewportBodyHeight: number;
  viewportWidth: number;
}

export interface TableViewportHookResult extends ViewportMeasurements {
  getRowAtPosition: RowAtPositionFunc;
  getRowOffset: RowOffsetFunc;
  setInSituRowOffset: (rowIndexOffset: number) => void;
  setScrollTop: (scrollTop: number, scrollPct: number) => void;
}

// Too simplistic, it depends on rowHeight
const MAX_PIXEL_HEIGHT = 10_000_000;

const UNMEASURED_VIEWPORT: TableViewportHookResult = {
  appliedPageSize: 0,
  contentHeight: 0,
  contentWidth: 0,
  getRowAtPosition: () => -1,
  getRowOffset: () => -1,
  horizontalScrollbarHeight: 0,
  isVirtualScroll: false,
  pinnedWidthLeft: 0,
  pinnedWidthRight: 0,
  rowCount: 0,
  setInSituRowOffset: () => undefined,
  setScrollTop: () => undefined,
  totalHeaderHeight: 0,
  verticalScrollbarWidth: 0,
  viewportBodyHeight: 0,
  viewportWidth: 0,
};

export const useTableViewport = ({
  columns,
  headerHeight,
  rowCount,
  rowHeight,
  selectionEndSize = 4,
  size,
}: TableViewportHookProps): TableViewportHookResult => {
  const inSituRowOffsetRef = useRef(0);
  const pctScrollTopRef = useRef(0);
  // TODO we are limited by pixels not an arbitraty number of rows
  const pixelContentHeight = Math.min(rowHeight * rowCount, MAX_PIXEL_HEIGHT);
  const virtualContentHeight = rowCount * rowHeight;
  const virtualisedExtent = virtualContentHeight - pixelContentHeight;

  const { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth } = useMemo(
    () => measurePinnedColumns(columns, selectionEndSize),
    [columns, selectionEndSize]
  );

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
      // TODO determine this at runtime
      const scrollbarSize = 15;
      const contentWidth = pinnedWidthLeft + unpinnedWidth + pinnedWidthRight;
      const horizontalScrollbarHeight =
        contentWidth > size.width ? scrollbarSize : 0;
      const visibleRows = (size.height - headerHeight) / rowHeight;
      const count = Number.isInteger(visibleRows)
        ? visibleRows
        : Math.ceil(visibleRows);
      const viewportBodyHeight = size.height - headerHeight;
      const verticalScrollbarWidth =
        pixelContentHeight > viewportBodyHeight ? scrollbarSize : 0;

      const appliedPageSize =
        count * rowHeight * (pixelContentHeight / virtualContentHeight);

      const viewportWidth = size.width;

      return {
        appliedPageSize,
        contentHeight: pixelContentHeight,
        contentWidth,
        getRowAtPosition,
        getRowOffset,
        isVirtualScroll,
        horizontalScrollbarHeight,
        pinnedWidthLeft,
        pinnedWidthRight,
        rowCount: count,
        setInSituRowOffset,
        setScrollTop,
        totalHeaderHeight: headerHeight,
        verticalScrollbarWidth,
        viewportBodyHeight,
        viewportWidth,
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
