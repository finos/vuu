import { useCallback, useRef } from 'react';
import {
  useCollapsibleGroups,
  useHierarchicalData,
  useKeyboardNavigation,
  useSelection
} from '../common-hooks';
import { useTypeahead } from './hooks';

console.log('[useList]');

const EMPTY_ARRAY = [];

export const useList = ({
  collapsibleHeaders,
  defaultHighlightedIdx,
  defaultSelected,
  highlightedIdx: highlightedIdxProp,
  id,
  onChange,
  onHighlight: onHighlightProp,
  selected,
  selection,
  sourceWithIds
}) => {
  const lastSelection = useRef(EMPTY_ARRAY);
  const dataHook = useHierarchicalData(sourceWithIds);

  const handleKeyboardNavigation = (evt, nextIdx) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIdx);
  };

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    defaultHighlightedIdx,
    highlightedIdx: highlightedIdxProp,
    indexPositions: dataHook.indexPositions,
    onHighlight: onHighlightProp,
    onKeyboardNavigation: handleKeyboardNavigation,
    id,
    label: 'List',
    selected: lastSelection.current
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    setVisibleData: dataHook.setData,
    source: dataHook.data
  });

  const selectionHook = useSelection({
    defaultSelected,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    onChange,
    label: 'useList',
    selected,
    selection
  });

  const typeaheadHook = useTypeahead({
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    typeToNavigate: true,
    source: sourceWithIds
  });

  // TODO just assign directly in listProps
  const handleBlur = useCallback(
    (evt) => {
      keyboardHook.listProps.onBlur(evt);
    },
    [keyboardHook]
  );

  const handleFocus = useCallback(
    (evt) => {
      keyboardHook.listProps.onFocus(evt);
    },
    [keyboardHook]
  );

  const handleKeyDown = useCallback(
    (evt) => {
      typeaheadHook.listProps.onKeyDown?.(evt);
      if (!evt.defaultPrevented) {
        keyboardHook.listProps.onKeyDown(evt);
      }
      if (!evt.defaultPrevented) {
        selectionHook.listHandlers.onKeyDown?.(evt);
      }
      if (!evt.defaultPrevented) {
        collapsibleHook.listHandlers.onKeyDown?.(evt);
      }
    },
    [collapsibleHook, keyboardHook, selectionHook, typeaheadHook]
  );

  // TOSO jusy assign directly to listProps
  const handleMouseDownCapture = useCallback(
    (evt) => {
      keyboardHook.listProps.onMouseDownCapture(evt);
    },
    [keyboardHook]
  );

  const handleMouseLeave = useCallback(
    (evt) => {
      keyboardHook.listProps.onMouseLeave(evt);
    },
    [keyboardHook]
  );

  const handleMouseMove = useCallback(
    (evt) => {
      keyboardHook.listProps.onMouseMove(evt);
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
    onBlur: handleBlur,
    onFocus: handleFocus,
    onKeyDown: handleKeyDown,
    onMouseDownCapture: handleMouseDownCapture,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove
  };

  return {
    count: collapsibleHook.count,
    focusVisible: keyboardHook.focusVisible,
    controlledHighlighting: keyboardHook.controlledHighlighting,
    highlightedIdx,
    hiliteItemAtIndex: keyboardHook.hiliteItemAtIndex,
    keyBoardNavigation: keyboardHook.keyBoardNavigation,
    listItemHeaderHandlers: collapsibleHook.listItemHandlers,
    listItemHandlers: selectionHook.listItemHandlers,
    listProps,
    selected: selectionHook.selected,
    setIgnoreFocus: keyboardHook.setIgnoreFocus,
    visibleData: dataHook.indexPositions
  };
};
