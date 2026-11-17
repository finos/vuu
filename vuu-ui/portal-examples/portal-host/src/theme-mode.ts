import type { Mode } from "@salt-ds/core";

const THEME_MODE_KEY = "portal-demo-theme-mode";

export const loadThemeMode = (): Mode => {
  try {
    return localStorage.getItem(THEME_MODE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
};

export const saveThemeMode = (mode: Mode) => {
  try {
    localStorage.setItem(THEME_MODE_KEY, mode);
  } catch {
    // Storage unavailable: the choice lasts for this page only.
  }
};
