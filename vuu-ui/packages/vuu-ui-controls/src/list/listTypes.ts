import React, {
  FocusEventHandler,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent,
  KeyboardEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  Ref,
  RefCallback,
  RefObject,
} from "react";

import { ScrollingAPI, ViewportTrackingResult } from "./common-hooks";

import {
  CollectionHookResult,
  ComponentSelectionProps,
  ListHandlers,
  NavigationHookResult,
  SelectionHookResult,
  SelectionStrategy,
} from "../common-hooks";
import {
  DragHookResult,
  DragStartHandler,
  dragStrategy,
  DropHandler,
} from "../drag-drop";
import { ViewportRange } from "./useScrollPosition";

export type ComponentType<T = unknown> = (
  props: PropsWithChildren<T>
) => JSX.Element;

export type ListItemType<T = unknown> = ComponentType<
  ListItemProps<T> & { ref?: Ref<HTMLDivElement> }
>;

export type MoveItemHandler = (fromIndex: number, toIndex: number) => void;

export interface ListItemProps<T = unknown>
  extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  disabled?: boolean;
  item?: T;
  itemHeight?: number /* | string */; // TODO would we ever need to use a string here ?
  itemTextHighlightPattern?: RegExp | string;
  label?: string;
  showCheckbox?: boolean;
  /**
   * selectable is a marker, used by List, not used by ListItem itself
   */
  selectable?: boolean;
  selected?: boolean;
  /**
   *  Will apply transform: translate style. Used for virtualised rendering,
   *  supplied by VirtualisedList.
   */
  translate3d?: number;
}

export interface ListScrollHandles<Item> {
  scrollToIndex: (itemIndex: number) => void;
  scrollToItem: (item: Item) => void;
  scrollTo: (scrollOffset: number) => void;
}

export interface ListProps<
  Item = string,
  S extends SelectionStrategy = "default"
> extends ComponentSelectionProps<Item, S>,
    Omit<
      HTMLAttributes<HTMLDivElement>,
      "onDragStart" | "onDrop" | "onSelect" | "defaultValue"
    > {
  /**
   * The component used to render a ListItem instead of the default. This must itself render a ListItem,
   * must implement props that extend ListItemProps and must forward ListItem props to the ListItem.
   */
  ListItem?: ListItemType<Item>;
  /**
   * The component used when there are no items.
   */
  ListPlaceholder?: ComponentType<HTMLAttributes<unknown>>;

  /**
   * ListItems can be re-ordered by drag drop.
   */
  allowDragDrop?: boolean | dragStrategy;

  borderless?: boolean; // TODO low emphasis ?
  /**
   * Adds checkbox to list. Defaults to true for multiselect strategy. Only supported for
   * multiple select strategies (multi selection and extended selection)
   */
  checkable?: boolean;

  className?: string;
  collapsibleHeaders?: boolean;
  defaultHighlightedIndex?: number;
  disabled?: boolean;
  disableFocus?: boolean;
  /**
   * Use to turn off typeahead search functionality within List. Defaulst to false;
   */

  disableTypeToSelect?: boolean;

  displayedItemCount?: number;
  emptyMessage?: string;
  focusVisible?: number;
  /**
   * Used for providing customized item height. It should return a number or a string if item height
   * is in percentage. .
   *
   * @param {number} index The item index.
   */
  getItemHeight?: (index: number) => number;

  /**
   * Used for providing customized item ids.
   * deprecated
   * @param {number} index The item index.
   */
  getItemId?: (index: number) => string;
  /**
   * Height of the component.
   */
  height?: number | string;

  highlightedIndex?: number;

  /**
   * The total number of items.
   *
   * Used for keyboard navigation (when `End` key is pressed) and when the list is virtualized.
   */
  itemCount?: number;
  /**
   * Size of the gap between list items. Defaults to zero.
   */
  itemGapSize?: number;
  /**
   * Height of an item. I can be a number or a string if item height is in percentage. If omitted
   * default height values from Salt theme will be used.
   *
   * Note that when using a percentage value, the list must have a height.
   */
  itemHeight?: number /*| string */;
  /**
   * Used for providing text highlight.
   *
   * It can be a capturing regex or a string for a straightforward string matching.
   */
  itemTextHighlightPattern?: RegExp | string;

  /**
   * Item `toString` function when list is not used declaratively and its items are objects
   * instead of strings. The string value is also used in tooltip when item text is truncated.
   *
   * If omitted, component will look for a `label` property on the data object.
   *
   * @param {object} item The item.
   */
  itemToString?: (item: Item) => string;
  listHandlers?: ListHandlers;
  /**
   * Maximum list height.
   */
  maxHeight?: number | string;
  /**
   * Maximum list width.
   */
  maxWidth?: number | string;
  /**
   * Minimum list height.
   */
  minHeight?: number | string;
  /**
   * Minimum list width.
   */
  minWidth?: number | string;

  // TODO implement a DragDrop interface
  onDragStart?: DragStartHandler;
  /**
   * Handle item dropped onto list. Note, this will not be triggered if a list item is
   * dragged within its owning list - this will trigger the onMoveListItem callback.
   */
  onDrop?: DropHandler;

  onHighlight?: (index: number) => void;

  onMoveListItem?: MoveItemHandler;

  onViewportScroll?: (
    firstVisibleRowIndex: number,
    lastVisibleRowIndex: number
  ) => void;

  /**
   * If `true`, the component will remember the last keyboard-interacted position
   * and highlight it when list is focused again.
   */
  restoreLastFocus?: boolean;

  scrollingApiRef?: ForwardedRef<ScrollingAPI<Item>>;

  showEmptyMessage?: boolean;
  source?: ReadonlyArray<Item>;
  stickyHeaders?: boolean;
  /**
   * When set to `true`, 'Tab' key selects current highlighted item before focus is blurred away
   * from the component. This would be the desirable behaviour for any dropdown menu based
   * components like dropdown, combobox.
   *
   * @default false
   */
  tabToSelect?: boolean;
  /**
   * Width of the component.
   */
  width?: number | string;
}

