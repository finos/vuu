import { useCallback, useEffect, useState } from "react";

export type ChromeMode = "light" | "dark";

export const CHROME_MODE_STORAGE_KEY = "vuu-showcase.chromeMode";
export const NAV_WIDTH_STORAGE_KEY = "vuu-showcase.navWidth";

export const NAV_WIDTH_DEFAULT = 264;
export const NAV_WIDTH_MIN = 220;
export const NAV_WIDTH_MAX = 420;

const readStorage = (key: string): string | null => {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: string) => {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // storage unavailable (e.g. privacy mode), the setting is not persisted
  }
};

const systemPrefersDark = () =>
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-color-scheme: dark)").matches;

export const getInitialChromeMode = (): ChromeMode => {
  const stored = readStorage(CHROME_MODE_STORAGE_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }
  return systemPrefersDark() ? "dark" : "light";
};

/**
 * Light/dark mode of the showcase chrome. Defaults to the OS colour scheme,
 * an explicit choice is persisted. Independent of the preview theme mode.
 */
export const useChromeMode = () => {
  const [chromeMode, setChromeMode] = useState<ChromeMode>(getInitialChromeMode);

  useEffect(() => {
    if (
      readStorage(CHROME_MODE_STORAGE_KEY) !== null ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    // follow the OS until the user makes an explicit choice
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (evt: MediaQueryListEvent) => {
      if (readStorage(CHROME_MODE_STORAGE_KEY) === null) {
        setChromeMode(evt.matches ? "dark" : "light");
      }
    };
    query.addEventListener("change", handleChange);
    return () => query.removeEventListener("change", handleChange);
  }, []);

  const toggleChromeMode = useCallback(() => {
    setChromeMode((mode) => {
      const nextMode = mode === "light" ? "dark" : "light";
      writeStorage(CHROME_MODE_STORAGE_KEY, nextMode);
      return nextMode;
    });
  }, []);

  return { chromeMode, toggleChromeMode };
};

export const clampNavWidth = (width: number) =>
  Math.round(Math.min(NAV_WIDTH_MAX, Math.max(NAV_WIDTH_MIN, width)));

export const getStoredNavWidth = () => {
  const stored = parseInt(readStorage(NAV_WIDTH_STORAGE_KEY) ?? "", 10);
  return isNaN(stored) ? NAV_WIDTH_DEFAULT : clampNavWidth(stored);
};

export const storeNavWidth = (width: number) =>
  writeStorage(NAV_WIDTH_STORAGE_KEY, `${clampNavWidth(width)}`);
