import { useCallback, useLayoutEffect, useRef } from "react";
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
        tableContainer.scrollLeft = scrollLeft;
        tableContainer.scrollTop = scrollTop;
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
    // console.log("%chandleContentContainerScroll", "color: blue");
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
    // console.log(
    //   `%chandleScrollbarContainerScroll, rootScrolled ? ${contentContainerScrolled}`,
    //   "color: green"
    // );
    if (contentContainerScrolled) {
      contentContainerScrolledRef.current = false;
    } else if (contentContainer && scrollbarContainer) {
      const [pctScrollLeft, pctScrollTop] = getPctScroll(scrollbarContainer);
      const [maxScrollLeft, maxScrollTop] = getMaxScroll(contentContainer);
      const rootScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const rootScrollTop = Math.round(pctScrollTop * maxScrollTop);
      contentContainer.scrollLeft = rootScrollLeft;
      // console.log(
      //   `%cset contentCOntainer scrolltop = ${rootScrollTop}`,
      //   "color: green"
      // );
      contentContainer.scrollTop = rootScrollTop;
      scrollTable(rootScrollLeft, rootScrollTop);
    }
  }, [contentContainerRef, scrollbarContainerRef, scrollTable]);

  const requestScroll: ScrollRequestHandler = useCallback(
    (scrollRequest) => {
      const { current: scrollbarContainer } = scrollbarContainerRef;
      if (scrollbarContainer) {
        contentContainerScrolledRef.current = false;
        if (scrollRequest.type === "scroll-page") {
          const { clientHeight, scrollTop } = scrollbarContainer;
          const { direction } = scrollRequest;
          const scrollBy = direction === "down" ? clientHeight : -clientHeight;
          // console.log(
          //   `page ${direction} (by ${scrollBy}), current scrollTop ${scrollTop}
          //    set scrollbar container scrollTop to ${Math.min(
          //      Math.max(0, scrollTop + scrollBy),
          //      viewport.maxScrollContainerScrollVertical
          //    )}`
          // );
          scrollbarContainer.scrollTop = Math.min(
            Math.max(0, scrollTop + scrollBy),
            viewport.maxScrollContainerScrollVertical
          );
        } else if (scrollRequest.type === "scroll-end") {
          const { direction } = scrollRequest;
          const scrollTo =
            direction === "end" ? viewport.maxScrollContainerScrollVertical : 0;
          scrollbarContainer.scrollTop = scrollTo;
        }
      }
    },
    [viewport.maxScrollContainerScrollVertical]
  );

  // TODO this is going to scroll to top in situations where this won't be right
  // Set the initial viewport range
  // useLayoutEffect(() => {
  //   handleTableContainerScroll();
  // }, [handleTableContainerScroll]);

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
