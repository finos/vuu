import {
  type RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

/** Width allowed for the overflow button before it has been rendered. */
const ESTIMATED_OVERFLOW_BUTTON_WIDTH = 40;
const MEASURING = "vuuOverflowItems-measuring";

const sameIndices = (a: number[], b: number[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

export interface OverflowItemsHookProps {
  /**
   * The element that lays out the items in a single row. Its direct
   * children marked with data-overflow-item take part; those also marked
   * data-overflow-pinned are never overflowed.
   */
  containerRef: RefObject<HTMLElement | null>;
  /**
   * The overflow button, rendered after the container while any items are
   * overflowed.
   */
  overflowButtonRef: RefObject<HTMLElement | null>;
  /**
   * Any value that changes the items or their widths.
   */
  measureKey: unknown;
  /**
   * Items marked data-overflow-shrink shrink to this width, or their
   * natural width if smaller, before any item overflows.
   */
  minItemWidth?: number;
}

/**
 * Items that do not fit on one row are overflowed, starting from the end of
 * the row, so the row height never changes. Shrinkable items (which must
 * be flex items able to shrink, e.g. by truncating a label) get a minimum
 * width, and overflow begins only once every item would be at its minimum.
 *
 * Overflowed items stay mounted, marked with data-overflowed, and CSS hides
 * them. While measuring they are shown again, so their widths are known.
 */
export const useOverflowItems = ({
  containerRef,
  measureKey,
  minItemWidth = 0,
  overflowButtonRef,
}: OverflowItemsHookProps) => {
  const [overflowedIndices, setOverflowedIndices] = useState<number[]>([]);
  const overflowedRef = useRef(overflowedIndices);
  overflowedRef.current = overflowedIndices;

  const measure = useCallback(() => {
    const container = containerRef.current;
    // a hidden container has nothing to measure, it is measured when shown
    if (!container || container.offsetParent === null) {
      return;
    }
    container.classList.add(MEASURING);
    const items = Array.from(container.children).filter(
      (el): el is HTMLElement =>
        el instanceof HTMLElement && el.dataset.overflowItem !== undefined,
    );
    const style = getComputedStyle(container);
    const gap = parseFloat(style.columnGap) || 0;
    const overflowButton = overflowButtonRef.current;
    const overflowButtonWidth =
      (overflowButton?.offsetWidth ?? ESTIMATED_OVERFLOW_BUTTON_WIDTH) + gap;
    // while the overflow button is shown, the container is narrower by its
    // width, all of which is available if nothing overflows
    const available =
      container.clientWidth + (overflowButton ? overflowButtonWidth : 0);
    // while measuring, items are at their natural width
    const widths = items.map((el) => el.getBoundingClientRect().width);
    const minWidths = items.map((el, i) => {
      if (el.dataset.overflowShrink === undefined) {
        return widths[i];
      }
      const minWidth = Math.min(minItemWidth, widths[i]);
      el.style.minWidth = `${minWidth}px`;
      return minWidth;
    });
    const gaps = gap * Math.max(0, items.length - 1);
    const sum = (values: number[]) =>
      values.reduce((total, value) => total + value, 0);

    const overflowed: number[] = [];
    let total = sum(minWidths) + gaps;
    if (sum(widths) + gaps > available + 0.5 && total > available + 0.5) {
      const limit = available - overflowButtonWidth;
      for (let i = items.length - 1; i >= 0 && total > limit + 0.5; i--) {
        if (items[i].dataset.overflowPinned === undefined) {
          total -= minWidths[i] + gap;
          overflowed.unshift(i);
        }
      }
    }
    container.classList.remove(MEASURING);

    if (!sameIndices(overflowed, overflowedRef.current)) {
      setOverflowedIndices(overflowed);
    }
  }, [containerRef, minItemWidth, overflowButtonRef]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: measureKey changes the items to be measured
  useLayoutEffect(() => {
    measure();
  }, [measure, measureKey]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const observed = container?.parentElement;
    if (observed) {
      let width = observed.clientWidth;
      const resizeObserver = new ResizeObserver(() => {
        if (observed.clientWidth !== width) {
          width = observed.clientWidth;
          measure();
        }
      });
      resizeObserver.observe(observed);
      return () => resizeObserver.disconnect();
    }
  }, [containerRef, measure]);

  return overflowedIndices;
};
