import fs from "fs";
import path from "path";
import { createHighlighter, type Highlighter } from "shiki";
import { resolveWithin } from "./safe-path";

import {
  type HighlightedSource,
  SOURCE_URL_PREFIX,
  sourceUrl,
} from "../src/showcase-main/example/source-url";

export { type HighlightedSource, SOURCE_URL_PREFIX, sourceUrl };

const LIGHT_THEME = "github-light";
const DARK_THEME = "github-dark";

let highlighter: Promise<Highlighter> | undefined;
const getHighlighter = () =>
  (highlighter ??= createHighlighter({
    langs: ["tsx"],
    themes: [LIGHT_THEME, DARK_THEME],
  }));

export const highlightSource = async (
  code: string,
): Promise<HighlightedSource> => {
  const { codeToTokens } = await getHighlighter();
  const { tokens } = codeToTokens(code, {
    defaultColor: false,
    lang: "tsx",
    themes: { dark: DARK_THEME, light: LIGHT_THEME },
  });
  const styles: HighlightedSource["styles"] = [];
  const styleIndex = new Map<string, number>();
  const lines = tokens.map((line) =>
    line.map<[string, number]>(({ content, fontStyle = 0, htmlStyle }) => {
      const style = (htmlStyle ?? {}) as Record<string, string>;
      const light = style["--shiki-light"] ?? "";
      const dark = style["--shiki-dark"] ?? "";
      const key = `${light}|${dark}|${fontStyle}`;
      let index = styleIndex.get(key);
      if (index === undefined) {
        index = styles.push([light, dark, fontStyle]) - 1;
        styleIndex.set(key, index);
      }
      return [content, index];
    }),
  );
  return { lines, styles };
};

const isExampleSource = (relativePath: string) =>
  relativePath.startsWith("src/examples/") &&
  relativePath.endsWith(".examples.tsx") &&
  !relativePath.split("/").includes("..");

/**
 * Resolves a source url path (without prefix and .json suffix) to a file
 * within the showcase examples folder, undefined if it is not an example.
 */
export const resolveSourcePath = (showcaseDir: string, urlPath: string) => {
  const relativePath = path.posix.normalize(decodeURIComponent(urlPath));
  if (isExampleSource(relativePath)) {
    return resolveWithin(showcaseDir, relativePath);
  }
};

/** Writes the highlighted source of every example file to outDir */
export const writeHighlightedSources = async (
  examplePaths: Iterable<string>,
  showcaseDir: string,
  outDir: string,
) => {
  let count = 0;
  for (const examplePath of examplePaths) {
    const filePath = resolveWithin(showcaseDir, examplePath);
    const code = fs.readFileSync(filePath, "utf8");
    const target = resolveWithin(outDir, sourceUrl(examplePath));
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, JSON.stringify(await highlightSource(code)));
    count += 1;
  }
  return count;
};
