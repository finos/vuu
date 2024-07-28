import { toPng } from "html-to-image";

/**
 * Takes a screenshot of the given node and returns the base64 encoded image url
 * @param node HTMLElement to take screenshot of
 * @returns Base64 encoded image url
 */
export const takeScreenshot = (node: HTMLElement): Promise<string> => {
  return new Promise((resolve, reject) => {
    toPng(node, {
      cacheBust: true /*,
      filter: (child) =>
        // remove content of table rows
        child.nodeType === Node.TEXT_NODE ||
        child.getAttribute("role") !== "row",*/,
    })
      .then((screenshot) => {
        if (!screenshot) {
          reject(new Error("No Screenshot available"));
        }
        resolve(screenshot);
      })
      .catch((error: Error) => {
        console.error(
          "the following error occurred while taking a screenshot of a DOMNode",
          error
        );
        reject(new Error("Error taking screenshot"));
      });
  });
};
