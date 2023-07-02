export const sortByScreenOrder = (elements: HTMLElement[]): HTMLElement[] =>
  elements.sort((e1, e2) => {
    const {
      dataset: { index: idx1 = "?" },
    } = e1;
    const {
      dataset: { index: idx2 = "?" },
    } = e2;
    const isOverflowed1 = e1.classList.contains("wrapped");
    const isOverflowed2 = e2.classList.contains("wrapped");
    const isOverflowedIndicator1 = idx1 === "overflow";
    const isOverflowedIndicator2 = idx2 === "overflow";
    if (isOverflowed1 && !isOverflowed2) {
      return 1;
    } else if (!isOverflowed1 && isOverflowed2) {
      return -1;
    }
    if (isOverflowedIndicator1) {
      return 1;
    } else if (isOverflowedIndicator2) {
      return -1;
    }
    return parseInt(idx1) > parseInt(idx2) ? 1 : -1;
  });

export const NO_WRAPPED_ITEMS: string[] = [];

export const detectOverflow = (container: HTMLElement) => {
  const underflowedItems: string[] = [];
  const overflowedItems: string[] = [];
  let currentLeft = -1;
  let overflowed = false;
  const sortedChildren = sortByScreenOrder(
    Array.from(container.children) as HTMLElement[]
  );
  for (const child of sortedChildren) {
    const element = child as HTMLElement;
    const {
      dataset: { index = "?" },
    } = element;
    const { left } = element.getBoundingClientRect();
    if (left <= currentLeft) {
      if (index === "overflow") {
        overflowedItems.push(underflowedItems.pop() as string);
      } else {
        overflowedItems.push(index);
      }
      overflowed = true;
    } else if (overflowed) {
      overflowedItems.push(index);
    } else {
      underflowedItems.push(index);
    }
    currentLeft = left;
  }
  return overflowedItems;
};

export const applyOverflowClass = (
  container: HTMLElement,
  overflowedItems: string[]
) => {
  let ignoreOverflow = false;
  if (overflowedItems.includes("overflow")) {
    if (overflowedItems.length === 1) {
      ignoreOverflow = true;
    }
  }
  for (const element of container.children) {
    const {
      dataset: { index = "?" },
    } = element as HTMLElement;
    if (overflowedItems.length === 0 || ignoreOverflow) {
      container.classList.remove("overflowed");
    } else {
      container.classList.add("overflowed");
    }
    if (overflowedItems.includes(index) && index !== "overflow") {
      element.classList.add("wrapped");
    } else {
      element.classList.remove("wrapped");
    }
  }
};

export const markElementAsWrapped = (container: HTMLElement, idx: string) => {
  const el = container.querySelector(`[data-index="${idx}"]`);
  if (el) {
    el.classList.add("wrapped");
  } else {
    throw Error(`markElementAsWrapped element ${idx} not found`);
  }
};

export const getElementsMarkedAsWrapped = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".wrapped")) as HTMLElement[];

const getNewItems = (items1: string[], items2: string[]) => {
  const newItems: string[] = [];
  for (const item of items2) {
    if (!items1.includes(item)) {
      newItems.push(item);
    }
  }
  return newItems;
};

export const unmarkItemsWhichAreNoLongerWrapped = (
  container: HTMLElement,
  wrappedItems: string[]
) => {
  const elementssMarkedAsWrapped = getElementsMarkedAsWrapped(container);
  elementssMarkedAsWrapped.forEach((el) => {
    const {
      dataset: { index = "?" },
    } = el;
    if (!wrappedItems.includes(index)) {
      el.classList.remove("wrapped");
    }
  });
};

/** 
  An edge case that may occur when reducing width from unwrapped to
  wrapped, or on first render.
  We overflow one or more items. Then, when the overflowIndicator assumes
  full width, it may itself overflow.
*/
export const correctForWrappedOverflowIndicator = (
  container: HTMLElement | null,
  overflowedItems: string[]
): Promise<string[]> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      if (container) {
        const o2 = detectOverflow(container);
        const newlyOverflowed = getNewItems(overflowedItems, o2);
        newlyOverflowed.forEach((item) =>
          markElementAsWrapped(container, item)
        );
        resolve(o2);
      } else {
        resolve(NO_WRAPPED_ITEMS);
      }
    });
  });

const getOverflowIndicator = (container: HTMLElement) =>
  container.querySelector('[data-index="overflow"]') as HTMLElement;
const getOverflowedItem = (container: HTMLElement) =>
  container.querySelector(".wrapped") as HTMLElement;
const getElementWidth = (el: HTMLElement) =>
  parseInt(getComputedStyle(el).getPropertyValue("width"));

const getAvailableSpace = (
  container: HTMLElement,
  overflowIndicator: HTMLElement
) => {
  const { right: containerRight } = container.getBoundingClientRect();
  const paddingRight = parseInt(
    getComputedStyle(container).getPropertyValue("padding-right")
  );
  const { right: indicatorRight } = overflowIndicator.getBoundingClientRect();
  return containerRight - paddingRight - indicatorRight;
};

/**
    An edge case. If container has grown but we still have one
    wrapped item - could the wrapped item return to the fold if the overflow
    indicaor were removed ?
 */
export const correctForUnnecessaryOverflowIndicator = (
  container: HTMLElement | null
): boolean => {
  if (container) {
    const overflowIndicator = getOverflowIndicator(container);
    const availableSpace = getAvailableSpace(container, overflowIndicator);
    const indicatorWidth = getElementWidth(overflowIndicator);
    const overflowedItem = getOverflowedItem(container);
    const overflowWidth = getElementWidth(overflowedItem);

    if (overflowWidth <= availableSpace + indicatorWidth) {
      container.classList.remove("overflowed");
      overflowedItem.classList.remove("wrapped");
      return true;
    }
  }
  return false;
};

export const switchWrappedItemIntoView = (
  container: HTMLElement | null,
  index: string
) => {
  console.log(`switchWrappedItemIntoView [${index}]`);
  if (container) {
    const unwrappedItems = Array.from(
      container.querySelectorAll(".vuuOverflowContainer-item:not(.wrapped)")
    ) as HTMLElement[];
    const targetItem = container.querySelector(
      `.vuuOverflowContainer-item[data-index="${index}"]`
    ) as HTMLElement;
    let pos = -1;
    let unwrappedItem = unwrappedItems.at(pos) as HTMLElement;
    const itemWidth = getElementWidth(unwrappedItem);
    const targetWidth = getElementWidth(targetItem);
    const overflowIndicator = getOverflowIndicator(container);
    let availableSpace =
      getAvailableSpace(container, overflowIndicator) + itemWidth;
    if (availableSpace >= targetWidth) {
      targetItem?.classList.remove("wrapped");
      unwrappedItem?.classList.add("wrapped");
    } else {
      // we need to wrap multiple items to make space for the switched item
      const { left: lastLeft } = unwrappedItem.getBoundingClientRect();
      const baseAvailableSpace = availableSpace;
      const wrapTargets = [unwrappedItem];
      while (availableSpace < targetWidth) {
        pos -= 1;
        unwrappedItem = unwrappedItems.at(pos) as HTMLElement;
        wrapTargets.push(unwrappedItem);
        const { left: nextLeft } = unwrappedItem.getBoundingClientRect();
        const extraSpace = lastLeft - nextLeft;
        availableSpace = baseAvailableSpace + extraSpace;
      }

      targetItem?.classList.remove("wrapped");
      wrapTargets.forEach((item) => {
        item.classList.add("wrapped");
      });
    }
  }
};
