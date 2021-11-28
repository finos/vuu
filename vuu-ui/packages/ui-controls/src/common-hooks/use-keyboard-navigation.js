import { useCallback, useMemo, useRef } from 'react';
import { ArrowDown, ArrowUp, isNavigationKey, useControlled } from '../utils';

function nextItemIdx(count, key, idx) {
  if (key === ArrowUp) {
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

const isLeaf = (item) => !item.header && !item.childNodes;
const isFocusable = (item) => isLeaf(item) || item.expanded !== undefined;

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  defaultHighlightedIdx = -1,
  highlightedIdx: highlightedIdxProp,
  indexPositions,
  onHighlight,
  onKeyboardNavigation,
  selected = []
}) => {
  const [highlightedIdx, setHighlightedIdx, isControlledHighlighting] = useControlled({
    controlled: highlightedIdxProp,
    default: defaultHighlightedIdx
  });

  const setHighlightedIndex = useCallback(
    (idx) => {
      onHighlight && onHighlight(idx);
      setHighlightedIdx(idx);
    },
    [onHighlight, setHighlightedIdx]
  );

  const nextFocusableItemIdx = useCallback(
    (key = ArrowDown, idx = key === ArrowDown ? -1 : indexPositions.length) => {
      let nextIdx = nextItemIdx(indexPositions.length, key, idx);
      while (
        ((key === ArrowDown && nextIdx < indexPositions.length) ||
          (key === ArrowUp && nextIdx > 0)) &&
        !isFocusable(indexPositions[nextIdx])
      ) {
        nextIdx = nextItemIdx(indexPositions.length, key, nextIdx);
      }
      return nextIdx;
    },
    [indexPositions]
  );

  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = (value) => (ignoreFocus.current = value);

  const handleFocus = useCallback(() => {
    if (ignoreFocus.current) {
      ignoreFocus.current = false;
    } else if (selected.length > 0) {
      setHighlightedIndex(selected[0]);
    } else {
      setHighlightedIndex(nextFocusableItemIdx());
    }
  }, [nextFocusableItemIdx, selected, setHighlightedIndex]);

  const navigateChildItems = useCallback(
    (e) => {
      const nextIdx = nextFocusableItemIdx(e.key, highlightedIdx);
      if (nextIdx !== highlightedIdx) {
        setHighlightedIndex(nextIdx);
        // What exactly is the point of this ?
        onKeyboardNavigation?.(e, nextIdx);
      }
    },
    [highlightedIdx, nextFocusableItemIdx, onKeyboardNavigation, setHighlightedIndex]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (isNavigationKey(e)) {
        e.preventDefault();
        e.stopPropagation();
        keyBoardNavigation.current = true;
        navigateChildItems(e);
      }
    },
    [navigateChildItems]
  );

  const listProps = useMemo(
    () => ({
      onBlur: () => {
        setHighlightedIndex(-1);
      },
      onFocus: handleFocus,
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
      }
    }),
    [handleFocus, handleKeyDown, setHighlightedIndex]
  );

  return {
    focusVisible: keyBoardNavigation.current ? highlightedIdx : -1,
    controlledHighlighting: isControlledHighlighting,
    highlightedIdx,
    hiliteItemAtIndex: setHighlightedIndex,
    keyBoardNavigation,
    listProps,
    setIgnoreFocus
  };
};
