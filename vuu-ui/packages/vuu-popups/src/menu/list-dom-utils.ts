// const listItemElement = (listEl: HTMLElement, listItemIdx: number) =>
//   listEl.querySelector(`:scope > [data-idx="${listItemIdx}"]`);

export function listItemIndex(listItemEl: HTMLElement) {
  if (listItemEl) {
    const idx = listItemEl.dataset.idx;
    if (idx) {
      return parseInt(idx, 10);
      // eslint-disable-next-line no-cond-assign
    } else if (listItemEl.ariaPosInSet) {
      return parseInt(listItemEl.ariaPosInSet, 10) - 1;
    }
  }
}

const listItemId = (el: HTMLElement | null | undefined) => el?.id;

export const closestListItem = (el: HTMLElement | null | undefined) =>
  el?.closest("[data-idx],[aria-posinset]") as HTMLElement;

export const closestListItemId = (el: HTMLElement) =>
  listItemId(closestListItem(el));

export const closestListItemIndex = (el: HTMLElement) =>
  listItemIndex(closestListItem(el));
