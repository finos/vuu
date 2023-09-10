import { useMemo } from "react";
import { KeySet } from "./keyset";
import { CollectionItem } from "./common-hooks";
import { ViewportRange } from "./useScrollPosition";

/**
 * [ item key, total height before the item, next row index, CollectionItem<Item>]
 * e.g. first item: [0, 0, 1, data[0]]
 */
export type Row<Item> = [number, number, number, CollectionItem<Item>];

const byKey = ([k1]: Row<unknown>, [k2]: Row<unknown>) => k1 - k2;

const renderBuffer = 5;

interface VirtualizationHookProps<Item> {
  data: CollectionItem<Item>[];
  listItemGapSize?: number;
  listItemHeight: number;
  viewportRange: ViewportRange;
}

export const useVirtualization = <Item>({
  data,
  listItemGapSize = 0,
  listItemHeight,
  viewportRange,
}: VirtualizationHookProps<Item>): Row<Item>[] => {
  const keys = useMemo(() => new KeySet(0, 1), []);
  const rowHeightWithGap = listItemHeight + listItemGapSize;
  const lo = Math.max(0, viewportRange.from - renderBuffer);
  const hi = Math.min(data.length, viewportRange.to + renderBuffer);
  keys.reset(lo, hi);
  const rows = data
    .slice(lo, hi)
    .map(
      (value, idx) =>
        [
          keys.keyFor(idx + lo),
          (idx + lo) * rowHeightWithGap,
          idx + lo + 1,
          value,
        ] as Row<Item>
    )
    .sort(byKey);

  return rows;
};
