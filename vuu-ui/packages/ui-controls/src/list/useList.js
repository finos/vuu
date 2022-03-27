import { useCallback, useRef } from 'react';
import {
  closestListItemIndex,
  useCollapsibleGroups,
  useHierarchicalData,
  useKeyboardNavigation,
  useSelection,
  useViewportTracking
} from '../common-hooks';

import { useDragDrop } from '../common-hooks/use-drag-drop';
import { useTypeahead } from './hooks';

const EMPTY_ARRAY = [];

export const useList = ({
  allowDragDrop,
  collapsibleHeaders,
  containerRef,
  defaultHighlightedIdx,
  defaultSelected,
  highlightedIdx: highlightedIdxProp,
  id,
  listItemHandlers: listItemHandlersProp,
  onChange,
  onHighlight: onHighlightProp,
  onMouseEnterListItem,
  selected,
  selection,
  selectionKeys,
  sourceWithIds,
  stickyHeaders
}) => {
  const lastSelection = useRef(EMPTY_ARRAY);
  const dataHook = useHierarchicalData(sourceWithIds);

  const handleKeyboardNavigation = (evt, nextIdx) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIdx);
  };

  const { highlightedIdx, ...keyboardHook } = useKeyboardNavigation({
    defaultHighlightedIdx,
    highlightedIdx: highlightedIdxProp,
    id,
    indexPositions: dataHook.indexPositions,
    label: 'List',
    onHighlight: onHighlightProp,
    onKeyboardNavigation: handleKeyboardNavigation,
    selected: lastSelection.current
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders,
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
    itemQuery: '.hwListItem',
    onDrop: handleDrop
  });

  const selectionHook = useSelection({
    defaultSelected,
    disableSelection: dragDropHook.isDragging,
    highlightedIdx,
    indexPositions: dataHook.indexPositions,
    onChange,
    label: 'useList',
    selected,
    selection,
    selectionKeys
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

  const isScrolling = useViewportTracking(containerRef, highlightedIdx, stickyHeaders);

  const handleMouseEnterListItem = useCallback(
    (evt) => {
      if (dragDropHook.isDragging) {
        return;
      }
      if (!isScrolling.current) {
        const idx = closestListItemIndex(evt.target);
        keyboardHook.hiliteItemAtIndex(idx);
        onMouseEnterListItem && onMouseEnterListItem(evt, idx);
      }
    },
    [keyboardHook, dragDropHook, isScrolling, onMouseEnterListItem]
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
    onMouseDown: onMouseDown,
    onMouseDownCapture: handleMouseDownCapture,
    onMouseLeave: handleMouseLeave,
    onMouseMove: handleMouseMove
  };

  return {
    count: collapsibleHook.count,
    focusVisible: keyboardHook.focusVisible,
    controlledHighlighting: keyboardHook.controlledHighlighting,
    highlightedIdx,
    keyBoardNavigation: keyboardHook.keyBoardNavigation,
    listItemHeaderHandlers: collapsibleHook.listItemHandlers,
    listItemHandlers: listItemHandlersProp || {
      ...selectionHook.listItemHandlers,
      onMouseEnter: handleMouseEnterListItem
    },
    listProps,
    selected: selectionHook.selected,
    setIgnoreFocus: keyboardHook.setIgnoreFocus,
    visibleData: dataHook.indexPositions,
    ...dragDropHook
  };
};
