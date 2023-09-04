import { toPng } from "html-to-image";

/**
 * Takes a screenshot of the given node and returns the base64 encoded image url
 * @param node Node to take screenshot of
 * @returns Base64 encoded image url
 */
export async function takeScreenshot(node: HTMLElement) {

  const screenshot = await toPng(node, { cacheBust: true })
    .then((dataUrl) => {
      return dataUrl;
    })
    .catch((err) => {
      console.error("Error taking screenshot", err);
      return undefined;
    });

  if (!screenshot) {
    return undefined;
  }
  return screenshot;
}
