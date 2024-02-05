import {
  getColumnsInViewport,
  getRowElementAtIndex,
  itemsChanged,
  RowAtPositionFunc,
} from "@finos/vuu-utils";
import type { VuuRange } from "@finos/vuu-protocol-types";
import {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ViewportMeasurements } from "./useTableViewport";
import { howFarIsRowOutsideViewport } from "./table-dom-utils";
import type { RuntimeColumnDescriptor } from "@finos/vuu-table-types";

export type ScrollDirectionVertical = "up" | "down";
export type ScrollDirectionHorizontal = "left" | "right";
export type ScrollDirection =
  | ScrollDirectionVertical
  | ScrollDirectionHorizontal;

/**
 * scroll into view the row at given index posiiton.
 */
export interface ScrollRequestRow {
  rowIndex: number;
  type: "scroll-row";
}
export interface ScrollRequestEnd {
  type: "scroll-end";
  direction: "home" | "end";
}

export interface ScrollRequestPage {
  type: "scroll-page";
  direction: ScrollDirectionVertical;
}

export type ScrollRequest =
  | ScrollRequestPage
  | ScrollRequestEnd
  | ScrollRequestRow;

export type ScrollRequestHandler = (request: ScrollRequest) => void;

export interface ScrollingAPI {
  scrollToIndex: (itemIndex: number) => void;
  scrollToKey: (rowKey: string) => void;
}

/** How far we allow horizontal scroll movement before we recheck the rendered columns */
const SCROLL_MOVE_CHECK_THRESHOLD = 100;

/** The buffer size in pixels that we allow for rendering columns just outside the viewport */
const HORIZONTAL_SCROLL_BUFFER = 200;

/**
 * Return the maximum scroll positions for gioven container
 * @param container
 * @returns [maxScrollLeft, maxScrollTop]
 */
const getMaxScroll = (container: HTMLElement) => {
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  return [scrollWidth - clientWidth, scrollHeight - clientHeight];
};

const getScrollDirection = (
  prevScrollPositions: ScrollPos | undefined,
  scrollPos: number
) => {
  if (prevScrollPositions === undefined) {
    return undefined;
  } else {
    const { scrollTop: prevTop } = prevScrollPositions;
    return scrollPos > prevTop ? "fwd" : "bwd";
  }
};

const getPctScroll = (container: HTMLElement, currentScrollPos?: ScrollPos) => {
  const {
    clientHeight,
    clientWidth,
    scrollHeight,
    scrollLeft,
    scrollTop,
    scrollWidth,
  } = container;

  const maxScrollLeft = scrollWidth - clientWidth;
  const pctScrollLeft = scrollLeft / (scrollWidth - clientWidth);
  const maxScrollTop = scrollHeight - clientHeight;
  let pctScrollTop = scrollTop / (scrollHeight - clientHeight);

  const scrollDirection = getScrollDirection(currentScrollPos, scrollTop);

  if (scrollDirection === "fwd" && pctScrollTop > 0.99) {
    pctScrollTop = 1;
  } else if (scrollDirection === "bwd" && pctScrollTop < 0.02) {
    pctScrollTop = 0;
  }

  return [
    scrollLeft,
    pctScrollLeft,
    maxScrollLeft,
    scrollTop,
    pctScrollTop,
    maxScrollTop,
  ];
};

export const noScrolling: ScrollingAPI = {
  scrollToIndex: () => undefined,
  scrollToKey: () => undefined,
};

interface CallbackRefHookProps<T = HTMLElement> {
  onAttach?: (el: T) => void;
  onDetach: (el: T) => void;
  label?: string;
}

const useCallbackRef = <T = HTMLElement>({
  onAttach,
  onDetach,
}: CallbackRefHookProps<T>) => {
  const ref = useRef<T | null>(null);
  const callbackRef = useCallback(
    (el: T | null) => {
      if (el) {
        ref.current = el;
        onAttach?.(el);
      } else if (ref.current) {
        const { current: originalRef } = ref;
        ref.current = el;
        onDetach?.(originalRef);
      }
    },
    [onAttach, onDetach]
  );
  return callbackRef;
};

