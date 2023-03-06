import { useCallback, useRef } from "react";
import { Viewport } from "./dataTableTypes";

export interface ScrollRequestEnd {
  type: "scroll-end";
  direction: "home" | "end";
}

export interface ScrollRequestPage {
  type: "scroll-page";
  direction: "up" | "down";
}

export interface ScrollRequestDistance {
  type: "scroll-distance";
  distance: number;
}

export type ScrollRequest =
  | ScrollRequestPage
  | ScrollRequestDistance
  | ScrollRequestEnd;

export type ScrollRequestHandler = (request: ScrollRequest) => void;

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
  rowHeight: number;
  viewportHeight: number;
  viewport: Viewport;
}

export const useTableScroll = ({
  onRangeChange,
  rowHeight,
  viewport,
}: TableScrollHookProps) => {
  const scrollbarContainerRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const contentContainerScrolledRef = useRef(false);
  const firstRowRef = useRef<number>(-1);
  const {
    rowCount: viewportRowCount,
    maxScrollContainerScrollHorizontal: maxScrollLeft,
    maxScrollContainerScrollVertical: maxScrollTop,
  } = viewport;

  const scrollTable = useCallback(
    (scrollLeft, scrollTop) => {
      const { current: tableContainer } = tableContainerRef;
      if (tableContainer) {
        tableContainer.scrollTo({
          top: scrollTop,
          left: scrollLeft,
          behavior: "auto",
        });
      }
    },
    [tableContainerRef]
  );

  const handleTableContainerScroll = useCallback(() => {
    const { current: tableContainer } = tableContainerRef;
    if (tableContainer) {
      const { scrollTop } = tableContainer;
      const firstRow = Math.floor(scrollTop / rowHeight);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        onRangeChange(firstRow, firstRow + viewportRowCount);
      }
    }
  }, [onRangeChange, rowHeight, viewportRowCount]);

  const handleContentContainerScroll = useCallback(() => {
    const { current: rootContainer } = contentContainerRef;
    const { current: scrollContainer } = scrollbarContainerRef;
    if (rootContainer && scrollContainer) {
      const [pctScrollLeft, pctScrollTop, scrollLeft, scrollTop] =
        getPctScroll(rootContainer);
      contentContainerScrolledRef.current = true;
      scrollContainer.scrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      scrollContainer.scrollTop = Math.round(pctScrollTop * maxScrollTop);
      scrollTable(scrollLeft, scrollTop);
    }
  }, [
    maxScrollLeft,
    maxScrollTop,
    contentContainerRef,
    scrollbarContainerRef,
    scrollTable,
  ]);

  const handleScrollbarContainerScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: contentContainerScrolled } = contentContainerScrolledRef;
    if (contentContainerScrolled) {
      contentContainerScrolledRef.current = false;
    } else if (contentContainer && scrollbarContainer) {
      const [pctScrollLeft, pctScrollTop] = getPctScroll(scrollbarContainer);
      const [maxScrollLeft, maxScrollTop] = getMaxScroll(contentContainer);
      const rootScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const rootScrollTop = Math.round(pctScrollTop * maxScrollTop);
      contentContainer.scrollTo({
        left: rootScrollLeft,
        top: rootScrollTop,
        behavior: "auto",
      });
      scrollTable(rootScrollLeft, rootScrollTop);
    }
  }, [contentContainerRef, scrollbarContainerRef, scrollTable]);

  const requestScroll: ScrollRequestHandler = useCallback(
    (scrollRequest) => {
      const { current: scrollbarContainer } = scrollbarContainerRef;
      if (scrollbarContainer) {
        contentContainerScrolledRef.current = false;
        if (scrollRequest.type === "scroll-page") {
          const { clientHeight, scrollLeft, scrollTop } = scrollbarContainer;
          const { direction } = scrollRequest;
          const scrollBy = direction === "down" ? clientHeight : -clientHeight;
          const newScrollTop = Math.min(
            Math.max(0, scrollTop + scrollBy),
            viewport.maxScrollContainerScrollVertical
          );
          scrollbarContainer.scrollTo({
            top: newScrollTop,
            left: scrollLeft,
            behavior: "auto",
          });
        } else if (scrollRequest.type === "scroll-end") {
          const { direction } = scrollRequest;
          const scrollTo =
            direction === "end" ? viewport.maxScrollContainerScrollVertical : 0;
          scrollbarContainer.scrollTo({
            top: scrollTo,
            left: scrollbarContainer.scrollLeft,
            behavior: "auto",
          });
        }
      }
    },
    [viewport.maxScrollContainerScrollVertical]
  );

  return {
    onScrollbarContainerScroll: handleScrollbarContainerScroll,
    onContentContainerScroll: handleContentContainerScroll,
    onTableContainerScroll: handleTableContainerScroll,
    requestScroll,
    contentContainerRef,
    scrollbarContainerRef,
    tableContainerRef,
  };
};
