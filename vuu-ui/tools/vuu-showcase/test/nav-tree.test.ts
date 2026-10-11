import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  buildExamplesIndexNode,
  buildSectionTree,
  COMPONENTS_LABEL,
  countExamples,
  createNavIndex,
  GETTING_STARTED_LABEL,
  type NavNodeData,
  sectionFromPath,
  getNavFrom,
  getNavFromForPath,
  navFromState,
} from "../src/showcase-main/tree-nav/nav-tree";

const treeSource: TreeSourceNode[] = [
  {
    id: "Docs",
    label: "Docs",
    childNodes: [{ id: "Docs/Table", label: "Table" }],
  },
  {
    id: "Table",
    label: "Table",
    childNodes: [
      {
        id: "Table/Misc",
        label: "Misc",
        childNodes: [{ id: "Table/Misc/DefaultTable", label: "DefaultTable" }],
      },
    ],
  },
  { id: "Layout", label: "Layout" },
];

describe("nav-tree", () => {
  const source: TreeSourceNode<NavNodeData>[] = [
    {
      id: "Docs",
      label: "Docs",
      childNodes: [
        {
          id: "Docs/Table",
          label: "Table",
          childNodes: [{ id: "Docs/Table/Intro", label: "Intro" }],
        },
        { id: "Docs/Diagrams", label: "Diagrams" },
      ],
    },
    ...(treeSource.slice(1) as TreeSourceNode<NavNodeData>[]),
    {
      id: "Basket",
      label: "Basket",
      childNodes: [{ id: "Basket/Ticket", keySegment: "T1", label: "Ticket" }],
    },
  ];

  describe("buildSectionTree", () => {
    it("groups examples under Getting started and Components headings", () => {
      const tree = buildSectionTree("examples", source);
      expect(tree.map(({ label }) => label)).toEqual([
        GETTING_STARTED_LABEL,
        COMPONENTS_LABEL,
      ]);
      const [gettingStarted, components] = tree;
      expect(gettingStarted.childNodes?.map(({ id }) => id)).toEqual([
        "Layout",
      ]);
      // folders sorted by label
      expect(components.childNodes?.map(({ id }) => id)).toEqual([
        "Basket",
        "Table",
      ]);
      expect(tree.every((node) => node.expanded)).toBe(true);
      expect(tree.every((node) => node.nodeData?.heading)).toBe(true);
      expect(components.nodeData?.count).toEqual(2);
    });
    it("omits empty headings", () => {
      const tree = buildSectionTree("examples", [source[0], source[1]]);
      expect(tree.map(({ label }) => label)).toEqual([COMPONENTS_LABEL]);
    });
    it("presents the content of Docs, folders expanded", () => {
      const tree = buildSectionTree("docs", source);
      expect(tree.map(({ id }) => id)).toEqual(["Docs/Table", "Docs/Diagrams"]);
      expect(tree[0].expanded).toBe(true);
      expect(tree[1].expanded).toBeUndefined();
    });
    it("presents chapters as pages, numbered chapters without an icon", () => {
      const chapter: TreeSourceNode<NavNodeData> = {
        id: "Docs/Guide/Columns",
        icon: "document",
        label: "Columns",
        nodeData: { order: 2, path: "Docs/Guide/02-Columns.mdx" },
        childNodes: [
          {
            id: "Docs/Guide/Columns/Pinned",
            label: "Pinned",
            nodeData: {
              componentName: "Pinned",
              path: "Docs/Guide/02-Columns.examples.tsx",
            },
          },
        ],
      };
      const [guide] = buildSectionTree("docs", [
        {
          id: "Docs",
          label: "Docs",
          childNodes: [
            { id: "Docs/Guide", label: "Guide", childNodes: [chapter] },
          ],
        },
      ]);
      const [columns] = guide.childNodes ?? [];
      expect(columns.childNodes).toBeUndefined();
      expect(columns.icon).toBeUndefined();
      expect(guide.expanded).toBe(true);
    });
    it("has no tree for the theme section", () => {
      expect(buildSectionTree("theme", source)).toEqual([]);
    });
  });

  describe("createNavIndex", () => {
    const navIndex = createNavIndex(buildSectionTree("examples", source));
    it("maps paths to the row keys TreeDataSource assigns", () => {
      expect(navIndex.keyForPath("/Table/Misc/DefaultTable")).toEqual(
        "$root|Components|Table|Misc|DefaultTable",
      );
      expect(navIndex.keyForPath("/Layout")).toEqual(
        "$root|Getting started|Layout",
      );
    });
    it("uses keySegment in keys and ignores a trailing slash", () => {
      expect(navIndex.keyForPath("/Basket/Ticket/")).toEqual(
        "$root|Components|Basket|T1",
      );
    });
    it("maps keys back to paths, headings have none", () => {
      expect(navIndex.pathForKey("$root|Components|Basket|T1")).toEqual(
        "/Basket/Ticket",
      );
      expect(navIndex.pathForKey("$root|Components")).toBeUndefined();
      expect(navIndex.keyForPath("/Docs/Table")).toBeUndefined();
    });
    it("identifies pages, as opposed to folders", () => {
      expect(navIndex.isPagePath("/Table/Misc/DefaultTable")).toBe(true);
      expect(navIndex.isPagePath("/Table/Misc")).toBe(false);
      expect(navIndex.isPagePath("/Unknown")).toBe(false);
    });
    it("falls back to the nearest ancestor in the tree", () => {
      expect(navIndex.keyForNearestPath("/Table/Misc/DefaultTable/x")).toEqual(
        "$root|Components|Table|Misc|DefaultTable",
      );
      expect(navIndex.keyForNearestPath("/Unknown/Path")).toBeUndefined();
    });
    it("indexes docs paths for the docs tree", () => {
      const docsIndex = createNavIndex(buildSectionTree("docs", source));
      expect(docsIndex.keyForPath("/Docs/Table/Intro")).toEqual(
        "$root|Table|Intro",
      );
    });
  });

  describe("sectionFromPath", () => {
    it("identifies the docs and theme sections", () => {
      expect(sectionFromPath("/Docs")).toEqual("docs");
      expect(sectionFromPath("/Docs/Table/Intro")).toEqual("docs");
      expect(sectionFromPath("/Theme")).toEqual("theme");
      expect(sectionFromPath("/Theme/")).toEqual("theme");
    });
    it("treats everything else as examples", () => {
      expect(sectionFromPath("/")).toEqual("examples");
      expect(sectionFromPath("/Table/Misc/DefaultTable")).toEqual("examples");
      expect(sectionFromPath("/DocsLike")).toEqual("examples");
    });
  });

  describe("countExamples / buildExamplesIndexNode", () => {
    const source: TreeSourceNode<NavNodeData>[] = [
      { id: "Docs", label: "Docs", childNodes: [{ id: "Docs/A", label: "A" }] },
      {
        id: "Table",
        label: "Table",
        nodeData: { count: 5, live: true },
        childNodes: [{ id: "Table/Misc", label: "Misc" }],
      },
      { id: "Single", label: "Single", nodeData: { componentName: "Single" } },
      { id: "Empty", label: "Empty" },
    ];
    it("sums folder counts and example leaves", () => {
      expect(countExamples(source.slice(1))).toEqual(6);
    });
    it("builds a synthetic Examples folder, excluding Docs", () => {
      const node = buildExamplesIndexNode(source);
      expect(node.id).toEqual("Examples");
      expect(node.childNodes?.map(({ id }) => id)).toEqual([
        "Table",
        "Single",
        "Empty",
      ]);
      expect(node.nodeData).toEqual({ count: 6, live: true });
    });
  });
});

describe("navFrom state", () => {
  it("round trips the route a page was opened from", () => {
    expect(getNavFrom(navFromState("/Docs/DateTime"))).toBe("/Docs/DateTime");
  });
  it("ignores missing or unrelated state", () => {
    expect(getNavFrom(null)).toBeUndefined();
    expect(getNavFrom(undefined)).toBeUndefined();
    expect(getNavFrom({ navFrom: 1 })).toBeUndefined();
  });
  it("applies only within the section of the route", () => {
    const state = navFromState("/Docs/DateTime");
    expect(getNavFromForPath(state, "/Docs/DateTime/Columns/X")).toBe(
      "/Docs/DateTime",
    );
    expect(getNavFromForPath(state, "/Table/Misc/X")).toBeUndefined();
  });
});
