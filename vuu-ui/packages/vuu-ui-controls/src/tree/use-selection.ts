import {
  KeyboardEvent,
  MouseEvent,
  SyntheticEvent,
  useCallback,
  useRef,
} from "react";
import { useControlled } from "@salt-ds/core";
import { NormalisedTreeSourceNode } from "./treeTypes";

export type TreeSelection =
  | "none"
  | "single"
  | "checkbox"
  | "multi"
  | "extended";

export const SINGLE = "single";
export const CHECKBOX = "checkbox";
export const MULTI = "multi";
export const EXTENDED = "extended";

export type GroupSelection = "none" | "single" | "cascade";

const defaultSelectionKeys = ["Enter", " "];

const NO_HANDLERS = {};

const isCollapsibleItem = (item: NormalisedTreeSourceNode) =>
  item.expanded !== undefined;

export type TreeNodeSelectionHandler = (
  evt: SyntheticEvent,
  selected: string[]
) => void;

export const groupSelectionEnabled = (groupSelection: GroupSelection) =>
  groupSelection && groupSelection !== "none";

export interface SelectionHookProps {
  defaultSelected?: string[];
  highlightedIdx: number;
  onChange: TreeNodeSelectionHandler;
  selected?: string[];
  selection: TreeSelection;
  selectionKeys?: string[];
  treeNodes: NormalisedTreeSourceNode[];
}

export interface SelectionHookResult {
  listHandlers: {
    onKeyDown?: (evt: KeyboardEvent) => void;
    onKeyboardNavigation?: (evt: KeyboardEvent, currentIndex: number) => void;
  };
  listItemHandlers: {
    onClick?: (evt: MouseEvent) => void;
  };
  selected: string[];
  setSelected: (selected: string[]) => void;
}

export const useSelection = ({
  defaultSelected,
  highlightedIdx,
  treeNodes,
  onChange,
  selected: selectedProp,
  selection = SINGLE,
  selectionKeys = defaultSelectionKeys,
}: SelectionHookProps): SelectionHookResult => {
  const singleSelect = selection === SINGLE;
  const multiSelect = selection === MULTI || selection.startsWith(CHECKBOX);
  const extendedSelect = selection === EXTENDED;
  const lastActive = useRef(-1);

  const isSelectionEvent = useCallback(
    (evt) => selectionKeys.includes(evt.key),
    [selectionKeys]
  );

  const [selected, setSelected] = useControlled({
    controlled: selectedProp,
    default: defaultSelected ?? [],
    name: "selected",
  });

  // const highlightedIdxRef = useRef();
  // highlightedIdxRef.current = highlightedIdx;

  const selectItemAtIndex = useCallback(
    (
      evt: SyntheticEvent,
      idx: number,
      id: string,
      rangeSelect: boolean,
      preserveExistingSelection = false
    ) => {
      const { current: active } = lastActive;
      const isSelected = selected?.includes(id);
      const inactiveRange = active === -1;
      const actsLikeSingleSelect =
        singleSelect ||
        (extendedSelect &&
          !preserveExistingSelection &&
          (!rangeSelect || inactiveRange));
      const actsLikeMultiSelect =
        multiSelect ||
        (extendedSelect && preserveExistingSelection && !rangeSelect);

      let newSelected: string[] = [];
      if (actsLikeSingleSelect && isSelected) {
        newSelected = [];
      } else if (actsLikeSingleSelect) {
        newSelected = [id];
      } else if (actsLikeMultiSelect && isSelected) {
        newSelected = selected.filter((i) => i !== id);
      } else if (actsLikeMultiSelect) {
        newSelected = selected.concat(id);
      } else if (extendedSelect) {
        const [from, to] = idx > active ? [active, idx] : [idx, active];
        newSelected = selected.slice();
        for (let i = from; i <= to; i++) {
          const { id } = treeNodes[i];
          if (!selected.includes(id)) {
            newSelected.push(id);
          }
        }
      }
      setSelected(newSelected);
      if (onChange) {
        onChange(evt, newSelected);
      }
    },
    [
      extendedSelect,
      treeNodes,
      multiSelect,
      onChange,
      selected,
      setSelected,
      singleSelect,
    ]
  );

  const handleKeyDown = useCallback(
    (evt: KeyboardEvent) => {
      if (~highlightedIdx && isSelectionEvent(evt)) {
        evt.preventDefault();
        const item = treeNodes[highlightedIdx];
        selectItemAtIndex(
          evt,
          highlightedIdx,
          item.id,
          false,
          evt.ctrlKey || evt.metaKey
        );
        if (extendedSelect) {
          lastActive.current = highlightedIdx;
        }
      }
    },
    [
      extendedSelect,
      highlightedIdx,
      treeNodes,
      isSelectionEvent,
      selectItemAtIndex,
    ]
  );

  const handleKeyboardNavigation = useCallback(
    (evt: KeyboardEvent, currentIndex: number) => {
      if (extendedSelect && evt.shiftKey) {
        const item = treeNodes[currentIndex];
        selectItemAtIndex(evt, currentIndex, item.id, true);
      }
    },
    [extendedSelect, treeNodes, selectItemAtIndex]
  );

  const listHandlers =
    selection === "none"
      ? NO_HANDLERS
      : {
          onKeyDown: handleKeyDown,
          onKeyboardNavigation: handleKeyboardNavigation,
        };

  const handleClick = useCallback(
    (evt: MouseEvent) => {
      if (highlightedIdx !== -1) {
        const item = treeNodes[highlightedIdx];
        if (!isCollapsibleItem(item)) {
          evt.preventDefault();
          evt.stopPropagation();
          selectItemAtIndex(
            evt,
            highlightedIdx,
            item.id,
            evt.shiftKey,
            evt.ctrlKey || evt.metaKey
          );
          if (extendedSelect) {
            lastActive.current = highlightedIdx;
          }
        }
      }
    },
    [extendedSelect, highlightedIdx, treeNodes, selectItemAtIndex]
  );

  const listItemHandlers =
    selection === "none"
      ? NO_HANDLERS
      : {
          onClick: handleClick,
        };

  return {
    listHandlers,
    listItemHandlers,
    selected,
    setSelected,
  };
};
