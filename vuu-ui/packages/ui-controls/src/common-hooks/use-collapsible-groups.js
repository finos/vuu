import { useCallback, useRef } from 'react';
import { closestListItem } from './list-dom-utils';
import { ArrowLeft, ArrowRight, Enter, getNodeById, replaceNode } from '../utils';

const NO_HANDLERS = {};
const isToggleElement = (element) => element && element.hasAttribute('aria-expanded');

export const useCollapsibleGroups = ({
  collapsibleHeaders,
  highlightedIdx,
  indexPositions,
  setVisibleData,
  source
}) => {
  const fullSource = useRef(source);
  const stateSource = useRef(fullSource.current);

  const setSource = useCallback(
    (value) => {
      setVisibleData((stateSource.current = value));
    },
    [setVisibleData]
  );

  const expandNode = useCallback(
    (nodeList, { id }) => replaceNode(nodeList, id, { expanded: true }),
    []
  );

  const collapseNode = useCallback(
    (nodeList, { id }) => replaceNode(nodeList, id, { expanded: false }),
    []
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === ArrowRight || e.key === Enter) {
        const node = indexPositions[highlightedIdx];
        if (node) {
          if (node.expanded === false) {
            e.preventDefault();
            setSource(expandNode(stateSource.current, node));
          }
        }
      }

      if (e.key === ArrowLeft || e.key === Enter) {
        const node = indexPositions[highlightedIdx];
        if (node) {
          if (node.expanded) {
            e.preventDefault();
            setSource(collapseNode(stateSource.current, node));
          }
        }
      }
    },
    [collapseNode, expandNode, highlightedIdx, indexPositions, setSource]
  );

  /**
   * These are List handlers, so we will not have reference to the actual node
   * element. We must rely on highlightedIdx to tell us which node is interactive.
   */
  const listHandlers = collapsibleHeaders
    ? {
        onKeyDown: handleKeyDown
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
    listItemHandlers
  };
};
