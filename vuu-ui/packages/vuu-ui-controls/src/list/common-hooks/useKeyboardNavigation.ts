import { useControlled } from "@salt-ds/core";
import {
  FocusEvent,
  KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ArrowDown,
  ArrowUp,
  End,
  Home,
  isCharacterKey,
  isNavigationKey,
  PageDown,
  PageUp,
} from "./keyUtils";
import {
  NavigationHookProps,
  NavigationHookResult,
  getFirstSelectedItem,
  hasSelection,
} from "../../common-hooks";
import { getElementByDataIndex, isValidNumber } from "@finos/vuu-utils";

export const LIST_FOCUS_VISIBLE = -2;

function nextItemIdx(count: number, key: string, idx: number) {
  if (key === ArrowUp || key === End) {
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

const getIndexOfSelectedItem = (selected?: string[]) => {
  const selectedItemId = Array.isArray(selected)
    ? getFirstSelectedItem(selected)
    : undefined;
  if (selectedItemId) {
    const el = document.getElementById(selectedItemId) as HTMLElement;
    if (el) {
      const index = parseInt(el.dataset.index ?? "-1");
      if (isValidNumber(index)) {
        return index;
      }
    }
  }
  return -1;
};

const getStartIdx = (
  key: string,
  idx: number,
  selectedIdx: number,
  length: number
) => {
  if (key === End) {
    return length;
  } else if (key === Home) {
    return -1;
  } else if (idx !== -1) {
    return idx;
  } else {
    return selectedIdx;
  }
};

const pageDown = (
  containerEl: HTMLElement,
  itemEl: HTMLElement,
  itemCount: number,
  index: number
): number | undefined => {
  const { top: itemTop } = itemEl.getBoundingClientRect();
  const { scrollTop, clientHeight, scrollHeight } = containerEl;
  const lastIndexPosition = itemCount - 1;
  const newScrollTop = Math.min(
    scrollTop + clientHeight,
    scrollHeight - clientHeight
  );
  if (newScrollTop !== scrollTop && index < lastIndexPosition) {
    containerEl.scrollTo(0, newScrollTop);
    // Might need to do this in a timeout, in case virtualized content has rendered
    let nextIdx = index;
    let nextRect;
    do {
      nextIdx += 1;
      nextRect = getElementByDataIndex(
        containerEl,
        nextIdx,
        true
      ).getBoundingClientRect();
    } while (nextRect.top < itemTop && nextIdx < lastIndexPosition);
    return nextIdx;
  }
};

const pageUp = async (
  containerEl: HTMLElement,
  itemEl: HTMLElement,
  index: number
): Promise<number | undefined> => {
  const { top: itemTop } = itemEl.getBoundingClientRect();
  const { scrollTop, clientHeight } = containerEl;
  const newScrollTop = Math.max(scrollTop - clientHeight, 0);
  if (newScrollTop !== scrollTop && index > 0) {
    containerEl.scrollTo(0, newScrollTop);
    return new Promise((resolve) => {
      // We must defer this operation until after render. If Items are virtualized.
      // we need to allow them to be rendered.
      requestAnimationFrame(() => {
        let nextIdx = index;
        let nextRect;
        do {
          nextIdx -= 1;
          nextRect = getElementByDataIndex(
            containerEl,
            nextIdx,
            true
          ).getBoundingClientRect();
        } while (nextRect.top > itemTop && nextIdx > 0);
        resolve(nextIdx);
      });
    });
  }
};

// const isLeaf = <Item>(item: CollectionItem<Item>): boolean =>
//   !item.header && !item.childNodes;
const isLeaf = (element?: HTMLElement) => element !== undefined;
// const isFocusable = <Item>(item: CollectionItem<Item>) =>
//   isLeaf(item) || item.expanded !== undefined;
// TODO read dom element and check for leaf item or toggleable group
const isFocusable = (container: HTMLElement, index: number) => {
  const targetEl = getElementByDataIndex(container, index);
  return isLeaf(targetEl);
};

export const useKeyboardNavigation = ({
  containerRef,
  defaultHighlightedIndex = -1,
  disableHighlightOnFocus,
  highlightedIndex: highlightedIndexProp,
  itemCount,
  onHighlight,
  onKeyboardNavigation,
  restoreLastFocus,
  selected,
  viewportItemCount,
}: NavigationHookProps): NavigationHookResult => {
  const lastFocus = useRef(-1);
  const [, forceRender] = useState({});
  const [highlightedIndex, setHighlightedIdx, isControlledHighlighting] =
    useControlled({
      controlled: highlightedIndexProp,
      default: defaultHighlightedIndex,
      name: "UseKeyboardNavigation",
    });

  const setHighlightedIndex = useCallback(
    (idx: number, fromKeyboard = false) => {
      onHighlight?.(idx);
      setHighlightedIdx(idx);
      if (fromKeyboard) {
        lastFocus.current = idx;
      }
    },
    [onHighlight, setHighlightedIdx]
  );

  const nextPageItemIdx = useCallback(
    async (
      key: "PageDown" | "PageUp" | "Home" | "End",
      index: number
    ): Promise<number> => {
      const itemEl = getElementByDataIndex(containerRef.current, index, true);
      let result: number | undefined;
      if (itemEl) {
        const { current: containerEl } = containerRef;
        if (itemEl && containerEl) {
          result =
            key === PageDown
              ? pageDown(containerEl, itemEl, itemCount, index)
              : await pageUp(containerEl, itemEl, index);
        }
      }
      return result ?? index;
    },
    [containerRef, itemCount]
  );

  const nextFocusableItemIdx = useCallback(
    (key = ArrowDown, idx: number = key === ArrowDown ? -1 : itemCount) => {
      //TODO we don't seem to have selectedhere first time after selection
      if (itemCount === 0) {
        return -1;
      } else {
        const isEnd = key === "End";
        const isHome = key === "Home";
        // The start index is generally the highlightedIdx (passed in as idx).
        // We don't need it for Home and End navigation.
        // Special case where we have selection, but no highlighting - begin
        // navigation from selected item.
        const indexOfSelectedItem =
          isEnd || isHome || idx === -1 ? -1 : getIndexOfSelectedItem(selected);
        const startIdx = getStartIdx(key, idx, indexOfSelectedItem, itemCount);
        let nextIdx = nextItemIdx(itemCount, key, startIdx);

        const { current: container } = containerRef;
        // Guard against returning zero, when first item is a header or group
        if (
          nextIdx === 0 &&
          key === ArrowUp &&
          container &&
          !isFocusable(container, 0)
        ) {
          return idx;
        }
        while (
          (((key === ArrowDown || isHome) && nextIdx < itemCount) ||
            ((key === ArrowUp || isEnd) && nextIdx > 0)) &&
          container &&
          !isFocusable(container, nextIdx)
        ) {
          nextIdx = nextItemIdx(itemCount, key, nextIdx);
        }
        return nextIdx;
      }
    },
    [containerRef, itemCount, selected]
  );

  // does this belong here or should it be a method passed in?
  const keyboardNavigation = useRef(false);
  const ignoreFocus = useRef<boolean>(false);
  const setIgnoreFocus = (value: boolean) => (ignoreFocus.current = value);

  const handleFocus = useCallback(() => {
    // Ignore focus if mouse has been used
    if (ignoreFocus.current) {
      ignoreFocus.current = false;
    } else {
      // If mouse wan't used, then keyboard must have been
      keyboardNavigation.current = true;
      if (itemCount === 0) {
        setHighlightedIndex(LIST_FOCUS_VISIBLE);
      } else if (highlightedIndex !== -1) {
        // We need to force a render here. We're not changing the highlightedIdx, but we want to
        // make sure we render with the correct focusVisible value. We don't store focusVisible
        // in state, as there are places where we would double render, as highlightedIdx also changes.
        forceRender({});
      } else if (restoreLastFocus) {
        if (lastFocus.current !== -1) {
          setHighlightedIndex(lastFocus.current);
        } else {
          const selectedItemIdx = getIndexOfSelectedItem(selected);
          if (selectedItemIdx !== -1) {
            setHighlightedIndex(selectedItemIdx);
          } else {
            setHighlightedIndex(0);
          }
        }
      } else if (hasSelection(selected)) {
        const selectedItemIdx = getIndexOfSelectedItem(selected);
        setHighlightedIndex(selectedItemIdx);
      } else if (disableHighlightOnFocus !== true) {
        setHighlightedIndex(nextFocusableItemIdx());
      }
    }
  }, [
    disableHighlightOnFocus,
    highlightedIndex,
    itemCount,
    nextFocusableItemIdx,
    restoreLastFocus,
    selected,
    setHighlightedIndex,
  ]);

  const navigateChildItems = useCallback(
    async (e: KeyboardEvent) => {
      const nextIdx =
        e.key === PageDown || e.key === PageUp
          ? await nextPageItemIdx(e.key, highlightedIndex)
          : nextFocusableItemIdx(e.key, highlightedIndex);

      if (nextIdx !== highlightedIndex) {
        setHighlightedIndex(nextIdx, true);
      }
      // Users may need to know that a Keyboard navigation event has been handled
      // even if no actual navigation was effected. e.g. fine-grained control
      // over aria-activedescendant requires this.
      onKeyboardNavigation?.(e, nextIdx);
    },
    [
      highlightedIndex,
      nextFocusableItemIdx,
      nextPageItemIdx,
      onKeyboardNavigation,
      setHighlightedIndex,
    ]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (itemCount > 0 && isNavigationKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        keyboardNavigation.current = true;
        void navigateChildItems(e);
      } else if (isCharacterKey(e)) {
        keyboardNavigation.current = true;
      }
    },
    [itemCount, navigateChildItems]
  );

  const containerProps = useMemo(() => {
    return {
      onBlur: (e: FocusEvent) => {
        //TODO no direct ref to List
        const sourceTarget = (e.target as HTMLElement).closest(".vuuList");
        const destTarget = e.relatedTarget as HTMLElement;
        if (sourceTarget && !sourceTarget?.contains(destTarget)) {
          keyboardNavigation.current = false;
          setHighlightedIdx(-1);
          if (!restoreLastFocus) {
            lastFocus.current = -1;
          }
        }
      },
      onFocus: handleFocus,
      onKeyDown: handleKeyDown,
      onMouseDownCapture: () => {
        keyboardNavigation.current = false;
        setIgnoreFocus(true);
      },

      // onMouseEnter would seem less expensive but it misses some cases
      onMouseMove: () => {
        if (keyboardNavigation.current) {
          keyboardNavigation.current = false;
        }
      },
      onMouseLeave: () => {
        keyboardNavigation.current = false;
        setIgnoreFocus(false);
        setHighlightedIndex(-1);
      },
    };
  }, [
    handleFocus,
    handleKeyDown,
    restoreLastFocus,
    setHighlightedIdx,
    setHighlightedIndex,
  ]);

  return {
    focusVisible: keyboardNavigation.current ? highlightedIndex : -1,
    controlledHighlighting: isControlledHighlighting,
    highlightedIndex,
    setHighlightedIndex,
    keyboardNavigation,
    containerProps,
    setIgnoreFocus,
  };
};
