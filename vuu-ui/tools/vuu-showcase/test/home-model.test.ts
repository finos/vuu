import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  createPageIndex,
  getHomeStats,
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
    childNodes: [
      example("Filters/X", "X"),
      example("Filters/Y", "Y"),
    ],
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