type ScrollPos = {
  scrollLeft: number;
  scrollTop: number;
};

export interface TableScrollHookProps {
  columns: RuntimeColumnDescriptor[];
  getRowAtPosition: RowAtPositionFunc;
  onHorizontalScroll?: (scrollLeft: number) => void;
  onVerticalScroll?: (scrollTop: number, pctScrollTop: number) => void;
  /**
   * When we have a virtualized scroll container, keyboard navigation is
   * performed `in situ`. We shift the range of rows rendered within the
   * viewport, whithout actually moving the scroll position
   */
  onVerticalScrollInSitu?: (rowIndexOffsetCount: number) => void;
  rowHeight: number;
  scrollingApiRef?: ForwardedRef<ScrollingAPI>;
  setRange: (range: VuuRange) => void;
  viewportMeasurements: ViewportMeasurements;
}

export const useTableScroll = ({
  columns,
  getRowAtPosition,
  onHorizontalScroll,
  onVerticalScroll,
  onVerticalScrollInSitu,
  scrollingApiRef,
  setRange,
  viewportMeasurements,
}: TableScrollHookProps) => {
  const firstRowRef = useRef<number>(0);
  const contentContainerScrolledRef = useRef(false);
  const contentContainerPosRef = useRef<ScrollPos>({
    scrollTop: 0,
    scrollLeft: 0,
  });
  const scrollbarContainerScrolledRef = useRef(false);
  const scrollbarContainerPosRef = useRef<ScrollPos>({
    scrollTop: 0,
    scrollLeft: 0,
  });
  const scrollbarContainerRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const lastHorizontalScrollCheckPoint = useRef(0);

  const {
    appliedPageSize,
    isVirtualScroll,
    rowCount: viewportRowCount,
    totalHeaderHeight,
    viewportWidth,
  } = viewportMeasurements;

  const columnsWithinViewportRef = useRef<RuntimeColumnDescriptor[]>([]);
  const [columnsWithinViewport, setColumnsWithinViewport] = useState<
    RuntimeColumnDescriptor[]
  >([]);

  const preSpanRef = useRef(0);

  useEffect(() => {
    const [visibleColumns, offset] = getColumnsInViewport(
      columns,
      contentContainerPosRef.current.scrollLeft,
      contentContainerPosRef.current.scrollLeft +
        viewportWidth +
        HORIZONTAL_SCROLL_BUFFER
    );

    if (itemsChanged(columnsWithinViewportRef.current, visibleColumns)) {
      preSpanRef.current = offset;
      setColumnsWithinViewport(
        (columnsWithinViewportRef.current = visibleColumns)
      );
    }
  }, [viewportWidth, columns]);

  const handleHorizontalScroll = useCallback(
    (scrollLeft: number) => {
      contentContainerPosRef.current.scrollLeft = scrollLeft;
      onHorizontalScroll?.(scrollLeft);

      if (
        Math.abs(scrollLeft - lastHorizontalScrollCheckPoint.current) >
        SCROLL_MOVE_CHECK_THRESHOLD
      ) {
        lastHorizontalScrollCheckPoint.current = scrollLeft;

        const [visibleColumns, pre] = getColumnsInViewport(
          columns,
          scrollLeft,
          scrollLeft + viewportWidth + 200
        );

        if (itemsChanged(columnsWithinViewport, visibleColumns)) {
          preSpanRef.current = pre;
          setColumnsWithinViewport(
            (columnsWithinViewportRef.current = visibleColumns)
          );
        }
      }
    },
    [columns, columnsWithinViewport, onHorizontalScroll, viewportWidth]
  );
  const handleVerticalScroll = useCallback(
    (scrollTop: number, pctScrollTop: number) => {
      contentContainerPosRef.current.scrollTop = scrollTop;

      onVerticalScroll?.(scrollTop, pctScrollTop);
      const firstRow = getRowAtPosition(scrollTop);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        setRange({ from: firstRow, to: firstRow + viewportRowCount });
      }
      onVerticalScrollInSitu?.(0);
    },
    [
      getRowAtPosition,
      onVerticalScroll,
      onVerticalScrollInSitu,
      setRange,
      viewportRowCount,
    ]
  );

  const handleScrollbarContainerScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: contentContainerScrolled } = contentContainerScrolledRef;
    const { current: scrollPos } = scrollbarContainerPosRef;

    if (contentContainerScrolled) {
      contentContainerScrolledRef.current = false;
    } else if (contentContainer && scrollbarContainer) {
      scrollbarContainerScrolledRef.current = true;
      const [scrollLeft, pctScrollLeft, , scrollTop, pctScrollTop] =
        getPctScroll(scrollbarContainer, scrollPos);

      scrollPos.scrollLeft = scrollLeft;
      scrollPos.scrollTop = scrollTop;

      const [maxScrollLeft, maxScrollTop] = getMaxScroll(scrollbarContainer);
      const contentScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const contentScrollTop = pctScrollTop * maxScrollTop;

      contentContainer.scrollTo({
        left: contentScrollLeft,
        top: contentScrollTop,
        behavior: "auto",
      });
    }
    onVerticalScrollInSitu?.(0);
  }, [onVerticalScrollInSitu]);

  const handleContentContainerScroll = useCallback(() => {
    const { current: scrollbarContainerScrolled } =
      scrollbarContainerScrolledRef;
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: scrollPos } = contentContainerPosRef;

    if (contentContainer && scrollbarContainer) {
      const [
        scrollLeft,
        pctScrollLeft,
        maxScrollLeft,
        scrollTop,
        pctScrollTop,
        maxScrollTop,
      ] = getPctScroll(contentContainer);

      contentContainerScrolledRef.current = true;

      if (scrollbarContainerScrolled) {
        scrollbarContainerScrolledRef.current = false;
      } else {
        scrollbarContainer.scrollLeft = Math.round(
          pctScrollLeft * maxScrollLeft
        );
        scrollbarContainer.scrollTop = pctScrollTop * maxScrollTop;
      }

      if (scrollPos.scrollTop !== scrollTop) {
        handleVerticalScroll(scrollTop, pctScrollTop);
      }
      if (scrollPos.scrollLeft !== scrollLeft) {
        handleHorizontalScroll(scrollLeft);
      }
    }
  }, [handleVerticalScroll, handleHorizontalScroll]);

  const handleAttachScrollbarContainer = useCallback(
    (el: HTMLDivElement) => {
      scrollbarContainerRef.current = el;
      el.addEventListener("scroll", handleScrollbarContainerScroll, {
        passive: true,
      });
    },
    [handleScrollbarContainerScroll]
  );

  const handleDetachScrollbarContainer = useCallback(
    (el: HTMLDivElement) => {
      scrollbarContainerRef.current = null;
      el.removeEventListener("scroll", handleScrollbarContainerScroll);
    },
    [handleScrollbarContainerScroll]
  );

  const handleAttachContentContainer = useCallback(
    (el: HTMLDivElement) => {
      contentContainerRef.current = el;
      el.addEventListener("scroll", handleContentContainerScroll, {
        passive: true,
      });
    },
    [handleContentContainerScroll]
  );

  const handleDetachContentContainer = useCallback(
    (el: HTMLDivElement) => {
      contentContainerRef.current = null;
      el.removeEventListener("scroll", handleContentContainerScroll);
    },
    [handleContentContainerScroll]
  );

  const contentContainerCallbackRef = useCallbackRef({
    onAttach: handleAttachContentContainer,
    onDetach: handleDetachContentContainer,
  });

  const scrollbarContainerCallbackRef = useCallbackRef({
    onAttach: handleAttachScrollbarContainer,
    onDetach: handleDetachScrollbarContainer,
  });

  const requestScroll: ScrollRequestHandler = useCallback(
    (scrollRequest) => {
      const { current: contentContainer } = contentContainerRef;
      if (contentContainer) {
        const [maxScrollLeft, maxScrollTop] = getMaxScroll(contentContainer);
        const { scrollLeft, scrollTop } = contentContainer;
        contentContainerScrolledRef.current = false;
        if (scrollRequest.type === "scroll-row") {
          const activeRow = getRowElementAtIndex(
            contentContainer,
            scrollRequest.rowIndex
          );
          if (activeRow !== null) {
            const [direction, distance] = howFarIsRowOutsideViewport(
              activeRow,
              totalHeaderHeight
            );
            if (direction && distance) {
              if (isVirtualScroll) {
                const offset = direction === "down" ? 1 : -1;
                onVerticalScrollInSitu?.(offset);
                const firstRow = firstRowRef.current + offset;
                firstRowRef.current = firstRow;
                setRange({
                  from: firstRow,
                  to: firstRow + viewportRowCount,
                });
              } else {
                let newScrollLeft = scrollLeft;
                let newScrollTop = scrollTop;
                if (direction === "up" || direction === "down") {
                  newScrollTop = Math.min(
                    Math.max(0, scrollTop + distance),
                    maxScrollTop
                  );
                } else {
                  newScrollLeft = Math.min(
                    Math.max(0, scrollLeft + distance),
                    maxScrollLeft
                  );
                }
                contentContainer.scrollTo({
                  top: newScrollTop,
                  left: newScrollLeft,
                  behavior: "smooth",
                });
              }
            }
          }
        } else if (scrollRequest.type === "scroll-page") {
          const { direction } = scrollRequest;
          if (isVirtualScroll) {
            const offset =
              direction === "down" ? viewportRowCount : -viewportRowCount;
            onVerticalScrollInSitu?.(offset);
            const firstRow = firstRowRef.current + offset;
            firstRowRef.current = firstRow;
            setRange({ from: firstRow, to: firstRow + viewportRowCount });
          } else {
            const scrollBy =
              direction === "down" ? appliedPageSize : -appliedPageSize;
            const newScrollTop = Math.min(
              Math.max(0, scrollTop + scrollBy),
              maxScrollTop
            );
            contentContainer.scrollTo({
              top: newScrollTop,
              left: scrollLeft,
              behavior: "auto",
            });
          }
        } else if (scrollRequest.type === "scroll-end") {
          const { direction } = scrollRequest;
          const scrollTo = direction === "end" ? maxScrollTop : 0;
          contentContainer.scrollTo({
            top: scrollTo,
            left: contentContainer.scrollLeft,
            behavior: "auto",
          });
        }
      }
    },
    [
      appliedPageSize,
      isVirtualScroll,
      onVerticalScrollInSitu,
      setRange,
      totalHeaderHeight,
      viewportRowCount,
    ]
  );

  const scrollHandles: ScrollingAPI = useMemo(
    () => ({
      scrollToIndex: (rowIndex: number) => {
        if (scrollbarContainerRef.current) {
          const scrollPos = (rowIndex - 30) * 20;
          scrollbarContainerRef.current.scrollTop = scrollPos;
        }
      },
      scrollToKey: (rowKey: string) => {
        console.log(`scrollToKey ${rowKey}`);
      },
    }),
    []
  );

  useImperativeHandle(
    scrollingApiRef,
    () => {
      if (scrollbarContainerRef.current) {
        return scrollHandles;
      } else {
        return noScrolling;
      }
    },
    [scrollHandles]
  );

  useEffect(() => {
    const { current: from } = firstRowRef;
    const rowRange = { from, to: from + viewportRowCount };
    setRange(rowRange);
  }, [setRange, viewportRowCount]);

  return {
    columnsWithinViewport,
    /** Ref to be assigned to ScrollbarContainer */
    scrollbarContainerRef: scrollbarContainerCallbackRef,
    /** Ref to be assigned to ContentContainer */
    contentContainerRef: contentContainerCallbackRef,
    /** Scroll the table  */
    requestScroll,
    /** number of leading columns not rendered because of virtualization  */
    virtualColSpan: preSpanRef.current,
  };
};
