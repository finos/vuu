export type PartitionTest<T> = (value: T, index: number) => boolean;

export function partition<T>(
  array: T[],
  test: PartitionTest<T>,
  pass: T[] = [],
  fail: T[] = []
): [T[], T[]] {
  for (let i = 0, len = array.length; i < len; i++) {
    (test(array[i], i) ? pass : fail).push(array[i]);
  }
  return [pass, fail];
}

// Note order of items can be different between arrays
// If an identityProperty is not defined, item identity is used
export function itemsChanged<T = unknown>(
  currentItems: T[],
  newItems: T[],
  identityProperty?: string
) {
  if (currentItems.length !== newItems.length) {
    return true;
  }
  if (identityProperty === undefined) {
    return !currentItems.every((item) => newItems.includes(item));
  } else {
    return currentItems.some(
      (currentItem) =>
        newItems.findIndex(
          (newItem) =>
            (newItem as { [key: string]: unknown })[identityProperty] ===
            (currentItem as { [key: string]: unknown })[identityProperty]
        ) === -1
    );
  }
}

export function itemsOrOrderChanged<T = unknown>(
  currentItems: T[],
  newItems: T[],
  identityProperty?: string
) {
  if (currentItems.length !== newItems.length) {
    return true;
  }
  if (identityProperty === undefined) {
    return currentItems.some((item, index) => newItems[index] !== item);
  } else {
    return currentItems.some(
      (currentItem, index) =>
        (newItems[index] as { [key: string]: unknown })[identityProperty] !==
        (currentItem as { [key: string]: unknown })[identityProperty]
    );
  }
}

export const moveItemDeprecated = <T = unknown>(
  items: T[],
  item: T,
  moveTo: number
): T[] => {
  const fromIndex = items.indexOf(item);
  if (fromIndex === moveTo) {
    return items;
  }
  const newItems = items.slice();
  if (fromIndex === -1) {
    throw Error("moveItem, item to be moved not found");
  }
  newItems.splice(fromIndex, 1);
  if (moveTo === -1) {
    newItems.push(item);
  } else {
    const offset = moveTo > fromIndex ? 0 : 0;
    newItems.splice(moveTo + offset, 0, item);
  }
  return newItems;
};

export const moveItem = <T = unknown>(
  items: T[],
  fromIndex: number,
  toIndex: number
): T[] => {
  if (fromIndex === toIndex) {
    return items;
  } else {
    const newItems = items.slice();
    const [item] = newItems.splice(fromIndex, 1);
    if (toIndex === -1) {
      return newItems.concat(item);
    } else {
      const offset = toIndex > fromIndex ? 0 : 0;
      newItems.splice(toIndex + offset, 0, item);
      return newItems;
    }
  }
};

export const getAddedItems = <T>(values: undefined | T[], newValues: T[]) => {
  const isNew = (v: T) => !values?.includes(v);
  if (values === undefined) {
    return newValues;
  } else if (newValues.some(isNew)) {
    return newValues.filter(isNew);
  } else {
    return [] as T[];
  }
};

export const getMissingItems = <T, I>(
  sourceItems: T[],
  items: I[],
  identity: (s: T) => I
) =>
  items.filter((i) => sourceItems.findIndex((s) => identity(s) === i) === -1);
