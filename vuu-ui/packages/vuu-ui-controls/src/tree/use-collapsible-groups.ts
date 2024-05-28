import { KeyboardEvent, MouseEvent, useCallback, useRef } from "react";
import { closestListItem } from "./list-dom-utils";
import { ArrowLeft, ArrowRight, Enter } from "./key-code";
import { getNodeById, replaceNode } from "./hierarchical-data-utils";
import { NormalisedTreeSourceNode } from "./treeTypes";

const NO_HANDLERS: CollapsibleHookResult["listHandlers"] = {};
const isToggleElement = (element: HTMLElement) =>
  element && element.hasAttribute("aria-expanded");

export interface CollapsibleGroupsHookProps {
  collapsibleHeaders?: boolean;
  highlightedIdx: number;
  treeNodes: NormalisedTreeSourceNode[];
  setVisibleData: (nodes: NormalisedTreeSourceNode[]) => void;
  source: NormalisedTreeSourceNode[];
}

export interface CollapsibleHookResult {
  listHandlers: {
    onKeyDown?: (e: KeyboardEvent) => void;
  };
  listItemHandlers: {
    onClick: (e: MouseEvent) => void;
  };
}

export const useCollapsibleGroups = ({
  collapsibleHeaders,
  highlightedIdx,
  treeNodes,
  setVisibleData,
  source,
}: CollapsibleGroupsHookProps): CollapsibleHookResult => {
  const fullSource = useRef<NormalisedTreeSourceNode[]>(source);
  const stateSource = useRef<NormalisedTreeSourceNode[]>(fullSource.current);

  const setSource = useCallback(
    (value) => {
      setVisibleData((stateSource.current = value));
    },
    [setVisibleData]
  );

  const expandNode = useCallback(
    (nodeList: NormalisedTreeSourceNode[], { id }: NormalisedTreeSourceNode) =>
      replaceNode(nodeList, id, { expanded: true }),
    []
  );

  const collapseNode = useCallback(
    (nodeList, { id }) => replaceNode(nodeList, id, { expanded: false }),
    []
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === ArrowRight || e.key === Enter) {
        const node = treeNodes[highlightedIdx];
        if (node) {
          if (node.expanded === false) {
            e.preventDefault();
            setSource(expandNode(stateSource.current, node));
          }
        }
      }

      if (e.key === ArrowLeft || e.key === Enter) {
        const node = treeNodes[highlightedIdx];
        if (node) {
          if (node.expanded) {
            e.preventDefault();
            setSource(collapseNode(stateSource.current, node));
          }
        }
      }
    },
    [collapseNode, expandNode, highlightedIdx, treeNodes, setSource]
  );

  /**
   * These are List handlers, so we will not have reference to the actual node
   * element. We must rely on highlightedIdx to tell us which node is interactive.
   */
  const listHandlers = collapsibleHeaders
    ? {
        onKeyDown: handleKeyDown,
      }
    : NO_HANDLERS;

  const handleClick = useCallback(
    (evt) => {
      const el = closestListItem(evt.target);
      if (isToggleElement(el)) {
        evt.stopPropagation();
        evt.preventDefault();
        const node = getNodeById(source, el.id);
        if (node?.expanded === false) {
          setSource(expandNode(source, node));
        } else if (node?.expanded === true) {
          setSource(collapseNode(source, node));
        }
      }
    },
    [collapseNode, expandNode, setSource, source]
  );

  const listItemHandlers = {
    onClick: handleClick,
  };

  return {
    listHandlers,
    listItemHandlers,
  };
};
