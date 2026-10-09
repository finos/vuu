import fs from "node:fs";
import path from "node:path";

export interface ThemeSourceFile {
  /** path relative to the theme css root, using forward slashes */
  path: string;
  css: string;
  /** number of lines in the physical file that precede this source */
  lineOffset: number;
}

/**
 * Bundled Salt themes (e.g @salt-ds/theme/css/theme-next.css) concatenate
 * source files, prefixing each with a comment of the form
 *    /* css/foundations/alpha.css *\/
 */
const bundleMarker = () => /^\/\* (css\/[^\s*]+\.css) \*\/\s*$/gm;

const importRule = () =>
  /@import\s+(?:url\(\s*["']?([^"')]+)["']?\s*\)|["']([^"']+)["'])[^;]*;/g;

const stripComments = (css: string) =>
  css.replace(/\/\*[\s\S]*?\*\//g, (comment) =>
    // preserve line count, so source positions remain accurate
    comment.replace(/[^\n]/g, " "),
  );

const toPosix = (p: string) => p.split(path.sep).join("/");

const lineOf = (text: string, index: number) =>
  text.slice(0, index).split("\n").length;

const isBundle = (css: string) => bundleMarker().test(css);

const splitBundle = (css: string): ThemeSourceFile[] => {
  const markers = [...css.matchAll(bundleMarker())];
  return markers.map((match, i) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = markers[i + 1]?.index ?? css.length;
    return {
      // drop the leading css/ segment, so paths are relative to the css root
      path: match[1].replace(/^css\//, ""),
      css: css.slice(start, end),
      lineOffset: lineOf(css, start) - 1,
    };
  });
};

/**
 * Load all css sources that make up a theme, starting from an entry file.
 * Supports both a tree of files linked with @import and a single bundled
 * file containing source-path marker comments. Sources are returned in
 * cascade order.
 */
export const loadThemeSources = (entryFile: string): ThemeSourceFile[] => {
  const entry = path.resolve(entryFile);
  const root = path.dirname(entry);
  const css = fs.readFileSync(entry, "utf8");

  if (isBundle(css)) {
    return splitBundle(css);
  }

  const visited = new Set<string>();
  const sources: ThemeSourceFile[] = [];

  const visit = (file: string) => {
    if (visited.has(file)) return;
    visited.add(file);
    const text = fs.readFileSync(file, "utf8");
    const withoutComments = stripComments(text);
    for (const match of withoutComments.matchAll(importRule())) {
      const target = match[1] ?? match[2];
      if (/^(https?:)?\/\//.test(target)) continue;
      const resolved = path.resolve(path.dirname(file), target);
      if (fs.existsSync(resolved)) {
        visit(resolved);
      }
    }
    sources.push({
      path: toPosix(path.relative(root, file)),
      // blank out imports (preserving offsets) so they are not re-parsed
      css: text.replace(importRule(), (rule) => rule.replace(/[^\n]/g, " ")),
      lineOffset: 0,
    });
  };

  visit(entry);
  return sources;
};
