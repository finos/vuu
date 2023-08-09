import { useIsomorphicLayoutEffect } from "@salt-ds/core";
import { UIEvent, useCallback, useMemo, useRef, useState } from "react";

export type ViewportRange = {
  atEnd: boolean;
  atStart: boolean;
  from: number;
  to: number;
};

interface ScrollPositionHookProps {
  containerSize: number;
  itemCount: number;
  itemGapSize?: number;
  itemSize: number;
  onViewportScroll?: (
    firstVisibleItemIndex: number,
    lastVisibleitemIndex: number
  ) => void;
}

const getRange = (
  scrollPos: number,
  height: number,
  itemCount: number,
  itemHeight: number
): ViewportRange => {
  const viewportRowCount = Math.ceil(height / itemHeight);
  const from = Math.floor(scrollPos / itemHeight);
  const to = Math.ceil(from + viewportRowCount - 1);
  return {
    atStart: from === 0,
    atEnd: to === itemCount - 1,
    from,
    to,
  };
};

export const useScrollPosition = ({
  containerSize: listHeight,
  itemCount: listItemCount,
  itemGapSize: listItemGapSize = 0,
  itemSize: listItemHeight,
  onViewportScroll,
}: ScrollPositionHookProps) => {
  const firstVisibleRowRef = useRef(0);
  const lastVisibleRowRef = useRef(0);
  const scrollPosRef = useRef(0);

  const range = useMemo(() => {
    return getRange(
      scrollPosRef.current,
      listHeight,
      listItemCount,
      listItemHeight + listItemGapSize
    );
  }, [listHeight, listItemCount, listItemHeight, listItemGapSize]);

  const [viewportRange, setViewportRange] = useState<ViewportRange>(range);

  useIsomorphicLayoutEffect(() => {
    setViewportRange(range);
  }, [range]);

  const handleVerticalScroll = useCallback(
    (e: UIEvent<HTMLElement>) => {
      const scrollTop = (e.target as HTMLElement).scrollTop;
      if (scrollTop !== scrollPosRef.current) {
        scrollPosRef.current = scrollTop;
        const itemHeight = listItemHeight + listItemGapSize;
        const range = getRange(
          scrollTop,
          listHeight,
          listItemCount,
          itemHeight
        );
        if (
          range.from !== firstVisibleRowRef.current ||
          range.to !== lastVisibleRowRef.current
        ) {
          firstVisibleRowRef.current = range.from;
          lastVisibleRowRef.current = range.to;
          onViewportScroll?.(range.from, range.to);
          setViewportRange(range);
        }
      }
    },
    [
      listItemHeight,
      listItemGapSize,
      listHeight,
      listItemCount,
      onViewportScroll,
    ]
  );

  return {
    onVerticalScroll: handleVerticalScroll,
    viewportRange,
  };
};
