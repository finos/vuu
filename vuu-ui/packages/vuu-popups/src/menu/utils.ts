export const isRoot = (el: HTMLElement) =>
  el.closest(`[data-root='true']`) !== null;

export const hasPopup = (el: HTMLElement, idx: number) =>
  (el.ariaHasPopup === "true" && el.dataset?.idx === `${idx}`) ||
  el.querySelector(`:scope > [data-index='${idx}'][aria-haspopup='true']`) !==
    null;
