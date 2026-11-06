import type { GridSnapshot } from "./GridSnapshot";

/** The grid position of a splitter: the cell its leading edge sits in. */
export interface FocusOrderSplitter {
  readonly column: { readonly start: number };
  readonly id: string;
  readonly row: { readonly start: number };
}

interface FocusRegion {
  readonly column: number;
  readonly ids: readonly string[];
  readonly kind: 0 | 1;
  readonly row: number;
}

/**
 * The element ids of a grid's focus regions in Tab order. Regions are the
 * grid's direct children: items, placeholders, stacks and splitters.
 *
 * Regions are ordered by the cell they start in, row by row. A splitter
 * sits on the leading edge of the cell it shares with an item, so it comes
 * before that item. A stack is its tab strip followed by its selected
 * item; unselected stack items are not rendered and are left out.
 */
export const computeFocusOrder = (
  snapshot: Pick<GridSnapshot, "items" | "stacks">,
  splitters: readonly FocusOrderSplitter[],
): string[] => {
  const stackByItemId = new Map(
    snapshot.stacks.flatMap((stack) =>
      stack.itemIds.map((itemId) => [itemId, stack] as const),
    ),
  );
  const regions: FocusRegion[] = [];
  for (const item of snapshot.items) {
    const stack = stackByItemId.get(item.id);
    if (stack && stack.selectedItemId !== item.id) {
      continue;
    }
    regions.push({
      column: item.column.start,
      ids: stack ? [stack.id, item.id] : [item.id],
      kind: 1,
      row: item.row.start,
    });
  }
  for (const splitter of splitters) {
    regions.push({
      column: splitter.column.start,
      ids: [splitter.id],
      kind: 0,
      row: splitter.row.start,
    });
  }
  return regions
    .sort((a, b) => a.row - b.row || a.column - b.column || a.kind - b.kind)
    .flatMap(({ ids }) => ids);
};
