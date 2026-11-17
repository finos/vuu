import {
  type RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

export interface PinnedRowsScrollHookProps {
  containerRef: RefObject<HTMLDivElement | null>;
  /**
   * The number of column header rows. Pinned rows follow these in
   * aria-rowindex order.
   */
  headerCount: number;
  maxVisibleRows: number;
  rowCount: number;
  rowHeight: number;
}

/**
 * When there are more pinned rows than maxVisibleRows, the pinned area
 * scrolls independently of the Table body. The pinned area cannot itself be
 * a scroll container, that would break sticky positioning of pinned columns
 * within it. Instead, rows are offset by scrollTop. A separate scrollbar,
 * outside the content container, provides the scroll position.
 */
export const usePinnedRowsScroll = ({
  containerRef,
  headerCount,
  maxVisibleRows,
  rowCount,
  rowHeight,
}: PinnedRowsScrollHookProps) => {
  const [scrollTop, setScrollTop] = useState(0);
  const scrollbarRef = useRef<HTMLDivElement | null>(null);
  const isScrollable = rowCount > maxVisibleRows;
  const visibleHeight = Math.min(rowCount, maxVisibleRows) * rowHeight;
  const maxScrollTop = Math.max(0, rowCount * rowHeight - visibleHeight);

  useEffect(() => {
    if (!isScrollable) {
      setScrollTop(0);
    } else if (scrollTop > maxScrollTop) {
      setScrollTop(maxScrollTop);
    }
  }, [isScrollable, maxScrollTop, scrollTop]);

  const handleScrollbarScroll = useCallback(() => {
    const el = scrollbarRef.current;
    if (el) {
      setScrollTop(Math.round(el.scrollTop));
    }
  }, []);

  const setScrollbarRef = useCallback(
    (el: HTMLDivElement | null) => {
      scrollbarRef.current?.removeEventListener(
        "scroll",
        handleScrollbarScroll,
      );
      scrollbarRef.current = el;
      el?.addEventListener("scroll", handleScrollbarScroll, { passive: true });
    },
    [handleScrollbarScroll],
  );

  const scrollTo = useCallback(
    (top: number) => {
      const newScrollTop = Math.max(0, Math.min(maxScrollTop, top));
      if (scrollbarRef.current) {
        scrollbarRef.current.scrollTop = newScrollTop;
      }
      setScrollTop(newScrollTop);
    },
    [maxScrollTop],
  );

  // Wheel events over the pinned area scroll the pinned rows vertically,
  // horizontal movement is passed on to the Table content container.
  useEffect(() => {
    const table = containerRef.current;
    if (isScrollable && table) {
      const handleWheel = (evt: WheelEvent) => {
        const pinnedRows = (evt.target as HTMLElement).closest?.(
          ".vuuTable-pinnedRows",
        );
        if (pinnedRows && table.contains(pinnedRows)) {
          const scrollbar = scrollbarRef.current;
          if (scrollbar && evt.deltaY !== 0) {
            evt.preventDefault();
            scrollbar.scrollTop += evt.deltaY;
            if (evt.deltaX !== 0) {
              const contentContainer = table.querySelector(
                ".vuuTable-contentContainer",
              );
              if (contentContainer) {
                contentContainer.scrollLeft += evt.deltaX;
              }
            }
          }
        }
      };
      table.addEventListener("wheel", handleWheel, { passive: false });
      return () => table.removeEventListener("wheel", handleWheel);
    }
  }, [containerRef, isScrollable]);

  const scrollPinnedRowIntoView = useCallback(
    (ariaRowIndex: number) => {
      if (isScrollable) {
        const rowTop = (ariaRowIndex - headerCount - 1) * rowHeight;
        if (rowTop < scrollTop) {
          scrollTo(rowTop);
        } else if (rowTop + rowHeight > scrollTop + visibleHeight) {
          scrollTo(rowTop + rowHeight - visibleHeight);
        }
      }
    },
    [headerCount, isScrollable, rowHeight, scrollTo, scrollTop, visibleHeight],
  );

  return {
    isScrollable,
    scrollPinnedRowIntoView,
    scrollTop,
    setScrollbarRef,
    visibleHeight,
  };
};
