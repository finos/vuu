import { describe, expect, it } from "vitest";
import {
  applyValues,
  buildAnatomy,
  formatAnatomy,
  parseVarReference,
  type RawCapture,
  specificity,
  tierOf,
} from "../scripts/anatomy/build-anatomy";
import type {
  AnatomyRef,
  ChainStep,
  ComponentAnatomyModel,
} from "../src/showcase-main/docs/anatomy/anatomy-types";
import {
  clipRect,
  displaySelector,
  elementAt,
  groupRefs,
  instanceForNode,
  nodeLabel,
  visibleSteps,
} from "../src/showcase-main/docs/anatomy/anatomy-view-model";

const themeTiers: Record<string, "characteristics" | "foundations"> = {
  "--salt-accent": "characteristics",
  "--salt-color-x": "foundations",
};

/**
 * html.theme > div.vuuThing > (div.vuuThingRow, div.vuuThingRow.vuuThingRow-even)
 */
const capture: RawCapture = {
  rootIndex: 1,
  size: [100, 50],
  rules: [
    {
      order: 0,
      decls: [
        ["--salt-color-x", "rgb(1, 2, 3)"],
        ["--salt-accent", "var(--salt-color-x)"],
      ],
    },
    {
      order: 1,
      decls: [
        ["--thing-bg", "var(--vuuThing-background, var(--salt-accent))"],
        ["background", "var(--thing-bg)"],
      ],
    },
    { order: 2, decls: [["padding", "var(--vuuThing-padding, 4px)"]] },
    { order: 3, decls: [["background", "var(--salt-color-x)"]] },
    { order: 4, decls: [["color", "var(--salt-accent)"]] },
    { order: 5, decls: [["--row-x", "1px"]] },
    { order: 6, decls: [["color", "var(--salt-color-x)"]] },
  ],
  elements: [
    {
      context: true,
      parent: -1,
      tag: "html",
      classes: ["theme"],
      matches: [{ rule: 0, selector: ".theme", states: [] }],
    },
    {
      parent: 0,
      tag: "div",
      classes: ["vuuThing"],
      rect: [0, 0, 100, 50],
      matches: [
        { rule: 1, selector: ".vuuThing", states: [] },
        { rule: 2, selector: ".theme .vuuThing", states: [] },
        { rule: 3, selector: "div", states: [] },
      ],
      computed: { background: "rgb(1, 2, 3)", padding: "4px" },
    },
    {
      parent: 1,
      tag: "div",
      classes: ["vuuThingRow"],
      rect: [0, 0, 100, 10],
      matches: [
        { rule: 4, selector: ".vuuThingRow", states: [] },
        { rule: 6, selector: ".vuuThingRow:hover", states: ["hover"] },
      ],
    },
    {
      parent: 1,
      tag: "div",
      classes: ["vuuThingRow", "vuuThingRow-even"],
      preferred: true,
      rect: [0, 10, 100, 80],
      matches: [
        { rule: 4, selector: ".vuuThingRow", states: [] },
        { rule: 5, selector: ".vuuThingRow-even", states: [] },
        { rule: 6, selector: ".vuuThingRow:hover", states: ["hover"] },
      ],
    },
  ],
};

const build = () =>
  buildAnatomy(capture, {
    component: "Thing",
    example: "/Thing/Example",
    theme: "test-theme",
    mode: "light",
    density: "high",
    themeTier: (name) => themeTiers[name],
  });

const refOf = (refs: AnatomyRef[], property: string, selector?: string) =>
  refs.find(
    (r) => r.property === property && (!selector || r.selector === selector),
  );

const names = (chain: ChainStep[]) =>
  chain.map((step) => (step.kind === "var" ? step.name : step.value));

describe("specificity", () => {
  it("counts ids, classes and types", () => {
    expect(specificity(".a .b:hover")).toEqual([0, 3, 0]);
    expect(specificity("div::before")).toEqual([0, 0, 2]);
    expect(specificity("#x .y[aria-selected='true']")).toEqual([1, 2, 0]);
  });
  it("uses the most specific argument of :is and ignores :where", () => {
    expect(specificity(":is(#x, .y) div")).toEqual([1, 0, 1]);
    expect(specificity(":where(.a .b) .c")).toEqual([0, 1, 0]);
  });
});

describe("parseVarReference", () => {
  it("parses a reference with a nested fallback", () => {
    expect(parseVarReference("var(--a, var(--b, 1px))")).toEqual({
      name: "--a",
      fallback: "var(--b, 1px)",
    });
    expect(parseVarReference(" var(--a) ")).toEqual({
      name: "--a",
      fallback: undefined,
    });
  });
  it("is undefined unless the whole value is a reference", () => {
    expect(parseVarReference("1px solid var(--a)")).toBeUndefined();
    expect(parseVarReference("var(--a) var(--b)")).toBeUndefined();
  });
});

describe("tierOf", () => {
  const none = () => undefined;
  it("identifies API variables", () => {
    expect(tierOf("--vuuTable-background", none)).toBe("api");
    expect(tierOf("--VuuTableRow-fontSize", none)).toBe("api");
    expect(tierOf("--saltButton-padding", none)).toBe("api");
  });
  it("uses the theme, then falls back to other or internal", () => {
    expect(tierOf("--salt-accent", (n) => themeTiers[n])).toBe(
      "characteristics",
    );
    expect(tierOf("--salt-unknown", none)).toBe("other");
    expect(tierOf("--row-height", none)).toBe("internal");
  });
});

