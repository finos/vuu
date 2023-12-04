export const getRows = (el: HTMLElement) =>
  getComputedStyle(el)
    .getPropertyValue("grid-template-rows")
    .split(" ")
    .map((value) => parseInt(value, 10));

export const getRow = (el: HTMLElement) =>
  getComputedStyle(el)
    .getPropertyValue("grid-row")
    .split("/")
    .map((value) => parseInt(value, 10));

export const getRowIndex = (el: HTMLElement) => {
  const [from] = getRow(el);
  return from - 1;
};
