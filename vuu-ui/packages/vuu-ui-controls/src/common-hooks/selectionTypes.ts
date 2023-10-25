import { MouseEventHandler, RefObject, SyntheticEvent } from "react";

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

export const isSingleSelection = (
  s?: SelectionStrategy
): s is SingleSelectionStrategy =>
  s === undefined || s === "default" || s === "deselectable";

export const isMultiSelection = (
  s?: SelectionStrategy
): s is MultiSelectionStrategy =>
  s === "multiple" || s?.startsWith("extended") === true;

export type SelectHandler<Item = string> = (
  event: SyntheticEvent,
  selectedItem: Item
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

interface SelectionProps {
  defaultSelected?: string[];
  onSelect?: SelectHandler;
  onSelectionChange?: MultiSelectionHandler;
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
  onClick?: MouseEventHandler;
  selectionKeys?: string[];
  tabToSelect?: boolean;
}

export interface SelectionHookResult {
  listHandlers: ListHandlers;
  selected: string[];
  setSelected: (selected: string[]) => void;
}

export type MultiSelectionHandler<Item = string> = (
  event: SyntheticEvent | null,
  selected: Item[]
) => void;
export type SingleSelectionHandler<Item = string> = (
  event: SyntheticEvent | null,
  selected: Item
) => void;

export type SelectionType<
  I,
  S extends SelectionStrategy
> = S extends MultiSelectionStrategy ? I[] : I | null;

export interface ComponentSelectionProps<
  Item = string,
  S extends SelectionStrategy = "default"
> {
  defaultSelected?: S extends MultiSelectionStrategy ? Item[] : Item;
  onSelect?: SelectHandler<Item>;
  onSelectionChange?: S extends MultiSelectionStrategy
    ? MultiSelectionHandler<Item>
    : SingleSelectionHandler<Item>;
  selected?: SelectionType<Item, S>;
  selectionStrategy?: S;
  /**
   * The keyboard keys used to effect selection, defaults to SPACE and ENTER
   * TODO maybe this belongs on the SelectionProps interface ?
   */
  selectionKeys?: string[];
}
