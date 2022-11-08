export const importCSS = async (path: string) => {
  const container = new CSSStyleSheet();
  console.log(`load css at ${path}`);
  return fetch(path)
    .then((x) => x.text())
    .then((x) => container.replace(x));
};
