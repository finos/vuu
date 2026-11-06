import {
  type FocusEvent,
  type KeyboardEvent,
  useCallback,
  useRef,
} from "react";

export const classNameFocusSentinel = "vuuGridLayout-focusSentinel";
const classNameGridLayout = "vuuGridLayout";

const tabbableSelector = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  '[contenteditable]:not([contenteditable="false"])',
  "[tabindex]",
].join(",");

/** Elements within `root`, including `root`, that Tab can reach, in DOM order. */
export const getTabbableElements = (root: HTMLElement) =>
  [root, ...root.querySelectorAll<HTMLElement>(tabbableSelector)].filter(
    (element) =>
      element.matches(tabbableSelector) &&
      element.tabIndex >= 0 &&
      element.closest("[inert]") === null &&
      element.checkVisibility({ visibilityProperty: true }),
  );

const parentGrid = (element: HTMLElement) =>
  element.parentElement?.closest<HTMLElement>(`.${classNameGridLayout}`) ??
  null;

/** The child of `container` that holds `element`. */
const getRegion = (container: HTMLElement, element: HTMLElement) => {
  let current: HTMLElement | null = element;
  while (current && current.parentElement !== container) {
    current = current.parentElement;
  }
  return current;
};

/**
 * A Tab keydown that reached the end of a nested grid, mapped to that grid's
 * container. The parent grid moves focus on from the item hosting it.
 */
const tabsLeavingNestedGrid = new WeakMap<Event, HTMLElement>();

export interface GridFocusOrderHookProps {
  /** Element ids of the grid's regions in Tab order, see computeFocusOrder. */
  focusOrder: readonly string[];
}

/**
 * Makes Tab and Shift+Tab move through a grid's regions in visual order.
 * DOM order of grid items is insertion order, so it can't be relied on.
 *
 * Tab moves natively between the tabbable elements of a region. From the
 * last tabbable element of a region (the first, with Shift) focus moves to
 * the next region that has a tabbable element. Sentinels at either end of
 * the grid redirect focus entering it from outside to the first or last
 * region, and are where focus leaves from at either end.
 */
export const useGridFocusOrder = ({ focusOrder }: GridFocusOrderHookProps) => {
  const headRef = useRef<HTMLDivElement>(null);
  const tailRef = useRef<HTMLDivElement>(null);

  /**
   * Focuses the first (or, backwards, the last) tabbable element of the
   * first region from `fromIndex`, in the direction of travel, that has one.
   */
  const focusRegionFrom = useCallback(
    (container: HTMLElement, fromIndex: number, forward: boolean) => {
      const step = forward ? 1 : -1;
      for (
        let index = fromIndex;
        index >= 0 && index < focusOrder.length;
        index += step
      ) {
        const region = container.querySelector<HTMLElement>(
          `:scope > #${CSS.escape(focusOrder[index])}`,
        );
        const tabbables = region ? getTabbableElements(region) : [];
        const element = forward ? tabbables[0] : tabbables.at(-1);
        if (element) {
          element.focus();
          return true;
        }
      }
      return false;
    },
    [focusOrder],
  );

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if (
        e.key !== "Tab" ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.defaultPrevented ||
        !(e.target instanceof HTMLElement)
      ) {
        return;
      }
      const container = e.currentTarget;
      const forward = !e.shiftKey;
      const leftGrid = tabsLeavingNestedGrid.get(e.nativeEvent);
      // The element focus moves on from: the focused element, or the nested
      // grid that Tab has just reached the end of.
      const anchor = leftGrid ?? e.target;
      if (
        !container.contains(anchor) ||
        anchor.classList.contains(classNameFocusSentinel) ||
        (leftGrid
          ? parentGrid(leftGrid) !== container
          : anchor.closest(`.${classNameGridLayout}`) !== container)
      ) {
        return;
      }
      const region = getRegion(container, anchor);
      const regionIndex = region ? focusOrder.indexOf(region.id) : -1;
      if (region === null || regionIndex === -1) {
        return;
      }

      const position = forward
        ? Node.DOCUMENT_POSITION_FOLLOWING
        : Node.DOCUMENT_POSITION_PRECEDING;
      const nextInRegion = getTabbableElements(region).filter(
        (element) =>
          element !== anchor &&
          anchor.compareDocumentPosition(element) & position &&
          !(leftGrid?.contains(element) ?? false),
      );
      if (nextInRegion.length > 0) {
        if (leftGrid) {
          (forward ? nextInRegion[0] : nextInRegion.at(-1))?.focus();
          e.preventDefault();
        }
        // otherwise the browser moves focus within the region
        return;
      }

      if (
        focusRegionFrom(container, regionIndex + (forward ? 1 : -1), forward)
      ) {
        e.preventDefault();
      } else if (parentGrid(container)) {
        tabsLeavingNestedGrid.set(e.nativeEvent, container);
      } else {
        // Tab continues from the sentinel, out of the grid.
        (forward ? tailRef : headRef).current?.focus();
      }
    },
    [focusOrder, focusRegionFrom],
  );

  const enteredFromOutside = (e: FocusEvent<HTMLDivElement>) => {
    const container = e.currentTarget.parentElement;
    return (
      container !== null &&
      !(e.relatedTarget instanceof Node && container.contains(e.relatedTarget))
    );
  };

  const onFocusHead = (e: FocusEvent<HTMLDivElement>) => {
    const container = e.currentTarget.parentElement;
    if (container && enteredFromOutside(e)) {
      focusRegionFrom(container, 0, true);
    }
  };

  const onFocusTail = (e: FocusEvent<HTMLDivElement>) => {
    const container = e.currentTarget.parentElement;
    if (container && enteredFromOutside(e)) {
      focusRegionFrom(container, focusOrder.length - 1, false);
    }
  };

  return {
    headSentinelProps: {
      className: classNameFocusSentinel,
      "data-focus-sentinel": "head",
      onFocus: onFocusHead,
      ref: headRef,
      tabIndex: 0,
    },
    onKeyDown,
    tailSentinelProps: {
      className: classNameFocusSentinel,
      "data-focus-sentinel": "tail",
      onFocus: onFocusTail,
      ref: tailRef,
      tabIndex: 0,
    },
  };
};
