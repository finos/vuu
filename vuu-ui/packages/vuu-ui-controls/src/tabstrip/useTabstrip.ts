import type { MenuActionHandler } from "@finos/vuu-data-types";
import type { OverflowItem } from "@finos/vuu-layout";
import { dispatchMouseEvent, orientationType } from "@finos/vuu-utils";
import {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { useDragDrop as useDragDrop } from "../drag-drop";
import { isTabMenuOptions } from "./TabMenuOptions";
import { getIndexOfSelectedTab } from "./tabstrip-dom-utils";
import { useAnimatedSelectionThumb } from "./useAnimatedSelectionThumb";
import { useKeyboardNavigation } from "./useKeyboardNavigation";
import { useSelection } from "./useSelection";

export type ExitEditModeHandler = (
  originalValue: string,
  editedValue: string,
  allowDeactivation: boolean,
  tabIndex: number
) => void;

export interface TabstripHookProps {
  activeTabIndex: number;
  allowDragDrop: boolean;
  animateSelectionThumb: boolean;
  containerRef: RefObject<HTMLElement>;
  onActiveChange?: (tabIndex: number) => void;
  onAddTab?: () => void;
  onCloseTab?: (tabIndex: number, newActiveTabIndex: number) => void;
  onExitEditMode?: ExitEditModeHandler;
  onMoveTab?: (fromIndex: number, toIndex: number) => void;
  orientation: orientationType;
  keyBoardActivation?: "manual" | "automatic";
}

const editKeys = new Set(["Enter", " "]);
const isEditKey = (key: string) => editKeys.has(key);

const getElementWithIndex = (container: HTMLElement | null, index: number) => {
  if (container) {
    return container.querySelector(`[data-index="${index}"]`) as HTMLElement;
  } else {
    return null;
  }
};

export const useTabstrip = ({
  activeTabIndex: activeTabIndexProp,
  allowDragDrop,
  animateSelectionThumb,
  containerRef,
  onActiveChange,
  onAddTab,
  onCloseTab,
  onExitEditMode,
  onMoveTab,
  orientation,
  keyBoardActivation,
}: TabstripHookProps) => {
  const lastSelection = useRef(activeTabIndexProp);

  const {
    focusTab: keyboardHookFocusTab,
    highlightedIdx,
    onClick: keyboardHookHandleClick,
    onKeyDown: keyboardHookHandleKeyDown,
    setHighlightedIdx: keyboardHookSetHighlightedIndex,
    ...keyboardHook
  } = useKeyboardNavigation({
    containerRef,
    keyBoardActivation,
    orientation,
    selectedIndex: lastSelection.current,
  });

  const {
    activateTab: selectionHookActivateTab,
    onClick: selectionHookHandleClick,
    onKeyDown: selectionHookHandleKeyDown,
    selected: selectionHookSelected,
  } = useSelection({
    highlightedIdx,
    onSelectionChange: onActiveChange,
    selected: activeTabIndexProp,
  });
  // We need this on reEntry for navigation hook to handle focus and for dragDropHook
  // to re-apply selection after drag drop. For some reason the value is stale if we
  // directly use selectionHookSelected within the drag, even though all dependencies
  //appear to be correctly declared.
  lastSelection.current = selectionHookSelected;

  const { containerStyle, resumeAnimation, suspendAnimation } =
    useAnimatedSelectionThumb(
      containerRef,
      animateSelectionThumb ? selectionHookSelected : -1,
      orientation
    );

  const handleDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      const { current: selected } = lastSelection;
      console.log(
        `useTabstrip handleDrop ${fromIndex} - ${toIndex}  ${selected}`
      );
      onMoveTab?.(fromIndex, toIndex);
      let nextSelectedTab = -1;
      if (toIndex !== -1) {
        if (selected === fromIndex) {
          nextSelectedTab = toIndex;
        } else if (fromIndex > selected && toIndex <= selected) {
          nextSelectedTab = selected + 1;
        } else if (fromIndex < selected && toIndex >= selected) {
          nextSelectedTab = selected - 1;
        }
        if (nextSelectedTab !== -1) {
          suspendAnimation();
          selectionHookActivateTab(nextSelectedTab);
          requestAnimationFrame(resumeAnimation);
        }
        keyboardHookFocusTab(toIndex, false, false, 350);
      }
    },
    [
      keyboardHookFocusTab,
      onMoveTab,
      resumeAnimation,
      selectionHookActivateTab,
      suspendAnimation,
    ]
  );

  const { onMouseDown: dragDropHookHandleMouseDown, ...dragDropHook } =
    useDragDrop({
      allowDragDrop,
      containerRef,
      // this is for useDragDropNext
      draggableClassName: `tabstrip-${orientation}`,
      // extendedDropZone: overflowedItems.length > 0,
      onDrop: handleDrop,
      orientation: "horizontal",
      itemQuery: ".vuuOverflowContainer-item",
    });

  const handleExitEditMode = useCallback<ExitEditModeHandler>(
    (originalValue, editedValue, allowDeactivation, tabIndex) => {
      console.log(
        `handleExitEditMode ${originalValue} ${editedValue} ${allowDeactivation} ${tabIndex}`
      );
      onExitEditMode?.(originalValue, editedValue, allowDeactivation, tabIndex);
      if (!allowDeactivation) {
        // this indicates that Enter or Esc key has been pressed, hence we
        // want to make sure keyboardHook treats this as a keyboard event
        // (and applies focusVisible). The last parameter here does that.
        keyboardHookFocusTab(tabIndex, false, true);
      }
    },
    [keyboardHookFocusTab, onExitEditMode]
  );

  const handleClick = useCallback(
    (evt: ReactMouseEvent<HTMLElement>, tabIndex: number) => {
      // releasing the mouse at end of drag will trigger a click, ignore those
      // if (!dragDropHook.isDragging) {
      keyboardHookHandleClick(evt, tabIndex);
      selectionHookHandleClick(evt, tabIndex);
      // }
    },
    // [dragDropHook.isDragging, keyboardHook, selectionHook]
    [keyboardHookHandleClick, selectionHookHandleClick]
  );

  const getEditableLabel = useCallback(
    (tabIndex = highlightedIdx) => {
      const targetEl = getElementWithIndex(containerRef.current, tabIndex);
      if (targetEl) {
        return targetEl.querySelector(".vuuEditableLabel") as HTMLElement;
      }
    },
    [containerRef, highlightedIdx]
  );

  const tabInEditMode = useCallback(
    (tabIndex = highlightedIdx) => {
      const editableLabel = getEditableLabel(tabIndex);
      if (editableLabel) {
        return editableLabel.classList.contains("vuuEditableLabel-editing");
      }
      return false;
    },
    [getEditableLabel, highlightedIdx]
  );

  const editTab = useCallback(
    (tabIndex = highlightedIdx) => {
      const editableLabelEl = getEditableLabel(tabIndex);
      if (editableLabelEl) {
        dispatchMouseEvent(editableLabelEl, "dblclick");
      }
    },
    [getEditableLabel, highlightedIdx]
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      keyboardHookHandleKeyDown(evt);
      if (!evt.defaultPrevented) {
        selectionHookHandleKeyDown(evt);
      }
      if (!evt.defaultPrevented && isEditKey(evt.key)) {
        editTab();
      }
    },
    [editTab, keyboardHookHandleKeyDown, selectionHookHandleKeyDown]
  );

  const handleCloseTabFromMenu = useCallback(
    (tabIndex: number) => {
      const selectedTabIndex = getIndexOfSelectedTab(containerRef.current);
      const newActiveTabIndex =
        selectedTabIndex > tabIndex
          ? selectedTabIndex - 1
          : selectedTabIndex === tabIndex
          ? 0
          : selectedTabIndex;
      suspendAnimation();
      // containerRef.current?.classList.add("vuuTabThumb-noTransition");
      onCloseTab?.(tabIndex, newActiveTabIndex);
      setTimeout(() => {
        resumeAnimation();
        // containerRef.current?.classList.remove("vuuTabThumb-noTransition");
      }, 200);
      return true;
    },
    [containerRef, onCloseTab, resumeAnimation, suspendAnimation]
  );

  const handleRenameTabFromMenu = useCallback(
    (tabIndex: number) => {
      editTab(tabIndex);
      return true;
    },
    [editTab]
  );

  const handleTabMenuAction = useCallback<MenuActionHandler>(
    (action) => {
      if (isTabMenuOptions(action.options)) {
        switch (action.menuId) {
          case "close-tab":
            return handleCloseTabFromMenu(action.options.tabIndex);
          case "rename-tab":
            return handleRenameTabFromMenu(action.options.tabIndex);
          default:
            console.log(`tab menu action ${action.menuId}`);
        }
      }
      return false;
    },
    [handleCloseTabFromMenu, handleRenameTabFromMenu]
  );

  //TODO( why do we sometimes see this fired twice  eg following rename)
  const handleTabMenuClose = useCallback(() => {
    if (!tabInEditMode()) {
      keyboardHookFocusTab(highlightedIdx);
    } else {
      keyboardHookSetHighlightedIndex(highlightedIdx);
    }
  }, [
    highlightedIdx,
    keyboardHookFocusTab,
    keyboardHookSetHighlightedIndex,
    tabInEditMode,
  ]);

  const onSwitchWrappedItemIntoView = useCallback(
    (item: OverflowItem) => {
      const index = parseInt(item.index);
      if (!isNaN(index)) {
        selectionHookActivateTab(index);
      }
    },
    [selectionHookActivateTab]
  );

  const navigationProps = {
    onFocus: keyboardHook.onFocus,
    onKeyDown: handleKeyDown,
  };

  const handleAddTabClick = useCallback(() => {
    onAddTab?.();
    requestAnimationFrame(() => {
      const selectedTabIndex = getIndexOfSelectedTab(containerRef.current);
      if (selectedTabIndex !== -1) {
        keyboardHookFocusTab(selectedTabIndex);
      }
    });
  }, [containerRef, keyboardHookFocusTab, onAddTab]);

  const tabProps = {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onExitEditMode: handleExitEditMode,
    onMenuAction: handleTabMenuAction,
    onMenuClose: handleTabMenuClose,
    onMouseDown: dragDropHookHandleMouseDown,
  };

  return {
    activeTabIndex: selectionHookSelected,
    containerStyle,
    focusVisible: keyboardHook.focusVisible,
    containerProps: {
      ...keyboardHook.containerProps,
      onSwitchWrappedItemIntoView,
    },
    navigationProps,
    onClickAddTab: handleAddTabClick,
    tabProps,
    ...dragDropHook,
  };
};
