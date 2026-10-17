import { describe, expect, it } from "vitest";
import {
  buildComponentModel,
  componentReferences,
  extractComponentDeclarations,
  referencesIn,
} from "../src/build-component-model.ts";

describe("referencesIn", () => {
  it("finds references in var() fallbacks", () => {
    expect(
      referencesIn(
        "var(--saltButton-background, var(--button-background, var(--salt-x)))",
      ),
    ).toEqual(["--saltButton-background", "--button-background", "--salt-x"]);
  });
  it("de-duplicates and ignores values without var()", () => {
    expect(referencesIn("calc(var(--a) + var(--a)) solid red")).toEqual([
      "--a",
    ]);
    expect(referencesIn("1px solid red")).toEqual([]);
  });
});

describe("extractComponentDeclarations", () => {
  const css = `
.saltButton {
  --button-background: var(--salt-actionable-bold-background);
  color: red;
}
.saltButton-primary:hover { background: var(--button-background); }
.saltButtonGroup { gap: var(--salt-spacing-100); }
.saltInput-adornment .saltButton { margin: var(--salt-spacing-50); }
.saltButton, .other { border-color: var(--salt-separable-borderColor); }
`;

  it("includes rules rooted on the classes, or their modifiers", () => {
    const declarations = extractComponentDeclarations({
      css,
      file: "core.css",
      classes: ["saltButton"],
    });
    expect(declarations.map((d) => d.selector)).toEqual([
      ".saltButton",
      ".saltButton-primary:hover",
      ".saltButton, .other",
    ]);
  });

  it("records property, value, references and location", () => {
    const [first] = extractComponentDeclarations({
      css,
      file: "core.css",
      classes: ["saltButton"],
    });
    expect(first).toEqual({
      selector: ".saltButton",
      property: "--button-background",
      value: "var(--salt-actionable-bold-background)",
      references: ["--salt-actionable-bold-background"],
      location: { file: "core.css", line: 3, column: 3 },
    });
  });

  it("includes every rule when no classes are given", () => {
    expect(
      extractComponentDeclarations({ css, file: "core.css" }),
    ).toHaveLength(5);
  });

  it("resolves nesting and records at-rules", () => {
    const declarations = extractComponentDeclarations({
      css: `.vuuTable {
  &.vuuTable-zebra { background: var(--zebra); }
  .vuuTableRow { color: var(--row); }
  @media (hover: hover) { outline-color: var(--focus); }
}`,
      file: "Table.css",
    });
    expect(
      declarations.map(({ selector, atRules, references }) => [
        selector,
        atRules,
        references[0],
      ]),
    ).toEqual([
      [".vuuTable.vuuTable-zebra", undefined, "--zebra"],
      [".vuuTable .vuuTableRow", undefined, "--row"],
      [".vuuTable", ["@media (hover: hover)"], "--focus"],
    ]);
  });

  it("includes rules nested within an included rule", () => {
    const declarations = extractComponentDeclarations({
      css: `.saltCheckbox { .icon { color: var(--x); } }
.other { .saltCheckbox { color: var(--y); } }`,
      file: "core.css",
      classes: ["saltCheckbox"],
    });
    expect(declarations.map((d) => d.references[0])).toEqual(["--x"]);
  });
});

describe("buildComponentModel", () => {
  const files: Record<string, string> = {
    "/repo/packages/table/Table.css": ".vuuTable { color: var(--a); }",
    "/repo/node_modules/@salt-ds/core/css/salt-core.css":
      ".saltButton { color: var(--b); } .saltCheckbox { color: var(--c); }",
  };
  const model = buildComponentModel({
    configDir: "/repo/tools/showcase",
    config: {
      root: "../..",
      libraries: [
        {
          id: "vuu",
          label: "Vuu",
          components: [{ label: "Table", css: ["packages/table/Table.css"] }],
        },
        {
          id: "salt",
          label: "Salt",
          css: ["node_modules/@salt-ds/core/css/salt-core.css"],
          components: [
            { label: "Button", classes: ["saltButton"] },
            { id: "check", label: "Checkbox", classes: ["saltCheckbox"] },
          ],
        },
      ],
    },
    readFile: (file) => files[file],
  });

  it("builds libraries of components with ids and display paths", () => {
    expect(
      model.libraries.map((l) => [
        l.label,
        l.components.map((c) => [c.id, c.library, c.sources[0]]),
      ]),
    ).toEqual([
      ["Vuu", [["vuu-table", "vuu", "packages/table/Table.css"]]],
      [
        "Salt",
        [
          ["salt-button", "salt", "@salt-ds/core/css/salt-core.css"],
          ["check", "salt", "@salt-ds/core/css/salt-core.css"],
        ],
      ],
    ]);
  });

  it("collects the references of each component", () => {
    const [button, checkbox] = model.libraries[1].components;
    expect(componentReferences(button)).toEqual(["--b"]);
    expect(componentReferences(checkbox)).toEqual(["--c"]);
    expect(button.declarations[0].location.file).toBe(
      "@salt-ds/core/css/salt-core.css",
    );
  });
});
