import { queryClosest } from "@vuu-ui/vuu-utils";

// in row order: the pills that fit, the overflow button, the Add button
const QUERY_NAVIGABLE_ITEMS = [
  ".vuuCustomFilters-filters > .vuuFilterPill:not([data-overflowed])",
  ".vuuFilterOverflowMenu",
  ".vuuCustomFilters-add",
].join(",");

/**
 * Arrow key navigation between the items of the filter row.
 */
export const navigateToNextItem = (
  el: HTMLElement | EventTarget,
  direction: "bwd" | "fwd" = "fwd",
) => {
  const filterBar = queryClosest(el, ".vuuFilterBar");
  if (filterBar && el instanceof Element) {
    const items = Array.from(
      filterBar.querySelectorAll<HTMLElement>(QUERY_NAVIGABLE_ITEMS),
    );
    const index = items.findIndex((item) => item.contains(el));
    if (index !== -1) {
      const target = items[direction === "fwd" ? index + 1 : index - 1];
      target?.focus();
    }
  }
};
