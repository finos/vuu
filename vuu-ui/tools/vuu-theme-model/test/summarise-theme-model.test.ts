import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildThemeModel } from "../src/build-theme-model.ts";
import { summariseThemeModel } from "../src/summarise-theme-model.ts";

const dirname = path.dirname(fileURLToPath(import.meta.url));

describe("summariseThemeModel", () => {
  const model = buildThemeModel({
    entry: path.join(dirname, "fixtures", "import-theme", "css", "theme-next.css"),
    name: "fixture",
  });
  const summary = summariseThemeModel(model);

  it("counts tokens of the theme proper, by tier", () => {
    const tokens = Object.values(model.tokens).filter(
      (t) => t.layer !== "legacy",
    );
    expect(summary.name).toBe("fixture");
    expect(summary.tokenCount).toBe(tokens.length);
    expect(
      summary.tokensByTier.foundations +
        summary.tokensByTier.palette +
        summary.tokensByTier.characteristics,
    ).toBe(summary.tokenCount);
    expect(summary.tokensByTier.palette).toBeGreaterThan(0);
  });

  it("includes axes and scope count, and is serialisable", () => {
    expect(summary.scopeCount).toBe(model.scopes.length);
    expect(summary.axes).toEqual(
      model.axes.map(({ name, values }) => ({ name, values })),
    );
    expect(JSON.parse(JSON.stringify(summary))).toEqual(summary);
  });
});
