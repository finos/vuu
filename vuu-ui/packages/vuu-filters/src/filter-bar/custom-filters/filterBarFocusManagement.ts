import {
  getElementByDataIndex,
  getElementDataIndex,
  queryClosest,
} from "@vuu-ui/vuu-utils";

const QUERY_ADD_BUTTON = '.saltButton:has([aria-label="Add filter"])';

export const navigateToNextItem = (
  el: HTMLElement | EventTarget,
  direction: "bwd" | "fwd" = "fwd",
) => {
  const pill = queryClosest(el, ".vuuFilterPill");
  if (pill) {
    const index = getElementDataIndex(pill);
    if (typeof index === "number") {
      const target =
        direction === "fwd"
          ? getElementByDataIndex(pill.parentElement, index + 1)
          : getElementByDataIndex(pill.parentElement, index - 1);
      if (target) {
        target.focus();
      } else if (direction === "fwd") {
        const filterBar = queryClosest(el, ".vuuFilterBar");
        const addButton = filterBar?.querySelector(
          QUERY_ADD_BUTTON,
        ) as HTMLElement;
        addButton?.focus();
      }
    }
  } else {
    const button = queryClosest(el, QUERY_ADD_BUTTON);
    if (button) {
      const filterBar = queryClosest(el, ".vuuFilterBar");
      const target = filterBar?.querySelector(
        ".vuuFilterPill:last-child",
      ) as HTMLElement;
      target?.focus();
    }
  }
};
