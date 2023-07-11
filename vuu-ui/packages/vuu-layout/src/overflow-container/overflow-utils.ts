const NON_WRAPPED_ITEM = ".vuuOverflowContainer-item:not(.wrapped)";

export type OverflowItem = {
  index: string;
  overflowPriority: string;
};

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

export const NO_WRAPPED_ITEMS: OverflowItem[] = [];

/**
    Identify wrapped items by comparing position of each item. Any item
    not to the right of preceeding item has wrapped. Note: on-screen 
    position of items does not necessarily match document position, due
    to use of css order. This is taken into account by sorting. 
    TODO support Vertical orientation
 */
export const getNonWrappedAndWrappedItems = (
  container: HTMLElement
): [OverflowItem[], OverflowItem[]] => {
  const nonWrappedItems: OverflowItem[] = [];
  const wrappedItems: OverflowItem[] = [];
  let currentLeft = -1;
  let overflowed = false;
  const sortedChildren = sortByScreenOrder(
    Array.from(container.children) as HTMLElement[]
  );
  for (const child of sortedChildren) {
    const element = child as HTMLElement;
    const {
      dataset: { index = "?", overflowPriority = "0" },
    } = element;
    const { left } = element.getBoundingClientRect();
    if (left <= currentLeft) {
      if (index === "overflow") {
        wrappedItems.push(nonWrappedItems.pop() as OverflowItem);
      } else {
        wrappedItems.push({ index, overflowPriority });
      }
      overflowed = true;
    } else if (overflowed) {
      wrappedItems.push({ index, overflowPriority });
    } else {
      nonWrappedItems.push({ index, overflowPriority });
    }
    currentLeft = left;
  }
  return [nonWrappedItems, wrappedItems];
};

export const applyOverflowClassToWrappedItems = (
  container: HTMLElement,
  overflowedItems: OverflowItem[]
) => {
  let ignoreOverflow = false;
  if (overflowedItems.find(({ index }) => index === "overflow")) {
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
    if (
      index !== "overflow" &&
      overflowedItems.find((item) => item.index === index)
    ) {
      element.classList.add("wrapped");
    } else {
      element.classList.remove("wrapped");
    }
  }
};

const maxPriority = (priority: number, { overflowPriority }: OverflowItem) =>
  Math.max(priority, parseInt(overflowPriority));

export const overflowIndicatorHasWrappedButShouldNotHave = (
  wrappedItems: OverflowItem[]
) => wrappedItems.length > 1 && wrappedItems.at(-1)?.index === "overflow";

const getHigherPriorityItem = (
  overflowItems: OverflowItem[],
  priority: number
) => {
  for (const item of overflowItems) {
    if (parseInt(item.overflowPriority) > priority) {
      return item;
    }
  }
};

export const highPriorityItemsHaveWrappedButShouldNotHave = (
  nonWrappedItems: OverflowItem[],
  wrappedItems: OverflowItem[]
) => {
  const maxNonwrappedPriority = nonWrappedItems.reduce<number>(maxPriority, 0);
  const maxwrappedPriority = wrappedItems.reduce<number>(maxPriority, 0);
  if (maxwrappedPriority > maxNonwrappedPriority) {
    return true;
  } else {
    return wrappedItems.length > 1 && wrappedItems.at(-1)?.index === "overflow";
  }
};

/** 
  An edge case that may occur when reducing width from unwrapped to
  wrapped, or on first render.
  We overflow one or more items. Then, when the overflowIndicator assumes
  full width, it may itself overflow.
*/
export const correctForWrappedOverflowIndicator = (
  container: HTMLElement,
  overflowedItems: OverflowItem[]
): Promise<OverflowItem[]> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      const [, o2] = getNonWrappedAndWrappedItems(container);
      const newlyOverflowed = getNewItems(overflowedItems, o2);
      newlyOverflowed.forEach((item) => markElementAsWrapped(container, item));
      resolve(o2);
    });
  });

