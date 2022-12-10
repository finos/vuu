import { RefObject, useCallback, useLayoutEffect, useRef } from "react";
import { Viewport } from "./dataTableTypes";

const getPctScroll = (container: HTMLElement) => {
  const { scrollLeft, scrollTop } = container;
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  const pctScrollLeft = scrollLeft / (scrollWidth - clientWidth);
  const pctScrollTop = scrollTop / (scrollHeight - clientHeight);
  return [pctScrollLeft, pctScrollTop, scrollLeft, scrollTop];
};

const getMaxScroll = (container: HTMLElement) => {
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  return [scrollWidth - clientWidth, scrollHeight - clientHeight];
};

export interface TableScrollHookProps {
  onRangeChange: (from: number, to: number) => void;
  rootRef: RefObject<HTMLDivElement>;
  rowHeight: number;
  scrollContainerRef: RefObject<HTMLDivElement>;
  tableContainerRef: RefObject<HTMLDivElement>;
  viewportHeight: number;
  viewport: Viewport;
}

export const useTableScroll = ({
  onRangeChange,
  rootRef,
  rowHeight,
  scrollContainerRef,
  tableContainerRef,
  viewport,
}: TableScrollHookProps) => {
  const firstRowRef = useRef<number>(-1);
  const rootScrolledRef = useRef(false);
  const {
    rowCount: viewportRowCount,
    maxScrollContainerScrollHorizontal: maxScrollLeft,
    maxScrollContainerScrollVertical: maxScrollTop,
  } = viewport;

  const scrollTable = useCallback(
    (scrollLeft, scrollTop) => {
      const { current: tableContainer } = tableContainerRef;
      if (tableContainer) {
        const firstRow = Math.floor(scrollTop / rowHeight);
        if (firstRow !== firstRowRef.current) {
          firstRowRef.current = firstRow;
          onRangeChange(firstRow, firstRow + viewportRowCount);
        }
        tableContainer.scrollLeft = scrollLeft;
        tableContainer.scrollTop = scrollTop;
      }
    },
    [onRangeChange, rowHeight, tableContainerRef, viewportRowCount]
  );

  const handleRootScroll = useCallback(() => {
    const { current: rootContainer } = rootRef;
    const { current: scrollContainer } = scrollContainerRef;
    if (rootContainer && scrollContainer) {
      const [pctScrollLeft, pctScrollTop, scrollLeft, scrollTop] =
        getPctScroll(rootContainer);
      rootScrolledRef.current = true;
      scrollContainer.scrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      scrollContainer.scrollTop = Math.round(pctScrollTop * maxScrollTop);
      scrollTable(scrollLeft, scrollTop);
    }
  }, [maxScrollLeft, maxScrollTop, rootRef, scrollContainerRef, scrollTable]);

  const handleScrollbarScroll = useCallback(() => {
    const { current: rootContainer } = rootRef;
    const { current: scrollContainer } = scrollContainerRef;
    const { current: rootScrolled } = rootScrolledRef;
    if (rootScrolled) {
      rootScrolledRef.current = false;
    } else if (rootContainer && scrollContainer) {
      const [pctScrollLeft, pctScrollTop] = getPctScroll(scrollContainer);
      const [maxScrollLeft, maxScrollTop] = getMaxScroll(rootContainer);
      const rootScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const rootScrollTop = Math.round(pctScrollTop * maxScrollTop);
      rootContainer.scrollLeft = rootScrollLeft;
      rootContainer.scrollTop = rootScrollTop;
      scrollTable(rootScrollLeft, rootScrollTop);
    }
  }, [rootRef, scrollContainerRef, scrollTable]);

  // TODO this is going to scroll to top in situations where this won't be right
  useLayoutEffect(() => {
    scrollTable(0, 0);
  }, [scrollTable]);

  return {
    handleScrollbarScroll,
    handleRootScroll,
  };
};
