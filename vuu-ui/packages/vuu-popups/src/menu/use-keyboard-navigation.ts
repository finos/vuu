import { KeyboardEvent, useCallback, useRef, useState } from "react";
import { hasPopup, isRoot } from "./utils";
import { isNavigationKey } from "./key-code";

export interface KeyboardNavigationProps {
  autoHighlightFirstItem?: boolean;
  count: number;
  highlightedIdx?: number;
  onActivate: (idx: number) => void;
  onHighlight?: (idx: number) => void;
  onCloseMenu: (idx: number) => void;
  onOpenMenu: (idx: number) => void;
}

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  autoHighlightFirstItem = false,
  count,
  highlightedIdx: highlightedIdxProp,
  onActivate,
  onHighlight,
  // onKeyDown,
  onCloseMenu,
  onOpenMenu,
}: KeyboardNavigationProps) => {
  // const prevCount = useRef(count);
  const highlightedIndexRef = useRef(
    highlightedIdxProp ?? autoHighlightFirstItem ? 0 : -1
  );
  const [, forceRefresh] = useState<unknown>(null);
  const controlledHighlighting = highlightedIdxProp !== undefined;

  // count will not work for this, as it will change when we expand collapse groups
  // if (count !== prevCount.current) {
  //   prevCount.current = count;
  //   if (highlightedIndexRef.current !== -1){
  //     highlightedIndexRef.current = autoHighlightFirstItem ? 0 : -1;
  //   }
  // }

  const setHighlightedIndex = useCallback(
    (idx) => {
      highlightedIndexRef.current = idx;
      onHighlight && onHighlight(idx);
      forceRefresh({});
    },
    [onHighlight]
  );

  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = (value: boolean) => (ignoreFocus.current = value);

  const hiliteItemAtIndex = useCallback(
    (idx) => {
      if (idx !== highlightedIndexRef.current) {
        if (!controlledHighlighting) {
          setHighlightedIndex(idx);
        }
      }
    },
    [controlledHighlighting, setHighlightedIndex]
  );

  const highlightedIdx = controlledHighlighting
    ? highlightedIdxProp
    : highlightedIndexRef.current;

  const listProps = {
    onFocus: () => {
      if (highlightedIdx === -1) {
        setHighlightedIndex(0);
      }
    },
    onKeyDown: (e: KeyboardEvent) => {
      if (isNavigationKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        keyBoardNavigation.current = true;
        navigateChildldItems(e);
      } else if (
        (e.key === "ArrowRight" || e.key === "Enter") &&
        hasPopup(e.target as HTMLElement, highlightedIdx)
      ) {
        onOpenMenu(highlightedIdx);
      } else if (e.key === "ArrowLeft" && !isRoot(e.target as HTMLElement)) {
        onCloseMenu(highlightedIdx);
      } else if (e.key === "Enter") {
        onActivate && onActivate(highlightedIdx);
      }
      // Is there any harm in allowing other keyDown Handlers to fire ?
      // TODO this is out of date - use additionalHandlers
      // if (Array.isArray(onKeyDown)) {
      //   for (let handleEvent of onKeyDown) {
      //     if (e.isPropagationStopped()) {
      //       break;
      //     }
      //     handleEvent(e);
      //   }
      // } else if (onKeyDown && !e.isPropagationStopped()) {
      //   onKeyDown(e);
      // }
    },
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
      hiliteItemAtIndex(-1);
    },
  };

  const navigateChildldItems = (e: KeyboardEvent) => {
    const nextIdx = nextItemIdx(count, e.key, highlightedIndexRef.current);
    if (nextIdx !== highlightedIndexRef.current) {
      hiliteItemAtIndex(nextIdx);
    }
  };

  // label === 'ParsedInput' && console.log(`%cuseNavigationHook<${label}>
  // highlightedIdxProp= ${highlightedIdxProp},
  // highlightedIndexRef= ${highlightedIndexRef.current},
  // %chighlightedIdx= ${highlightedIdx}`, 'color: brown','color: brown;font-weight: bold;')

  return {
    focusVisible: keyBoardNavigation.current ? highlightedIdx : -1,
    controlledHighlighting,
    highlightedIdx,
    hiliteItemAtIndex,
    keyBoardNavigation,
    listProps,
    setIgnoreFocus,
  };
};

// need to be able to accommodate disabled items
function nextItemIdx(count: number, key: string, idx: number) {
  if (key === "Up") {
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
