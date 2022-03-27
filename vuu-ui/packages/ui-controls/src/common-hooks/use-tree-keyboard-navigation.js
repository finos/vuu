import { useCallback } from 'react';
import { ArrowLeft, getNodeById, getNodeParentPath, getIndexOfNode } from '../utils';

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  highlightedIdx,
  hiliteItemAtIndex,
  indexPositions,
  source
}) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ArrowLeft) {
        const node = indexPositions[highlightedIdx];
        const parentId = getNodeParentPath(node);
        if (parentId) {
          e.preventDefault();
          const parentNode = getNodeById(source, parentId);
          const idx = getIndexOfNode(indexPositions, parentNode);
          hiliteItemAtIndex(idx);
        }
      }
    },
    [highlightedIdx, hiliteItemAtIndex, indexPositions, source]
  );

  const listHandlers = {
    onKeyDown: handleKeyDown
  };

  return {
    listHandlers
  };
};
