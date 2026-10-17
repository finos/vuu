import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it, vi } from "vitest";
import {
  commandItems,
  createIndex,
  docItems,
  exampleItems,
  excerpt,
  searchPalette,
  tokenItems,
} from "../src/showcase-main/command-palette/palette-model";
import type { NavNodeData } from "../src/showcase-main/tree-nav/nav-tree";

const treeSource: TreeSourceNode<NavNodeData>[] = [
  {
    id: "Docs",
    label: "Docs",
    childNodes: [
      { id: "Docs/Table", label: "Table", nodeData: { path: "./x.mdx" } },
    ],
  },
  {
    id: "Table",
    label: "Table",
    childNodes: [
      {
        id: "Table/PinnedColumns",
        label: "Pinned columns",
        nodeData: { componentName: "PinnedColumns", tags: ["Table"] },
      },
      {
        id: "Table/LiveTable",
        label: "Live table",
        nodeData: { componentName: "LiveTable", live: true },
      },
    ],
  },
];

const examples = exampleItems(treeSource);
const docs = docItems([
  {
    anchor: "pinned-columns",
    breadcrumb: ["Docs", "Table"],
    route: "/Docs/Table/Columns",
    text: "Set pin to keep a column visible.",
    title: ["Columns", "Pinned columns"],
  },
]);
const tokens = tokenItems([
  {
    category: "color",
    dark: "rgb(0, 0, 0)",
    group: "accent",
    light: "rgb(255, 255, 255)",
    name: "--salt-accent-background",
    tier: "characteristics",
  },
]);
const run = vi.fn();
const commands = commandItems([
  { icon: "moon", id: "dark", run, title: "Switch to dark appearance" },
]);
const indexes = {
  commands: createIndex(commands),
  docs: createIndex(docs),
  examples: createIndex(examples),
  tokens: createIndex(tokens),
};

describe("palette items", () => {
  it("collects examples, but not docs, with their trail", () => {
    expect(examples.map(({ path, subtitle }) => [path, subtitle])).toEqual([
      ["/Table/PinnedColumns", "Table"],
      ["/Table/LiveTable", "Table"],
    ]);
    expect(examples.map(({ badge }) => badge)).toEqual([
      { label: "Table" },
      { label: "Live", live: true },
    ]);
  });

  it("routes docs to their section anchor and tokens to the theme browser", () => {
    expect(docs[0].path).toBe("/Docs/Table/Columns?anchor=pinned-columns");
    expect(tokens[0].path).toBe("/Theme?token=--salt-accent-background");
    expect(tokens[0].swatches).toEqual(["rgb(255, 255, 255)", "rgb(0, 0, 0)"]);
  });
});

describe("searchPalette", () => {
  it("groups results by scope, with counts for every scope", () => {
    const { counts, groups } = searchPalette(indexes, "pinned");
    expect(counts).toEqual({ commands: 0, docs: 1, examples: 1, tokens: 0 });
    expect(groups.map(({ id }) => id).sort()).toEqual(["docs", "examples"]);
  });

  it("restricts results to the selected scope", () => {
    const { counts, groups } = searchPalette(indexes, "pinned", "docs");
    expect(counts.examples).toBe(1);
    expect(groups.map(({ id }) => id)).toEqual(["docs"]);
  });

  it("finds tokens and commands", () => {
    expect(searchPalette(indexes, "accent").groups[0].id).toBe("tokens");
    expect(searchPalette(indexes, "dark").groups[0].items[0].run).toBe(run);
  });
});

describe("excerpt", () => {
  const text =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua pinned columns stay visible while scrolling horizontally.";

  it("starts at the beginning when the match is near the start", () => {
    expect(excerpt(text, "lorem")).toMatch(/^Lorem ipsum/);
  });

  it("starts near the first match, at a word boundary", () => {
    const result = excerpt(text, "pinned");
    expect(result.startsWith("…")).toBe(true);
    expect(result).toContain("pinned columns");
    expect(result.length).toBeLessThanOrEqual(112);
  });
});
