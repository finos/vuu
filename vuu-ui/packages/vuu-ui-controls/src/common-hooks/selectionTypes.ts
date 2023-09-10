import { RefObject, SyntheticEvent } from "react";

export type SelectionDisallowed = "none";
export type SingleSelectionStrategy = "default" | "deselectable";
export type MultiSelectionStrategy =
  | "multiple"
  | "extended"
  | "extended-multi-range";

/**
 * SpecialKeyMultiple works as deselectable unless a special key
 * (default SHIFT) is also pressed, then it allows multiple selection.
 * Useful for column sorting, filters etc
 */
export type SpecialKeyMultipleSelection = "multiple-special-key";

export type SelectionStrategy =
  | SelectionDisallowed
  | SingleSelectionStrategy
  | MultiSelectionStrategy;

export type selectedType<
  Item,
  Selection extends SelectionStrategy
> = Selection extends MultiSelectionStrategy ? Item[] : Item | null;

export type SelectHandler<Item = string> = (
  event: SyntheticEvent,
  selectedItem: Item
) => void;

export type SelectionChangeHandler<
  Item = string,
  Selection extends SelectionStrategy = "default"
> = (
  event: SyntheticEvent,
  selected: Selection extends SingleSelectionStrategy ? Item | null : Item[]
) => void;

export const selectionIsDisallowed = (
  selection?: SelectionStrategy
): selection is SelectionDisallowed => selection === "none";

export const allowMultipleSelection = (
  selectionStrategy: SelectionStrategy | SpecialKeyMultipleSelection,
  specialKey = false
) =>
  selectionStrategy === "multiple" ||
  (selectionStrategy === "multiple-special-key" && specialKey);

export const deselectionIsAllowed = (
  selection?: SelectionStrategy | SpecialKeyMultipleSelection
): selection is "deselectable" | MultiSelectionStrategy =>
  selection !== "none" && selection !== "default";

export const hasSelection = <Item = unknown>(
  selected: Item | Item[] | null
): selected is Item | Item[] => {
  return Array.isArray(selected)
    ? selected.length > 0
    : selected !== null && selected !== undefined;
};

export const getFirstSelectedItem = <Item = unknown>(
  selected: Item | Item[] | null
): Item | null => {
  return Array.isArray(selected) ? selected[0] : selected;
};

export interface SelectionProps<
  Item,
  Selection extends SelectionStrategy = "default"
> {
  defaultSelected?: Selection extends SingleSelectionStrategy
    ? Item | null
    : Item[];
  onSelect?: SelectHandler<Item>;
  onSelectionChange?: SelectionChangeHandler<Item, Selection>;
  selected?: Selection extends SingleSelectionStrategy ? Item | null : Item[];
  selectionStrategy?: Selection;
}

export interface ListHandlers {
  onClick?: (event: React.MouseEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  onKeyboardNavigation?: (
    event: React.KeyboardEvent,
    currentIndex: number
  ) => void;
  onMouseMove?: (event: React.MouseEvent) => void;
}
export interface SelectionHookProps<
  Selection extends SelectionStrategy = "default"
> extends SelectionProps<string, Selection> {
  containerRef: RefObject<HTMLElement>;
  disableSelection?: boolean;
  highlightedIdx: number;
  itemQuery: string;
  label?: string;
  selectionKeys?: string[];
  tabToSelect?: boolean;
}

export interface SelectionHookResult<
  Selection extends SelectionStrategy = "default"
> {
  listHandlers: ListHandlers;
  selected: Selection extends SingleSelectionStrategy
    ? string | null
    : string[];
  setSelected: (
    selected: Selection extends SingleSelectionStrategy
      ? string | null
      : string[]
  ) => void;
}
