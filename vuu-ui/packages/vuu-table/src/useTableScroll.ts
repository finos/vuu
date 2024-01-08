import { getRowElementAtIndex } from "@finos/vuu-utils";
import {
  ForwardedRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import { ViewportMeasurements } from "./useTableViewport";

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

const getPctScroll = (container: HTMLElement) => {
  const { scrollLeft, scrollTop } = container;
  const { clientHeight, clientWidth, scrollHeight, scrollWidth } = container;
  const pctScrollLeft = scrollLeft / (scrollWidth - clientWidth);
  const pctScrollTop = scrollTop / (scrollHeight - clientHeight);
  return [pctScrollLeft, pctScrollTop];
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

const NO_SCROLL_NECESSARY = [undefined, undefined] as const;

export const howFarIsRowOutsideViewport = (
  rowEl: HTMLElement,
  totalHeaderHeight: number,
  contentContainer = rowEl.closest(".vuuTable-contentContainer")
): readonly [ScrollDirection | undefined, number | undefined] => {
  //TODO lots of scope for optimisation here
  if (contentContainer) {
    // TODO take totalHeaderHeight into consideration
    const viewport = contentContainer?.getBoundingClientRect();
    const upperBoundary = viewport.top + totalHeaderHeight;
    const row = rowEl.getBoundingClientRect();
    if (row) {
      if (row.bottom > viewport.bottom) {
        return ["down", row.bottom - viewport.bottom];
      } else if (row.top < upperBoundary) {
        return ["up", row.top - upperBoundary];
      } else {
        return NO_SCROLL_NECESSARY;
      }
    } else {
      throw Error("Whats going on, row not found");
    }
  } else {
    throw Error("Whats going on, scrollbar container not found");
  }
};

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
  onHorizontalScroll?: (scrollLeft: number) => void;
  onVerticalScroll?: (scrollTop: number, pctScrollTop: number) => void;
  rowHeight: number;
  scrollingApiRef?: ForwardedRef<ScrollingAPI>;
  viewportMeasurements: ViewportMeasurements;
}

export const useTableScroll = ({
  onHorizontalScroll,
  onVerticalScroll,
  scrollingApiRef,
  viewportMeasurements,
}: TableScrollHookProps) => {
  const contentContainerScrolledRef = useRef(false);
  const scrollPosRef = useRef({ scrollTop: 0, scrollLeft: 0 });
  const scrollbarContainerRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  const {
    appliedPageSize,
    isVirtualScroll,
    maxScrollContainerScrollHorizontal: maxScrollLeft,
    maxScrollContainerScrollVertical: maxScrollTop,
    totalHeaderHeight,
  } = viewportMeasurements;

  const handleScrollbarContainerScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: contentContainerScrolled } = contentContainerScrolledRef;
    if (contentContainerScrolled) {
      contentContainerScrolledRef.current = false;
    } else if (contentContainer && scrollbarContainer) {
      const [pctScrollLeft, pctScrollTop] = getPctScroll(scrollbarContainer);
      const rootScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const rootScrollTop = pctScrollTop * maxScrollTop;
      contentContainer.scrollTo({
        left: rootScrollLeft,
        top: rootScrollTop,
        behavior: "auto",
      });
    }
  }, [maxScrollLeft, maxScrollTop]);

  const handleContentContainerScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: scrollPos } = scrollPosRef;

    if (contentContainer && scrollbarContainer) {
      const { scrollLeft, scrollTop } = contentContainer;
      const [pctScrollLeft, pctScrollTop] = getPctScroll(contentContainer);
      contentContainerScrolledRef.current = true;
      scrollbarContainer.scrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      scrollbarContainer.scrollTop = pctScrollTop * maxScrollTop;

      if (scrollPos.scrollTop !== scrollTop) {
        scrollPos.scrollTop = scrollTop;
        onVerticalScroll?.(scrollTop, pctScrollTop);
      }
      if (scrollPos.scrollLeft !== scrollLeft) {
        scrollPos.scrollLeft = scrollLeft;
        onHorizontalScroll?.(scrollLeft);
      }
    }
  }, [maxScrollLeft, maxScrollTop, onHorizontalScroll, onVerticalScroll]);

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

  const scrollRowIntoViewIfNecessary = useCallback((rowIndex: number) => {
    // TODO
    // requestScroll?.({ type: "scroll-row-into-view", rowIndex });
    const { current: container } = contentContainerRef;
    const activeRow = container?.querySelector(
      `[aria-rowindex="${rowIndex}"]`
    ) as HTMLElement;
    if (activeRow) {
      const [direction, distance] = howFarIsRowOutsideViewport(
        activeRow,
        totalHeaderHeight
      );
      if (direction && distance) {
        // requestScroll?.({ type: "scroll-distance", distance, direction });
      }
    }
  }, []);

  //TODO should this be async ?
  const requestScroll: ScrollRequestHandler = useCallback(
    (scrollRequest) => {
      const { current: scrollbarContainer } = contentContainerRef;
      if (scrollbarContainer) {
        const { scrollLeft, scrollTop } = scrollbarContainer;
        contentContainerScrolledRef.current = false;
        if (scrollRequest.type === "scroll-row") {
          if (isVirtualScroll) {
            console.log("virtual scroll row required");
          } else {
            const activeRow = getRowElementAtIndex(
              scrollbarContainer,
              scrollRequest.rowIndex
            );
            if (activeRow !== null) {
              const [direction, distance] = howFarIsRowOutsideViewport(
                activeRow,
                totalHeaderHeight
              );
              console.log(`direction === ${direction}`);
              if (direction && distance) {
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
                scrollbarContainer.scrollTo({
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
            console.log(`need a virtual page scroll`);
          } else {
            const scrollBy =
              direction === "down" ? appliedPageSize : -appliedPageSize;
            const newScrollTop = Math.min(
              Math.max(0, scrollTop + scrollBy),
              maxScrollTop
            );
            scrollbarContainer.scrollTo({
              top: newScrollTop,
              left: scrollLeft,
              behavior: "auto",
            });
          }
        } else if (scrollRequest.type === "scroll-end") {
          const { direction } = scrollRequest;
          const scrollTo = direction === "end" ? maxScrollTop : 0;
          scrollbarContainer.scrollTo({
            top: scrollTo,
            left: scrollbarContainer.scrollLeft,
            behavior: "auto",
          });
        }
      }
    },
    [appliedPageSize, isVirtualScroll, maxScrollLeft, maxScrollTop]
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

  return {
    /** Ref to be assigned to ScrollbarContainer */
    scrollbarContainerRef: scrollbarContainerCallbackRef,
    /** Ref to be assigned to ContentContainer */
    contentContainerRef: contentContainerCallbackRef,
    /** Scroll the table  */
    requestScroll,
  };
};
