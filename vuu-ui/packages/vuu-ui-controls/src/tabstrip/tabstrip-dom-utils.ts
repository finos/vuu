import { getElementDataIndex } from "@finos/vuu-utils";

const getIndexOfItem = (container: HTMLElement | null, query: string) => {
  if (container) {
    const targetTab = container.querySelector(
      `[data-index]:has(${query})`
    ) as HTMLElement;
    return getElementDataIndex(targetTab);
  }
  return -1;
};

export const getIndexOfSelectedTab = (container: HTMLElement | null) =>
  getIndexOfItem(container, '[aria-selected="true"]');

export const getIndexOfEditedItem = (container: HTMLElement | null) =>
  getIndexOfItem(container, ".vuuEditableLabel-editing");
