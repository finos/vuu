import { useCallback } from 'react';

// TODO get rid of this entirely if we can establish a suitable html structure
export const useScrollInducedLayoutShift = ({ gridModel, rootRef, viewportRef }) => {
  const handleHorizontalScrollStart = useCallback(() => {
    viewportRef.current.beginHorizontalScroll();
    rootRef.current.classList.add('scrolling-x');
    rootRef.current.style.paddingTop = gridModel.customHeaderHeight + 'px';
  }, [gridModel.customHeaderHeight, rootRef, viewportRef]);

  const handleHorizontalScrollEnd = useCallback(() => {
    viewportRef.current.endHorizontalScroll();
    rootRef.current.classList.remove('scrolling-x');
    const { headerHeight, headingDepth, customHeaderHeight, customInlineHeaderHeight } = gridModel;
    const totalHeaderHeight =
      headerHeight * headingDepth + customHeaderHeight + customInlineHeaderHeight;
    rootRef.current.style.paddingTop = totalHeaderHeight + 'px';
  }, [gridModel, rootRef, viewportRef]);

  const invokeScrollAction = useCallback(
    (action) => {
      if (action.type === 'scroll-start-horizontal') {
        handleHorizontalScrollStart();
        return true;
      } else if (action.type === 'scroll-end-horizontal') {
        handleHorizontalScrollEnd();
        return true;
      }
      return false;
    },
    [handleHorizontalScrollEnd, handleHorizontalScrollStart]
  );

  return invokeScrollAction;
};
