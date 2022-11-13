import { useCallback, useRef } from "react";

export type scrollPhase = "scroll" | "scroll-start" | "scroll-end";

export default function useScroll(
  scrollPos: "scrollLeft" | "scrollTop",
  callback: (scrollPhase: scrollPhase, scrollPos: number) => void,
  scrollThreshold = 0
) {
  const timeoutHandle = useRef<number | null>(null);
  const pos = useRef(0);
  const scrollHandlingSuspended = useRef(false);
  const checkPos = useRef(0);
  const onScrollEnd = useCallback(() => {
    callback("scroll-end", pos.current);
    timeoutHandle.current = null;
  }, [callback]);

  const suspendScrollHandling = useCallback(
    (suspended) => (scrollHandlingSuspended.current = suspended),
    []
  );

  const onScroll = useCallback(
    (e) => {
      // important for the horizontal scroll on Canvas
      e.stopPropagation();
      if (!scrollHandlingSuspended.current) {
        const scrollPosition = e.target[scrollPos];
        if (scrollPosition !== pos.current) {
          pos.current = scrollPosition;
          if (timeoutHandle.current === null) {
            callback("scroll-start", scrollPosition);
          } else {
            clearTimeout(timeoutHandle.current);
          }
          if (Math.abs(scrollPosition - checkPos.current) > scrollThreshold) {
            checkPos.current = scrollPosition;
            callback("scroll", scrollPosition);
          }
          timeoutHandle.current = window.setTimeout(onScrollEnd, 100);
        }
      }
    },
    [callback, onScrollEnd, scrollPos, scrollThreshold]
  );

  return [onScroll, suspendScrollHandling];
}
