import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  createPageIndex,
  getHomeStats,
  getRecentlyAdded,
  resolveRecent,
} from "../src/showcase-main/home/home-model";
import type { NavNodeData } from "../src/showcase-main/tree-nav/nav-tree";

const example = (id: string, label: string, live = false, added?: string) => ({
  id,
  label,
  nodeData: { added, componentName: label, live },
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
          example("Table/Misc/Two", "Two", false, "2026-10-01"),
        ],
      },
      example("Table/Three", "Three", true, "2026-10-08"),
      example("Table/Four", "Four"),
      example("Table/Five", "Five", false, "2026-09-01"),
    ],
  },
  {
    id: "Filters",
    label: "Filters",
    nodeData: { count: 2, live: false },
    childNodes: [
      example("Filters/X", "X", false, "2026-10-08"),
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

  it("lists the most recently added examples, newest first", () => {
    expect(getRecentlyAdded(source, 3)).toEqual([
      {
        added: "2026-10-08",
        label: "Three",
        live: true,
        path: "/Table/Three",
        trail: ["Table"],
      },
      {
        added: "2026-10-08",
        label: "X",
        live: false,
        path: "/Filters/X",
        trail: ["Filters"],
      },
      {
        added: "2026-10-01",
        label: "Two",
        live: false,
        path: "/Table/Misc/Two",
        trail: ["Table", "Misc"],
      },
    ]);
    expect(getRecentlyAdded(source, 10)).toHaveLength(4);
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
