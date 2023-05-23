import {
  KeyedColumnDescriptor,
  TableHeadings,
} from "@finos/vuu-datagrid-types";
import {
  actualRowPositioning,
  RowAtPositionFunc,
  RowOffsetFunc,
  RowPositioning,
} from "@finos/vuu-utils";
import { useCallback, useMemo, useRef } from "react";

// TODO copied from useMeasuresSize
export interface MeasuredSize {
  height: number;
  width: number;
}

export interface TableViewportHookProps {
  columns: KeyedColumnDescriptor[];
  headerHeight: number;
  headings: TableHeadings;
  rowCount: number;
  rowHeight: number;
  size?: MeasuredSize;
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

const measurePinnedColumns = (columns: KeyedColumnDescriptor[]) => {
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
  return { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth };
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

  const { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth } = useMemo(
    () => measurePinnedColumns(columns),
    [columns]
  );

  const [actualRowOffset, actualRowAtPosition] = useMemo<RowPositioning>(
    () => actualRowPositioning(rowHeight),
    [rowHeight]
  );

  // WOn't be using this until we implement the > 1.5 mill rows code
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
      const visibleRows = (size.height - headerHeight) / rowHeight;
      const count = Number.isInteger(visibleRows)
        ? visibleRows + 1
        : Math.ceil(visibleRows);
      const viewportBodyHeight = size.height - totalHeaderHeight;
      const verticalScrollbarWidth =
        appliedContentHeight > viewportBodyHeight ? scrollbarSize : 0;

      return {
        contentHeight: 30000,
        contentWidth,
        getRowAtPosition: actualRowAtPosition,
        getRowOffset: actualRowOffset,
        height: 700,
        horizontalScrollbarHeight,
        maxScrollContainerScrollHorizontal: 0,
        maxScrollContainerScrollVertical: 0,
        pinnedWidthLeft: 0,
        pinnedWidthRight: 0,
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
    actualRowAtPosition,
    actualRowOffset,
    appliedContentHeight,
    headerHeight,
    headings.length,
    pinnedWidthLeft,
    pinnedWidthRight,
    rowHeight,
    setPctScrollTop,
    size,
    unpinnedWidth,
  ]);
};
