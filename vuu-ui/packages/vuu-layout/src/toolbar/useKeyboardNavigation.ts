import { useControlled } from "@salt-ds/core";
import {
  dispatchMouseEvent,
  getClosest,
  getElementDataIndex,
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
import { getIndexOfEditedItem } from "./toolbar-dom-utils";
import { NavigationOutOfBoundsHandler } from "./Toolbar";
import { PopupCloseCallback } from "@finos/vuu-popups";

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

const isOverflowIndicator = (el: HTMLElement | null) =>
  el !== null && el.dataset.index === "overflow";

const itemIsNotFocusable = (
  container: HTMLElement | null,
  direction: "bwd" | "fwd",
  indexCount: number,
  nextIdx: number,
  hasOverflowedItem: boolean
) => {
  if (container) {
    const withinRangeBwd = direction === "bwd" && nextIdx > 0;
    const withinRangeFwd = direction === "fwd" && nextIdx < indexCount;
    const withinRange = withinRangeBwd || withinRangeFwd;
    const nextElement = getElementByPosition(container, nextIdx, true);
    const isOverflowedItem =
      hasOverflowedItem && !isNonWrappedElement(nextElement);
    const isHiddenOverflowIndicator =
      !hasOverflowedItem && isOverflowIndicator(nextElement);
    hasOverflowedItem && !isNonWrappedElement(nextElement);
    return withinRange && (isOverflowedItem || isHiddenOverflowIndicator);
  } else {
    return false;
  }
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

const isNonWrappedElement = (element: HTMLElement | null) =>
  element !== null && !element.classList.contains("wrapped");

const getToolbarItems = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-index]")) as HTMLElement[];

const getIndexOfOverflowItem = (container: HTMLElement | null) => {
  if (container === null) {
    return -1;
  } else {
    const targets = getToolbarItems(container);
    const indexValues = targets.map((el) => el.dataset.index);
    return indexValues.indexOf("overflow");
  }
};

// Get an OverflowItem based on data-index
const getElementByPosition = (
  container: HTMLElement | null,
  index: number,
  includeOverflowInd = false
) => {
  if (container !== null) {
    const targets = getToolbarItems(container);
    const target = targets[index];
    if (!includeOverflowInd && isOverflowIndicator(target)) {
      return null;
    } else {
      return target;
    }
  }
  return null;
};

export interface ContainerNavigationProps {
  onBlur: FocusEventHandler;
  onFocus: FocusEventHandler;
  onMouseDownCapture: MouseEventHandler;
  onMouseLeave: MouseEventHandler;
}

interface ToolbarNavigationHookProps {
  containerRef: RefObject<HTMLElement>;
  defaultHighlightedIdx?: number;
  highlightedIdx?: number;
  onNavigateOutOfBounds?: NavigationOutOfBoundsHandler;
  orientation: orientationType;
}

interface ToolbarNavigationHookResult {
  containerProps: ContainerNavigationProps;
  focusableIdx: number;
  highlightedIdx: number;
  focusItem: (
    itemIndex: number,
    immediateFocus?: boolean,
    withKeyboard?: boolean,
    delay?: number
  ) => void;
  focusVisible: number;
  focusIsWithinComponent: boolean;
  onClick: (evt: ReactMouseEvent, tabIndex: number) => void;
  onFocus: (evt: FocusEvent<HTMLElement>) => void;
  onKeyDown: (evt: KeyboardEvent) => void;
  onOverflowMenuClose?: PopupCloseCallback;
  setHighlightedIdx: (highlightedIndex: number) => void;
}

export const useKeyboardNavigation = ({
  containerRef,
  defaultHighlightedIdx = -1,
  highlightedIdx: highlightedIdxProp,
  onNavigateOutOfBounds,
  orientation,
}: ToolbarNavigationHookProps): ToolbarNavigationHookResult => {
  const mouseClickPending = useRef(false);
  /** tracks the highlighted index */
  const focusedRef = useRef<number>(-1);
  const [hasFocus, setHasFocus] = useState(false);
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

  const focusItem = useCallback(
    (
      itemIndex: number,
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
      console.log(`focus item ${itemIndex}`);
      setHighlightedIdx(itemIndex);

      if (withKeyboard === true && !keyboardNavigation.current) {
        keyboardNavigation.current = true;
      }

      const setFocus = () => {
        const element = getElementByPosition(
          containerRef.current,
          itemIndex,
          true
        );
        if (element) {
          const focussableElement = getFocusableElement(element);
          focussableElement?.focus();
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
      if (e.target.tabIndex === 0) {
        // we are tabbing into the focusable item, by default the first
        // align highlighted index
        const index = getElementDataIndex(getClosest(e.target, "index"));
        setHighlightedIdx(index);
      } else if (e.target.tabIndex === -1) {
        // Do nothing, assume focus is being passed back to button by closing dialog. Might need
        // to revisit this and add code here if we may get focus set programatically in other ways.
      } else {
        const index = getIndexOfEditedItem(containerRef.current);
        if (index !== -1) {
          requestAnimationFrame(() => {
            setHighlightedIdx(index);
          });
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

      const hasOverflowedItem =
        containerRef.current?.querySelector(
          ".vuuOverflowContainer-wrapContainer-overflowed"
        ) != null;

      while (
        itemIsNotFocusable(
          containerRef.current,
          nextDirection,
          indexCount,
          nextIdx,
          hasOverflowedItem
        )
      ) {
        const newIdx = nextItemIdx(indexCount, nextDirection, nextIdx);
        if (newIdx === nextIdx) {
          // theres no further index and nextIndex is not focusable
          // so there are no further focusable items
          return index;
        } else {
          nextIdx = newIdx;
        }
      }
      return nextIdx;
    },
    [containerRef, getIndexCount]
  );

  const navigateChildItems = useCallback(
    (e: React.KeyboardEvent) => {
      const direction = navigation[orientation][e.key];
      const nextIdx = nextFocusableItemIdx(direction, highlightedIdx);
      console.log(`highlightedIdx = ${highlightedIdx}, nextIdx = ${nextIdx} `);
      if (nextIdx !== highlightedIdx) {
        const immediateFocus = true;
        focusItem(nextIdx, immediateFocus);
      } else {
        onNavigateOutOfBounds?.(direction === "bwd" ? "start" : "end");
      }
    },
    [
      orientation,
      nextFocusableItemIdx,
      highlightedIdx,
      focusItem,
      onNavigateOutOfBounds,
    ]
  );

  const highlightedItemHasMenu = useCallback(() => {
    const el = getElementByPosition(containerRef.current, highlightedIdx);
    if (el) {
      return el.querySelector(".vuuPopupMenu") != null;
    }
    return false;
  }, [containerRef, highlightedIdx]);

  const highlightedItemInEditState = useCallback(() => {
    const el = getElementByPosition(containerRef.current, highlightedIdx);
    if (el) {
      return el.querySelector(".vuuEditableLabel-input") != null;
    }
    return false;
  }, [containerRef, highlightedIdx]);

  const activateItemMenu = useCallback(() => {
    const el = getElementByPosition(containerRef.current, highlightedIdx);
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
          navigateChildItems(e);
        }
      } else if (
        isMenuActivationKey(e.key) &&
        highlightedItemHasMenu() &&
        !highlightedItemInEditState()
      ) {
        activateItemMenu();
      }
    },
    [
      activateItemMenu,
      getIndexCount,
      highlightedItemHasMenu,
      highlightedItemInEditState,
      navigateChildItems,
      orientation,
    ]
  );

  // TODO, in common hooks, we use mouse movement to track current highlighted
  // index, rather than rely on component item reporting it
  const handleItemClick = (_: ReactMouseEvent, itemIndex: number) => {
    setHighlightedIdx(itemIndex);
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

  const handleOverflowMenuClose = useCallback<PopupCloseCallback>(
    (closeReason) => {
      if (closeReason?.type === "escape") {
        const index = getIndexOfOverflowItem(containerRef.current);
        if (index !== -1) {
          focusItem(index);
        }
      }
    },
    [containerRef, focusItem]
  );

  const containerProps = {
    onBlur: (e: FocusEvent) => {
      const sourceTarget = (e.target as HTMLElement).closest(".vuuToolbar");
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
    focusableIdx: 0,
    focusItem,
    onClick: handleItemClick,
    onFocus,
    onKeyDown: handleKeyDown,
    onOverflowMenuClose: handleOverflowMenuClose,
    setHighlightedIdx,
  };
};