describe("buildAnatomy", () => {
  it("groups repeated elements into one node", () => {
    const { model } = build();
    expect(model.nodes).toHaveLength(2);
    const [root, row] = model.nodes;
    expect(root).toMatchObject({ id: 0, parent: null, depth: 0, total: 1 });
    expect(row).toMatchObject({
      parent: 0,
      depth: 1,
      classes: ["vuuThingRow"],
      variantClasses: ["vuuThingRow-even"],
      count: 2,
      total: 2,
    });
    // the preferred instance first
    expect(row.instances).toEqual([2, 1]);
    expect(model.elements.map((e) => e.parent)).toEqual([null, 0, 0]);
  });

  it("follows a chain through API variables, fallbacks and the theme", () => {
    const { model } = build();
    const background = refOf(model.nodes[0].refs, "background", ".vuuThing");
    expect(names(background?.chain ?? [])).toEqual([
      "--thing-bg",
      "--vuuThing-background",
      "--salt-accent",
      "--salt-color-x",
      "rgb(1, 2, 3)",
    ]);
    expect(background?.chain[1]).toMatchObject({ tier: "api", set: false });
    expect(background?.chain[2]).toMatchObject({
      tier: "characteristics",
      set: true,
      source: "theme",
      selector: ".theme",
    });
    expect(background?.value).toBe("rgb(1, 2, 3)");

    const padding = refOf(model.nodes[0].refs, "padding");
    expect(names(padding?.chain ?? [])).toEqual(["--vuuThing-padding", "4px"]);
  });

  it("flags overridden, partial and state declarations", () => {
    const { model } = build();
    expect(refOf(model.nodes[0].refs, "background", "div")?.overridden).toBe(
      true,
    );
    expect(
      refOf(model.nodes[0].refs, "background", ".vuuThing")?.overridden,
    ).toBeUndefined();
    const rowRefs = model.nodes[1].refs;
    expect(refOf(rowRefs, "--row-x")?.instances).toBe(1);
    expect(refOf(rowRefs, "color", ".vuuThingRow")?.instances).toBeUndefined();
    const hover = refOf(rowRefs, "color", ".vuuThingRow:hover");
    expect(hover?.states).toEqual(["hover"]);
    expect(hover?.overridden).toBeUndefined();
  });

  it("applies values read from the page", () => {
    const { model, lookups } = build();
    applyValues(
      lookups,
      lookups.map(({ name }) => `value of ${name}`),
    );
    expect(refOf(model.nodes[1].refs, "--row-x")?.value).toBe(
      "value of --row-x",
    );
    const color = refOf(model.nodes[1].refs, "color", ".vuuThingRow");
    expect(color?.chain[0]).toMatchObject({ value: "value of --salt-accent" });
  });

  it("formats as compact, valid JSON", () => {
    const { model } = build();
    const text = formatAnatomy(model);
    expect(JSON.parse(text)).toEqual(JSON.parse(JSON.stringify(model)));
    expect(text.split("\n").length).toBeLessThan(40);
  });
});

describe("anatomy view model", () => {
  const model = build().model as ComponentAnatomyModel;

  it("labels nodes by their component class", () => {
    expect(
      nodeLabel(
        { ...model.nodes[0], classes: ["vuuMeasuredContainer", "vuuThing"] },
        "Thing",
      ),
    ).toBe("div.vuuThing");
    expect(nodeLabel({ ...model.nodes[0], classes: [] }, "Thing")).toBe("div");
  });

  it("clips rects to the component", () => {
    expect(clipRect([0, 10, 100, 80], [100, 50])).toEqual([0, 10, 100, 40]);
    expect(clipRect([0, 60, 100, 10], [100, 50])[3]).toBe(0);
  });

  it("finds the deepest element at a point", () => {
    expect(elementAt(model, 50, 5)).toBe(1);
    expect(elementAt(model, 50, 30)).toBe(2);
    expect(elementAt(model, 50, 60)).toBeUndefined();
  });

  it("selects the ancestor instance when picking a node from the tree", () => {
    expect(instanceForNode(model, 0, 2)).toBe(0);
    expect(instanceForNode(model, 1, 0)).toBe(2);
  });

  it("drops the rgb channels of foundation colours", () => {
    const steps: ChainStep[] = [
      { kind: "var", name: "--a", tier: "foundations", set: true },
      { kind: "literal", value: "rgb(var(--a-rgb))" },
      { kind: "var", name: "--a-rgb", tier: "foundations", set: true },
      { kind: "literal", value: "1, 2, 3" },
    ];
    expect(visibleSteps(steps)).toEqual(steps.slice(0, 1));
  });

  it("simplifies nested selectors", () => {
    expect(
      displaySelector(
        ':is(:is(:is(.salt-theme.vuu-theme) .vuuTable) .vuuTableRow[aria-selected="true"]) .vuuTableCell:focus',
      ),
    ).toBe('.vuuTable .vuuTableRow[aria-selected="true"] .vuuTableCell:focus');
  });

  it("groups refs into styles, definitions, states and pseudo-elements", () => {
    const ref = (property: string, extra: Partial<AnatomyRef> = {}) => ({
      property,
      selector: ".x",
      declared: "",
      chain: [],
      ...extra,
    });
    const groups = groupRefs([
      ref("color", { pseudoElement: "::before" }),
      ref("color", { states: ["hover"] }),
      ref("--x"),
      ref("color"),
    ]);
    expect(groups.map((g) => g.title)).toEqual([
      "Styles",
      "Defines",
      ":hover",
      "::before",
    ]);
  });
});
