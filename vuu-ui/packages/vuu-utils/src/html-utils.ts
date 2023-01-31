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
