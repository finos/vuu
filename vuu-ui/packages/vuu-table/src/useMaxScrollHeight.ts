import { useWindow } from "@salt-ds/window";
import { getMaxScrollHeight } from "@vuu-ui/vuu-utils";
import { useEffect, useState } from "react";

// Firefox's limit is reduced by the element's offset within the document.
const SAFETY_FACTOR = 0.99;

const getSafeMaxScrollHeight = (targetWindow?: Window) =>
  Math.floor(getMaxScrollHeight(targetWindow?.document) * SAFETY_FACTOR);

/**
 * The maximum content height (CSS pixels) the browser will scroll through.
 * This varies by browser and shrinks as browser zoom increases, so it is
 * re-measured whenever devicePixelRatio changes (zoom or change of display).
 */
export const useMaxScrollHeight = () => {
  const targetWindow = useWindow() ?? globalThis.window;
  const [maxScrollHeight, setMaxScrollHeight] = useState(() =>
    getSafeMaxScrollHeight(targetWindow),
  );

  useEffect(() => {
    if (typeof targetWindow?.matchMedia !== "function") {
      return;
    }

    setMaxScrollHeight(getSafeMaxScrollHeight(targetWindow));
    let mediaQuery: MediaQueryList | undefined;

    // A resolution query only matches the current ratio, so re-register after each change
    const listen = () => {
      mediaQuery?.removeEventListener("change", handleChange);
      mediaQuery = targetWindow.matchMedia(
        `(resolution: ${targetWindow.devicePixelRatio}dppx)`,
      );
      mediaQuery.addEventListener("change", handleChange);
    };

    const handleChange = () => {
      setMaxScrollHeight(getSafeMaxScrollHeight(targetWindow));
      listen();
    };

    listen();
    return () => mediaQuery?.removeEventListener("change", handleChange);
  }, [targetWindow]);

  return maxScrollHeight;
};
