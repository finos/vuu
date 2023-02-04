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

export const moveItem = <T = unknown>(
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
