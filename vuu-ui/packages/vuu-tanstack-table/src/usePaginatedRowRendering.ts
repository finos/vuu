import { useCallback, useRef } from "react";
import { useMeasuredHeight } from "./useMeasuredHeight";
import { RowRenderingHook } from "./tanstack-table-types";

export const usePaginatedRowRendering: RowRenderingHook = ({
  rowHeight,
  setRange,
}) => {
  const viewportRowCountRef = useRef(0);

  const setViewportRowCount = useCallback(
    (viewportRowCount: number) => {
      console.log(
        `[usePaginatedRowRendering] setViewportRowCount ${viewportRowCount}`,
      );
      viewportRowCountRef.current = viewportRowCount;

      setRange({ from: 0, to: viewportRowCount });
    },
    [setRange],
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
