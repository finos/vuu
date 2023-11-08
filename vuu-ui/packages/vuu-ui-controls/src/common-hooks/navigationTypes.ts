import { FocusEvent, KeyboardEvent, RefObject } from "react";

export interface NavigationProps {
  cycleFocus?: boolean;
  defaultHighlightedIndex?: number;
  disableHighlightOnFocus?: boolean;
  focusOnHighlight?: boolean;
  focusVisible?: number;
  highlightedIndex?: number;
  itemCount: number;
  onHighlight?: (idx: number) => void;
  onKeyboardNavigation?: (evt: KeyboardEvent, idx: number) => void;
  restoreLastFocus?: boolean;
  viewportItemCount: number;
}

export interface NavigationHookProps extends NavigationProps {
  containerRef: RefObject<HTMLElement>;
  label?: string;
  selected?: string[];
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
