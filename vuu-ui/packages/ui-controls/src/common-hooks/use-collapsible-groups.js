import { useCallback, useRef } from 'react';
import { closestListItem } from '../list/list-dom-utils';
import {
  ArrowLeft,
  ArrowRight,
  countVisibleDescendants,
  Enter,
  getNodeById,
  isHeader,
  replaceNode
} from '../utils';

const NO_HANDLERS = {};
const isToggleElement = (element) => element && element.hasAttribute('aria-expanded');

export const useCollapsibleGroups = ({
  collapsibleHeaders,
  indexPositions,
  setVisibleData,
  source
}) => {
  const highlightedIdx = useRef(null);
  // do we need to maintain this separately ?
  const visibleCount = useRef(indexPositions.length);
  const fullSource = useRef(source);
  const stateSource = useRef(fullSource.current);

  const setSource = useCallback(
    (value) => {
      setVisibleData((stateSource.current = value));
    },
    [setVisibleData]
  );

  const expandNode = useCallback((nodeList, { id }) => {
    const [newNodes, expandedNode] = replaceNode(nodeList, id, { expanded: true });
    if (isHeader(expandedNode)) {
      visibleCount.current += expandedNode.count;
    } else {
      visibleCount.current += countVisibleDescendants(expandedNode);
    }
    return newNodes;
  }, []);

  const collapseNode = useCallback((nodeList, { id }) => {
    const [newNodes, collapsedNode] = replaceNode(nodeList, id, { expanded: false });
    if (isHeader(collapsedNode)) {
      visibleCount.current -= collapsedNode.count;
    } else {
      visibleCount.current -= countVisibleDescendants(collapsedNode, true);
    }
    return newNodes;
  }, []);

  /**
   * These are List handlers, so we will not have reference to the actual node
   * element. We must rely on highlightedIdx to tell us which node is interactive.
   */
  const listHandlers = collapsibleHeaders
    ? {
        onHighlight: (idx) => {
          highlightedIdx.current = idx;
        },
        onKeyDown: (e) => {
          if (e.key === ArrowRight || e.key === Enter) {
            const node = indexPositions[highlightedIdx.current];
            if (node) {
              if (node.expanded === false) {
                e.preventDefault();
                setSource(expandNode(stateSource.current, node));
              }
            }
          }

          if (e.key === ArrowLeft || e.key === Enter) {
            const node = indexPositions[highlightedIdx.current];
            if (node) {
              if (node.expanded) {
                e.preventDefault();
                setSource(collapseNode(stateSource.current, node));
              }
            }
          }
        }
      }
    : NO_HANDLERS;

  const handleClick = useCallback(
    (evt) => {
      const el = closestListItem(evt.target);
      if (isToggleElement(el)) {
        evt.stopPropagation();
        evt.preventDefault();
        const node = getNodeById(source, el.id);
        if (node.expanded === false) {
          setSource(expandNode(source, node));
        } else if (node.expanded === true) {
          setSource(collapseNode(source, node));
        }
      }
    },
    [collapseNode, expandNode, setSource, source]
  );

  const listItemHandlers = {
    onClick: handleClick
  };

  return {
    listHandlers,
    listItemHandlers,
    visibleItemCount: visibleCount.current
  };
};
