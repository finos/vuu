import { useCallback } from 'react';

// TODO get rid of this entirely if we can establish a suitable html structure
export const useScrollInducedLayoutShift = ({
  gridModel,
  isColumnDragging,
  rootRef,
  viewportRef
}) => {
  const handleHorizontalScrollStart = useCallback(() => {
    if (!isColumnDragging) {
      viewportRef.current.beginHorizontalScroll();
      rootRef.current.classList.add('scrolling-x');
      rootRef.current.style.paddingTop = gridModel.customHeaderHeight + 'px';
    }
  }, [gridModel.customHeaderHeight, isColumnDragging, rootRef, viewportRef]);

  const handleHorizontalScrollEnd = useCallback(() => {
    if (!isColumnDragging) {
      viewportRef.current.endHorizontalScroll();
      rootRef.current.classList.remove('scrolling-x');
      const { headerHeight, headingDepth, customHeaderHeight, customInlineHeaderHeight } =
        gridModel;
      const totalHeaderHeight =
        headerHeight * headingDepth + customHeaderHeight + customInlineHeaderHeight;
      rootRef.current.style.paddingTop = totalHeaderHeight + 'px';
    }
  }, [gridModel, isColumnDragging, rootRef, viewportRef]);

  const invokeScrollAction = useCallback(
    (action) => {
      if (action.type === 'scroll-start-horizontal') {
        handleHorizontalScrollStart();
        return true;
      } else if (action.type === 'scroll-end-horizontal') {
        handleHorizontalScrollEnd();
        return true;
      } else {
        return false;
      }
    },
    [handleHorizontalScrollEnd, handleHorizontalScrollStart]
  );

  return invokeScrollAction;
};
