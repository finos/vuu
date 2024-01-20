import { getRowElementAtIndex, RowAtPositionFunc } from "@finos/vuu-utils";
import { VuuRange } from "@finos/vuu-protocol-types";
import {
  ForwardedRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { ViewportMeasurements } from "./useTableViewport";
import { howFarIsRowOutsideViewport } from "./table-dom-utils";

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

/**
 * Return the maximum scroll positions for gioven container
 * @param container
 * @returns [maxScrollLeft, maxScrollTop]
 */
const getMaxScroll = (container: HTMLElement) => {
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  return [scrollWidth - clientWidth, scrollHeight - clientHeight];
};

const getPctScroll = (container: HTMLElement, approximateBoundaries = true) => {
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
  const pctScrollTop = scrollTop / (scrollHeight - clientHeight);

  if (approximateBoundaries) {
    if (pctScrollTop > 0.99) {
      return [pctScrollLeft, 1];
    } else if (pctScrollTop < 0.02) {
      return [pctScrollLeft, 0];
    }
  }
  return [pctScrollLeft, pctScrollTop, maxScrollLeft, maxScrollTop];
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

export interface TableScrollHookProps {
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
  const scrollbarContainerScrolledRef = useRef(false);
  const scrollPosRef = useRef({ scrollTop: 0, scrollLeft: 0 });
  const scrollbarContainerRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    appliedPageSize,
    isVirtualScroll,
    rowCount: viewportRowCount,
    totalHeaderHeight,
  } = viewportMeasurements;

  const handleVerticalScroll = useCallback(
    (scrollTop: number, pctScrollTop: number) => {
      onVerticalScroll?.(scrollTop, pctScrollTop);
      const firstRow = getRowAtPosition(scrollTop);
      if (firstRow !== firstRowRef.current) {
        firstRowRef.current = firstRow;
        setRange({ from: firstRow, to: firstRow + viewportRowCount + 1 });
      }
    },
    [getRowAtPosition, onVerticalScroll, setRange, viewportRowCount]
  );

  const handleScrollbarContainerScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: contentContainerScrolled } = contentContainerScrolledRef;
    const { current: scrollPos } = scrollPosRef;
    if (contentContainerScrolled) {
      contentContainerScrolledRef.current = false;
    } else if (contentContainer && scrollbarContainer) {
      scrollbarContainerScrolledRef.current = true;
      const [maxScrollLeft, maxScrollTop] = getMaxScroll(contentContainer);
      const approximateBoundaries =
        scrollPos.scrollTop > 0 && scrollPos.scrollTop < maxScrollTop;
      const [pctScrollLeft, pctScrollTop] = getPctScroll(
        scrollbarContainer,
        approximateBoundaries
      );
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
    const { current: scrollPos } = scrollPosRef;

    if (contentContainer && scrollbarContainer) {
      const { scrollLeft, scrollTop } = contentContainer;
      const [pctScrollLeft, pctScrollTop, maxScrollLeft, maxScrollTop] =
        getPctScroll(contentContainer);

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
        scrollPos.scrollTop = scrollTop;
        handleVerticalScroll(scrollTop, pctScrollTop);
        onVerticalScrollInSitu?.(0);
      }
      if (scrollPos.scrollLeft !== scrollLeft) {
        scrollPos.scrollLeft = scrollLeft;
        onHorizontalScroll?.(scrollLeft);
      }
    }
  }, [handleVerticalScroll, onHorizontalScroll, onVerticalScrollInSitu]);

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
                  to: firstRow + viewportRowCount + 1,
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
            setRange({ from: firstRow, to: firstRow + viewportRowCount + 1 });
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
    /** Ref to be assigned to ScrollbarContainer */
    scrollbarContainerRef: scrollbarContainerCallbackRef,
    /** Ref to be assigned to ContentContainer */
    contentContainerRef: contentContainerCallbackRef,
    /** Scroll the table  */
    requestScroll,
  };
};
