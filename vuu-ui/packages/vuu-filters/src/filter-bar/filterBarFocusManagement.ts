import {
  getElementByDataIndex,
  getElementDataIndex,
  queryClosest,
} from "@finos/vuu-utils";

export const navigateToNextItem = (
  el: HTMLElement | EventTarget,
  direction: "bwd" | "fwd" = "fwd"
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
        console.log("to the button");
        const filterBar = queryClosest(el, ".vuuFilterBar");
        const addButton = filterBar?.querySelector(
          ".vuuFilterBar-add"
        ) as HTMLElement;
        addButton?.focus();
      }
    }
  } else {
    const button = queryClosest(el, ".vuuFilterBar-add");
    if (button) {
      const filterBar = queryClosest(el, ".vuuFilterBar");
      const target = filterBar?.querySelector(
        ".vuuFilterPill:last-child"
      ) as HTMLElement;
      target?.focus();
    }
  }
};
