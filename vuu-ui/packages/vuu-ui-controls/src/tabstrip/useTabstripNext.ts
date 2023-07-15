import {
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { useSelection } from "./useSelectionNext";
import { useKeyboardNavigation } from "./useKeyboardNavigationNext";
import { orientationType } from "../responsive";
import { OverflowItem } from "@finos/vuu-layout";
import { useAnimatedSelectionThumb } from "./useAnimatedSelectionThumb";

export type ExitEditModeHandler = (
  originalValue: string,
  editedValue: string,
  allowDeactivation: boolean,
  tabIndex: number
) => void;

export interface TabstripNextHookProps {
  activeTabIndex: number;
  animateSelectionThumb: boolean;
  onActiveChange?: (tabIndex: number) => void;
  onExitEditMode?: ExitEditModeHandler;
  containerRef: RefObject<HTMLElement>;
  orientation: orientationType;
  keyBoardActivation?: "manual" | "automatic";
}

const editKeys = new Set(["Enter", " "]);
const isEditKey = (key: string) => editKeys.has(key);

export const useTabstripNext = ({
  activeTabIndex: activeTabIndexProp,
  animateSelectionThumb,
  containerRef,
  onActiveChange,
  onExitEditMode,
  orientation,
  keyBoardActivation,
}: TabstripNextHookProps) => {
  const lastSelection = useRef(activeTabIndexProp);

  const {
    focusTab: keyboardHookFocusTab,
    onClick: keyboardHookHandleClick,
    onKeyDown: keyboardHookHandleKeyDown,
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
    highlightedIdx: keyboardHook.highlightedIdx,
    onSelectionChange: onActiveChange,
    selected: activeTabIndexProp,
  });
  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHookSelected;

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

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      keyboardHookHandleKeyDown(evt);
      if (!evt.defaultPrevented) {
        selectionHookHandleKeyDown(evt);
      }
      if (!evt.defaultPrevented) {
        const target = evt.target as HTMLElement;
        const editableLabelEl = target.querySelector(".vuuEditableLabel");
        if (isEditKey(evt.key) && editableLabelEl) {
          const evt = new MouseEvent("dblclick", {
            view: window,
            bubbles: true,
            cancelable: true,
          });
          editableLabelEl.dispatchEvent(evt);
        }
      }
    },
    [keyboardHookHandleKeyDown, selectionHookHandleKeyDown]
  );

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

  const tabProps = {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onExitEditMode: handleExitEditMode,
  };

  const containerStyle = useAnimatedSelectionThumb(
    containerRef,
    animateSelectionThumb ? selectionHookSelected : -1
  );

  return {
    activeTabIndex: selectionHookSelected,
    focusVisible: keyboardHook.focusVisible,
    containerProps: {
      ...keyboardHook.containerProps,
      onSwitchWrappedItemIntoView,
    },
    navigationProps,
    containerStyle,
    tabProps,
  };
};
