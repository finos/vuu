import { useCallback, useRef } from 'react';
import { useHierarchicalData, useSelection, useKeyboardNavigation } from '../common-hooks';
import { closestListItemIndex } from '../list';

const EMPTY_ARRAY = [];
const label = 'useSelect';

export const useSelect = ({
  sourceWithIds,
  defaultSelected,
  getDataItemById,
  groupSelection,
  id,
  onChange,
  onHighlight: onHighlightProp,
  selected: selectedProp,
  selection
}) => {
  const lastSelection = useRef(EMPTY_ARRAY);
  const dataHook = useHierarchicalData(sourceWithIds);

  const handleHighlight = (idx) => {
    onHighlightProp?.(idx);
  };

  const handleKeyboardNavigation = (evt, nextIdx) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIdx);
  };

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    id,
    indexPositions: dataHook.indexPositions,
    label,
    onHighlight: handleHighlight,
    onKeyboardNavigation: handleKeyboardNavigation,
    selected: lastSelection.current
  });

  const selectionHook = useSelection({
    defaultSelected,
    groupSelection,
    getDataItemById,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    label,
    onChange,
    selected: selectedProp,
    selection
  });

  const handleKeyDown = useCallback(
    (evt) => {
      keyboardHook.listProps.onKeyDown?.(evt);
      if (!evt.defaultPrevented) {
        selectionHook.listHandlers.onKeyDown?.(evt);
      }
    },
    [keyboardHook.listProps, selectionHook.listHandlers]
  );

  const handleMouseEnterListItem = useCallback(
    (evt) => {
      // if (!isScrolling.current) {
      const idx = closestListItemIndex(evt.target);
      keyboardHook.hiliteItemAtIndex(idx);
      // onMouseEnterListItem && onMouseEnterListItem(evt, idx);
      // }
    },
    [keyboardHook]
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
    onMouseDownCapture: keyboardHook.listProps.onMouseDownCapture,
    onMouseLeave: keyboardHook.listProps.onMouseLeave,
    onMouseMove: keyboardHook.listProps.onMouseMove
  };

  const listItemHandlers = {
    ...selectionHook.listItemHandlers,
    onMouseEnter: handleMouseEnterListItem
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
