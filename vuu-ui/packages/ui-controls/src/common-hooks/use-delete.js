import { useCallback } from 'react';
import { Backspace, Delete } from '../utils';

// we need a way to set highlightedIdx when selection changes
export const useDelete = ({
  highlightedIdx,
  hiliteItemAtIndex,
  indexPositions,
  onDelete,
  selected,
  setSelected,
  setVisibleData
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      // TODO highlight previous one
      if (e.key === Delete || e.key === Backspace) {
        const item = indexPositions[highlightedIdx];
        if (item.closeable) {
          e.preventDefault();
          const index = indexPositions.indexOf(item);
          const data = indexPositions.filter((i) => i !== item);
          setVisibleData(data);
          if (index > 0) {
            hiliteItemAtIndex(index - 1);
          } else if (data.length === 0) {
            hiliteItemAtIndex(-1);
          }
          if (selected.includes(item.id)) {
            setSelected(selected.filter((id) => id !== item.id));
          }
          onDelete?.(item);
        }
      }
    },
    [
      highlightedIdx,
      hiliteItemAtIndex,
      indexPositions,
      onDelete,
      selected,
      setSelected,
      setVisibleData
    ]
  );

  return {
    onKeyDown: handleKeyDown
  };
};
