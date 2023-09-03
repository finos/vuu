import { useControlled } from "@salt-ds/core";
import {
  allowMultipleSelection,
  deselectionIsAllowed,
  selectionIsDisallowed,
  SelectionStrategy,
  SpecialKeyMultipleSelection,
} from "@finos/vuu-ui-controls";
import {
  KeyboardEvent,
  MouseEvent,
  RefObject,
  useCallback,
  useMemo,
} from "react";

const defaultSelectionKeys = ["Enter", " "];

export interface SelectionHookProps {
  containerRef: RefObject<HTMLElement>;
  defaultSelected?: number[];
  highlightedIdx: number;
  itemQuery: string;
  onSelectionChange?: (selectedIndices: number[]) => void;
  selected?: number[];
  selectionStrategy: SelectionStrategy | SpecialKeyMultipleSelection;
}

export interface ItemHandlers {
  onClick?: (e: MouseEvent, itemIndex: number) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
}

const NO_SELECTION_HANDLERS: ItemHandlers = {};

export interface SelectionHookResult {
  activateItem: (tabIndex: number) => void;
  itemHandlers: ItemHandlers;
  isControlled: boolean;
  selected: number[];
}

// TODO use SelectionProps
export const useSelection = ({
  containerRef,
  defaultSelected,
  highlightedIdx,
  itemQuery,
  onSelectionChange,
  selected: selectedProp,
  selectionStrategy,
}: SelectionHookProps): SelectionHookResult => {
  const [selected, setSelected, isControlled] = useControlled({
    controlled: selectedProp,
    default: defaultSelected ?? [],
    name: "useSelection",
    state: "selected",
  });

  const isSelectableElement = useMemo(
    () =>
      (el: HTMLElement): boolean =>
        el && el.matches(`[class*="${itemQuery} "]`),
    [itemQuery]
  );

  const isSelectionEvent = useCallback(
    (evt: KeyboardEvent) => defaultSelectionKeys.includes(evt.key),
    []
  );

  const selectItem = useCallback(
    (itemIndex: number, specialKey = false) => {
      const newSelected = allowMultipleSelection(selectionStrategy, specialKey)
        ? selected.concat(itemIndex)
        : [itemIndex];

      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    },
    [onSelectionChange, selected, selectionStrategy, setSelected]
  );

  const deselectItem = useCallback(
    (itemIndex: number, specialKey = false) => {
      const newSelected =
        selectionStrategy === "deselectable" ||
        (selectionStrategy === "multiple-special-key" && !specialKey)
          ? []
          : selected.filter((index) => index !== itemIndex);
      setSelected(newSelected);
      onSelectionChange?.(newSelected);
    },
    [onSelectionChange, selected, selectionStrategy, setSelected]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const targetElement = e.target as HTMLElement;
      if (isSelectionEvent(e) && isSelectableElement(targetElement)) {
        if (!selected.includes(highlightedIdx)) {
          e.stopPropagation();
          e.preventDefault();
          selectItem(highlightedIdx, e.shiftKey);
        } else if (deselectionIsAllowed(selectionStrategy)) {
          e.stopPropagation();
          e.preventDefault();
          deselectItem(highlightedIdx, e.shiftKey);
        }
      }
    },
    [
      isSelectionEvent,
      isSelectableElement,
      selected,
      highlightedIdx,
      selectionStrategy,
      selectItem,
      deselectItem,
    ]
  );

  const onClick = useCallback(
    (e: MouseEvent, itemIndex: number) => {
      if (!selected.includes(itemIndex)) {
        selectItem(itemIndex, e.shiftKey);
      } else if (deselectionIsAllowed(selectionStrategy)) {
        deselectItem(itemIndex, e.shiftKey);
      }
    },
    [deselectItem, selectItem, selected, selectionStrategy]
  );

  const itemHandlers = selectionIsDisallowed(selectionStrategy)
    ? NO_SELECTION_HANDLERS
    : {
        onClick,
        onKeyDown: handleKeyDown,
      };

  return {
    activateItem: selectItem,
    itemHandlers,
    isControlled,
    selected,
  };
};
