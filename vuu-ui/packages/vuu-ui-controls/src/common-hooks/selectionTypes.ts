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

export type SelectHandler<Item = string> = (
  event: SyntheticEvent,
  selectedItem: Item
) => void;

export type SelectionChangeHandler<Item = string> = (
  event: SyntheticEvent,
  selected: Item[]
) => void;

export const selectionIsDisallowed = (
  selection?: SelectionStrategy | SpecialKeyMultipleSelection
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

export const hasSelection = <Item = unknown>(selected?: Item[]) =>
  selected !== undefined && selected.length > 0;

export const getFirstSelectedItem = <Item = unknown>(selected: Item[]) =>
  selected[0];

export interface SelectionProps {
  defaultSelected?: string[];
  onSelect?: SelectHandler;
  onSelectionChange?: SelectionChangeHandler;
  selected?: string[];
  selectionStrategy?: SelectionStrategy;
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
export interface SelectionHookProps extends SelectionProps {
  containerRef: RefObject<HTMLElement>;
  disableSelection?: boolean;
  highlightedIdx: number;
  itemQuery: string;
  label?: string;
  selectionKeys?: string[];
  tabToSelect?: boolean;
}

export interface SelectionHookResult {
  listHandlers: ListHandlers;
  selected: string[];
  setSelected: (selected: string[]) => void;
}
