export const createEl = (
  elementType: "div" | "p" | "span",
  className?: string,
  textContent?: string
): HTMLElement => {
  const el = document.createElement(elementType);
  if (className) {
    el.className = className;
  }
  if (textContent) {
    el.textContent = textContent;
  }
  return el;
};

export const getFocusableElement = (
  el: HTMLElement | null,
  tabIndex?: number
) => {
  if (el) {
    if (el.hasAttribute("tabindex")) {
      const rootTabIndex = parseInt(el.getAttribute("tabindex") as string);
      if (
        !isNaN(rootTabIndex) &&
        (tabIndex === undefined || rootTabIndex === tabIndex)
      ) {
        return el;
      }
    }
    const focusableEl =
      typeof tabIndex === "number"
        ? (el.querySelector(`[tabindex="${tabIndex}"]`) as HTMLElement)
        : (el.querySelector("[tabindex]") as HTMLElement);
    if (focusableEl) {
      return focusableEl as HTMLElement;
    }
  }
};

export const focusFirstFocusableElement = (
  el: HTMLElement | null,
  tabIndex?: number
) => {
  // TODO test el for focusable
  requestAnimationFrame(() => {
    const focusableElement = getFocusableElement(el, tabIndex);
    if (focusableElement) {
      focusableElement.focus();
    }
  });
};
