export const isRoot = (el) => el.closest(`[data-root='true']`) !== null;

export const hasPopup = (el, idx) =>
  (el.ariaHasPopup === 'true' && el.dataset?.idx === `${idx}`) ||
  el.querySelector(`:scope > [data-idx='${idx}'][aria-haspopup='true']`) !== null;
