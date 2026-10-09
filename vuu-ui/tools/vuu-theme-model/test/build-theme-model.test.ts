import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildThemeModel } from "../src/build-theme-model.ts";
import { loadThemeSources } from "../src/load-theme-sources.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const fixture = (...segments: string[]) =>
  path.join(dirname, "fixtures", ...segments);

describe("loadThemeSources", () => {
  it("follows @import rules, in cascade order", () => {
    const sources = loadThemeSources(
      fixture("import-theme", "css", "theme-next.css"),
    );
    expect(sources.map((s) => s.path)).toEqual([
      "foundations/size.css",
      "foundations/color.css",
      "next/palette/accent.css",
      "next/characteristics/actionable.css",
      "next/deprecated/palette.css",
      "palette/legacy.css",
      "theme-next.css",
    ]);
  });

  it("splits bundled themes using source marker comments", () => {
    const sources = loadThemeSources(
      fixture("bundle-theme", "css", "theme-next.css"),
    );
    expect(sources.map((s) => [s.path, s.lineOffset])).toEqual([
      ["foundations/size.css", 0],
      ["next/palette/accent.css", 4],
      ["next/deprecated/palette.css", 8],
    ]);
  });
});

describe("buildThemeModel (@import theme)", () => {
  const model = buildThemeModel({
    entry: fixture("import-theme", "css", "theme-next.css"),
    name: "fixture",
  });

  it("includes only shared foundations and next tiers", () => {
    expect(Object.keys(model.tokens).sort()).toEqual([
      "--salt-actionable-bold-background",
      "--salt-actionable-bold-background-hover",
      "--salt-actionable-cursor-hover",
      "--salt-color-blue-500",
      "--salt-color-blue-500-rgb",
      "--salt-color-teal-500",
      "--salt-palette-accent",
      "--salt-size-base",
    ]);
    expect(model.groups.foundations.map((g) => g.file)).toEqual([
      "foundations/size.css",
      "foundations/color.css",
    ]);
    expect(model.groups.palette.map((g) => g.name)).toEqual(["accent"]);
    expect(model.groups.characteristics.map((g) => g.name)).toEqual([
      "actionable",
    ]);
  });

  it("derives axes from scopes", () => {
    expect(model.axes).toEqual([
      {
        name: "density",
        source: ".salt-density-*",
        values: ["high", "medium"],
      },
      { name: "mode", source: "data-mode", values: ["light", "dark"] },
      { name: "accent", source: "data-accent", values: ["blue", "teal"] },
    ]);
  });

  it("records a value per scope, for each selector in a list", () => {
    const accent = model.tokens["--salt-palette-accent"];
    expect(accent.values.map((v) => [v.scopeId, v.raw])).toEqual([
      [".salt-theme.salt-theme-next[mode=light]", "var(--salt-color-blue-500)"],
      [
        ".salt-theme.salt-theme-next[accent=blue][mode=dark]",
        "var(--salt-color-blue-500)",
      ],
      [
        ".salt-theme.salt-theme-next[accent=teal][mode=dark]",
        "var(--salt-color-teal-500)",
      ],
    ]);
    expect(accent.values[2].location).toEqual({
      file: "next/palette/accent.css",
      line: 7,
      column: 3,
    });
  });

  it("builds the reference graph in both directions", () => {
    const accent = model.tokens["--salt-palette-accent"];
    expect(accent.references).toEqual([
      "--salt-color-blue-500",
      "--salt-color-teal-500",
    ]);
    expect(accent.referencedBy).toEqual(["--salt-actionable-bold-background"]);
    expect(model.tokens["--salt-color-blue-500"].referencedBy).toEqual([
      "--salt-palette-accent",
    ]);
  });

  it("assigns categories, inheriting through aliases", () => {
    const category = (name: string) => model.tokens[name].category;
    expect(category("--salt-color-blue-500-rgb")).toBe("color-channels");
    expect(category("--salt-color-blue-500")).toBe("color");
    expect(category("--salt-palette-accent")).toBe("color");
    expect(category("--salt-actionable-bold-background")).toBe("color");
    expect(category("--salt-actionable-cursor-hover")).toBe("cursor");
    expect(category("--salt-size-base")).toBe("dimension");
  });

  it("applies the cascade within a scope and reports overrides", () => {
    const cursor = model.tokens["--salt-actionable-cursor-hover"];
    expect(cursor.values.map((v) => [v.scopeId, v.raw])).toEqual([
      [".salt-theme.salt-theme-next", "grab"],
      [
        "@media (prefers-reduced-motion) .salt-theme.salt-theme-next",
        "default",
      ],
    ]);
    expect(
      model.diagnostics.filter((d) => d.type === "overridden-in-scope"),
    ).toHaveLength(1);
  });

  it("reports unresolved references", () => {
    expect(
      model.diagnostics.filter((d) => d.type === "unresolved-reference"),
    ).toEqual([
      expect.objectContaining({
        token: "--salt-actionable-bold-background-hover",
        message: expect.stringContaining("--salt-palette-missing"),
      }),
    ]);
  });
});

describe("buildThemeModel (bundled theme with legacy fallback)", () => {
  const entry = fixture("bundle-theme", "css", "theme-next.css");

  it("reports references only declared in legacy, without fallback", () => {
    const model = buildThemeModel({ entry });
    expect(model.name).toBe("theme-next");
    expect(Object.keys(model.tokens)).toEqual([
      "--salt-size-base",
      "--salt-palette-accent",
    ]);
    expect(model.diagnostics).toHaveLength(1);
  });

  it("resolves references transitively from fallback sources", () => {
    const model = buildThemeModel({
      entry,
      fallback: [fixture("bundle-theme", "css", "theme.css")],
    });
    expect(model.diagnostics).toEqual([]);
    expect(Object.keys(model.tokens)).toEqual([
      "--salt-size-base",
      "--salt-palette-accent",
      "--salt-color-blue-500",
      "--salt-color-blue-500-rgb",
    ]);
    const blue = model.tokens["--salt-color-blue-500"];
    expect(blue.layer).toBe("legacy");
    expect(blue.tier).toBe("foundations");
    expect(blue.category).toBe("color");
    expect(blue.values[0].location).toEqual({
      file: "legacy/foundations/color.css",
      line: 3,
      column: 3,
    });
  });
});
