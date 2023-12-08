/**
 * This hook measures and calculates the values needed to manage layout
 * and virtualisation of the table. This includes measurements required
 * to support pinned columns.
 */
import {
  RuntimeColumnDescriptor,
  TableHeadings,
} from "@finos/vuu-datagrid-types";
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
  contentHeight: number;
  horizontalScrollbarHeight: number;
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
const MAX_RAW_ROWS = 1_500_000;

const UNMEASURED_VIEWPORT: TableViewportHookResult = {
  contentHeight: 0,
  contentWidth: 0,
  getRowAtPosition: () => -1,
  getRowOffset: () => -1,
  horizontalScrollbarHeight: 0,
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
  const appliedRowCount = Math.min(rowCount, MAX_RAW_ROWS);
  const appliedContentHeight = appliedRowCount * rowHeight;
  const virtualContentHeight = rowCount * rowHeight;
  const virtualisedExtent = virtualContentHeight - appliedContentHeight;

  const { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth } = useMemo(
    () => measurePinnedColumns(columns),
    [columns]
  );

  const [actualRowOffset, actualRowAtPosition] = useMemo<RowPositioning>(
    () => actualRowPositioning(rowHeight),
    [rowHeight]
  );

  const [getRowOffset, getRowAtPosition] = useMemo<RowPositioning>(() => {
    if (virtualisedExtent) {
      return virtualRowPositioning(
        rowHeight,
        virtualisedExtent,
        pctScrollTopRef
      );
    } else {
      return [actualRowOffset, actualRowAtPosition];
    }
  }, [actualRowAtPosition, actualRowOffset, virtualisedExtent, rowHeight]);

  const setPctScrollTop = useCallback((scrollPct: number) => {
    pctScrollTopRef.current = scrollPct;
  }, []);

  return useMemo(() => {
    if (size) {
      const headingsDepth = headings.length;
      const scrollbarSize = 15;
      const contentWidth = pinnedWidthLeft + unpinnedWidth + pinnedWidthRight;
      const horizontalScrollbarHeight =
        contentWidth > size.width ? scrollbarSize : 0;
      const totalHeaderHeight = headerHeight * (1 + headingsDepth);
      const maxScrollContainerScrollVertical =
        appliedContentHeight -
        ((size?.height ?? 0) - horizontalScrollbarHeight) +
        totalHeaderHeight;
      const maxScrollContainerScrollHorizontal =
        contentWidth - size.width + pinnedWidthLeft;
      const visibleRows = (size.height - headerHeight) / rowHeight;
      const count = Number.isInteger(visibleRows)
        ? visibleRows + 1
        : Math.ceil(visibleRows);
      const viewportBodyHeight = size.height - totalHeaderHeight;
      const verticalScrollbarWidth =
        appliedContentHeight > viewportBodyHeight ? scrollbarSize : 0;

      return {
        contentHeight: appliedContentHeight,
        getRowAtPosition,
        getRowOffset,
        horizontalScrollbarHeight,
        maxScrollContainerScrollHorizontal,
        maxScrollContainerScrollVertical,
        pinnedWidthLeft,
        pinnedWidthRight,
        rowCount: count,
        contentWidth,
        setPctScrollTop,
        totalHeaderHeight,
        verticalScrollbarWidth,
        viewportBodyHeight,
      };
    } else {
      return UNMEASURED_VIEWPORT;
    }
  }, [
    size,
    headings.length,
    pinnedWidthLeft,
    unpinnedWidth,
    pinnedWidthRight,
    appliedContentHeight,
    headerHeight,
    rowHeight,
    getRowAtPosition,
    getRowOffset,
    setPctScrollTop,
  ]);
};
