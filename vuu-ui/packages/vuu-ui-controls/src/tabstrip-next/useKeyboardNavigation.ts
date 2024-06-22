import { useControlled } from "@salt-ds/core";
import {
  dispatchMouseEvent,
  getElementByDataIndex,
  getFocusableElement,
  orientationType,
} from "@finos/vuu-utils";
import {
  FocusEvent,
  FocusEventHandler,
  KeyboardEvent,
  MouseEvent as ReactMouseEvent,
  MouseEventHandler,
  RefObject,
  useCallback,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowLeft,
  ArrowRight,
  Home,
  End,
} from "@finos/vuu-utils";
import { getIndexOfEditedItem } from "./tabstrip-dom-utils";

type directionType = "bwd" | "fwd" | "start" | "end";
type directionMap = { [key: string]: directionType };
const navigation = {
  horizontal: {
    [Home]: "start",
    [End]: "end",
    [ArrowLeft]: "bwd",
    [ArrowRight]: "fwd",
  } as directionMap,
  vertical: {
    [Home]: "start",
    [End]: "end",
    [ArrowUp]: "bwd",
    [ArrowDown]: "fwd",
  } as directionMap,
};

const isNavigationKey = (
  key: string,
  orientation: orientationType = "horizontal"
) => navigation[orientation][key] !== undefined;

const isMenuActivationKey = (key: string) => key === ArrowDown;

function nextItemIdx(count: number, direction: directionType, idx: number) {
  if (direction === "start") {
    return 0;
  } else if (direction === "end") {
    return count - 1;
  } else if (direction === "bwd") {
    if (idx > 0) {
      return idx - 1;
    } else {
      return idx;
    }
  } else {
    if (idx === null) {
      return 0;
    } else if (idx === count - 1) {
      return idx;
    } else {
      return idx + 1;
    }
  }
}

const isEditing = (element: HTMLElement | null | undefined) =>
  element != null && element.classList.contains("vuuTab-editing");

const isNonWrappedElement = (element: HTMLElement | null | undefined) =>
  element != null && !element.classList.contains("wrapped");

export interface ContainerNavigationProps {
  onBlur: FocusEventHandler;
  onFocus: FocusEventHandler;
  onMouseDownCapture: MouseEventHandler;
  onMouseLeave: MouseEventHandler;
}

interface TabstripNavigationHookProps {
  containerRef: RefObject<HTMLElement>;
  defaultHighlightedIdx?: number;
  highlightedIdx?: number;
  keyBoardActivation?: "manual" | "automatic";
  orientation: orientationType;
  selectedIndex: number | null;
}

interface TabstripNavigationHookResult {
  containerProps: ContainerNavigationProps;
  highlightedIdx: number;
  focusTab: (
    tabIndex: number,
    immediateFocus?: boolean,
    withKeyboard?: boolean,
    delay?: number
  ) => void;
  focusVisible: number;
  focusIsWithinComponent: boolean;
  onClick: (evt: ReactMouseEvent, tabIndex: number) => void;
  onFocus: (evt: FocusEvent<HTMLElement>) => void;
  onKeyDown: (evt: KeyboardEvent) => void;
  setHighlightedIdx: (highlightedIndex: number) => void;
}

