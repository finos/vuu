import { isMeasured, Size } from "./useMeasuredSize";
import { RefObject, useLayoutEffect, useMemo, useState } from "react";
import { Column, TableMeasurements } from "./dataTableTypes";

export interface TableViewportHookProps {
  columns: Column[];
  headerHeight: number;
  rootRef: RefObject<HTMLDivElement>;
  rowCount: number;
  rowHeight: number;
  size: Size;
}

type ColumnMeasurements = {
  pinnedWidthLeft: number;
  unpinnedWidth: number;
};

const measureColumns = (columns: Column[]): ColumnMeasurements => {
  let pinnedWidthLeft = 0;
  let unpinnedWidth = 0;
  const defaultWidth = 100;
  for (let i = 0; i < columns.length; i++) {
    const column = columns[i];
    const { pin, width = defaultWidth } = column;
    if (pin === "left") {
      column.pinnedLeftOffset = pinnedWidthLeft;
      pinnedWidthLeft += width;
    } else {
      unpinnedWidth += width;
    }
  }
  return { pinnedWidthLeft, unpinnedWidth };
};

export const useTableViewport = ({
  columns,
  headerHeight,
  rootRef,
  rowCount,
  rowHeight,
  size,
}: TableViewportHookProps) => {
  const { pinnedWidthLeft, unpinnedWidth } = useMemo(
    () => measureColumns(columns),
    [columns]
  );
  const { pixelHeight: applyHeight, pixelWidth: applyWidth } = size;
  const sizeIsMeasured = isMeasured(size);
  const scrollbarSize = 15;
  const contentHeight = rowCount * rowHeight;
  const scrollContentHeight = headerHeight + contentHeight + scrollbarSize;
  const scrollContentWidth = pinnedWidthLeft + unpinnedWidth;

  const maxScrollContainerScrollHorizontal =
    scrollContentWidth - applyWidth + pinnedWidthLeft;
  const maxScrollContainerScrollVertical =
    contentHeight + headerHeight - (applyHeight - headerHeight - scrollbarSize);

  const [measurements, setMeasurements] = useState<TableMeasurements>({
    contentHeight,
    left: -1,
    right: -1,
    scrollbarSize,
    scrollContentHeight,
    status: "unmeasured",
    top: -1,
  });

  const [viewportRowCount, fillerHeight] = useMemo(() => {
    const visibleRows = (size.pixelHeight - headerHeight) / rowHeight;
    const count = Number.isInteger(visibleRows)
      ? visibleRows + 1
      : Math.ceil(visibleRows);
    const fillerHeight = (rowCount - count) * rowHeight;
    return [count, fillerHeight];
  }, [headerHeight, size.pixelHeight, rowCount, rowHeight]);

  useLayoutEffect(() => {
    if (rootRef.current && sizeIsMeasured) {
      const { left, right, top } = rootRef.current.getBoundingClientRect();
      setMeasurements({
        contentHeight,
        left,
        status: "measured",
        right,
        scrollbarSize,
        scrollContentHeight,
        top,
      });
    }
  }, [contentHeight, rootRef, scrollContentHeight, sizeIsMeasured]);

  return {
    measurements,
    viewport: {
      fillerHeight,
      maxScrollContainerScrollHorizontal,
      maxScrollContainerScrollVertical,
      pinnedWidthLeft,
      rowCount: viewportRowCount,
      scrollContentWidth,
    },
  };
};
