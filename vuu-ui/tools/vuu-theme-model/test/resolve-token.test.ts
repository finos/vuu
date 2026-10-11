import { describe, expect, it } from "vitest";
import { resolveTokenValue } from "../src/resolve-token.ts";
import type {
  ThemeModel,
  ThemeScope,
  ThemeToken,
} from "../src/theme-model-types.ts";
import { buildTokenSearchIndex } from "../src/token-search-index.ts";

const scope = (
  id: string,
  conditions: Record<string, string> = {},
  classes = ["salt-theme"],
): ThemeScope => ({ classes, conditions, id, selector: id });

const token = (name: string, ...values: [string, string][]): ThemeToken => ({
  category: "color",
  group: "test",
  layer: "next",
  name,
  prefix: "salt",
  referencedBy: [],
  references: [],
  segments: name.slice(7).split("-"),
  tier: "palette",
  values: values.map(([scopeId, raw]) => ({
    kind: raw.startsWith("var(") && raw.endsWith(")") ? "reference" : "color",
    location: { column: 1, file: "test.css", line: 1 },
    raw,
    references: [...raw.matchAll(/var\((--[\w-]+)/g)].map((m) => m[1]),
    scopeId,
  })),
});

const tokens = [
  token("--salt-white", ["root", "255, 255, 255"]),
  token("--salt-black", ["root", "0, 0, 0"]),
  token(
    "--salt-surface",
    ["light", "rgb(var(--salt-white))"],
    ["dark", "rgb(var(--salt-black))"],
  ),
  token("--salt-alias", ["root", "var(--salt-surface)"]),
  token("--salt-fallback", ["root", "var(--salt-missing, var(--salt-white))"]),
  token("--salt-broken", ["root", "var(--salt-missing)"]),
  token("--salt-specific", ["root", "1px"], ["specificRoot", "2px"]),
];

const model: ThemeModel = {
  axes: [{ name: "mode", source: "data-mode", values: ["light", "dark"] }],
  diagnostics: [],
  entry: "theme.css",
  groups: { characteristics: [], foundations: [], palette: [] },
  name: "test",
  schemaVersion: 1,
  scopes: [
    scope("specificRoot", {}, ["salt-theme", "salt-theme-next"]),
    scope("root"),
    scope("light", { mode: "light" }),
    scope("dark", { mode: "dark" }),
  ],
  tokens: Object.fromEntries(tokens.map((t) => [t.name, t])),
};

describe("resolveTokenValue", () => {
  it("substitutes references within a value, by mode", () => {
    expect(resolveTokenValue(model, "--salt-surface", { mode: "light" })).toBe(
      "rgb(255, 255, 255)",
    );
    expect(resolveTokenValue(model, "--salt-alias", { mode: "dark" })).toBe(
      "rgb(0, 0, 0)",
    );
  });

  it("uses a var() fallback when the reference is not declared", () => {
    expect(resolveTokenValue(model, "--salt-fallback", {})).toBe(
      "255, 255, 255",
    );
  });

  it("is undefined when a reference cannot be resolved", () => {
    expect(resolveTokenValue(model, "--salt-broken", {})).toBeUndefined();
    expect(resolveTokenValue(model, "--salt-surface", {})).toBeUndefined();
  });

  it("prefers the value from the more specific selector", () => {
    expect(resolveTokenValue(model, "--salt-specific", {})).toBe("2px");
  });
});

describe("buildTokenSearchIndex", () => {
  it("records aliases and light/dark values, omitting an unchanged dark", () => {
    const index = buildTokenSearchIndex(model);
    expect(index.find((t) => t.name === "--salt-alias")).toEqual({
      alias: "--salt-surface",
      category: "color",
      dark: "rgb(0, 0, 0)",
      group: "test",
      light: "rgb(255, 255, 255)",
      name: "--salt-alias",
      tier: "palette",
    });
    expect(index.find((t) => t.name === "--salt-white")?.dark).toBeUndefined();
  });
});
