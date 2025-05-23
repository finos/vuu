import { RefCallback, useCallback, useMemo, useRef } from "react";
import { RowRenderingHook } from "./tanstack-table-types";

type ScrollPos = {
  scrollLeft: number;
  scrollTop: number;
};

export const useVirtualisedScrollRowRendering: RowRenderingHook = ({
  headerHeight,
  renderBufferSize = 20,
  rowHeight,
  setRange,
  totalRowCount,
}) => {
  const firstRowRef = useRef<number>(0);
  const contentHeight = rowHeight * totalRowCount;
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const contentContainerPosRef = useRef<ScrollPos>({
    scrollTop: 0,
    scrollLeft: 0,
  });
  const viewportRowCountRef = useRef(0);
  const totalRowCountRef = useRef(totalRowCount);

  const setViewportPosition = useCallback(
    (firstRow: number) => {
      const lastRow = firstRow + viewportRowCountRef.current;
      const from = Math.max(0, firstRow - renderBufferSize);
      const to = Math.min(lastRow + renderBufferSize, totalRowCountRef.current);
      setRange?.({ from, to });
    },
    [renderBufferSize, setRange],
  );

  const handleVerticalScroll = useCallback(
    (scrollTop: number) => {
      contentContainerPosRef.current.scrollTop = scrollTop;
      const firstRow = Math.round(scrollTop / rowHeight);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        setViewportPosition(firstRow);
      }
    },
    [rowHeight, setViewportPosition],
  );

  const setViewportRowCount = useCallback(
    (viewportRowCount: number) => {
      viewportRowCountRef.current = viewportRowCount;
      setViewportPosition(0);
    },
    [setViewportPosition],
  );

  useMemo(() => {
    if (totalRowCountRef.current !== totalRowCount) {
      totalRowCountRef.current = totalRowCount;
      setViewportPosition(firstRowRef.current);
    }
  }, [setViewportPosition, totalRowCount]);

  const setContentHeight = useCallback(
    (height: number) => {
      console.log(
        `[useVirtualisedScrollRowRendering] set contentHeight ${height} (headerHeight = ${headerHeight})`,
      );
      setViewportRowCount(Math.ceil((height - headerHeight) / rowHeight));
    },
    [headerHeight, rowHeight, setViewportRowCount],
  );

  const handleScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollPos } = contentContainerPosRef;

    if (contentContainer) {
      const { scrollTop } = contentContainer;

      if (scrollPos.scrollTop !== scrollTop) {
        handleVerticalScroll(scrollTop);
      }
    }
  }, [handleVerticalScroll]);

  const scrollableContainerRef = useCallback<RefCallback<HTMLDivElement>>(
    (el) => {
      if (el) {
        contentContainerRef.current = el;
        const { height } = el.getBoundingClientRect();
        el.addEventListener("scroll", handleScroll);
        setContentHeight(height);
      }
    },
    [handleScroll, setContentHeight],
  );

  return { contentHeight, scrollableContainerRef };
};
