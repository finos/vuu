/**
 * This hook measures and calculates the values needed to manage layout
 * and virtualisation of the table. This includes measurements required
 * to support pinned columns.
 */
import { KeyedColumnDescriptor } from "@finos/vuu-datagrid-types";
import { useMemo } from "react";
import { MeasuredSize } from "./useMeasuredContainer";

export interface TableViewportHookProps {
  columns: KeyedColumnDescriptor[];
  headerHeight: number;
  rowCount: number;
  rowHeight: number;
  size?: MeasuredSize;
}

export interface ViewportMeasurements {
  fillerHeight: number;
  maxScrollContainerScrollHorizontal: number;
  maxScrollContainerScrollVertical: number;
  pinnedWidthLeft: number;
  pinnedWidthRight: number;
  rowCount: number;
  scrollContentHeight: number;
  scrollbarSize: number;
  scrollContentWidth: number;
}

const UNMEASURED_VIEWPORT = {
  fillerHeight: 0,
  maxScrollContainerScrollHorizontal: 0,
  maxScrollContainerScrollVertical: 0,
  pinnedWidthLeft: 0,
  pinnedWidthRight: 0,
  rowCount: 0,
  scrollContentHeight: 0,
  scrollbarSize: 0,
  scrollContentWidth: 0,
};

const measurePinnedColumns = (columns: KeyedColumnDescriptor[]) => {
  let pinnedWidthLeft = 0;
  let pinnedWidthRight = 0;
  let unpinnedWidth = 0;
  for (const column of columns) {
    const { pin, width } = column;
    if (pin === "left") {
      pinnedWidthLeft += width;
    } else if (pin === "right") {
      pinnedWidthRight += width;
    } else {
      unpinnedWidth += width;
    }
  }
  return { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth };
};

export const useTableViewport = ({
  columns,
  headerHeight,
  rowCount,
  rowHeight,
  size,
}: TableViewportHookProps) => {
  const { pinnedWidthLeft, pinnedWidthRight, unpinnedWidth } = useMemo(
    () => measurePinnedColumns(columns),
    [columns]
  );

  const viewportMeasurements = useMemo(() => {
    if (size) {
      const scrollbarSize = 15;
      const contentHeight = rowCount * rowHeight;
      const scrollContentWidth =
        pinnedWidthLeft + unpinnedWidth + pinnedWidthRight;
      const maxScrollContainerScrollVertical =
        contentHeight +
        headerHeight -
        ((size?.height ?? 0) - headerHeight - scrollbarSize);
      const maxScrollContainerScrollHorizontal =
        scrollContentWidth - size.width + pinnedWidthLeft;

      const visibleRows = (size.height - headerHeight) / rowHeight;
      const count = Number.isInteger(visibleRows)
        ? visibleRows + 1
        : Math.ceil(visibleRows);
      return {
        fillerHeight: (rowCount - count) * rowHeight,
        maxScrollContainerScrollHorizontal,
        maxScrollContainerScrollVertical,
        pinnedWidthLeft,
        pinnedWidthRight,
        rowCount: count,
        scrollContentHeight: headerHeight + contentHeight + scrollbarSize,
        scrollbarSize,
        scrollContentWidth,
      };
    } else {
      return UNMEASURED_VIEWPORT;
    }
  }, [
    headerHeight,
    pinnedWidthLeft,
    pinnedWidthRight,
    rowCount,
    rowHeight,
    size,
    unpinnedWidth,
  ]);

  return viewportMeasurements;
};
