import {
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import { hasPopup, isRoot } from "./utils";
import { isNavigationKey } from "./key-code";
import { isValidNumber } from "@vuu-ui/vuu-utils";
import { MenuOpenHandler } from "./MenuList";

export type MenuCloseReason = "tab-away" | "close-child-menu";

export type MenuCloseHandler = (
  evt: KeyboardEvent,
  reason: MenuCloseReason,
) => void;

export interface KeyboardNavigationProps {
  autoHighlightFirstItem?: boolean;
  count: number;
  defaultHighlightedIdx?: number;
  highlightedIndex?: number;
  onActivate: (idx: number) => void;
  onHighlight?: (idx: number) => void;
  onCloseMenu: MenuCloseHandler;
  onOpenMenu?: MenuOpenHandler;
}

export interface KeyboardHookListProps {
  // onBlur: (evt: FocusEvent) => void;
  onFocus: (evt: FocusEvent) => void;
  onKeyDown: (evt: KeyboardEvent) => void;
  onMouseDownCapture: () => void;
  onMouseMove: () => void;
  onMouseLeave: () => void;
}

export interface NavigationHookResult {
  focusVisible: number;
  controlledHighlighting: boolean;
  highlightedIndex: number;
  setHighlightedIndex: (idx: number) => void;
  // keyboardNavigation: RefObject<boolean>;
  listProps: KeyboardHookListProps;
  setIgnoreFocus: (ignoreFocus: boolean) => void;
}

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  autoHighlightFirstItem = false,
  count,
  defaultHighlightedIdx,
  highlightedIndex: highlightedIndexProp,
  onActivate,
  onHighlight,
  onCloseMenu,
  onOpenMenu,
}: KeyboardNavigationProps): NavigationHookResult => {
  if (
    isValidNumber(highlightedIndexProp) &&
    isValidNumber(defaultHighlightedIdx)
  ) {
    throw Error(
      "useKeyboardNavigation do not pass values for both highlightedIndex and defaultHighlightedIdx",
    );
  }

  const controlledHighlighting = isValidNumber(highlightedIndexProp);
  const highlightedIndexRef = useRef(
    defaultHighlightedIdx ??
      highlightedIndexProp ??
      (autoHighlightFirstItem ? 0 : -1),
  );
  const [, forceRender] = useState<unknown>(null);

  const setHighlightedIdx = useCallback(
    (idx: number) => {
      highlightedIndexRef.current = idx;
      onHighlight?.(idx);
      forceRender({});
    },
    [onHighlight],
  );

  const setHighlightedIndex = useCallback(
    (idx: number) => {
      if (idx !== highlightedIndexRef.current) {
        if (!controlledHighlighting) {
          setHighlightedIdx(idx);
        }
      }
    },
    [controlledHighlighting, setHighlightedIdx],
  );

  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = (value: boolean) => (ignoreFocus.current = value);

  const highlightedIndex = controlledHighlighting
    ? highlightedIndexProp
    : highlightedIndexRef.current;

  const navigateChildItems = useCallback(
    (e: KeyboardEvent) => {
      const nextIdx = nextItemIdx(count, e.key, highlightedIndexRef.current);
      if (nextIdx !== highlightedIndexRef.current) {
        setHighlightedIndex(nextIdx);
      }
    },
    [count, setHighlightedIndex],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isNavigationKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        keyBoardNavigation.current = true;
        navigateChildItems(e);
      } else if (
        (e.key === "ArrowRight" || e.key === "Enter") &&
        hasPopup(e.target as HTMLElement, highlightedIndex)
      ) {
        const menuEl = e.target as HTMLElement;
        const menuItemEl = menuEl.querySelector(
          `:scope > [data-index='${highlightedIndex}']`,
        ) as HTMLElement;

        if (menuItemEl) {
          onOpenMenu?.(menuItemEl, true);
        }
      } else if (e.key === "ArrowLeft" && !isRoot(e.target as HTMLElement)) {
        onCloseMenu(e, "close-child-menu");
      } else if (e.key === "Enter") {
        e.preventDefault();
        e.stopPropagation();
        onActivate && onActivate(highlightedIndex);
      } else if (e.key === "Tab") {
        onCloseMenu(e, "tab-away");
      }
    },
    [highlightedIndex, navigateChildItems, onActivate, onCloseMenu, onOpenMenu],
  );

  const listProps: KeyboardHookListProps = useMemo(
    () => ({
      onFocus: () => {
        if (highlightedIndex === -1) {
          setHighlightedIdx(0);
        }
      },
      onKeyDown: handleKeyDown,
      onMouseDownCapture: () => {
        keyBoardNavigation.current = false;
        setIgnoreFocus(true);
      },

      // onMouseEnter would seem less expensive but it misses some cases
      onMouseMove: () => {
        if (keyBoardNavigation.current) {
          keyBoardNavigation.current = false;
        }
      },
      onMouseLeave: () => {
        keyBoardNavigation.current = true;
        setIgnoreFocus(false);
        setHighlightedIndex(-1);
      },
    }),
    [handleKeyDown, highlightedIndex, setHighlightedIdx, setHighlightedIndex],
  );

  return {
    focusVisible: keyBoardNavigation.current ? highlightedIndex : -1,
    controlledHighlighting,
    highlightedIndex,
    setHighlightedIndex: setHighlightedIndex,
    listProps,
    setIgnoreFocus,
  };
};

// need to be able to accommodate disabled items
function nextItemIdx(count: number, key: string, idx: number) {
  if (key === "ArrowUp") {
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