export interface ListControlProps {
  "aria-activedescendant"?: string;
  onBlur: FocusEventHandler;
  onFocus: FocusEventHandler;
  onKeyDown: KeyboardEventHandler;
  onMouseDown?: MouseEventHandler;
  onMouseDownCapture: MouseEventHandler;
  onMouseLeave: MouseEventHandler;
}

export interface ListHookProps<
  Item = string,
  S extends SelectionStrategy = "default"
> extends Pick<
    ListProps<Item, S>,
    | "allowDragDrop"
    | "collapsibleHeaders"
    | "disabled"
    | "id"
    | "onClick"
    | "onDragStart"
    | "onDrop"
    | "onHighlight"
    | "onMoveListItem"
    | "onSelect"
    | "onSelectionChange"
    | "restoreLastFocus"
    | "selectionKeys"
    | "selectionStrategy"
    | "stickyHeaders"
    | "tabToSelect"
  > {
  collectionHook: CollectionHookResult<Item>;
  contentRef?: RefObject<HTMLElement>;
  defaultHighlightedIndex?: number;
  defaultSelected?: string[];
  disableAriaActiveDescendant?: boolean;
  disableHighlightOnFocus?: boolean;
  disableTypeToSelect?: boolean;
  focusVisible?: boolean;
  highlightedIndex?: number;
  label?: string;
  listHandlers?: ListHandlers;
  onKeyboardNavigation?: (
    event: React.KeyboardEvent,
    currentIndex: number
  ) => void;
  onKeyDown?: (evt: KeyboardEvent) => void;
  selected?: string[];
  // selectionStrategy: S;
  viewportRange?: ViewportRange;
}

export interface ListHookResult<Item>
  extends Partial<ViewportTrackingResult<Item>>,
    Pick<SelectionHookResult, "selected" | "setSelected">,
    Partial<Omit<NavigationHookResult, "listProps">>,
    Omit<DragHookResult, "isDragging" | "isScrolling"> {
  containerRef: RefObject<HTMLDivElement>;
  setContainerRef: RefCallback<HTMLDivElement>;
  keyboardNavigation: RefObject<boolean>;
  listHandlers: ListHandlers;
  listItemHeaderHandlers: Partial<ListHandlers>;
  listControlProps: ListControlProps;
  setHighlightedIndex: (index: number) => void;
  setIgnoreFocus: (ignoreFocus: boolean) => void;
}
