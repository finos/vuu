import { createContext, useContext } from "react";
import type { ChromeMode } from "./chrome-settings";

export interface ChromeModeContextValue {
  chromeMode: ChromeMode;
  toggleChromeMode: () => void;
}

/** Chrome light/dark mode, provided by the shell and by standalone docs */
export const ChromeModeContext = createContext<ChromeModeContextValue>({
  chromeMode: "light",
  toggleChromeMode: () => undefined,
});

export const useChromeModeContext = () => useContext(ChromeModeContext);
