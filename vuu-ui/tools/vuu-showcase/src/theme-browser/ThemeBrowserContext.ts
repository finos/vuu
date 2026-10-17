import type { ThemeModel } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import { createContext, useContext } from "react";
import type { ComponentIndex } from "./component-utils";
import type { Axes, ThemeIndex } from "./model-utils";
import type { ThemeSandbox } from "./ThemeSandbox";

export type ThemeBrowserViewId =
  "tiers" | "characteristic" | "foundations" | "diagnostics";

export interface ThemeBrowserContextProps {
  axes: Axes;
  /** components whose css is matched to the theme, when available */
  components?: ComponentIndex;
  index: ThemeIndex;
  model: ThemeModel;
  sandbox: ThemeSandbox;
  /** computed value of a token, under the current axes unless specified */
  resolve: (name: string, axes?: Axes) => string;
  select: (name: string, view?: ThemeBrowserViewId) => void;
  selected?: string;
  /** a selected component takes precedence over the selected token */
  selectComponent: (id: string) => void;
  selectedComponent?: string;
  setAxes: (axes: Axes) => void;
  setShowComponents: (show: boolean) => void;
  showComponents: boolean;
}

export const ThemeBrowserContext =
  createContext<ThemeBrowserContextProps | null>(null);

export const useThemeBrowser = () => {
  const context = useContext(ThemeBrowserContext);
  if (context === null) {
    throw Error("useThemeBrowser must be used within a ThemeBrowser");
  }
  return context;
};

/**
 * Inline style that paints a region with the subject theme's own surface and
 * text, using resolved values only (nothing from the theme is inherited).
 */
export const useStageStyle = (
  surface = "--salt-container-primary-background",
) => {
  const { resolve } = useThemeBrowser();
  const fontFamily = resolve("--salt-text-fontFamily");
  return {
    background: resolve(surface),
    color: resolve("--salt-content-primary-foreground"),
    fontFamily: fontFamily ? `${fontFamily}, system-ui, sans-serif` : undefined,
  };
};
