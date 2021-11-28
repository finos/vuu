import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { KeySet } from './keyset';

const byKey = ([k1], [k2]) => k1 - k2;
const renderBuffer = 5;

export function useVirtualization(data) {
  const viewportRef = useRef(null);
  const viewportMeasures = useRef({
    contentHeight: 10000,
    firstVisibleRow: 0,
    rowCount: 1,
    rowHeight: 0,
    scrollPos: 0
  });
  const [rows, setRows] = useState([[0, 0, 1, data[0]]]);
  const keys = useMemo(() => new KeySet({ from: 0, to: 1 }), []);

  const updateRows = useCallback(
    (from, to) => {
      const { rowHeight } = viewportMeasures.current;
      const lo = Math.max(0, from - renderBuffer);
      const hi = Math.min(data.length, to + renderBuffer);
      keys.reset(lo, hi);
      const newRows = data
        .slice(lo, hi)
        .map((value, idx) => [keys.keyFor(idx + lo), (idx + lo) * rowHeight, idx + lo + 1, value])
        .sort(byKey);
      setRows(newRows);
    },
    [data, keys]
  );

  useLayoutEffect(() => {
    const viewport = viewportMeasures.current;
    const viewportEl = viewportRef.current;
    const listItemEl = viewportEl.querySelector('.hwListItem');
    const { height: viewportHeight } = viewportEl.getBoundingClientRect();
    const { height: rowHeight } = listItemEl.getBoundingClientRect();
    viewport.rowHeight = rowHeight;
    viewport.rowCount = Math.ceil(viewportHeight / rowHeight);
    viewport.contentHeight = rowHeight * data.length;
    updateRows(0, viewport.rowCount);
  }, [data, keys, updateRows]);

  const handleVerticalScroll = useCallback(
    (e) => {
      const viewport = viewportMeasures.current;
      const scrollTop = e.target.scrollTop;
      if (scrollTop !== viewport.scrollPos) {
        viewport.scrollPos = scrollTop;
        const firstRow = Math.floor(scrollTop / viewport.rowHeight);
        if (firstRow !== viewport.firstVisibleRow) {
          viewport.firstVisibleRow = firstRow;
          const from = firstRow;
          const to = firstRow + viewport.rowCount;
          updateRows(from, to);
        }
      }
    },
    [updateRows]
  );

  return [viewportRef, rows, viewportMeasures.current.contentHeight, handleVerticalScroll];
}
