import type { OverflowItem, ToolbarProps } from "@finos/vuu-layout";
import { isValidNumber } from "@finos/vuu-utils";
import { PopupCloseCallback } from "@finos/vuu-popups";
import {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { useSelection } from "./useSelection";

export interface ToolbarHookProps
  extends Pick<
      ToolbarProps,
      | "activeItemIndex"
      | "defaultActiveItemIndex"
      | "onActiveChange"
      | "onNavigateOutOfBounds"
    >,
    Required<Pick<ToolbarProps, "orientation" | "selectionStrategy">> {
  containerRef: RefObject<HTMLElement>;
  itemQuery?: string;
}

export const useToolbar = ({
  activeItemIndex: activeItemIndexProp,
  defaultActiveItemIndex,
  containerRef,
  itemQuery = "vuuToolbarItem",
  onActiveChange,
  onNavigateOutOfBounds,
  orientation,
  selectionStrategy,
}: ToolbarHookProps) => {
  const lastSelection = useRef(activeItemIndexProp);

  const {
    focusItem: keyboardHookFocusItem,
    highlightedIdx,
    onClick: keyboardHookHandleClick,
    onKeyDown: keyboardHookHandleKeyDown,
    setHighlightedIdx: keyboardHookSetHighlightedIndex,
    ...keyboardHook
  } = useKeyboardNavigation({
    containerRef,
    onNavigateOutOfBounds,
    orientation,
  });

  const {
    activateItem: selectionHookActivateItem,
    itemHandlers: { onClick, onKeyDown },
    selected: selectionHookSelected,
  } = useSelection({
    containerRef,
    defaultSelected: defaultActiveItemIndex,
    highlightedIdx,
    itemQuery,
    onSelectionChange: onActiveChange,
    selected: activeItemIndexProp,
    selectionStrategy,
  });
  // We need this on reEntry for navigation hook to handle focus and for dragDropHook
  // to re-apply selection after drag drop. For some reason the value is stale if we
  // directly use selectionHookSelected within the drag, even though all dependencies
  //appear to be correctly declared.
  lastSelection.current = selectionHookSelected;

  const handleClick = useCallback(
    (evt: ReactMouseEvent<HTMLElement>) => {
      const target = evt.target as HTMLElement;
      const toolbarItem = target.closest("[data-index]") as HTMLElement;
      if (toolbarItem) {
        const index = parseInt(toolbarItem.dataset.index ?? "-1");
        if (index !== -1 && isValidNumber(index)) {
          keyboardHookHandleClick(evt, index);
          onClick?.(evt, index);
        }
      }
    },
    [keyboardHookHandleClick, onClick]
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      keyboardHookHandleKeyDown(evt);
      if (!evt.defaultPrevented) {
        onKeyDown?.(evt);
      }
    },
    [keyboardHookHandleKeyDown, onKeyDown]
  );

  const onSwitchWrappedItemIntoView = useCallback(
    (item: OverflowItem) => {
      const index = parseInt(item.index);
      if (!isNaN(index)) {
        //TODO need to be able to reset the overflow-priority without selecting the item
        selectionHookActivateItem(index);
        keyboardHookFocusItem(index);
      }
    },
    [keyboardHookFocusItem, selectionHookActivateItem]
  );

  const itemProps = {
    onClick: handleClick,
    onFocus: keyboardHook.onFocus,
    onKeyDown: handleKeyDown,
  };

  return {
    activeItemIndex: selectionHookSelected,
    focusableIdx: keyboardHook.focusableIdx,
    focusVisible: keyboardHook.focusVisible,
    containerProps: {
      PopupMenuProps: {
        onKeyDown: handleKeyDown,
        onMenuClose: keyboardHook.onOverflowMenuClose,
      },
      ...keyboardHook.containerProps,
      onSwitchWrappedItemIntoView,
    },
    itemProps,
  };
};