/** 
  An edge case that may occur when reducing width from unwrapped to
  wrapped, or on first render.
  We overflow one or more items. Then, when the overflowIndicator assumes
  full width, it may itself overflow.
*/
export const correctForWrappedHighPriorityItems = (
  container: HTMLElement,
  overflowedItems: OverflowItem[]
): Promise<OverflowItem[]> =>
  new Promise((resolve) => {
    requestAnimationFrame(() => {
      const [o1, o2] = getNonWrappedAndWrappedItems(container);
      const priority = o1.reduce<number>(maxPriority, 0);
      const highPriorityWrappedItem = getHigherPriorityItem(o2, priority);
      if (highPriorityWrappedItem) {
        const wrappedItems = switchWrappedItemIntoView(
          container,
          highPriorityWrappedItem
        );
        resolve(wrappedItems);
      } else {
        resolve(overflowedItems);
      }
    });
  });

const getElementByIndex = (container: HTMLElement, item: OverflowItem) =>
  container.querySelector(`[data-index="${item.index}"]`) as HTMLElement;

export const markElementAsWrapped = (
  container: HTMLElement,
  item: OverflowItem
) => {
  const el = getElementByIndex(container, item);
  if (el) {
    el.classList.add("wrapped");
  } else {
    throw Error(
      `markElementAsWrapped element item with index ${item.index} not found`
    );
  }
};

export const getElementsMarkedAsWrapped = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(".wrapped")) as HTMLElement[];

const getNewItems = (items1: OverflowItem[], items2: OverflowItem[]) => {
  const newItems: OverflowItem[] = [];
  for (const item of items2) {
    if (!items1.find(({ index }) => index === item.index)) {
      newItems.push(item);
    }
  }
  return newItems;
};

export const unmarkItemsWhichAreNoLongerWrapped = (
  container: HTMLElement,
  wrappedItems: OverflowItem[]
) => {
  const elementssMarkedAsWrapped = getElementsMarkedAsWrapped(container);
  elementssMarkedAsWrapped.forEach((el) => {
    const {
      dataset: { index = "?" },
    } = el;
    if (!wrappedItems.find((i) => i.index === index)) {
      el.classList.remove("wrapped");
    }
  });
};

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
export const removeOverflowIndicatorIfNoLongerNeeded = (
  container: HTMLElement
): boolean => {
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
  return false;
};

const byPriorityDescending = (h1: Element, h2: Element) => {
  const {
    dataset: { index: i1 = "0", overflowPriority: p1 = "0" },
  } = h1 as HTMLElement;
  const {
    dataset: { index: i2 = "0", overflowPriority: p2 = "0" },
  } = h2 as HTMLElement;

  if (p1 > p2) {
    return -1;
  } else if (p1 < p2) {
    return 1;
  } else {
    return parseInt(i1) - parseInt(i2);
  }
};

const getNonwrappedItemsByPriority = (container: HTMLElement) =>
  Array.from(container.querySelectorAll(NON_WRAPPED_ITEM)).sort(
    byPriorityDescending
  ) as HTMLElement[];

/**
 * This is used both when an overflow menu is used to select an overflowed item
 * and when a high priority item has overflowed, whilst lower priority items
 * remain in view.
 */
export const switchWrappedItemIntoView = (
  container: HTMLElement,
  overflowItem: OverflowItem
): OverflowItem[] => {
  const unwrappedItems = getNonwrappedItemsByPriority(container);
  const targetElement = getElementByIndex(container, overflowItem);
  let pos = -1;
  let unwrappedItem = unwrappedItems.at(pos) as HTMLElement;
  const itemWidth = getElementWidth(unwrappedItem);
  const targetWidth = getElementWidth(targetElement);
  const overflowIndicator = getOverflowIndicator(container);
  let availableSpace =
    getAvailableSpace(container, overflowIndicator) + itemWidth;
  if (availableSpace >= targetWidth) {
    switchWrapOnElements(targetElement, unwrappedItem);
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

    targetElement?.classList.remove("wrapped");
    wrapTargets.forEach((item) => {
      item.classList.add("wrapped");
    });
  }
  const [, wrappedItems] = getNonWrappedAndWrappedItems(container);
  unmarkItemsWhichAreNoLongerWrapped(container, wrappedItems);
  return wrappedItems;
};

const switchWrapOnElements = (
  wrappedElement?: HTMLElement | null,
  nonWrappedElement?: HTMLElement
) => {
  if (!wrappedElement || !nonWrappedElement) {
    throw Error("switchWrapOnElements, element undefined");
  }
  wrappedElement.classList.remove("wrapped");
  nonWrappedElement.classList.add("wrapped");
};
