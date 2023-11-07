import { useCallback, useRef } from "react";

export type ScrollDirectionVertical = "up" | "down";
export type ScrollDirectionHorizontal = "left" | "right";
export type ScrollDirection =
  | ScrollDirectionVertical
  | ScrollDirectionHorizontal;

export interface ScrollRequestEnd {
  type: "scroll-end";
  direction: "home" | "end";
}

export interface ScrollRequestPage {
  type: "scroll-page";
  direction: ScrollDirectionVertical;
}

export interface ScrollRequestDistance {
  direction: ScrollDirection;
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
  return [pctScrollLeft, pctScrollTop];
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
  maxScrollLeft: number;
  maxScrollTop: number;
  onHorizontalScroll?: (scrollLeft: number) => void;
  onVerticalScroll?: (scrollTop: number, pctScrollTop: number) => void;
  rowHeight: number;
  viewportRowCount: number;
}

export const useTableScroll = ({
  maxScrollLeft,
  maxScrollTop,
  onHorizontalScroll,
  onVerticalScroll,
  rowHeight,
  viewportRowCount,
}: TableScrollHookProps) => {
  const contentContainerScrolledRef = useRef(false);
  const scrollPosRef = useRef({ scrollTop: 0, scrollLeft: 0 });
  const scrollbarContainerRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  const handleScrollbarContainerScroll = useCallback(() => {
    const { current: contentContainer } = contentContainerRef;
    const { current: scrollbarContainer } = scrollbarContainerRef;
    const { current: contentContainerScrolled } = contentContainerScrolledRef;
    if (contentContainerScrolled) {
      contentContainerScrolledRef.current = false;
    } else if (contentContainer && scrollbarContainer) {
      const [pctScrollLeft, pctScrollTop] = getPctScroll(scrollbarContainer);
      const rootScrollLeft = Math.round(pctScrollLeft * maxScrollLeft);
      const rootScrollTop = Math.round(pctScrollTop * maxScrollTop);
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
      scrollbarContainer.scrollTop = Math.round(pctScrollTop * maxScrollTop);

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

  //TODO should this be async ?
  const requestScroll: ScrollRequestHandler = useCallback(
    (scrollRequest) => {
      const { current: scrollbarContainer } = contentContainerRef;
      if (scrollbarContainer) {
        const { scrollLeft, scrollTop } = scrollbarContainer;
        contentContainerScrolledRef.current = false;
        if (scrollRequest.type === "scroll-distance") {
          let newScrollLeft = scrollLeft;
          let newScrollTop = scrollTop;
          if (
            scrollRequest.direction === "up" ||
            scrollRequest.direction === "down"
          ) {
            newScrollTop = Math.min(
              Math.max(0, scrollTop + scrollRequest.distance),
              maxScrollTop
            );
          } else {
            newScrollLeft = Math.min(
              Math.max(0, scrollLeft + scrollRequest.distance),
              maxScrollLeft
            );
          }
          scrollbarContainer.scrollTo({
            top: newScrollTop,
            left: newScrollLeft,
            behavior: "smooth",
          });
        } else if (scrollRequest.type === "scroll-page") {
          const { direction } = scrollRequest;
          const scrollBy =
            viewportRowCount * (direction === "down" ? rowHeight : -rowHeight);
          const newScrollTop = Math.min(
            Math.max(0, scrollTop + scrollBy),
            maxScrollTop
          );
          scrollbarContainer.scrollTo({
            top: newScrollTop,
            left: scrollLeft,
            behavior: "auto",
          });
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
    [maxScrollLeft, maxScrollTop, rowHeight, viewportRowCount]
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
