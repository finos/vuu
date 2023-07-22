export const getElementIndex = (el: HTMLElement | null) => {
  if (el) {
    const index = parseInt(el.dataset.index || "");
    if (!isNaN(index)) {
      return index;
    }
  }
  return -1;
};

const getIndexOfItem = (container: HTMLElement | null, query: string) => {
  if (container) {
    const targetTab = container.querySelector(
      `[data-index]:has(${query})`
    ) as HTMLElement;
    return getElementIndex(targetTab);
  }
  return -1;
};

export const getIndexOfSelectedTab = (container: HTMLElement | null) =>
  getIndexOfItem(container, '[aria-selected="true"]');

export const getIndexOfEditedItem = (container: HTMLElement | null) =>
  getIndexOfItem(container, ".vuuEditableLabel-editing");
