/**
 * Example source, highlighted at build time. Tokens rather than html are
 * emitted, so the client renders them as React elements. Each token is
 * [text, styleIndex], styles hold the light and dark colours (the chrome mode
 * selects which is used) and font style flags.
 */
export type HighlightedSource = {
  lines: [string, number][][];
  styles: [light: string, dark: string, fontStyle: number][];
};

/** Url prefix under which highlighted sources are served */
export const SOURCE_URL_PREFIX = "/showcase-source/";

/**
 * Example paths are relative to the showcase folder, e.g
 * ./src/examples/Table/Misc.examples.tsx. The url drops the leading ./
 */
export const sourceUrl = (examplePath: string) =>
  `${SOURCE_URL_PREFIX}${examplePath.replace(/^\.\//, "")}.json`;

export type SourceScope = "example" | "file";

export interface SourceLine {
  /** 1-based line number */
  number: number;
  tokens: [string, number][];
}

/**
 * The lines to display, the whole file, or just the example's lines when a
 * source range is available.
 */
export const getSourceLines = (
  { lines }: HighlightedSource,
  scope: SourceScope,
  sourceRange?: [number, number],
): SourceLine[] => {
  const all = lines.map((tokens, i) => ({ number: i + 1, tokens }));
  if (scope === "example" && sourceRange) {
    const [start, end] = sourceRange;
    return all.slice(start - 1, end);
  }
  return all;
};

export const sourceText = (lines: SourceLine[]) =>
  lines.map(({ tokens }) => tokens.map(([text]) => text).join("")).join("\n");
