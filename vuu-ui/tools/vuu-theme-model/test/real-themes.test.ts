import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildThemeModel } from "../src/build-theme-model.ts";
import { THEME_TIERS } from "../src/theme-model-types.ts";

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

describe.each([
  {
    name: "vuu-theme",
    entry: "packages/vuu-theme/css/theme-next.css",
    fallback: [],
  },
  {
    name: "salt-theme",
    entry: "node_modules/@salt-ds/theme/css/theme-next.css",
    fallback: ["node_modules/@salt-ds/theme/css/theme.css"],
  },
])("$name", ({ entry, fallback }) => {
  const model = buildThemeModel({
    entry: path.join(root, entry),
    fallback: fallback.map((f) => path.join(root, f)),
  });
  const tokens = Object.values(model.tokens);

  it("populates every tier", () => {
    for (const tier of THEME_TIERS) {
      expect(model.groups[tier].length).toBeGreaterThan(0);
      expect(tokens.filter((t) => t.tier === tier).length).toBeGreaterThan(100);
    }
  });

  it("excludes deprecated sources", () => {
    expect(
      tokens.some((t) =>
        t.values.some((v) => /deprecated/.test(v.location.file)),
      ),
    ).toBe(false);
  });

  it("finds mode and density axes", () => {
    const axis = (name: string) =>
      model.axes.find((a) => a.name === name)?.values;
    expect(axis("mode")).toEqual(["light", "dark"]);
    expect(axis("density")).toEqual(["touch", "low", "medium", "high"]);
  });

  it("has no complex selectors or parse errors", () => {
    expect(
      model.diagnostics.filter(
        (d) => d.type === "complex-selector" || d.type === "parse-error",
      ),
    ).toEqual([]);
  });
});
