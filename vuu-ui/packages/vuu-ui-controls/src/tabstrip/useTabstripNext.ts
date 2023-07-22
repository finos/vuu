import type { MenuActionHandler } from "@finos/vuu-data-types";
import type { OverflowItem } from "@finos/vuu-layout";
import {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { useDragDrop } from "../drag-drop";
import type { orientationType } from "../responsive";
import { isTabMenuOptions } from "./TabMenuOptions";
import { getIndexOfSelectedTab } from "./tabstrip-dom-utils";
import { useAnimatedSelectionThumb } from "./useAnimatedSelectionThumb";
import { useKeyboardNavigation } from "./useKeyboardNavigationNext";
import { useSelection } from "./useSelectionNext";

export type ExitEditModeHandler = (
  originalValue: string,
  editedValue: string,
  allowDeactivation: boolean,
  tabIndex: number
) => void;

export interface TabstripNextHookProps {
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

export const useTabstripNext = ({
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
}: TabstripNextHookProps) => {
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
  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHookSelected;

  const { containerStyle, resumeAnimation, suspendAnimation } =
    useAnimatedSelectionThumb(
      containerRef,
      animateSelectionThumb ? selectionHookSelected : -1
    );

  const handleDrop = useCallback(
    (fromIndex: number, toIndex: number) => {
      console.log(
        `handleDrop ${fromIndex} - ${toIndex}  ${selectionHookSelected}`
      );
      onMoveTab?.(fromIndex, toIndex);
      // if (toIndex === -1) {
      //   // nothing to do
      // } else {
      //   if (selectionHookSelected === null) {
      //     // do thing
      //   } else if (selectionHookSelected === fromIndex) {
      //     selectionHook.activateTab(toIndex);
      //   } else if (
      //     fromIndex > selectionHookSelected &&
      //     toIndex <= selectionHookSelected
      //   ) {
      //     selectionHook.activateTab(selectionHookSelected + 1);
      //   } else if (
      //     fromIndex < selectionHookSelected &&
      //     toIndex >= selectionHookSelected
      //   ) {
      //     selectionHook.activateTab(selectionHookSelected - 1);
      //   }
      // }
    },
    [onMoveTab, selectionHookSelected]
  );

  const { onMouseDown: dragDropHookHandleMouseDown, ...dragDropHook } =
    useDragDrop({
      allowDragDrop,
      containerRef,
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
        const evt = new MouseEvent("dblclick", {
          view: window,
          bubbles: true,
          cancelable: true,
        });
        editableLabelEl.dispatchEvent(evt);
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
    (type, options) => {
      if (isTabMenuOptions(options)) {
        switch (type) {
          case "close-tab":
            return handleCloseTabFromMenu(options.tabIndex);
          case "rename-tab":
            return handleRenameTabFromMenu(options.tabIndex);
          default:
            console.log(`tab menu action ${type}`);
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
