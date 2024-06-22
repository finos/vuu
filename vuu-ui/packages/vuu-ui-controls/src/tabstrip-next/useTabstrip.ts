import type { MenuActionHandler } from "@finos/vuu-data-types";
import type { OverflowItem } from "@finos/vuu-ui-controls";
import { orientationType } from "@finos/vuu-utils";
import {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import { isTabMenuOptions } from "./TabMenuOptions";
import { DropHandler } from "./dragDropTypes";
import { getIndexOfSelectedTab } from "./tabstrip-dom-utils";
import { useAnimatedSelectionThumb } from "./useAnimatedSelectionThumb";
import { useDragDrop } from "./useDragDrop";
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

type InteractedTabState = {
  index: number;
  state: "rename";
};

export const useTabstrip = ({
  activeTabIndex: activeTabIndexProp,
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
  const [interactedTabState, setInteractedTabState] = useState<
    InteractedTabState | undefined
  >();

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

  const handleExitEditMode = useCallback<ExitEditModeHandler>(
    (originalValue, editedValue, allowDeactivation, tabIndex) => {
      setInteractedTabState(undefined);
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

  const editTab = useCallback(
    (tabIndex = highlightedIdx) => {
      console.log(`set interacted tab state ${tabIndex}`);
      setInteractedTabState({ index: tabIndex, state: "rename" });
    },
    [highlightedIdx]
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
    if (interactedTabState?.index === highlightedIdx) {
      keyboardHookSetHighlightedIndex(highlightedIdx);
    } else {
      keyboardHookFocusTab(highlightedIdx);
    }
  }, [
    highlightedIdx,
    interactedTabState?.index,
    keyboardHookFocusTab,
    keyboardHookSetHighlightedIndex,
  ]);

  // const onSwitchWrappedItemIntoView = useCallback(
  //   (item: OverflowItem) => {
  //     const index = parseInt(item.index);
  //     if (!isNaN(index)) {
  //       selectionHookActivateTab(index);
  //     }
  //   },
  //   [selectionHookActivateTab]
  // );

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
  };

  const handleDrop = useCallback<DropHandler>(
    ({ fromIndex, toIndex }) => {
      onMoveTab?.(fromIndex, toIndex);
    },
    [onMoveTab]
  );

  const dragProps = useDragDrop({ onDrop: handleDrop });

  return {
    activeTabIndex: selectionHookSelected,
    containerProps: {
      ...keyboardHook.containerProps,
      // onSwitchWrappedItemIntoView,
    },
    containerStyle,
    dragProps,
    focusVisible: keyboardHook.focusVisible,
    interactedTabState,
    navigationProps,
    onClickAddTab: handleAddTabClick,
    tabProps,
  };
};
