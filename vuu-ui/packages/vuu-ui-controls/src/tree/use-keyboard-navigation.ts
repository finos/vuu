import { KeyboardEvent, useCallback, useMemo, useRef } from "react";
import { getIndexOfNode, getNodeById } from "./hierarchical-data-utils";
import { useControlled } from "@salt-ds/core";
import { ArrowDown, ArrowLeft, ArrowUp, isNavigationKey } from "./key-code";
import { NormalisedTreeSourceNode } from "@finos/vuu-utils";

function nextItemIdx(count: number, key: string, idx: number) {
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

const isLeaf = (item: NormalisedTreeSourceNode) =>
  !item.header && !item.childNodes;
const isFocusable = (item: NormalisedTreeSourceNode) =>
  isLeaf(item) || item.expanded !== undefined;

export interface KeyboardNavigationHookProps {
  defaultHighlightedIdx?: number;
  highlightedIdx?: number;
  onHighlight?: (highlightedIdx: number) => void;
  onKeyboardNavigation?: (evt: KeyboardEvent, nextIdx: number) => void;
  selected: string[];
  treeNodes: NormalisedTreeSourceNode[];
}

// we need a way to set highlightedIdx when selection changes
export const useKeyboardNavigation = ({
  defaultHighlightedIdx = -1,
  highlightedIdx: highlightedIdxProp,
  treeNodes,
  onHighlight,
  onKeyboardNavigation,
  selected = [],
}: KeyboardNavigationHookProps) => {
  const { bwd: ArrowBwd, fwd: ArrowFwd } = useMemo(
    () => ({
      bwd: ArrowUp,
      fwd: ArrowDown,
    }),
    [],
  );

  const [highlightedIdx, setHighlightedIdx, isControlledHighlighting] =
    useControlled({
      controlled: highlightedIdxProp,
      default: defaultHighlightedIdx,
      name: "highlightedIdx",
    });

  const setHighlightedIndex = useCallback(
    (idx) => {
      onHighlight?.(idx);
      setHighlightedIdx(idx);
    },
    [onHighlight, setHighlightedIdx],
  );

  const nextFocusableItemIdx = useCallback(
    (key = ArrowFwd, idx = key === ArrowFwd ? -1 : treeNodes.length) => {
      let nextIdx = nextItemIdx(treeNodes.length, key, idx);
      while (
        nextIdx !== -1 &&
        ((key === ArrowFwd && nextIdx < treeNodes.length) ||
          (key === ArrowBwd && nextIdx > 0)) &&
        !isFocusable(treeNodes[nextIdx])
      ) {
        nextIdx = nextItemIdx(treeNodes.length, key, nextIdx);
      }
      return nextIdx;
    },
    [ArrowBwd, ArrowFwd, treeNodes],
  );

  // does this belong here or should it be a method passed in?
  const keyBoardNavigation = useRef(true);
  const ignoreFocus = useRef(false);
  const setIgnoreFocus = (value: boolean) => (ignoreFocus.current = value);

  const handleFocus = useCallback(() => {
    if (ignoreFocus.current) {
      ignoreFocus.current = false;
    } else if (selected.length > 0) {
      const node = getNodeById(treeNodes, selected[0]);
      if (node) {
        const idx = getIndexOfNode(treeNodes, node);
        setHighlightedIndex(idx);
      }
    } else {
      setHighlightedIndex(nextFocusableItemIdx());
    }
  }, [treeNodes, nextFocusableItemIdx, selected, setHighlightedIndex]);

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
    ],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (treeNodes.length > 0 && isNavigationKey(e, "vertical")) {
        e.preventDefault();
        e.stopPropagation();
        keyBoardNavigation.current = true;
        navigateChildItems(e);
      }
    },
    [treeNodes, navigateChildItems],
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
    [handleFocus, handleKeyDown, setHighlightedIndex],
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
