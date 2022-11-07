import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useResizeObserver } from "./useResizeObserver";
import { measureMinimumNodeSize } from "./measureMinimumNodeSize";

const MONITORED_DIMENSIONS = {
  horizontal: ["width", "scrollHeight"],
  vertical: ["height", "scrollWidth"],
  none: [],
};
const NO_OVERFLOW_INDICATOR = {};
const NO_DATA = {};

const UNCOLLAPSED_DYNAMIC_ITEMS =
  '[data-collapsible="dynamic"]:not([data-collapsed="true"]):not([data-collapsing="true"])';

const addAll = (sum: number, m: any) => sum + m.size;
const addAllExceptOverflowIndicator = (sum: number, m: any) =>
  sum + (m.isOverflowIndicator ? 0 : m.size);

// There should be no collapsible items here that are not already collapsed
// otherwise we would be collapsing, not overflowing
const lastOverflowableItem = (arr) => {
  for (let i = arr.length - 1; i >= 0; i--) {
    const item = arr[i];
    // TODO should we support a no-overflow attribute (maybe a priority 0)
    // to prevent an item from overflowing ?
    // TODO when all collapsible items are collapsed and we start overflowing,
    // should we leave collapsed items to last in the overflow priority ?
    if (!item.isOverflowIndicator) {
      return item;
    }
  }
  return null;
};
const OVERFLOWING = 1000;
const collapsedOnly = (status) => status > 0 && status < 1000;
const includesOverflow = (status) => status >= OVERFLOWING;
const lastListItem = (listRef) => listRef.current[listRef.current.length - 1];

const newlyCollapsed = (visibleItems) =>
  visibleItems.some((item) => item.collapsed && item.fullWidth === null);

const hasUncollapsedDynamicItems = (containerRef) =>
  containerRef.current.querySelector(UNCOLLAPSED_DYNAMIC_ITEMS) !== null;

const moveOverflowItem = (fromStack, toStack) => {
  const item = lastOverflowableItem(fromStack.current);
  if (item) {
    fromStack.current = fromStack.current.filter((i) => i !== item);
    toStack.current = toStack.current.concat(item);
    return item;
  } else {
    return null;
  }
};

const byDescendingPriority = (m1, m2) => {
  let result = m1.priority - m2.priority;
  if (result === 0) {
    result = m1.index - m2.index;
  }
  return result;
};

const getOverflowIndicator = (visibleRef) =>
  visibleRef.current.find((item) => item.isOverflowIndicator);

const Dimensions = {
  horizontal: {
    size: "clientWidth",
    depth: "clientHeight",
    scrollDepth: "scrollHeight",
  },
  vertical: {
    size: "clientHeight",
    depth: "clientWidth",
    scrollDepth: "scrollWidth",
  },
};

const measureContainerOverflow = (
  { current: innerEl },
  orientation = "horizontal"
) => {
  const dim = Dimensions[orientation];
  const { [dim.depth]: containerDepth } = innerEl.parentNode;
  const { [dim.scrollDepth]: scrollDepth, [dim.size]: contentSize } = innerEl;
  const isOverflowing = containerDepth < scrollDepth;
  return [isOverflowing, contentSize, containerDepth];
};

const useOverflowStatus = () => {
  const [, forceUpdate] = useState(null);
  // TODO make this easier to understand by storing the overflow and
  // collapse status as separate reference count fields
  const [overflowing, _setOverflowing] = useState(0);
  const overflowingRef = useRef(0);
  const setOverflowing = useCallback(
    (value) => {
      _setOverflowing((overflowingRef.current = value));
    },
    [_setOverflowing]
  );

  const updateOverflowStatus = useCallback(
    (value, force) => {
      if (Math.abs(value) === OVERFLOWING) {
        if (value > 0 && !includesOverflow(overflowingRef.current)) {
          setOverflowing(overflowingRef.current + value);
        } else if (value < 0 && includesOverflow(overflowingRef.current)) {
          setOverflowing(overflowingRef.current + value);
        } else {
          forceUpdate({});
        }
      } else if (value !== 0) {
        setOverflowing(overflowingRef.current + value);
      } else if (force) {
        forceUpdate({});
      }
    },
    [forceUpdate, overflowingRef, setOverflowing]
  );

  return [overflowingRef, overflowing, updateOverflowStatus];
};

