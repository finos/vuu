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

export interface KeyboardNavigationProps {
  autoHighlightFirstItem?: boolean;
  count: number;
  highlightedIndex?: number;
  onActivate: (idx: number) => void;
  onHighlight?: (idx: number) => void;
  onCloseMenu: (idx: number) => void;
  onOpenMenu: (idx: number) => void;
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
  highlightedIndex: highlightedIndexProp,
  onActivate,
  onHighlight,
  // onKeyDown,
  onCloseMenu,
  onOpenMenu,
}: KeyboardNavigationProps): NavigationHookResult => {
  // const prevCount = useRef(count);
  const highlightedIndexRef = useRef(
    highlightedIndexProp ?? autoHighlightFirstItem ? 0 : -1
  );
  const [, forceRender] = useState<unknown>(null);
  const controlledHighlighting = highlightedIndexProp !== undefined;

  // count will not work for this, as it will change when we expand collapse groups
  // if (count !== prevCount.current) {
  //   prevCount.current = count;
  //   if (highlightedIndexRef.current !== -1){
  //     highlightedIndexRef.current = autoHighlightFirstItem ? 0 : -1;
  //   }
  // }

  const setHighlightedIdx = useCallback(
    (idx) => {
      highlightedIndexRef.current = idx;
      onHighlight?.(idx);
      forceRender({});
    },
    [onHighlight]
  );

  const setHighlightedIndex = useCallback(
    (idx) => {
      if (idx !== highlightedIndexRef.current) {
        if (!controlledHighlighting) {
          setHighlightedIdx(idx);
        }
      }
    },
    [controlledHighlighting, setHighlightedIdx]
  );

  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = (value: boolean) => (ignoreFocus.current = value);

  const highlightedIndex = controlledHighlighting
    ? highlightedIndexProp
    : highlightedIndexRef.current;

  const navigateChildldItems = useCallback(
    (e: KeyboardEvent) => {
      const nextIdx = nextItemIdx(count, e.key, highlightedIndexRef.current);
      if (nextIdx !== highlightedIndexRef.current) {
        setHighlightedIndex(nextIdx);
      }
    },
    [count, setHighlightedIndex]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (isNavigationKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        keyBoardNavigation.current = true;
        navigateChildldItems(e);
      } else if (
        (e.key === "ArrowRight" || e.key === "Enter") &&
        hasPopup(e.target as HTMLElement, highlightedIndex)
      ) {
        onOpenMenu(highlightedIndex);
      } else if (e.key === "ArrowLeft" && !isRoot(e.target as HTMLElement)) {
        onCloseMenu(highlightedIndex);
      } else if (e.key === "Enter") {
        onActivate && onActivate(highlightedIndex);
      }
    },
    [
      highlightedIndex,
      navigateChildldItems,
      onActivate,
      onCloseMenu,
      onOpenMenu,
    ]
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
        // label === 'ParsedInput' && console.log(`%c[useKeyboardNavigationHook]<${label}> onMouseLeave`,'color:brown')
        keyBoardNavigation.current = true;
        setIgnoreFocus(false);
        setHighlightedIndex(-1);
      },
    }),
    [
      highlightedIndex,
      setHighlightedIndex,
      navigateChildldItems,
      onActivate,
      onCloseMenu,
      onOpenMenu,
      setHighlightedIdx,
    ]
  );

  // label === 'ParsedInput' && console.log(`%cuseNavigationHook<${label}>
  // highlightedIdxProp= ${highlightedIdxProp},
  // highlightedIndexRef= ${highlightedIndexRef.current},
  // %chighlightedIdx= ${highlightedIdx}`, 'color: brown','color: brown;font-weight: bold;')

  return {
    focusVisible: keyBoardNavigation.current ? highlightedIndex : -1,
    controlledHighlighting,
    highlightedIndex,
    setHighlightedIndex: setHighlightedIndex,
    // keyBoardNavigation,
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
