import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import {
  KeyboardEvent,
  MouseEvent,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  CollectionItem,
  hasSelection,
  ListHandlers,
  SelectHandler,
  SelectionChangeHandler,
  SelectionStrategy,
} from "../common-hooks";
import { useDragDropNext as useDragDrop } from "../drag-drop";
import {
  closestListItemIndex,
  useCollapsibleGroups,
  useKeyboardNavigation,
  useSelection,
  useTypeahead,
  useViewportTracking,
} from "./common-hooks";

import { ListControlProps, ListHookProps, ListHookResult } from "./listTypes";

export const useList = <Item, Selection extends SelectionStrategy = "default">({
  allowDragDrop = false,
  collapsibleHeaders,
  collectionHook: dataHook,
  containerRef,
  contentRef,
  defaultHighlightedIndex,
  defaultSelected,
  disabled,
  disableAriaActiveDescendant,
  disableHighlightOnFocus,
  disableTypeToSelect,
  highlightedIndex: highlightedIndexProp,
  id,
  label = "",
  listHandlers: listHandlersProp,
  onHighlight,
  onKeyboardNavigation,
  onKeyDown,
  onMoveListItem,
  onSelect,
  onSelectionChange,
  restoreLastFocus,
  selected,
  selectionStrategy,
  selectionKeys,
  stickyHeaders,
  tabToSelect,
  viewportRange,
}: ListHookProps<Item, Selection>): ListHookResult<Item, Selection> => {
  // Used to preserve selection across a drop event.
  const selectedByIndexRef = useRef<number | null | number[]>(null);
  const lastSelection = useRef<typeof selected>(selected || defaultSelected);
  const handleKeyboardNavigation = (evt: KeyboardEvent, nextIndex: number) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIndex);
    onKeyboardNavigation?.(evt, nextIndex);
  };

  // TODO where do these belong ?
  const handleSelect = useCallback<SelectHandler>(
    (evt, selectedId) => {
      if (onSelect) {
        if (selectedId !== null) {
          onSelect(evt, dataHook.itemById(selectedId));
        }
      }
    },
    [dataHook, onSelect]
  );

  // TODO should we leave the id to item conversion to List ?
  // consider the use case where we use this hook from dropdown etc
  const handleSelectionChange = useCallback<
    SelectionChangeHandler<string, Selection>
  >(
    (evt, selected) => {
      console.log(`useList handleSelectionChange`, {
        selectionStrategy,
        selected,
      });
      if (onSelectionChange) {
        if (Array.isArray(selected)) {
          const selectedItems = selected.map((id) => dataHook.itemById(id));
          onSelectionChange(evt, selectedItems as any);
        } else if (selected) {
          const item = dataHook.itemById(selected);
          onSelectionChange(evt, item as any);
        }
      }
    },
    [dataHook, onSelectionChange]
  );

  const {
    highlightedIndex,
    listProps: {
      onKeyDown: navigationKeyDown,
      onMouseMove: navigationMouseMove,
      ...navigationControlProps
    },
    setHighlightedIndex,
    ...keyboardHook
  } = useKeyboardNavigation<Item, Selection>({
    containerRef,
    defaultHighlightedIndex,
    disableHighlightOnFocus,
    highlightedIndex: highlightedIndexProp,
    indexPositions: dataHook.data,
    label,
    onHighlight,
    onKeyboardNavigation: handleKeyboardNavigation,
    restoreLastFocus,
    selected: lastSelection.current,
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders,
    highlightedIdx: highlightedIndex,
    collectionHook: dataHook,
  });

  const handleDragStart = useCallback(() => {
    setHighlightedIndex(-1);
  }, [setHighlightedIndex]);

  const selectionHook = useSelection<Selection>({
    containerRef,
    defaultSelected,
    highlightedIdx: highlightedIndex,
    itemQuery: ".vuuListItem",
    label: `${label}:useList`,
    onSelect: handleSelect,
    onSelectionChange: handleSelectionChange,
    selected,
    selectionStrategy,
    selectionKeys,
    tabToSelect,
  });

  const adjustIndex = useCallback(
    (item: CollectionItem<Item>, fromIndex: number, toIndex: number) => {
      const index = dataHook.data.indexOf(item);
      if (index === fromIndex) {
        return toIndex;
      } else if (
        index < Math.min(fromIndex, toIndex) ||
        index > Math.max(fromIndex, toIndex)
      ) {
        return index;
      }
      if (fromIndex < index) {
        return index - 1;
      } else {
        return index + 1;
      }
    },
    [dataHook.data]
  );

  // Used after a drop event, to calculate wht the new selected indices will be
  const reorderSelectedIndices = useCallback(
    (selected: string | string[], fromIndex: number, toIndex: number) => {
      if (Array.isArray(selected)) {
        return selected.map((item) => adjustIndex(item, fromIndex, toIndex));
      } else {
        return adjustIndex(selected, fromIndex, toIndex);
      }
    },
    [adjustIndex]
  );

  const handleDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (hasSelection(selectionHook.selected)) {
        selectedByIndexRef.current = reorderSelectedIndices(
          selectionHook.selected,
          fromIndex,
          toIndex
        );
      }
      onMoveListItem?.(fromIndex, toIndex);
      setHighlightedIndex(-1);
    },
    [
      selectionHook.selected,
      onMoveListItem,
      setHighlightedIndex,
      reorderSelectedIndices,
    ]
  );

  const handleDropSettle = useCallback(
    (toIndex: number) => {
      setHighlightedIndex(toIndex);
    },
    [setHighlightedIndex]
  );

  const { setSelected } = selectionHook;
  useEffect(() => {
    const { current: selectedByIndex } = selectedByIndexRef;
    if (hasSelection(selectedByIndex)) {
      const postDropSelected = Array.isArray(selectedByIndex)
        ? selectedByIndex.map((i) => dataHook.data[i])
        : dataHook.data[selectedByIndex];

      selectedByIndexRef.current = null;
      // TODO gave up trying to figure out how to type this correctly
      setSelected(postDropSelected as any);
    }
  }, [dataHook.data, setSelected]);

  useLayoutEffectSkipFirst(() => {
    if (hasSelection(lastSelection.current)) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      setSelected(Array.isArray(lastSelection.current) ? [] : null);
    }
  }, [setSelected, dataHook.data]);

  const {
    onMouseDown,
    isDragging,
    isScrolling: isDragDropScrolling,
    ...dragDropHook
  } = useDragDrop({
    allowDragDrop,
    draggableClassName: "list-item",
    orientation: "vertical",
    containerRef,
    id,
    itemQuery: ".vuuListItem",
    onDragStart: handleDragStart,
    onDrop: handleDrop,
    onDropSettle: handleDropSettle,
    // selected: selectionHook.selected,
    viewportRange,
  });

  const { onKeyDown: typeaheadOnKeyDown } = useTypeahead<Item>({
    disableTypeToSelect,
    highlightedIdx: highlightedIndex,
    highlightItemAtIndex: setHighlightedIndex,
    typeToNavigate: true,
    items: dataHook.data,
  });

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (!evt.defaultPrevented) {
        typeaheadOnKeyDown?.(evt);
      }
      // We still let the keyboard navigation hook process the event even
      // if it has been handled by the typeahead hook. That is so it can
      // correctly manage the focusVisible state.
      navigationKeyDown(evt);
      if (!evt.defaultPrevented) {
        selectionHook.listHandlers.onKeyDown?.(evt);
      }
      if (!evt.defaultPrevented) {
        collapsibleHook?.onKeyDown?.(evt);
      }

      if (!evt.defaultPrevented) {
        onKeyDown?.(evt);
      }
    },
    [
      collapsibleHook,
      navigationKeyDown,
      onKeyDown,
      selectionHook.listHandlers,
      typeaheadOnKeyDown,
    ]
  );

  // This is only appropriate when we are directly controlling a List,
  // not when a control is manipulating the list
  const { isScrolling: isViewportScrolling, scrollIntoView } =
    useViewportTracking({
      containerRef,
      contentRef,
      highlightedIdx: highlightedIndex,
      indexPositions: dataHook.data,
      stickyHeaders,
    });

  const isScrolling =
    isViewportScrolling.current || isDragDropScrolling.current;

  const handleMouseMove = useCallback(
    (evt: MouseEvent) => {
      if (!isScrolling && !disabled && !isDragging) {
        navigationMouseMove();
        const idx = closestListItemIndex(evt.target as HTMLElement);
        if (idx !== -1 && idx !== highlightedIndex) {
          const item = dataHook.data[idx];
          if (!item || item.disabled) {
            setHighlightedIndex(-1);
          } else {
            setHighlightedIndex(idx);
          }
        }
      }
    },
    [
      isDragging,
      isScrolling,
      disabled,
      setHighlightedIndex,
      navigationMouseMove,
      highlightedIndex,
      dataHook.data,
    ]
  );

  const getActiveDescendant = () =>
    highlightedIndex === undefined ||
    highlightedIndex === -1 ||
    disableAriaActiveDescendant
      ? undefined
      : dataHook.data[highlightedIndex]?.id;

  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHook.selected;

  // controlProps ?
  const listControlProps: ListControlProps = {
    "aria-activedescendant": getActiveDescendant(),
    onBlur: navigationControlProps.onBlur,
    onFocus: navigationControlProps.onFocus,
    onKeyDown: handleKeyDown,
    onMouseDown: onMouseDown,
    onMouseDownCapture: navigationControlProps.onMouseDownCapture,
    onMouseLeave: navigationControlProps.onMouseLeave,
  };

  const listHandlers: ListHandlers = listHandlersProp || {
    onClick: selectionHook.listHandlers.onClick,
    // MouseEnter would be much better for this. There is a bug in Cypress
    // wheby it emits spurious MouseEnter (and MouseOver) events around
    // keypress events, which break many tests.
    onMouseMove: handleMouseMove,
  };

  return {
    focusVisible: keyboardHook.focusVisible,
    controlledHighlighting: keyboardHook.controlledHighlighting,
    highlightedIndex,
    keyboardNavigation: keyboardHook.keyboardNavigation,
    listHandlers,
    listItemHeaderHandlers: collapsibleHook,
    listControlProps,
    scrollIntoView,
    selected: selectionHook.selected,
    setHighlightedIndex,
    setIgnoreFocus: keyboardHook.setIgnoreFocus,
    setSelected: selectionHook.setSelected,
    ...dragDropHook,
  };
};
