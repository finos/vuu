import fs from "node:fs";
import path from "node:path";
import { loadThemeSources } from "./load-theme-sources.ts";

export interface BuildThemeStylesheetOptions {
  entry: string;
  fallback?: string[];
}

const atRuleBlock = (name: string) =>
  new RegExp(`@${name}\\s*\\{[^{}]*\\}`, "g");

/**
 * Flatten a theme into a single stylesheet, suitable for loading into an
 * isolated (shadow root) context with `CSSStyleSheet.replaceSync`. That
 * excludes `@import` (inlined here) and `@font-face` (not honoured inside
 * shadow roots - fonts must be loaded by the host document).
 *
 * Fallback sources (e.g. the legacy Salt theme.css) are included in full and
 * precede the entry, mirroring the order in which they are loaded by apps.
 */
export const buildThemeStylesheet = ({
  entry,
  fallback = [],
}: BuildThemeStylesheetOptions) => {
  const flatten = (file: string) =>
    loadThemeSources(file)
      .map(({ css, path: sourcePath }) => `/* ${sourcePath} */\n${css}`)
      .join("\n");

  return [...fallback, entry]
    .map((file) => {
      if (!fs.existsSync(file)) {
        throw Error(`[buildThemeStylesheet] file not found ${file}`);
      }
      return `/* ${path.basename(file)} */\n${flatten(file)}`;
    })
    .join("\n")
    .replace(/@import\s+[^;]+;/g, "")
    .replace(atRuleBlock("font-face"), "")
    .replace(/\n\s*\n+/g, "\n");
};
