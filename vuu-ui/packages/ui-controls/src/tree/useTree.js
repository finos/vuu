import { useCallback, useRef } from 'react';
import {
  useCollapsibleGroups,
  useHierarchicalData,
  useKeyboardNavigation,
  useSelection
} from '../common-hooks';
import { useKeyboardNavigation as useTreeNavigation } from './use-tree-keyboard-navigation';
import { useDragDrop } from '../common-hooks/use-hierarchical-drag-drop';

const EMPTY_ARRAY = [];

export const useTree = ({
  allowDragDrop,
  containerRef,
  defaultSelected,
  sourceWithIds,
  groupSelection,
  id,
  onChange,
  onHighlight: onHighlightProp,
  selected: selectedProp,
  selection,
  totalItemCount
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
    selected: lastSelection.current
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders: true,
    count: totalItemCount,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    setVisibleData: dataHook.setData,
    source: dataHook.data
  });

  const handleDrop = useCallback(
    (fromIndex, toIndex) => {
      console.log(`dropAtIndex ${fromIndex} ${toIndex}`);
      const data = dataHook.data.slice();
      const [target] = data.splice(fromIndex, 1);
      if (toIndex === -1) {
        data.push(target);
      } else {
        data.splice(toIndex, 0, target);
      }
      dataHook.setData(data);
      keyboardHook.hiliteItemAtIndex(toIndex);
    },
    [dataHook, keyboardHook]
  );

  const { onMouseDown, ...dragDropHook } = useDragDrop({
    allowDragDrop,
    orientation: 'vertical',
    containerRef,
    itemQuery: '.hwTreeNode:not(.hwTreeNode-toggle)',
    onDrop: handleDrop
  });

  const selectionHook = useSelection({
    defaultSelected,
    groupSelection,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    onChange,
    selected: selectedProp,
    selection
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

  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHook.selected;

  const listProps = {
    'aria-activedescendant': getActiveDescendant(),
    onBlur: keyboardHook.listProps.onBlur,
    onFocus: keyboardHook.listProps.onFocus,
    onKeyDown: handleKeyDown,
    onMouseDown,
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
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    listProps,
    listItemHandlers,
    selected: selectionHook.selected,
    visibleData: dataHook.data,
    ...dragDropHook
  };
};
