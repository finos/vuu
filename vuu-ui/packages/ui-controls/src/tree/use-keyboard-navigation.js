import { useCallback } from 'react';
import { ArrowLeft, getNodeById, getNodeParentPath, getIndexOfNode } from '../utils';

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  highlightedIdx,
  hiliteItemAtIndex,
  indexPositions,
  source
}) => {
  console.log(`useKeyboardNavigation<Tree>`);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ArrowLeft) {
        const node = indexPositions[highlightedIdx];
        const parentId = getNodeParentPath(node);
        if (parentId) {
          const parentNode = getNodeById(source, parentId);
          const idx = getIndexOfNode(indexPositions, parentNode);
          console.log(`highlight index ${idx}`);
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
