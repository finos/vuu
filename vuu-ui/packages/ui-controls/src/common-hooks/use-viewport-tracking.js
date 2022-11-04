import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useResizeObserver } from "@vuu-ui/react-utils";

const HeightOnly = ["height", "scrollHeight"];

export const useViewportTracking = (
  root,
  highlightedIdx,
  stickyHeaders = false
) => {
  const scrollTop = useRef(0);
  const scrolling = useRef(false);
  const rootHeight = useRef(0);
  const rootScrollHeight = useRef(0);

  const scrollIntoView = useCallback(
    (el) => {
      const targetEl = el.ariaExpanded ? el.firstChild : el;
      const headerHeight = stickyHeaders ? 30 : 0;
      const t = targetEl.offsetTop;
      const h = targetEl.offsetHeight;
      const viewportStart = scrollTop.current + headerHeight;
      const viewportEnd = viewportStart + rootHeight.current - headerHeight;

      if (t + h > viewportEnd || t < viewportStart) {
        scrollTop.current =
          t + h > viewportEnd
            ? scrollTop.current + (t + h) - viewportEnd
            : t - headerHeight;

        scrolling.current = true;
        root.current.scrollTop = scrollTop.current;
        setTimeout(() => {
          scrolling.current = false;
        });
      }
    },
    [root, stickyHeaders]
  );

  const scrollHandler = useCallback((e) => {
    scrollTop.current = e.target.scrollTop;
  }, []);

  useEffect(() => {
    const { current: rootEl } = root;
    if (rootEl) {
      rootEl.addEventListener("scroll", scrollHandler);
    }

    return () => {
      if (rootEl) {
        rootEl.removeEventListener("scroll", scrollHandler);
      }
    };
  }, [root, scrollHandler]);

  useLayoutEffect(() => {
    if (
      highlightedIdx !== -1 &&
      rootScrollHeight.current > rootHeight.current
    ) {
      const item = root.current.querySelector(`
      [data-idx='${highlightedIdx}'],
      [aria-posinset='${highlightedIdx + 1}']
      `);
      if (item === null) {
        console.log(
          "[useViewportTracking], is this virtualised ?  we're going to have to know rowHeight"
        );
      } else {
        scrollIntoView(item);
      }
    }
  }, [highlightedIdx, root, scrollIntoView]);

  useEffect(() => {
    // onsole.log('TODO measure the sticky header')
  }, [stickyHeaders]);

  const onResize = useCallback(({ height, scrollHeight }) => {
    rootHeight.current = height;
    rootScrollHeight.current = scrollHeight;
  }, []);

  useResizeObserver(root, HeightOnly, onResize, true);

  return scrolling;
};