const measureChildNodes = ({ current: innerEl }, dimension) => {
  const measurements = Array.from(innerEl.childNodes).reduce(
    (list, node: Node) => {
      const {
        collapsible,
        collapsed,
        collapsing,
        index,
        priority = "1",
        overflowIndicator,
        overflowed,
      } = node?.dataset ?? NO_DATA;
      if (index) {
        const size = measureMinimumNodeSize(node, dimension);
        if (overflowed) {
          delete node.dataset.overflowed;
        }
        list.push({
          collapsible,
          collapsed: collapsible ? collapsed === "true" : undefined,
          collapsing,
          // only to be populated in case of collapse
          // TODO check the role of this - especially the way we check it in useEffect
          // to detect collapse
          fullSize: null,
          index: parseInt(index, 10),
          isOverflowIndicator: overflowIndicator,
          label: node.title || node.innerText,
          priority: parseInt(priority, 10),
          size,
        });
      }
      return list;
    },
    []
  );

  return measurements.sort(byDescendingPriority);
};

const getElementForItem = (ref, item) =>
  ref.current.querySelector(`:scope > [data-idx='${item.index}']`);

// value could be anything which might require a re-evaluation. In the case of tabs
// we might have selected an overflowed tab. Can we make this more efficient, only
// needs action if an overflowed item re-enters the visible section
export function useOverflowObserver(orientation = "horizontal", label = "") {
  const ref = useRef(null);
  const [overflowingRef, overflowing, updateOverflowStatus] =
    useOverflowStatus();
  // const [, forceUpdate] = useState();
  const visibleRef = useRef([]);
  const overflowedRef = useRef([]);
  const collapsedRef = useRef([]);
  const collapsingRef = useRef(false);
  const rootDepthRef = useRef(null);
  const containerSizeRef = useRef(null);
  const horizontalRef = useRef(orientation === "horizontal");
  const overflowIndicatorSizeRef = useRef(36); // should default by density
  const minSizeRef = useRef(0);

  const setContainerMinSize = useCallback(
    (size) => {
      const isHorizontal = horizontalRef.current;
      if (size === undefined) {
        const dimension = isHorizontal ? "width" : "height";
        ({ [dimension]: size } = ref.current.getBoundingClientRect());
      }
      minSizeRef.current = size;
      const styleDimension = isHorizontal ? "minWidth" : "minHeight";
      ref.current.style[styleDimension] = size + "px";
    },
    [ref]
  );

  const markOverflowingItems = useCallback(
    (visibleContentSize, containerSize) => {
      let result = 0;
      // First pass, see if there is a collapsible item we can collapse. We won't
      // know how much space this frees up until the thing has re-rendered, so this
      // may kick off a chain of renders and remeasures if there are multiple collapsible
      // items and each yields only a part of the shrinkage we need to apply.
      //  That's the worst case scenario.
      if (
        visibleRef.current.some((item) => item.collapsible && !item.collapsed)
      ) {
        for (let i = visibleRef.current.length - 1; i >= 0; i--) {
          const item = visibleRef.current[i];
          if (item.collapsible === "instant" && !item.collapsed) {
            item.collapsed = true;
            const target = getElementForItem(ref, item);
            target.dataset.collapsed = true;
            collapsedRef.current.push(item);
            // We only ever collapse 1 item at a time. We now need to wait for
            // it to render, so we can re-measure and determine how much space
            // this has saved.
            return 1;
          } else if (
            item.collapsible === "dynamic" &&
            !item.collapsed &&
            !item.collapsing
          ) {
            item.collapsing = true;
            const target = getElementForItem(ref, item);
            target.dataset.collapsing = true;
            collapsedRef.current.push(item);
            ref.current.dataset.collapsing = true;
            // We only ever collapse 1 item at a time. We now need to wait for
            // it to render, so we can re-measure and determine how much space
            // this has saved.
            return 1;
          }
        }
      }

      // If no collapsible items, movin items from visible to overflowed queues
      while (visibleContentSize > containerSize) {
        const overflowedItem = moveOverflowItem(visibleRef, overflowedRef);
        if (overflowedItem === null) {
          // unable to overflow, all items are collapsed, this is our minimum width,
          // enforce it ...
          // TODO what if density changes
          //TODO probably not right, now we overflow even collapsed items, min width should be
          // overflow indicator width plus width of any non-overflowable items
          setContainerMinSize(visibleContentSize);
          break;
        }
        visibleContentSize -= overflowedItem.size;
        const target = getElementForItem(ref, overflowedItem);
        target.dataset.overflowed = true;
        result = OVERFLOWING;
      }
      return result;
    },
    [setContainerMinSize]
  );

  const removeOverflowIfSpaceAllows = useCallback(
    (containerSize) => {
      let result = 0;
      // TODO calculate this without using fullWidth if we have OVERFLOW
      // Need a loop here where we first remove OVERFLOW, then potentially remove
      // COLLAPSE too
      // We want to re-introduce overflowed items before we start to restore collapsed items
      // When we are dealing with overflowed items, we just use the current width of collapsed items.
      let visibleContentSize = visibleRef.current.reduce(
        addAllExceptOverflowIndicator,
        0
      );
      let diff = containerSize - visibleContentSize;

      if (collapsedOnly(overflowingRef.current)) {
        // find the next collapsed item, see how much extra space it would
        // occupy if restored. If we have enough space, restore it.
        while (collapsedRef.current.length) {
          const item = lastListItem(collapsedRef);
          const itemDiff = item.fullSize - item.size;
          if (diff >= itemDiff) {
            item.collapsed = false;
            item.size = item.fullSize;
            // Be careful before setting this to null, check the code in useEffect
            delete item.fullSize;
            const target = getElementForItem(ref, item);
            collapsedRef.current.pop();
            delete target.dataset.collapsed;
            diff = diff - itemDiff;
            result += 1;
          } else {
            break;
          }
        }
        return result;
      } else {
        while (overflowedRef.current.length > 0) {
          const { size: nextSize } = lastListItem(overflowedRef);

          if (diff >= nextSize) {
            const { size: overflowSize = 0 } =
              getOverflowIndicator(visibleRef) || NO_OVERFLOW_INDICATOR;
            // we can only ignore the width of overflow Indicator if either there is only one remaining
            // overflow item (so overflowIndicator will be removed) or diff is big enough to accommodate
            // the overflow Ind.
            if (
              overflowedRef.current.length === 1 ||
              diff >= nextSize + overflowSize
            ) {
              const overflowedItem = moveOverflowItem(
                overflowedRef,
                visibleRef
              );
              visibleContentSize += overflowedItem.size;
              const target = getElementForItem(ref, overflowedItem);
              delete target.dataset.overflowed;
              diff = diff - overflowedItem.size;
              result = OVERFLOWING;
            } else {
              break;
            }
          } else {
            break;
          }
        }
      }
      // DOn't return OVERFLOWING unless there is no more overflow
      return result;
    },
    [overflowingRef]
  );

  const initializeDynamicContent = useCallback(() => {
    let renderedSize = visibleRef.current.reduce(addAll, 0);
    let diff = renderedSize - containerSizeRef.current;
    for (let i = visibleRef.current.length - 1; i >= 0; i--) {
      const item = visibleRef.current[i];
      if (item.collapsible && !item.collapsed) {
        const target = getElementForItem(ref, item);
        // TODO where do we derive min width 28 + 8
        if (diff > item.size - 36) {
          // We really want to know if it has reached min-width, but we will have to
          // wait for it to render
          target.dataset.collapsed = item.collapsed = true;
          diff -= item.size;
        } else {
          target.dataset.collapsing = item.collapsing = true;
          break;
        }
      }
    }
  }, [containerSizeRef, ref, visibleRef]);

  const collapseCollapsingItem = useCallback(
    (item, target) => {
      target.dataset.collapsing = item.collapsing = false;
      target.dataset.collapsed = item.collapsed = true;

      const rest = visibleRef.current.filter(
        ({ collapsible, collapsed }) => collapsible === "dynamic" && !collapsed
      );
      const last = rest.pop();
      if (last) {
        const lastTarget = getElementForItem(ref, last);
        lastTarget.dataset.collapsing = last.collapsing = true;
      } else {
        // Set minSize to current measured size
        // TODO check that this makes sense...suspect it doesn't
        setContainerMinSize();
      }
    },
    [setContainerMinSize]
  );

  const restoreCollapsingItem = useCallback((item, target) => {
    target.dataset.collapsing = item.collapsing = false;
    // we might have an opportunity to switch the next collapsed item to
    // collapsing here. If we don't do this, it will ge handled in the next resize
  }, []);

  const checkDynamicContent = useCallback(
    (containerHasGrown) => {
      // The order must matter here
      const collapsingItem = visibleRef.current.find(
        ({ collapsible, collapsing }) => collapsible === "dynamic" && collapsing
      );
      const collapsedItem = visibleRef.current.find(
        ({ collapsible, collapsed }) => collapsible === "dynamic" && collapsed
      );

      if (collapsingItem === undefined && collapsedItem === undefined) {
        return;
      }

      if (collapsingItem === undefined) {
        const target = getElementForItem(ref, collapsedItem);
        target.dataset.collapsed = collapsedItem.collapsed = false;
        target.dataset.collapsing = collapsedItem.collapsing = true;
        return;
      }

      const target = getElementForItem(ref, collapsingItem);
      const dimension = horizontalRef.current ? "width" : "height";

      if (containerHasGrown && collapsedItem) {
        const size = measureMinimumNodeSize(target, dimension);
        // We don't restore a collapsing item unless there is at least one collapsed item
        if (collapsedItem && size === collapsingItem.size) {
          restoreCollapsingItem(collapsingItem, target);
        }
      } else {
        // Note we are going to compare width with minWidth. Margin is ignored here, so we
        // use getBoundingClientRect rather than measureNode
        const { [dimension]: size } = target.getBoundingClientRect();
        const style = getComputedStyle(target);
        const minSize = parseInt(style.getPropertyValue(`min-${dimension}`));
        if (size === minSize) {
          collapseCollapsingItem(collapsingItem, target);
        }
      }
    },
    [collapseCollapsingItem, restoreCollapsingItem]
  );

  const resetMeasurements = useCallback(() => {
    const [isOverflowing, innerContainerSize, rootContainerDepth] =
      measureContainerOverflow(ref, orientation);

    containerSizeRef.current = innerContainerSize;
    rootDepthRef.current = rootContainerDepth;

    const hasDynamicItems = hasUncollapsedDynamicItems(ref);

    if (hasDynamicItems || isOverflowing) {
      const dimension = horizontalRef.current ? "width" : "height";
      const measurements = measureChildNodes(ref, dimension);
      visibleRef.current = measurements;
      overflowedRef.current = [];
    }

    if (hasDynamicItems) {
      // if we don't have overflow, but we do have dynamic collapse items, we need to monitor resize events
      //  to determine when the collapsing item reaches min-width. At which point it becomes collapsed, and
      // the next dynanic collapse item assumes collapsing status
      collapsingRef.current = true;
      ref.current.dataset.collapsing = true;

      if (isOverflowing) {
        // We will only encounter this scenario first-time in. Once we initialize for dynamic content,
        // there will be no more overflow (unless we decide to re-enable overflow once all dynamic
        // items are collapsed ).
        initializeDynamicContent();
      } else {
        const collapsingItem = lastListItem(visibleRef);
        const element = getElementForItem(ref, collapsingItem);
        element.dataset.collapsing = collapsingItem.collapsing = true;
      }
    } else if (isOverflowing) {
      // We may already have an overflowIndicator here, if caller is Tabstrip
      let renderedSize = visibleRef.current.reduce(
        addAllExceptOverflowIndicator,
        0
      );
      const result = markOverflowingItems(
        renderedSize,
        innerContainerSize - overflowIndicatorSizeRef.current
      );
      updateOverflowStatus(+result);
    }
  }, [
    initializeDynamicContent,
    markOverflowingItems,
    orientation,
    updateOverflowStatus,
  ]);

  const resizeHandler = useCallback(
    ({
      scrollHeight,
      height = scrollHeight,
      scrollWidth,
      width = scrollWidth,
    }) => {
      const [size, depth] = horizontalRef.current
        ? [width, height]
        : [height, width];

      const wasFullSize = overflowingRef.current === 0;
      const overflowDetected = depth > rootDepthRef.current;
      const containerHasGrown = size > containerSizeRef.current;

      containerSizeRef.current = size;

      if (containerHasGrown && size === minSizeRef.current) {
        // ignore
      } else if (collapsingRef.current) {
        checkDynamicContent(containerHasGrown);
      } else if (!wasFullSize && containerHasGrown) {
        const result = removeOverflowIfSpaceAllows(size);
        // Don't remove the overflowing status if there are remaining overflowed item(s).
        // Unlike collapsed items, overflowed is not a reference count.
        if (result !== OVERFLOWING || overflowedRef.current.length === 0) {
          updateOverflowStatus(-result);
        } else if (result === OVERFLOWING) {
          updateOverflowStatus(0, true);
        }
      } else if (wasFullSize && overflowDetected) {
        // TODO if client is not using an overflow indicator, there is nothing to do here,
        // just let nature take its course. How do we know this ?
        // This is when we need to add width to measurements we are tracking
        resetMeasurements();
      } else if (!wasFullSize && overflowDetected) {
        // we're still overflowing
        let renderedSize = visibleRef.current.reduce(addAll, 0);
        if (size < renderedSize) {
          const result = markOverflowingItems(renderedSize, size);
          updateOverflowStatus(+result);
        }
      }
    },
    [
      checkDynamicContent,
      removeOverflowIfSpaceAllows,
      resetMeasurements,
      markOverflowingItems,
      overflowingRef,
      updateOverflowStatus,
    ]
  );

  useLayoutEffect(() => {
    const dimension = horizontalRef.current ? "width" : "height";
    if (newlyCollapsed(visibleRef.current)) {
      // These are in reverse priority order, so last collapsed will always be first
      const [collapsedItem] = visibleRef.current.filter(
        (item) => item.collapsed
      );
      if (collapsedItem.fullSize === null) {
        const target = getElementForItem(ref, collapsedItem);
        if (target) {
          const collapsedSize = measureMinimumNodeSize(target, dimension);
          collapsedItem.fullSize = collapsedItem.size;
          collapsedItem.size = collapsedSize;
          // is the difference between collapsed size and original size enough ?
          // TODO we repeat this code a lot, factoer it out
          const renderedSize = visibleRef.current.reduce(addAll, 0);
          if (renderedSize > containerSizeRef.current) {
            const strategy = markOverflowingItems(
              renderedSize,
              containerSizeRef.current - overflowIndicatorSizeRef.current
            );
            updateOverflowStatus(+strategy);
          }
        }
      }
    } else if (includesOverflow(overflowing)) {
      const target = ref.current.querySelector(
        `:scope > [data-overflow-indicator='true']`
      );
      if (target) {
        const { index, priority = "1" } = target?.dataset ?? NO_DATA;
        const item = {
          index: parseInt(index, 10),
          isOverflowIndicator: true,
          priority: parseInt(priority, 10),
          label: target.innerText,
          size: measureMinimumNodeSize(target, dimension),
        };
        overflowIndicatorSizeRef.current = item.size;
        visibleRef.current = visibleRef.current
          .concat(item)
          .sort(byDescendingPriority);
      }
    } else if (getOverflowIndicator(visibleRef)) {
      visibleRef.current = visibleRef.current.filter(
        (item) => !item.isOverflowIndicator
      );
    }
  }, [
    markOverflowingItems,
    overflowing,
    ref,
    updateOverflowStatus,
    visibleRef,
  ]);

  // Measurement occurs post-render, by necessity, need to trigger a render
  useLayoutEffect(() => {
    async function measure() {
      await document.fonts.ready;
      if (ref.current !== null) {
        resetMeasurements();
      }
    }
    if (orientation !== "none") {
      measure();
    }
  }, [label, orientation, resetMeasurements]);

  useResizeObserver(ref, MONITORED_DIMENSIONS[orientation], resizeHandler);

  return [ref, overflowedRef.current, collapsedRef.current, resetMeasurements];
}
