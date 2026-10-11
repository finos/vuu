import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  createPageIndex,
  getAreas,
  getHomeStats,
  getStartHereCards,
  resolveRecent,
} from "../src/showcase-main/home/home-model";
import type { NavNodeData } from "../src/showcase-main/tree-nav/nav-tree";

const example = (id: string, label: string, live = false) => ({
  id,
  label,
  nodeData: { componentName: label, live },
});

const source: TreeSourceNode<NavNodeData>[] = [
  {
    id: "Docs",
    label: "Docs",
    childNodes: [
      {
        id: "Docs/Table",
        label: "Table",
        childNodes: [
          { id: "Docs/Table/GettingStarted", label: "Getting started" },
          { id: "Docs/Table/Styling", label: "Styling" },
          { id: "Docs/Table/Api", label: "API reference" },
        ],
      },
      { id: "Docs/Diagrams", label: "Diagrams" },
    ],
  },
  example("1.ApplicationFeatures", "Application features"),
  {
    id: "Layout",
    label: "Layout",
    nodeData: { count: 2, live: false },
    childNodes: [example("Layout/A", "A"), example("Layout/B", "B")],
  },
  {
    id: "Table",
    label: "Table",
    nodeData: { count: 5, live: true },
    childNodes: [
      {
        id: "Table/Misc",
        label: "Misc",
        nodeData: { count: 2, live: true },
        childNodes: [
          example("Table/Misc/One", "One", true),
          example("Table/Misc/Two", "Two"),
        ],
      },
      example("Table/Three", "Three", true),
      example("Table/Four", "Four"),
      example("Table/Five", "Five"),
    ],
  },
  {
    id: "Filters",
    label: "Filters",
    nodeData: { count: 2, live: false },
    childNodes: [example("Filters/X", "X"), example("Filters/Y", "Y")],
  },
];

describe("home-model", () => {
  it("computes the hero stats", () => {
    expect(getHomeStats(source)).toEqual({
      docChapters: 3,
      docGuides: 1,
      examples: 10,
      liveExamples: 2,
    });
  });

  it("lists areas largest first, then by label, with samples", () => {
    const areas = getAreas(source);
    expect(areas.map(({ id }) => id)).toEqual(["Table", "Filters", "Layout"]);
    expect(areas[0]).toMatchObject({
      count: 5,
      liveCount: 2,
      path: "/Table",
    });
    expect(areas[0].samples.map(({ path }) => path)).toEqual([
      "/Table/Misc/One",
      "/Table/Misc/Two",
      "/Table/Three",
    ]);
  });

  it("resolves start here entries, dropping missing routes", () => {
    const cards = getStartHereCards(
      [
        { kind: "guide", path: "/Docs/Table" },
        { kind: "theme" },
        { kind: "page", path: "/Missing", description: "gone" },
        {
          kind: "page",
          path: "/1.ApplicationFeatures",
          description: "What a Vuu app can do",
        },
      ],
      source,
      { name: "vuu-theme", tokenCount: 934 },
    );
    expect(cards).toEqual([
      {
        art: "guide",
        description: "3 chapters · Getting started → API reference",
        path: "/Docs/Table",
        title: "Table guide",
      },
      {
        art: "theme",
        description: "vuu-theme · 934 tokens in 3 tiers",
        path: "/Theme",
        title: "Theme Browser",
      },
      {
        art: "page",
        description: "What a Vuu app can do",
        path: "/1.ApplicationFeatures",
        title: "Application features",
      },
    ]);
  });

  it("describes the theme without a summary", () => {
    const [card] = getStartHereCards([{ kind: "theme" }], source);
    expect(card.description).toBe("Foundations, palette and characteristics");
  });

  it("indexes pages with their ancestor trail", () => {
    const index = createPageIndex(source);
    expect(index.get("/Table/Misc/One")).toEqual({
      label: "One",
      live: true,
      path: "/Table/Misc/One",
      trail: ["Table", "Misc"],
    });
    expect(index.get("/Layout")?.trail).toEqual([]);
  });

  it("resolves recent paths, dropping unknown ones", () => {
    const index = createPageIndex(source);
    expect(
      resolveRecent(["/Layout/B", "/Nope", "/Table/Four"], index).map(
        ({ label }) => label,
      ),
    ).toEqual(["B", "Four"]);
  });
});
