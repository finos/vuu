import type { ComponentModel } from "@vuu-ui/vuu-theme-model/src/component-model-types";
import type { ThemeToken } from "@vuu-ui/vuu-theme-model/src/theme-model-types";
import { describe, expect, it } from "vitest";
import {
  ComponentIndex,
  declarationsUsing,
  isApiVariable,
} from "../src/theme-browser/component-utils";

const token = (name: string, tier: ThemeToken["tier"]) =>
  ({ name, tier }) as ThemeToken;

const tokens = new Map(
  [
    token("--salt-actionable-bold-background", "characteristics"),
    token("--salt-palette-accent-background", "palette"),
    token("--salt-color-blue-500", "foundations"),
    token("--salt-size-base", "foundations"),
  ].map((t) => [t.name, t]),
);
const themeIndex = { token: (name: string) => tokens.get(name) };

const declaration = (references: string[]) => ({
  selector: ".x",
  property: "color",
  value: references.map((r) => `var(${r})`).join(" "),
  references,
  location: { file: "x.css", line: 1, column: 1 },
});

const model: ComponentModel = {
  schemaVersion: 1,
  libraries: [
    {
      id: "salt",
      label: "Salt",
      components: [
        {
          id: "salt-button",
          label: "Button",
          library: "salt",
          sources: ["salt-core.css"],
          declarations: [
            declaration([
              "--saltButton-background",
              "--salt-actionable-bold-background",
            ]),
            declaration(["--salt-size-base", "--button-private"]),
            declaration(["--salt-actionable-bold-background"]),
          ],
        },
        {
          id: "salt-checkbox",
          label: "Checkbox",
          library: "salt",
          sources: ["salt-core.css"],
          declarations: [
            declaration([
              "--salt-palette-accent-background",
              "--salt-actionable-bold-background",
            ]),
          ],
        },
      ],
    },
  ],
};

describe("isApiVariable", () => {
  it("recognises component API variables", () => {
    expect(isApiVariable("--saltButton-background")).toBe(true);
    expect(isApiVariable("--vuuTable-height")).toBe(true);
    expect(isApiVariable("--salt-size-base")).toBe(false);
    expect(isApiVariable("--button-private")).toBe(false);
  });
});

describe("ComponentIndex", () => {
  const index = new ComponentIndex(model, themeIndex, [
    "characteristics",
    "palette",
    "foundations",
  ]);

  it("classifies the references of a component", () => {
    const button = index.usage("salt-button");
    expect(button?.tokens.map((t) => t.name)).toEqual([
      "--salt-actionable-bold-background",
      "--salt-size-base",
    ]);
    expect(button?.apiVariables).toEqual(["--saltButton-background"]);
    expect(button?.localVariables).toEqual(["--button-private"]);
  });

  it("orders tokens by tier", () => {
    expect(index.usage("salt-checkbox")?.tokens.map((t) => t.tier)).toEqual([
      "characteristics",
      "palette",
    ]);
  });

  it("maps tokens to the components that reference them", () => {
    expect(
      index
        .componentsUsing("--salt-actionable-bold-background")
        .map((u) => u.component.id),
    ).toEqual(["salt-button", "salt-checkbox"]);
    expect(index.componentsUsing("--salt-color-blue-500")).toEqual([]);
  });

  it("ignores tokens outside the given tiers", () => {
    const characteristicsOnly = new ComponentIndex(model, themeIndex, [
      "characteristics",
    ]);
    expect(
      characteristicsOnly.usage("salt-button")?.tokens.map((t) => t.name),
    ).toEqual(["--salt-actionable-bold-background"]);
    expect(characteristicsOnly.usage("salt-button")?.localVariables).toEqual([
      "--button-private",
    ]);
  });

  it("finds the declarations referencing a variable", () => {
    const button = model.libraries[0].components[0];
    expect(
      declarationsUsing(button, "--salt-actionable-bold-background"),
    ).toHaveLength(2);
  });
});
