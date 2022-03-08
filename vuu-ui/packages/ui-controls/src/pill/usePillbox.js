import { useCallback, useRef } from 'react';
import {
  closestListItemIndex,
  MULTI,
  useDelete,
  useHierarchicalData,
  useKeyboardNavigation,
  useSelection
} from '../common-hooks';

const EMPTY_ARRAY = [];

export const usePillbox = ({
  defaultHighlightedIdx,
  defaultSelected,
  highlightedIdx: highlightedIdxProp,
  id,
  label = '',
  listItemHandlers: listItemHandlersProp, // whats this for ?
  onChange,
  onDelete,
  onHighlight: onHighlightProp,
  itemsWithIds,
  selected
}) => {
  const lastSelection = useRef(EMPTY_ARRAY);
  const dataHook = useHierarchicalData(itemsWithIds, label);

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    defaultHighlightedIdx,
    highlightedIdx: highlightedIdxProp,
    id,
    indexPositions: dataHook.indexPositions,
    onHighlight: onHighlightProp,
    orientation: 'horizontal',
    selected: lastSelection.current
  });

  const selectionHook = useSelection({
    defaultSelected,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    onChange,
    selected,
    selection: MULTI,
    selectionKeys: 'Enter'
  });

  const { onKeyDown: deleteKeyDown } = useDelete({
    highlightedIdx,
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    indexPositions: dataHook.indexPositions,
    onDelete,
    selected: selectionHook.selected,
    setSelected: selectionHook.setSelected,
    setVisibleData: dataHook.setData
  });

  const handleFocus = useCallback(
    (evt) => {
      keyboardHook.listProps.onFocus(evt);
    },
    [keyboardHook]
  );

  const handleKeyDown = useCallback(
    (evt) => {
      keyboardHook.listProps.onKeyDown(evt);
      if (!evt.defaultPrevented) {
        selectionHook.listHandlers.onKeyDown?.(evt);
      }
      if (!evt.defaultPrevented) {
        deleteKeyDown(evt);
      }
    },
    [deleteKeyDown, keyboardHook, selectionHook]
  );

  const handleMouseEnterItem = useCallback(
    (evt) => {
      const idx = closestListItemIndex(evt.target);
      keyboardHook.hiliteItemAtIndex(idx);
    },
    [keyboardHook]
  );

  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHook.selected;

  const getActiveDescendant = () =>
    highlightedIdx === undefined || highlightedIdx === -1
      ? undefined
      : dataHook.indexPositions[highlightedIdx]?.id;

  const controlProps = {
    'aria-activedescendant': getActiveDescendant(),
    // onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    // onMouseDown: onMouseDown,
    // onMouseDownCapture: handleMouseDownCapture,
    onMouseLeave: keyboardHook.listProps.onMouseLeave,
    onMouseMove: keyboardHook.listProps.onMouseMove
  };

  return {
    controlProps,
    focusVisible: keyboardHook.focusVisible,
    highlightedIdx,
    itemHandlers: listItemHandlersProp || {
      ...selectionHook.listItemHandlers,
      onMouseEnter: handleMouseEnterItem
    },
    selected: selectionHook.selected,
    visibleData: dataHook.indexPositions
  };
};
