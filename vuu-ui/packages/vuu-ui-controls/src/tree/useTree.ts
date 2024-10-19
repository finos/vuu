import type { NormalisedTreeSourceNode } from "@finos/vuu-utils";
import { KeyboardEvent, useCallback, useRef } from "react";
import { useCollapsibleGroups } from "./use-collapsible-groups";
import { useHierarchicalData } from "./use-hierarchical-data";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import {
  GroupSelection,
  TreeNodeSelectionHandler,
  TreeSelection,
  useSelection,
} from "./use-selection";
import { useTreeKeyboardNavigation } from "./use-tree-keyboard-navigation";

const EMPTY_ARRAY: string[] = [];

export interface TreeHookProps {
  defaultSelected?: string[];
  groupSelection: GroupSelection;
  onChange: TreeNodeSelectionHandler;
  onHighlight?: (index: number) => void;
  selected?: string[];
  selection: TreeSelection;
  sourceWithIds: NormalisedTreeSourceNode[];
}

export const useTree = ({
  defaultSelected,
  sourceWithIds,
  onChange,
  onHighlight: onHighlightProp,
  selected: selectedProp,
  selection,
}: TreeHookProps) => {
  const lastSelection = useRef<string[]>(EMPTY_ARRAY);
  const dataHook = useHierarchicalData(sourceWithIds);

  const handleKeyboardNavigation = (evt: KeyboardEvent, nextIdx: number) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIdx);
  };

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    treeNodes: dataHook.indexPositions,
    onHighlight: onHighlightProp,
    onKeyboardNavigation: handleKeyboardNavigation,
    selected: lastSelection.current,
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders: true,
    highlightedIdx,
    treeNodes: dataHook.indexPositions,
    setVisibleData: dataHook.setData,
    source: dataHook.data,
  });

  const selectionHook = useSelection({
    defaultSelected,
    highlightedIdx,
    treeNodes: dataHook.indexPositions,
    onChange,
    selected: selectedProp,
    selection,
  });

  const treeNavigationHook = useTreeKeyboardNavigation({
    source: dataHook.data,
    highlightedIdx,
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    indexPositions: dataHook.indexPositions,
  });

  const handleClick = useCallback(
    (evt) => {
      collapsibleHook.listItemHandlers?.onClick(evt);
      if (!evt.defaultPrevented) {
        selectionHook.listItemHandlers?.onClick?.(evt);
      }
    },
    [collapsibleHook, selectionHook],
  );

  const handleKeyDown = useCallback(
    (evt) => {
      keyboardHook.listProps.onKeyDown?.(evt);
      if (!evt.defaultPrevented) {
        selectionHook.listHandlers.onKeyDown?.(evt);
      }
      if (!evt.defaultPrevented) {
        collapsibleHook.listHandlers.onKeyDown?.(evt);
      }
      if (!evt.defaultPrevented) {
        treeNavigationHook.listHandlers.onKeyDown?.(evt);
      }
    },
    [
      collapsibleHook.listHandlers,
      keyboardHook.listProps,
      selectionHook.listHandlers,
      treeNavigationHook.listHandlers,
    ],
  );

  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : dataHook.indexPositions[highlightedIdx]?.id;

  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHook.selected;

  const listProps = {
    "aria-activedescendant": getActiveDescendant(),
    onBlur: keyboardHook.listProps.onBlur,
    onFocus: keyboardHook.listProps.onFocus,
    onKeyDown: handleKeyDown,
    onMouseDownCapture: keyboardHook.listProps.onMouseDownCapture,
    onMouseLeave: keyboardHook.listProps.onMouseLeave,
    onMouseMove: keyboardHook.listProps.onMouseMove,
  };

  const listItemHandlers = {
    onClick: handleClick,
  };

  return {
    focusVisible: keyboardHook.focusVisible,
    highlightedIdx,
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    listProps,
    listItemHandlers,
    selected: selectionHook.selected,
    visibleData: dataHook.data,
  };
};
