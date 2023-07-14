import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useRef,
} from "react";
import { useSelection } from "./useSelectionNext";
import { useKeyboardNavigation } from "./useKeyboardNavigationNext";
import { orientationType } from "../responsive";
import { OverflowItem } from "@finos/vuu-layout";

export interface TabstripNextHookProps {
  activeTabIndex: number;
  onActiveChange?: (tabIndex: number) => void;
  containerRef: RefObject<HTMLElement>;
  orientation: orientationType;
  keyBoardActivation?: "manual" | "automatic";
}

export const useTabstripNext = ({
  activeTabIndex: activeTabIndexProp,
  containerRef,
  onActiveChange,
  orientation,
  keyBoardActivation,
}: TabstripNextHookProps) => {
  const lastSelection = useRef(activeTabIndexProp);

  const keyboardHook = useKeyboardNavigation({
    containerRef,
    keyBoardActivation,
    orientation,
    selectedIndex: lastSelection.current,
  });

  const selectionHook = useSelection({
    highlightedIdx: keyboardHook.highlightedIdx,
    onSelectionChange: onActiveChange,
    selected: activeTabIndexProp,
  });
  // We need this on reEntry for navigation hook to handle focus
  lastSelection.current = selectionHook.selected;

  const handleClick = useCallback(
    (evt: MouseEvent<HTMLElement>, tabIndex: number) => {
      // releasing the mouse at end of drag will trigger a click, ignore those
      // if (!dragDropHook.isDragging) {
      keyboardHook.onClick(evt, tabIndex);
      selectionHook.onClick(evt, tabIndex);
      // }
    },
    // [dragDropHook.isDragging, keyboardHook, selectionHook]
    [keyboardHook, selectionHook]
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      keyboardHook.onKeyDown(evt);
      if (!evt.defaultPrevented) {
        selectionHook.onKeyDown(evt);
      }
      // if (!evt.defaultPrevented) {
      //   editableHook.onKeyDown(evt);
      // }
    },
    [keyboardHook, selectionHook]
  );

  const onSwitchWrappedItemIntoView = useCallback(
    (item: OverflowItem) => {
      const index = parseInt(item.index);
      if (!isNaN(index)) {
        selectionHook.activateTab(index);
      }
    },
    [selectionHook]
  );

  const navigationProps = {
    onFocus: keyboardHook.onFocus,
    onKeyDown: handleKeyDown,
  };

  // TODO useMemo for these ?
  const tabProps = {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
  };

  return {
    activeTabIndex: selectionHook.selected,
    focusVisible: keyboardHook.focusVisible,
    containerProps: {
      ...keyboardHook.containerProps,
      onSwitchWrappedItemIntoView,
    },
    navigationProps,
    tabProps,
  };
};