export const useKeyboardNavigation = ({
  containerRef,
  defaultHighlightedIdx = -1,
  highlightedIdx: highlightedIdxProp,
  keyBoardActivation,
  orientation,
  selectedIndex: selectedTabIndex = 0,
}: TabstripNavigationHookProps): TabstripNavigationHookResult => {
  const manualActivation = keyBoardActivation === "manual";
  const mouseClickPending = useRef(false);
  const focusedRef = useRef<number>(-1);
  const [hasFocus, setHasFocus] = useState(false);
  const [, forceRefresh] = useState({});
  const [highlightedIdx, _setHighlightedIdx] = useControlled({
    controlled: highlightedIdxProp,
    default: defaultHighlightedIdx,
    name: "UseKeyboardNavigation",
  });

  const setHighlightedIdx = useCallback(
    (value: number) => {
      _setHighlightedIdx((focusedRef.current = value));
    },
    [_setHighlightedIdx]
  );

  const keyboardNavigation = useRef(false);

  const focusTab = useCallback(
    (
      tabIndex: number,
      immediateFocus = false,
      withKeyboard?: boolean,
      delay = 70
    ) => {
      // The timeout is important in two scenarios:
      // 1) where tab has overflowed and is being selected from overflow menu.
      // We must not focus it until the overflow mechanism + render has restored
      // it to the main display.
      // 2) when we are focussing a new tab
      // We MUST NOT delay focus when using keyboard nav, else when focus moves from
      // close button (focus ring styled by :focus-visible) to Tab label (focus ring
      // styled by css class) focus style will briefly linger on both.
      setHighlightedIdx(tabIndex);

      if (withKeyboard === true && !keyboardNavigation.current) {
        keyboardNavigation.current = true;
      }

      const setFocus = () => {
        if (tabIndex !== -1) {
          const element = getElementByDataIndex(containerRef.current, tabIndex);
          if (element) {
            const focusableElement = getFocusableElement(element);
            if (!isEditing(focusableElement)) {
              focusableElement?.focus();
            }
          }
        }
      };
      if (immediateFocus) {
        setFocus();
      } else {
        setTimeout(setFocus, delay);
      }
    },
    [containerRef, setHighlightedIdx]
  );

  const onFocus = (e: FocusEvent<HTMLElement>) => {
    // If focus is received by keyboard navigation, item with tabindex 0 will receive
    // focus. If the item receiving focus has tabindex -1, then focus has been set
    // programatically. We must respect this and not reset focus to selected tab.
    if (focusedRef.current === -1) {
      // Focus is entering tabstrip. Assume keyboard - if it'a actually mouse-driven,
      // the click event will have set correct value.
      if (e.target.tabIndex === -1) {
        // Do nothing, assume focus is being passed back to button by closing dialog. Might need
        // to revisit this and add code here if we may get focus set programatically in other ways.
      } else {
        const index = getIndexOfEditedItem(containerRef.current);
        if (index !== -1) {
          requestAnimationFrame(() => {
            setHighlightedIdx(index);
          });
        } else {
          setTimeout(() => {
            // The selected tab will have tabIndex 0 make sure our internal state is aligned.
            if (focusedRef.current === -1 && selectedTabIndex !== null) {
              setHighlightedIdx(selectedTabIndex);
            }
          }, 200);
        }
      }
    }
  };

  const getIndexCount = useCallback(
    () => containerRef.current?.querySelectorAll(`[data-index]`).length ?? 0,
    [containerRef]
  );

  const nextFocusableItemIdx = useCallback(
    (direction: directionType = "fwd", idx?: number) => {
      const indexCount = getIndexCount();
      const index = typeof idx === "number" ? idx : indexCount;

      let nextIdx = nextItemIdx(indexCount, direction, index);
      const nextDirection =
        direction === "start" ? "fwd" : direction === "end" ? "bwd" : direction;
      while (
        ((nextDirection === "fwd" && nextIdx < indexCount) ||
          (nextDirection === "bwd" && nextIdx > 0)) &&
        !isNonWrappedElement(
          getElementByDataIndex(containerRef.current, nextIdx)
        )
      ) {
        const newIdx = nextItemIdx(indexCount, nextDirection, nextIdx);
        if (newIdx === nextIdx) {
          break;
        } else {
          nextIdx = newIdx;
        }
      }
      return nextIdx;
    },
    [containerRef, getIndexCount]
  );

  // forceFocusVisible supports an edge case - first or last Tab are clicked
  // then Left or Right Arrow keys are pressed, There will be no navigation
  // but focusVisible must be applied
  const navigateChildItems = useCallback(
    (e: React.KeyboardEvent, forceFocusVisible = false) => {
      const direction = navigation[orientation][e.key];
      const nextIdx = nextFocusableItemIdx(direction, highlightedIdx);
      if (nextIdx !== highlightedIdx) {
        const immediateFocus = true;
        if (manualActivation) {
          focusTab(nextIdx, immediateFocus);
        } else {
          // activateTab(newTabIndex);
        }
      } else if (forceFocusVisible) {
        forceRefresh({});
      }
    },
    [
      highlightedIdx,
      manualActivation,
      nextFocusableItemIdx,
      focusTab,
      orientation,
    ]
  );

  const highlightedTabHasMenu = useCallback(() => {
    const el = getElementByDataIndex(containerRef.current, highlightedIdx);
    if (el) {
      return el.querySelector(".vuuPopupMenu") != null;
    }
    return false;
  }, [containerRef, highlightedIdx]);

  const activateTabMenu = useCallback(() => {
    const el = getElementByDataIndex(containerRef.current, highlightedIdx);
    const menuEl = el?.querySelector(".vuuPopupMenu") as HTMLElement;
    if (menuEl) {
      dispatchMouseEvent(menuEl, "click");
    }
    return false;
  }, [containerRef, highlightedIdx]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (getIndexCount() > 0 && isNavigationKey(e.key, orientation)) {
        e.preventDefault();
        if (keyboardNavigation.current) {
          navigateChildItems(e);
        } else {
          keyboardNavigation.current = true;
          navigateChildItems(e, true);
        }
      } else if (isMenuActivationKey(e.key) && highlightedTabHasMenu()) {
        activateTabMenu();
      }
    },
    [
      activateTabMenu,
      getIndexCount,
      highlightedTabHasMenu,
      navigateChildItems,
      orientation,
    ]
  );

  // TODO, in common hooks, we use mouse movement to track current highlighted
  // index, rather than rely on component item reporting it
  const handleItemClick = (_: ReactMouseEvent, tabIndex: number) => {
    setHighlightedIdx(tabIndex);
  };

  const handleFocus = useCallback(() => {
    if (!hasFocus) {
      setHasFocus(true);
      if (!mouseClickPending.current) {
        keyboardNavigation.current = true;
      } else {
        mouseClickPending.current = false;
      }
    }
  }, [hasFocus]);

  const handleContainerMouseDown = useCallback(() => {
    if (!hasFocus) {
      mouseClickPending.current = true;
    }
    keyboardNavigation.current = false;
  }, [hasFocus]);

  const containerProps = {
    onBlur: (e: FocusEvent) => {
      const sourceTarget = (e.target as HTMLElement).closest(".vuuTabstrip");
      const destTarget = e.relatedTarget as HTMLElement;
      if (sourceTarget && !sourceTarget?.contains(destTarget)) {
        setHighlightedIdx(-1);
        setHasFocus(false);
      }
    },
    onMouseDownCapture: handleContainerMouseDown,
    onFocus: handleFocus,
    onMouseLeave: () => {
      keyboardNavigation.current = true;
      setHighlightedIdx(-1);
      mouseClickPending.current = false;
    },
  };

  return {
    containerProps,
    focusVisible: keyboardNavigation.current ? highlightedIdx : -1,
    focusIsWithinComponent: hasFocus,
    highlightedIdx,
    focusTab,
    onClick: handleItemClick,
    onFocus,
    onKeyDown: handleKeyDown,
    setHighlightedIdx,
  };
};
