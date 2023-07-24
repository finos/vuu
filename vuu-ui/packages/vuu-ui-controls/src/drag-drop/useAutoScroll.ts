import { RefObject, useCallback, useRef } from "react";
import { dimensions } from "./dragUtils";

export type ScrollStopHandler = (
  scrollDirection: "fwd" | "bwd",
  scrollPos: number,
  atEnd: boolean
) => void;

export const useAutoScroll = ({
  containerRef,
  onScrollingStopped,
  orientation = "vertical",
}: {
  containerRef: RefObject<HTMLElement>;
  onScrollingStopped?: ScrollStopHandler;
  orientation?: "horizontal" | "vertical";
}) => {
  const scrollTimer = useRef<number | null>(null);
  const isScrolling = useRef(false);
  const scrollPosRef = useRef(0);
  const lastScrollDirectionRef = useRef<"fwd" | "bwd">("fwd");

  const stopScrolling = useCallback(
    (atEnd = false) => {
      console.log("[useAutoScroll] stopScrolling");
      if (scrollTimer.current !== null) {
        clearTimeout(scrollTimer.current);
        scrollTimer.current = null;
      }
      isScrolling.current = false;
      onScrollingStopped?.(
        lastScrollDirectionRef.current,
        scrollPosRef.current,
        atEnd
      );
    },
    [onScrollingStopped]
  );

  const startScrolling = useCallback(
    (direction: "fwd" | "bwd", scrollRate: number, scrollUnit = 30) => {
      const { current: container } = containerRef;
      if (container) {
        const { SCROLL_POS, SCROLL_SIZE, CLIENT_SIZE } =
          dimensions(orientation);
        const {
          [SCROLL_POS]: scrollPos,
          [SCROLL_SIZE]: scrollSize,
          [CLIENT_SIZE]: clientSize,
        } = container;
        const maxScroll =
          direction === "fwd" ? scrollSize - clientSize - scrollPos : scrollPos;
        const nextScroll = Math.min(maxScroll, scrollUnit);

        if (direction === "fwd") {
          lastScrollDirectionRef.current = "fwd";
          container[SCROLL_POS as "scrollTop" | "scrollLeft"] =
            scrollPosRef.current = scrollPos + nextScroll;
        } else {
          lastScrollDirectionRef.current = "bwd";
          container[SCROLL_POS as "scrollTop" | "scrollLeft"] =
            scrollPosRef.current = scrollPos - nextScroll;
        }

        if (nextScroll === maxScroll) {
          stopScrolling(true);
        } else {
          isScrolling.current = true;
          scrollTimer.current = window.setTimeout(() => {
            startScrolling(direction, scrollRate, scrollUnit);
          }, 100);
        }
      }
    },
    [containerRef, orientation, stopScrolling]
  );

  return {
    isScrolling,
    startScrolling,
    stopScrolling,
  };
};
