import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildThemeStylesheet } from "../src/build-theme-stylesheet.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (...segments: string[]) =>
  path.join(dirname, "fixtures", ...segments);

describe("buildThemeStylesheet", () => {
  it("inlines an @import tree, leaving no @import rules", () => {
    const css = buildThemeStylesheet({
      entry: fixture("import-theme", "css", "theme-next.css"),
    });
    expect(css).not.toMatch(/@import/);
    expect(css).not.toMatch(/@font-face/);
    const sizeIndex = css.indexOf("/* foundations/size.css */");
    const actionableIndex = css.indexOf(
      "/* next/characteristics/actionable.css */",
    );
    expect(sizeIndex).toBeGreaterThan(-1);
    expect(actionableIndex).toBeGreaterThan(sizeIndex);
  });

  it("places fallback sources before the entry", () => {
    const css = buildThemeStylesheet({
      entry: fixture("bundle-theme", "css", "theme-next.css"),
      fallback: [fixture("bundle-theme", "css", "theme.css")],
    });
    const fallbackIndex = css.indexOf("/* theme.css */");
    const entryIndex = css.indexOf("/* theme-next.css */");
    expect(fallbackIndex).toBeGreaterThan(-1);
    expect(entryIndex).toBeGreaterThan(fallbackIndex);
    expect(css).not.toMatch(/@font-face/);
  });

  it("throws for a missing file", () => {
    expect(() =>
      buildThemeStylesheet({ entry: fixture("missing", "theme.css") }),
    ).toThrow(/file not found/);
  });
});
