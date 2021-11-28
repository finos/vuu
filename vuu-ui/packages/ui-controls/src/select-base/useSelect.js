import { useCallback } from 'react';
import { useHierarchicalData } from './use-hierarchical-data';
import { useCollapsibleGroups, useKeyboardNavigation } from '../common-hooks';
import { useKeyboardNavigation as useTreeNavigation } from './use-keyboard-navigation';
import { useSelection } from './use-selection';

export const useSelect = ({
  sourceWithIds,
  defaultSelected,
  getDataItemById,
  groupSelection,
  id,
  onChange,
  onHighlight: onHighlightProp,
  selected: selectedProp,
  selection,
  totalItemCount
}) => {
  const dataHook = useHierarchicalData(sourceWithIds);

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders: true,
    count: totalItemCount,
    indexPositions: dataHook.indexPositions,
    setVisibleData: dataHook.setData,
    source: dataHook.data
  });

  const selectionHook = useSelection({
    defaultSelected,
    groupSelection,
    getDataItemById,
    onChange,
    selected: selectedProp,
    selection
  });

  const handleHighlight = (idx) => {
    collapsibleHook.listHandlers.onHighlight?.(idx);
    onHighlightProp?.(idx);
  };

  const handleKeyboardNavigation = (evt, nextIdx) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIdx);
  };

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    count: collapsibleHook.visibleItemCount,
    id,
    indexPositions: dataHook.indexPositions,
    onHighlight: handleHighlight,
    onKeyboardNavigation: handleKeyboardNavigation,
    selected: selectionHook.selected
  });

  const treeNavigationHook = useTreeNavigation({
    source: dataHook.data,
    highlightedIdx,
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    indexPositions: dataHook.indexPositions
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
      treeNavigationHook.listHandlers
    ]
  );

  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : dataHook.indexPositions[highlightedIdx]?.id;

  const listProps = {
    'aria-activedescendant': getActiveDescendant(),
    onBlur: keyboardHook.listProps.onBlur,
    onFocus: keyboardHook.listProps.onFocus,
    onKeyDown: handleKeyDown,
    onMouseDownCapture: keyboardHook.listProps.onMouseDownCapture,
    onMouseLeave: keyboardHook.listProps.onMouseLeave,
    onMouseMove: keyboardHook.listProps.onMouseMove
  };

  const listItemHandlers = {
    onClick: handleClick
  };

  return {
    focusVisible: keyboardHook.focusVisible,
    highlightedIdx,
    listProps,
    listItemHandlers,
    selected: selectionHook.selected,
    visibleData: dataHook.data
  };
};
