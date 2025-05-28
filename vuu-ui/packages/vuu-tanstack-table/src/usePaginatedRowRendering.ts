import { useCallback, useRef } from "react";
import { useMeasuredHeight } from "./useMeasuredHeight";
import { RowRenderingHook } from "./tanstack-table-types";

export const usePaginatedRowRendering: RowRenderingHook = ({
  rowHeight,
  setRange,
  totalRowCount,
}) => {
  const viewportRowCountRef = useRef(0);

  const calculateRange = useCallback(
    (firstRow: number) => {
      const lastRow = firstRow + viewportRowCountRef.current;
      console.log(`firstRow ${firstRow} lastRow ${lastRow}`);
      const from = Math.max(0, firstRow);
      const to = Math.min(lastRow, totalRowCount);
      console.log(`[usePaginatedRowRendering] setRange ${from}:${to}`);
      setRange({ from, to });
    },
    [setRange, totalRowCount],
  );

  const setViewportRowCount = useCallback(
    (viewportRowCount: number) => {
      console.log(
        `[usePaginatedRowRendering] setViewportRowCount ${viewportRowCount}`,
      );
      viewportRowCountRef.current = viewportRowCount;
      calculateRange(0);
    },
    [calculateRange],
  );

  const onHeightMeasured = useCallback(
    (height: number) => {
      console.log(`[usePaginatedRowRendering] set contentHeight ${height}`);
      setViewportRowCount(Math.floor(height / rowHeight));
    },
    [rowHeight, setViewportRowCount],
  );

  const { measuredHeight, measuredRef } = useMeasuredHeight({
    onHeightMeasured,
  });

  console.log(`[usePaginatedRowRendering] measuredHeight ${measuredHeight}`);

  return {
    contentHeight: "100%",
    tableBodyRef: measuredRef,
  };
};
