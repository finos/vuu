import { FocusEvent, KeyboardEvent, RefObject } from "react";
import { CollectionItem } from "./collectionTypes";
import { SelectionStrategy, SingleSelectionStrategy } from "./selectionTypes";

export interface NavigationProps<Item = unknown> {
  cycleFocus?: boolean;
  defaultHighlightedIndex?: number;
  disableHighlightOnFocus?: boolean;
  focusOnHighlight?: boolean;
  focusVisible?: number;
  highlightedIndex?: number;
  indexPositions: CollectionItem<Item>[];
  itemCount: number;
  onHighlight?: (idx: number) => void;
  onKeyboardNavigation?: (evt: KeyboardEvent, idx: number) => void;
  restoreLastFocus?: boolean;
  viewportItemCount: number;
}

export interface NavigationHookProps<Item, Selection extends SelectionStrategy>
  extends NavigationProps<Item> {
  containerRef: RefObject<HTMLElement>;
  label?: string;
  selected?: Selection extends SingleSelectionStrategy
    ? string | null
    : string[];
}

export interface KeyboardHookContainerProps {
  onBlur: (evt: FocusEvent) => void;
  onFocus: (evt: FocusEvent) => void;
  onKeyDown: (evt: KeyboardEvent) => void;
  onMouseDownCapture: () => void;
  onMouseMove: () => void;
  onMouseLeave: () => void;
}

export interface NavigationHookResult {
  focusVisible: number;
  controlledHighlighting: boolean;
  highlightedIndex: number;
  setHighlightedIndex: (idx: number) => void;
  keyboardNavigation: RefObject<boolean>;
  containerProps: KeyboardHookContainerProps;
  setIgnoreFocus: (ignoreFocus: boolean) => void;
}
