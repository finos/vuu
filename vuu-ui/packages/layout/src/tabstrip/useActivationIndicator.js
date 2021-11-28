import { useCallback, useLayoutEffect, useState } from 'react';
import useResizeObserver, { WidthOnly } from '../responsive/useResizeObserver';

// Overflow can affect tab positions, so we recalculate when it changes
export default function useActivationIndicator(rootRef, tabRef, orientation) {
  const [, forceRender] = useState(null);
  const { current: tab } = tabRef;

  //   const vertical = orientation === "vertical";
  const createIndicatorStyle = useCallback(() => {
    if (tabRef.current) {
      const tabRect = tabRef.current.getBoundingClientRect();
      // TODO we could cache this one at least ...
      const rootRect = rootRef.current.getBoundingClientRect();
      if (orientation === 'horizontal') {
        const left = tabRect.left - rootRect.left;
        return { left, width: tabRect.width };
      } else {
        const top = tabRect.top - rootRect.top;
        return { top, height: tabRect.height };
      }
    }
  }, [orientation, rootRef, tabRef]);

  const onResize = useCallback(() => {
    forceRender({});
  }, []);

  useResizeObserver(tabRef, WidthOnly, onResize);

  // Force a re-render after the initial render only. We cannot determine where to
  // position the activation indicator content has been rendered.
  // All subsequent updates will be triggered by changes to TabRef. We don't want
  // to trigger these after render as this will always incure two renders for the
  // ActivationIndicator. AFter the first, we can compute position during the render
  // phase.
  useLayoutEffect(() => {
    forceRender({});
  }, [forceRender, tab]);

  // Have tried memoising this. Problem is, it's difficult to get the timing right
  // when overflow may be present and a selected tab may be currently overflowed
  // This is more expensive than necessary, but simple and safe...
  return createIndicatorStyle();
}
