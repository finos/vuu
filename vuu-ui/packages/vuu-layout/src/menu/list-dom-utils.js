export const listItemElement = (listEl, listItemIdx) =>
  listEl.querySelector(`:scope > [data-idx="${listItemIdx}"]`);

export function listItemIndex(listItemEl) {
  if (listItemEl) {
    let idx = listItemEl.dataset.idx;
    if (idx) {
      return parseInt(idx, 10);
      // eslint-disable-next-line no-cond-assign
    } else if ((idx = listItemEl.ariaPosInSet)) {
      return parseInt(idx, 10) - 1;
    }
  }
}

export const listItemId = (el) => el?.id;

export const closestListItem = (el) => el.closest('[data-idx],[aria-posinset]');

export const closestListItemId = (el) => listItemId(closestListItem(el));

export const closestListItemIndex = (el) => listItemIndex(closestListItem(el));
