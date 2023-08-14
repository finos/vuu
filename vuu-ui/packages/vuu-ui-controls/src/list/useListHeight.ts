import { useIsomorphicLayoutEffect } from "@salt-ds/core";
import { RefObject, useCallback, useMemo, useState } from "react";
import { HeightOnly, ResizeHandler, useResizeObserver } from "../common-hooks";

export interface ListHeightHookProps {
  borderless?: boolean;
  displayedItemCount: number;
  getItemHeight?: (index: number) => number;
  height?: number | string;
  itemCount: number;
  itemGapSize: number;
  itemHeight?: number;
  rootRef: RefObject<HTMLElement>;
  rowHeightRef: RefObject<HTMLElement | null>;
}

export interface HeightHookResult {
  contentHeight: number;
  listClientHeight?: number;
  listItemHeight: number;
  listHeight: number | string;
}

const getContentHeight = (
  itemCount: number,
  itemHeight: number,
  itemGapSize = 0
) => {
  if (itemCount === 0) {
    return 0;
  } else if (itemGapSize === 0) {
    return itemCount * itemHeight;
  } else {
    return itemCount - 1 * (itemHeight + itemGapSize) + itemHeight;
  }
};

export const useListHeight = ({
  borderless,
  displayedItemCount,
  getItemHeight,
  // TODO no need to incur the cost of a resizeObserver if height is explicit
  height,
  itemCount,
  itemGapSize,
  itemHeight: itemHeightProp,
  rootRef,
  rowHeightRef,
}: ListHeightHookProps): HeightHookResult => {
  // TODO default by density
  const [measuredItemHeight, setMeasuredItemHeight] = useState<number>(36);
  const [clientHeight, setClientHeight] = useState<number>();

  const [contentHeight, listHeight] = useMemo(() => {
    let result = borderless ? 0 : 2;
    const itemHeight = itemHeightProp ?? measuredItemHeight;
    const contentHeight = getContentHeight(itemCount, itemHeight, itemGapSize);
    if (
      (height !== undefined && typeof height === "number") ||
      typeof height === "string"
    ) {
      // TODO if this is a percentage, convert to number
      return [contentHeight, height];
    }

    // if there are 0 items we render with the preferred count
    const preferredItemCount =
      Math.min(displayedItemCount, itemCount) || displayedItemCount;

    if (typeof getItemHeight === "function") {
      result +=
        Array(preferredItemCount)
          .fill(0)
          .reduce<number>(
            (total, _, index) => total + getItemHeight(index) + itemGapSize,
            0
          ) -
        // We don't want gap after the last item
        itemGapSize;
    } else {
      result +=
        preferredItemCount * Number(itemHeight) +
        (preferredItemCount - 1) * itemGapSize;
    }

    const listHeight = result;

    return [contentHeight, listHeight, clientHeight];
  }, [
    borderless,
    clientHeight,
    displayedItemCount,
    getItemHeight,
    height,
    itemCount,
    itemGapSize,
    itemHeightProp,
    measuredItemHeight,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (rootRef.current) {
      const { clientHeight } = rootRef.current;
      setClientHeight(clientHeight);
    }
  }, [rootRef]);

  const handleRowHeight: ResizeHandler = useCallback(({ height }) => {
    if (typeof height === "number") {
      setMeasuredItemHeight(height);
    }
  }, []);

  useResizeObserver(rowHeightRef, HeightOnly, handleRowHeight, true);

  return {
    contentHeight,
    listClientHeight: clientHeight,
    listItemHeight: measuredItemHeight,
    listHeight,
  };
};
