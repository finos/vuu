import { useCallback } from "react";
import { ArrowLeft } from "./key-code";
import {
  getNodeById,
  getNodeParentPath,
  getIndexOfNode,
} from "./hierarchical-data-utils";
import { NormalisedTreeSourceNode } from "./Tree";

export interface TreeKeyboardNavigationHookProps {
  highlightedIdx: number;
  hiliteItemAtIndex: (idx: number) => void;
  indexPositions: NormalisedTreeSourceNode[];
  source: NormalisedTreeSourceNode[];
}

// we need a way to set highlightedIdx when selection changes
export const useTreeKeyboardNavigation = ({
  highlightedIdx,
  hiliteItemAtIndex,
  indexPositions,
  source,
}: TreeKeyboardNavigationHookProps) => {
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ArrowLeft) {
        const node = indexPositions[highlightedIdx];
        const parentId = getNodeParentPath(node);
        if (parentId) {
          e.preventDefault();
          const parentNode = getNodeById(source, parentId);
          if (parentNode) {
            const idx = getIndexOfNode(indexPositions, parentNode);
            if (idx !== undefined) {
              hiliteItemAtIndex(idx);
            }
          }
        }
      }
    },
    [highlightedIdx, hiliteItemAtIndex, indexPositions, source]
  );

  const listHandlers = {
    onKeyDown: handleKeyDown,
  };

  return {
    listHandlers,
  };
};
