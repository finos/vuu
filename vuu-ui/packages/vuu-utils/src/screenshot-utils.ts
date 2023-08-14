import {toPng} from "html-to-image";

/**
 * Takes a screenshot of the given node and returns the base64 encoded image url
 * @param node Node to take screenshot of
 */
export async function takeScreenshot(node: HTMLElement) {
  localStorage.removeItem("layout-screenshot");

  const screenshot = await toPng(node, { cacheBust: true })
    .then((dataUrl) => {
      return dataUrl;
    })
    .catch((err) => {
      console.error("Error taking screenshot", err);
      return undefined;
    });

  if (screenshot) localStorage.setItem("layout-screenshot", screenshot);
}
