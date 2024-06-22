import { isValidNumber, MEASURES, orientationType } from "@finos/vuu-utils";
import { CSSProperties, RefObject, useCallback, useMemo, useRef } from "react";

export const useAnimatedSelectionThumb = (
  containerRef: RefObject<HTMLElement>,
  activeTabIndex: number,
  orientation: orientationType = "horizontal"
) => {
  const animationSuspendedRef = useRef(false);
  const suspendAnimation = useCallback(() => {
    animationSuspendedRef.current = true;
  }, []);

  const resumeAnimation = useCallback(() => {
    animationSuspendedRef.current = false;
  }, []);

  const onTransitionEnd = useCallback(() => {
    containerRef.current?.style.setProperty("--tab-thumb-transition", "none");
    containerRef.current?.removeEventListener("transitionend", onTransitionEnd);
  }, [containerRef]);
  const lastSelectedRef = useRef(-1);
  return useMemo(() => {
    let offset = 0;
    let size = 0;
    if (lastSelectedRef.current !== -1) {
      const oldSelected =
        containerRef.current?.querySelector(".vuuTab-selected");
      const newSelected = containerRef.current?.querySelector(
        `[data-index="${activeTabIndex}"] .vuuTab`
      );
      const { positionProp, sizeProp } = MEASURES[orientation];
      if (oldSelected && newSelected && !animationSuspendedRef.current) {
        const { [positionProp]: oldPosition, [sizeProp]: oldSize } =
          oldSelected.getBoundingClientRect();
        const { [positionProp]: newPosition } =
          newSelected.getBoundingClientRect();
        if (
          isValidNumber(oldPosition) &&
          isValidNumber(newPosition) &&
          isValidNumber(oldSize)
        ) {
          offset = oldPosition - newPosition;
          size = oldSize;
          const speed = orientation === "horizontal" ? 1100 : 700;
          const duration = Math.abs(offset / speed);
          requestAnimationFrame(() => {
            containerRef.current?.style.setProperty(
              "--tab-thumb-offset",
              "0px"
            );
            containerRef.current?.style.setProperty("--tab-thumb-size", "100%");
            containerRef.current?.style.setProperty(
              "--tab-thumb-transition",
              `all ${duration}s ease`
            );
            containerRef.current?.addEventListener(
              "transitionend",
              onTransitionEnd
            );
          });
        }
      }
    }
    lastSelectedRef.current = activeTabIndex;
    if (animationSuspendedRef.current) {
      return {
        containerStyle: {
          "--tab-thumb-offset": "0px",
          "--tab-thumb-size": "100%",
        } as CSSProperties,
        resumeAnimation,
        suspendAnimation,
      };
    } else {
      return {
        containerStyle: {
          "--tab-thumb-offset": `${offset}px`,
          "--tab-thumb-size": size ? `${size}px` : undefined,
        } as CSSProperties,
        resumeAnimation,
        suspendAnimation,
      };
    }
  }, [
    activeTabIndex,
    containerRef,
    orientation,
    onTransitionEnd,
    resumeAnimation,
    suspendAnimation,
  ]);
};
