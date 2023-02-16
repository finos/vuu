import { useCallback, useRef } from "react";
import { useKeyboardNavigation } from "./use-keyboard-navigation";
import { useSelection } from "./use-selection";
import { useHierarchicalData } from "./use-hierarchical-data";
import { useCollapsibleGroups } from "./use-collapsible-groups";
import { useKeyboardNavigation as useTreeNavigation } from "./use-tree-keyboard-navigation";

const EMPTY_ARRAY = [];

export const useTree = ({
  defaultSelected,
  sourceWithIds,
  groupSelection,
  id,
  onChange,
  onHighlight: onHighlightProp,
  selected: selectedProp,
  selection,
  totalItemCount,
}) => {
  const lastSelection = useRef(EMPTY_ARRAY);
  const dataHook = useHierarchicalData(sourceWithIds);

  const handleKeyboardNavigation = (evt, nextIdx) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIdx);
  };

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    id,
    indexPositions: dataHook.indexPositions,
    onHighlight: onHighlightProp,
    onKeyboardNavigation: handleKeyboardNavigation,
    selected: lastSelection.current,
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders: true,
    count: totalItemCount,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    setVisibleData: dataHook.setData,
    source: dataHook.data,
  });

  const selectionHook = useSelection({
    defaultSelected,
    groupSelection,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    onChange,
    selected: selectedProp,
    selection,
  });

  const treeNavigationHook = useTreeNavigation({
    source: dataHook.data,
    highlightedIdx,
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    indexPositions: dataHook.indexPositions,
  });

  const handleClick = useCallback(
    (evt) => {
      collapsibleHook.listItemHandlers?.onClick(evt);
      if (!evt.defaultPrevented) {
        selectionHook.listItemHandlers?.onClick(evt);
      }
    },
    [collapsibleHook, selectionHook]
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
    ]
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
