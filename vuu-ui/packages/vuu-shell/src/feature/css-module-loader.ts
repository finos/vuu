export const importCSS = async (path: string) => {
  const container = new CSSStyleSheet();
  return fetch(path)
    .then((x) => x.text())
    .then((x) => container.replace(x));
};
