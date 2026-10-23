import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { ChromeMode } from "../chrome/chrome-settings";
import {
  DENSITIES,
  THEME_OPTIONS,
  type ThemeMode,
} from "../example/preview-state";
import { useShowcaseContext } from "../ShowcaseProvider";
import { DOCS_ID, THEME_PATH } from "../tree-nav/nav-tree";
import type { PaletteCommand } from "./palette-model";

const capitalise = (text: string) => text[0].toUpperCase() + text.slice(1);
const MODES: ThemeMode[] = ["light", "dark"];

export const usePaletteCommands = (
  chromeMode: ChromeMode,
  onToggleChromeMode: () => void,
) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { preview, setPreview } = useShowcaseContext();

  return useMemo<PaletteCommand[]>(() => {
    const current = (selected: boolean) => (selected ? "Current" : undefined);
    const nextChromeMode = chromeMode === "light" ? "dark" : "light";
    return [
      {
        icon: chromeMode === "light" ? "moon" : "sun",
        id: "chrome-mode",
        keywords: "appearance chrome mode toggle light dark",
        run: onToggleChromeMode,
        subtitle: "Showcase appearance, independent of the preview",
        title: `Switch to ${nextChromeMode} appearance`,
      },
      ...THEME_OPTIONS.map<PaletteCommand>(({ label, value }) => ({
        icon: "theme",
        id: `preview-theme-${value}`,
        keywords: "preview theme",
        run: () => setPreview({ theme: value }),
        subtitle: current(preview.theme === value),
        title: `Preview theme: ${label}`,
      })),
      ...MODES.map<PaletteCommand>((mode) => ({
        icon: mode === "light" ? "sun" : "moon",
        id: `preview-mode-${mode}`,
        keywords: "preview mode appearance",
        run: () => setPreview({ mode }),
        subtitle: current(preview.mode === mode),
        title: `Preview mode: ${capitalise(mode)}`,
      })),
      ...DENSITIES.map<PaletteCommand>((density) => ({
        icon: "selector",
        id: `preview-density-${density}`,
        keywords: "preview density size",
        run: () => setPreview({ density }),
        subtitle: current(preview.density === density),
        title: `Preview density: ${capitalise(density)}`,
      })),
      {
        icon: "examples",
        id: "go-home",
        keywords: "home start examples",
        run: () => navigate("/"),
        title: "Go to Home",
      },
      {
        icon: "docs",
        id: "go-docs",
        keywords: "documentation guides",
        run: () => navigate(`/${DOCS_ID}`),
        title: "Go to Docs",
      },
      {
        icon: "theme",
        id: "go-theme",
        keywords: "theme tokens salt foundations palette characteristics",
        run: () => navigate(THEME_PATH),
        title: "Open Theme Browser",
      },
      {
        icon: "link",
        id: "copy-link",
        keywords: "share url copy",
        run: () => navigator.clipboard?.writeText(window.location.href),
        subtitle: pathname === "/" ? undefined : pathname,
        title: "Copy link to this page",
      },
    ];
  }, [chromeMode, navigate, onToggleChromeMode, pathname, preview, setPreview]);
};
