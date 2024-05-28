// TODO this is very fragile
export const isOverflowElement = (element: HTMLElement | null) =>
  element !== null &&
  element.dataset.index === "overflow" &&
  element.parentElement !== null &&
  element.parentElement.classList.contains(
    "vuuOverflowContainer-wrapContainer-overflowed"
  );
