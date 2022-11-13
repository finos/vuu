import { MutableRefObject, useCallback } from "react";
import { GridModelType } from "../grid-model";
import { ViewportScrollApi } from "../Viewport";

export interface HorizontalScrollSynvHookProps {
  gridModel: GridModelType;
  rootRef: MutableRefObject<HTMLDivElement | null>;
  viewportRef: MutableRefObject<ViewportScrollApi | null>;
}

// TODO get rid of this entirely if we can establish a suitable html structure
export const useHorizonatlScrollSync = ({
  gridModel,
  rootRef,
  viewportRef,
}: HorizontalScrollSynvHookProps) => {
  const handleHorizontalScrollStart = useCallback(() => {
    if (rootRef.current && viewportRef.current) {
      viewportRef.current.beginHorizontalScroll();
      rootRef.current.classList.add("scrolling-x");
      rootRef.current.style.paddingTop = gridModel.customHeaderHeight + "px";
    }
  }, [gridModel.customHeaderHeight, rootRef, viewportRef]);

  const handleHorizontalScrollEnd = useCallback(() => {
    if (rootRef.current && viewportRef.current) {
      viewportRef.current.endHorizontalScroll();
      rootRef.current.classList.remove("scrolling-x");
      const {
        headerHeight,
        headingDepth = 1,
        customHeaderHeight,
        customInlineHeaderHeight,
      } = gridModel;
      const totalHeaderHeight =
        headerHeight * headingDepth +
        customHeaderHeight +
        customInlineHeaderHeight;
      rootRef.current.style.paddingTop = totalHeaderHeight + "px";
    }
  }, [gridModel, rootRef, viewportRef]);

  const invokeScrollAction = useCallback(
    (action) => {
      if (action.type === "scroll-start-horizontal") {
        handleHorizontalScrollStart();
        return true;
      } else if (action.type === "scroll-end-horizontal") {
        handleHorizontalScrollEnd();
        return true;
      }
      return false;
    },
    [handleHorizontalScrollEnd, handleHorizontalScrollStart]
  );

  return invokeScrollAction;
};
