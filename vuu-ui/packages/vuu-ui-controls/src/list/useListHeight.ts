import { MeasuredSize } from "@finos/vuu-ui-controls";
import { useCallback, useMemo, useRef, useState } from "react";
import { HeightOnly, ResizeHandler, useResizeObserver } from "../common-hooks";

export interface ListHeightHookProps {
  displayedItemCount: number;
  getItemHeight?: (index: number) => number;
  height?: number | string;
  itemCount: number;
  itemGapSize: number;
  itemHeight?: number;
  size: MeasuredSize | undefined;
}

export interface HeightHookResult {
  computedListHeight: number | undefined;
  contentHeight: number;
  listClientHeight?: number;
  listItemHeight: number;
  rowHeightProxyRef: (el: HTMLDivElement | null) => void;
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
  displayedItemCount,
  getItemHeight,
  // TODO no need to incur the cost of a resizeObserver if height is explicit
  height,
  itemCount,
  itemGapSize,
  itemHeight: itemHeightProp = 36,
  size,
}: ListHeightHookProps): HeightHookResult => {
  // TODO default by density
  const [measuredItemHeight, setMeasuredItemHeight] =
    useState<number>(itemHeightProp);
  // Not 100% sure why we need this forceUpdate
  const [, forceUpdate] = useState({});
  // This is a ref to the 'item proxy' a hiden list item used to detect css driven
  // size changes (e.g. runtime density switch)
  const proxyItemRef = useRef<HTMLDivElement | null>(null);

  const [contentHeight, computedListHeight] = useMemo(() => {
    let result = 0;
    const itemHeight = measuredItemHeight ?? itemHeightProp;
    const contentHeight = getContentHeight(itemCount, itemHeight, itemGapSize);
    if (height !== undefined) {
      // TODO if this is a percentage, convert to number
      return [contentHeight, undefined];
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

    return [contentHeight, listHeight];
  }, [
    displayedItemCount,
    getItemHeight,
    height,
    itemCount,
    itemGapSize,
    itemHeightProp,
    measuredItemHeight,
  ]);

  const handleRowHeight: ResizeHandler = useCallback(({ height }) => {
    if (typeof height === "number") {
      setMeasuredItemHeight(height);
    }
  }, []);

  const rowHeightProxyRef = useCallback((el: HTMLDivElement | null) => {
    proxyItemRef.current = el;
    forceUpdate({});
  }, []);

  useResizeObserver(proxyItemRef, HeightOnly, handleRowHeight, true);

  return {
    computedListHeight,
    contentHeight,
    listClientHeight: size?.height,
    listItemHeight: measuredItemHeight,
    rowHeightProxyRef,
  };
};
