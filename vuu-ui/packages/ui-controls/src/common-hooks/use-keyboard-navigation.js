import { useCallback, useMemo, useRef } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  getIndexOfNode,
  isNavigationKey,
  useControlled,
} from "../utils";

function nextItemIdx(count, key, idx) {
  if (key === ArrowUp || key === ArrowLeft) {
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

const ArrowKeys = {
  horizontal: {
    bwd: ArrowLeft,
    fwd: ArrowRight,
  },
  vertical: {
    bwd: ArrowUp,
    fwd: ArrowDown,
  },
};

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  defaultHighlightedIdx = -1,
  highlightedIdx: highlightedIdxProp,
  indexPositions,
  onHighlight,
  onKeyboardNavigation = null,
  orientation = "vertical",
  selected = [],
}) => {
  const { bwd: ArrowBwd, fwd: ArrowFwd } = useMemo(
    () => ArrowKeys[orientation],
    [orientation]
  );

  const [highlightedIdx, setHighlightedIdx, isControlledHighlighting] =
    useControlled({
      controlled: highlightedIdxProp,
      default: defaultHighlightedIdx,
    });

  const setHighlightedIndex = useCallback(
    (idx) => {
      onHighlight && onHighlight(idx);
      setHighlightedIdx(idx);
    },
    [onHighlight, setHighlightedIdx]
  );

  const nextFocusableItemIdx = useCallback(
    (key = ArrowFwd, idx = key === ArrowFwd ? -1 : indexPositions.length) => {
      let nextIdx = nextItemIdx(indexPositions.length, key, idx);
      while (
        nextIdx !== -1 &&
        ((key === ArrowFwd && nextIdx < indexPositions.length) ||
          (key === ArrowBwd && nextIdx > 0)) &&
        !isFocusable(indexPositions[nextIdx])
      ) {
        nextIdx = nextItemIdx(indexPositions.length, key, nextIdx);
      }
      return nextIdx;
    },
    [ArrowBwd, ArrowFwd, indexPositions]
  );

  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = (value) => (ignoreFocus.current = value);

  const handleFocus = useCallback(() => {
    if (ignoreFocus.current) {
      ignoreFocus.current = false;
    } else if (selected.length > 0) {
      const idx = getIndexOfNode(indexPositions, selected[0]);
      setHighlightedIndex(idx);
    } else {
      setHighlightedIndex(nextFocusableItemIdx());
    }
  }, [indexPositions, nextFocusableItemIdx, selected, setHighlightedIndex]);

  const navigateChildItems = useCallback(
    (e) => {
      const nextIdx = nextFocusableItemIdx(e.key, highlightedIdx);
      if (nextIdx !== highlightedIdx) {
        setHighlightedIndex(nextIdx);
        // What exactly is the point of this ?
        onKeyboardNavigation?.(e, nextIdx);
      }
    },
    [
      highlightedIdx,
      nextFocusableItemIdx,
      onKeyboardNavigation,
      setHighlightedIndex,
    ]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (indexPositions.length > 0 && isNavigationKey(e, orientation)) {
        e.preventDefault();
        e.stopPropagation();
        keyBoardNavigation.current = true;
        navigateChildItems(e);
      }
    },
    [indexPositions, navigateChildItems, orientation]
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
      // SHould this be here - this is not strictly keyboard nav
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
    [handleFocus, handleKeyDown, setHighlightedIndex]
  );

  return {
    focusVisible: keyBoardNavigation.current ? highlightedIdx : -1,
    controlledHighlighting: isControlledHighlighting,
    highlightedIdx,
    hiliteItemAtIndex: setHighlightedIndex,
    keyBoardNavigation,
    listProps,
    setIgnoreFocus,
  };
};
