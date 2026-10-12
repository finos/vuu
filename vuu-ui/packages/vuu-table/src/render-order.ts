import type { DataRow } from "@vuu-ui/vuu-table-types";

export interface RenderEntry {
  dataRow: DataRow;
  /** selected row whose predecessor (in row order) is not selected */
  selectionStart: boolean;
  /** selected row whose successor (in row order) is not selected */
  selectionEnd: boolean;
  /** non-selected row whose successor (in row order) is selected */
  precedesSelection: boolean;
}

const createEntry = (
  dataRow: DataRow,
  prev: DataRow | undefined,
  next: DataRow | undefined,
): RenderEntry => {
  // isSelected is the raw DataSourceRow value, which may be 0 | 1, not boolean
  const selected = Boolean(dataRow.isSelected);
  return {
    dataRow,
    selectionStart: selected && prev !== undefined && !prev.isSelected,
    selectionEnd: selected && next !== undefined && !next.isSelected,
    precedesSelection: !selected && Boolean(next?.isSelected),
  };
};

const byRenderIndex = (e1: RenderEntry, e2: RenderEntry) =>
  e1.dataRow.renderIndex - e2.dataRow.renderIndex;

/**
 * Rows are rendered with recycled keys (renderIndex). If they were rendered in
 * row (index) order, React's keyed reconciliation would have to move DOM nodes
 * whenever the mapping of keys to rows rotates - which happens on every scroll
 * step, and particularly expensively when scrolling backwards. Rendering in
 * renderIndex order keeps the order of keyed children stable, so React never
 * moves a DOM node. Rows are positioned absolutely, so DOM order has no visual
 * effect. Anything that previously relied on DOM sibling order to infer row
 * order (e.g. selection styling) must use the flags computed here instead.
 *
 * renderIndex values are drawn from a small, dense pool (KeySet), so rows can
 * be placed directly into slots in a single O(n) pass, no sort is required.
 */
export const getRowsInRenderOrder = (dataRows: DataRow[]): RenderEntry[] => {
  // dataRows may be sparse, collect populated entries in row order
  const rows: DataRow[] = [];
  let maxRenderIndex = -1;
  for (let i = 0; i < dataRows.length; i++) {
    const dataRow = dataRows[i];
    if (dataRow !== undefined) {
      rows.push(dataRow);
      if (dataRow.renderIndex > maxRenderIndex) {
        maxRenderIndex = dataRow.renderIndex;
      }
    }
  }

  const count = rows.length;
  const entries: RenderEntry[] = new Array(count);
  for (let i = 0; i < count; i++) {
    entries[i] = createEntry(rows[i], rows[i - 1], rows[i + 1]);
  }

  // Guard against a renderIndex pool much larger than the row count, slots
  // would then be mostly empty, a sort is cheaper.
  if (maxRenderIndex >= count * 4 + 100) {
    return entries.sort(byRenderIndex);
  }

  const slots: (RenderEntry | undefined)[] = new Array(maxRenderIndex + 1);
  for (let i = 0; i < count; i++) {
    const entry = entries[i];
    const { renderIndex } = entry.dataRow;
    if (renderIndex < 0 || slots[renderIndex] !== undefined) {
      // invalid or duplicate renderIndex, fall back to a stable sort
      return entries.sort(byRenderIndex);
    }
    slots[renderIndex] = entry;
  }

  const result: RenderEntry[] = [];
  for (let i = 0; i < slots.length; i++) {
    const entry = slots[i];
    if (entry !== undefined) {
      result.push(entry);
    }
  }
  return result;
};
