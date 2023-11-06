import { useLayoutEffectSkipFirst } from "@finos/vuu-layout";
import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useMemo,
  useRef,
} from "react";
import {
  hasSelection,
  isMultiSelection,
  isSingleSelection,
  ListHandlers,
  MultiSelectionHandler,
  SelectHandler,
  SelectionStrategy,
  SingleSelectionHandler,
} from "../common-hooks";
import { DragStartHandler, useDragDropNext as useDragDrop } from "../drag-drop";
import {
  closestListItemIndex,
  useCollapsibleGroups,
  useKeyboardNavigation,
  useSelection,
  useTypeahead,
  useViewportTracking,
} from "./common-hooks";

import { ListControlProps, ListHookProps, ListHookResult } from "./listTypes";
import { useListDrop } from "./useListDrop";

export const useList = <Item, S extends SelectionStrategy>({
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
  onClick: onClickProp,
  onDragStart,
  onDrop,
  onHighlight,
  onKeyboardNavigation,
  onKeyDown,
  onMoveListItem,
  onSelect,
  onSelectionChange,
  restoreLastFocus,
  scrollContainerRef,
  selected,
  selectionStrategy,
  selectionKeys,
  stickyHeaders,
  tabToSelect,
  viewportRange,
}: ListHookProps<Item, S>): ListHookResult<Item> => {
  const lastSelection = useRef<string[] | undefined>(
    selected || defaultSelected
  );
  const handleKeyboardNavigation = (evt: KeyboardEvent, nextIndex: number) => {
    selectionHook.listHandlers.onKeyboardNavigation?.(evt, nextIndex);
    onKeyboardNavigation?.(evt, nextIndex);
  };

  // console.log(
  //   `useList
  //   defaultSelected ${JSON.stringify(defaultSelected)}
  //   selectedProp ${JSON.stringify(selected)} `
  // );

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

  const scrollContainer = useMemo<RefObject<HTMLElement>>(() => {
    if (scrollContainerRef) {
      return scrollContainerRef;
    } else {
      return {
        current:
          containerRef.current?.querySelector(".vuuList-scrollContainer") ??
          null,
      };
    }
  }, [containerRef, scrollContainerRef]);

  const handleSelectionChange = useCallback<MultiSelectionHandler>(
    (evt, selected) => {
      // TODO what about empty selection
      if (onSelectionChange) {
        if (isSingleSelection(selectionStrategy)) {
          const [selectedItem] = selected;
          (onSelectionChange as SingleSelectionHandler<Item>)(
            evt,
            dataHook.itemById(selectedItem)
          );
        } else if (isMultiSelection(selectionStrategy)) {
          const selectedItems = selected.map((id) => dataHook.itemById(id));
          (onSelectionChange as MultiSelectionHandler<Item>)(
            evt,
            selectedItems
          );
        }
      }
    },
    [dataHook, onSelectionChange, selectionStrategy]
  );

  const {
    highlightedIndex,
    containerProps: {
      onKeyDown: navigationKeyDown,
      onMouseMove: navigationMouseMove,
      ...navigationControlProps
    },
    setHighlightedIndex,
    ...keyboardHook
  } = useKeyboardNavigation({
    containerRef: scrollContainer,
    defaultHighlightedIndex,
    disableHighlightOnFocus,
    highlightedIndex: highlightedIndexProp,
    itemCount: dataHook.data.length,
    label,
    onHighlight,
    onKeyboardNavigation: handleKeyboardNavigation,
    restoreLastFocus,
    selected: lastSelection.current,
    viewportItemCount: 10,
  });

  const collapsibleHook = useCollapsibleGroups({
    collapsibleHeaders,
    highlightedIdx: highlightedIndex,
    collectionHook: dataHook,
  });

  const handleDragStart = useCallback<DragStartHandler>(
    (dragDropState) => {
      setHighlightedIndex(-1);
      onDragStart?.(dragDropState);
    },
    [onDragStart, setHighlightedIndex]
  );

  const selectionHook = useSelection({
    containerRef,
    defaultSelected,
    highlightedIdx: highlightedIndex,
    itemQuery: ".vuuListItem",
    label: `${label}:useList`,
    onClick: onClickProp,
    onSelect: handleSelect,
    onSelectionChange: handleSelectionChange,
    selected,
    selectionStrategy,
    selectionKeys,
    tabToSelect,
  });

  const { handleDrop, onDropSettle } = useListDrop<Item>({
    dataHook,
    onDrop,
    onMoveListItem,
    selected: selectionHook.selected,
    setHighlightedIndex,
    setSelected: selectionHook.setSelected,
  });

  const { setSelected } = selectionHook;
  useLayoutEffectSkipFirst(() => {
    if (hasSelection(lastSelection.current)) {
      setSelected([]);
    }
  }, [selected, dataHook.data, setSelected]);

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
    onDropSettle,
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
      containerRef: scrollContainer,
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
    //TODO given that we firs onSelect and onSelectionCHange with Item(s), should we return Item(s) here ?
    selected: selectionHook.selected,
    setHighlightedIndex,
    setIgnoreFocus: keyboardHook.setIgnoreFocus,
    setSelected: selectionHook.setSelected,
    ...dragDropHook,
  };
};
