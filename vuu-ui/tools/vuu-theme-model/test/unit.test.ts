import { describe, expect, it } from "vitest";
import { analyseValue } from "../src/analyse-value.ts";
import { classifyThemeFile } from "../src/classify-theme-file.ts";
import { parseScope } from "../src/parse-scope.ts";

describe("classifyThemeFile", () => {
  it.each([
    [
      "foundations/size.css",
      { tier: "foundations", layer: "shared", group: "size" },
    ],
    [
      "next/foundations/color.css",
      { tier: "foundations", layer: "next", group: "color" },
    ],
    [
      "next/palette/accent.css",
      { tier: "palette", layer: "next", group: "accent" },
    ],
    [
      "next/characteristics/actionable.css",
      { tier: "characteristics", layer: "next", group: "actionable" },
    ],
  ])("classifies %s", (file, expected) => {
    expect(classifyThemeFile(file)).toEqual(expected);
  });

  it.each([
    "palette/accent.css",
    "characteristics/actionable.css",
    "legacy/palette/accent.css",
    "legacy/foundations/color.css",
    "next/deprecated/palette.css",
    "deprecated/foundations.css",
    "components/button.css",
    "global.css",
    "theme-next.css",
  ])("excludes %s", (file) => {
    expect(classifyThemeFile(file)).toBeUndefined();
  });

  it("admits legacy files, when allowed", () => {
    expect(
      classifyThemeFile("legacy/palette/accent.css", { allowLegacy: true }),
    ).toEqual({ tier: "palette", layer: "legacy", group: "accent" });
    expect(
      classifyThemeFile("next/deprecated/palette.css", { allowLegacy: true }),
    ).toBeUndefined();
  });
});

describe("parseScope", () => {
  it("maps data attributes to axes, regardless of quoting", () => {
    const quoted = parseScope(
      '.salt-theme.salt-theme-next[data-mode="dark"][data-accent="teal"]',
    );
    const unquoted = parseScope(
      ".salt-theme-next.salt-theme[data-accent=teal][data-mode=dark]",
    );
    expect(quoted.conditions).toEqual({ mode: "dark", accent: "teal" });
    expect(quoted.classes).toEqual(["salt-theme", "salt-theme-next"]);
    expect(quoted.id).toBe(unquoted.id);
    expect(quoted.complex).toBeUndefined();
  });

  it("maps density classes to the density axis", () => {
    const axisSources = new Map<string, string>();
    const scope = parseScope(".salt-density-high", [], axisSources);
    expect(scope.conditions).toEqual({ density: "high" });
    expect(scope.classes).toEqual([]);
    expect(axisSources.get("density")).toBe(".salt-density-*");
  });

  it("flags complex selectors", () => {
    expect(parseScope(".salt-theme .child").complex).toBe(true);
    expect(parseScope(".salt-theme:hover").complex).toBe(true);
  });

  it("includes at-rules in scope id", () => {
    const scope = parseScope(".salt-theme", ["media (min-width:600px)"]);
    expect(scope.id).toBe("@media (min-width:600px) .salt-theme");
    expect(scope.atRules).toEqual(["media (min-width:600px)"]);
  });
});

describe("analyseValue", () => {
  it.each([
    ["var(--salt-color-blue-500)", "reference", ["--salt-color-blue-500"]],
    [
      "rgb(var(--salt-color-blue-500-rgb))",
      "color",
      ["--salt-color-blue-500-rgb"],
    ],
    ["rgba(243, 120, 128, .2)", "color", []],
    ["#00838f", "color", []],
    ["transparent", "color", []],
    ["255, 255, 255", "color-channels", []],
    ["28px", "dimension", []],
    ["300", "number", []],
    ["100%", "percentage", []],
    ['"Nunito Sans"', "string", []],
    ["pointer", "keyword", []],
    ["calc(var(--salt-size-base) / 2)", "calc", ["--salt-size-base"]],
    ["0 1px 3px 0 rgba(0, 0, 0, 0.1)", "composite", []],
    ["var(--a) var(--b) var(--a)", "composite", ["--a", "--b"]],
    ["var(--missing, red)", "reference", ["--missing"]],
  ])("%s => %s", (raw, kind, references) => {
    expect(analyseValue(raw)).toEqual({ kind, references });
  });
});
