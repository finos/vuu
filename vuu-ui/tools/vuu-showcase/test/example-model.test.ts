import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  getAdjacentExamples,
  getBreadcrumbs,
  getParentNode,
  getRelated,
  getSourceLinks,
} from "../src/showcase-main/example/example-model";
import type { NavNodeData } from "../src/showcase-main/tree-nav/nav-tree";

const example = (id: string, label: string) => ({
  id,
  label,
  nodeData: { componentName: label, path: "./src/examples/x.examples.tsx" },
});

const source: TreeSourceNode<NavNodeData>[] = [
  {
    id: "Docs",
    label: "Docs",
    childNodes: [
      {
        id: "Docs/Table",
        label: "Table",
        childNodes: [example("Docs/Table/Flash", "Flash")],
      },
    ],
  },
  { id: "Intro", label: "Intro", nodeData: { path: "./src/Intro.mdx" } },
  {
    id: "Table",
    label: "Table",
    childNodes: [
      {
        id: "Table/Misc",
        label: "Misc",
        childNodes: [
          example("Table/Misc/TestTable", "Test Table"),
          example("Table/Misc/AutoTable", "Auto Table"),
        ],
      },
    ],
  },
  {
    id: "Chart",
    label: "Chart",
    childNodes: [example("Chart/Line", "Line")],
  },
];

describe("example-model", () => {
  it("builds breadcrumbs for examples, excluding the target", () => {
    expect(getBreadcrumbs("/Table/Misc/TestTable", source)).toEqual([
      { label: "Examples", path: "/" },
      { label: "Table", path: "/Table" },
      { label: "Misc", path: "/Table/Misc" },
    ]);
  });

  it("builds breadcrumbs for docs", () => {
    expect(getBreadcrumbs("/Docs/Table/Flash", source)).toEqual([
      { label: "Docs", path: "/Docs" },
      { label: "Table", path: "/Docs/Table" },
    ]);
  });

  it("finds adjacent examples in nav order, folders sorted by label", () => {
    expect(getAdjacentExamples("/Chart/Line", source)).toMatchObject({
      next: { id: "Table/Misc/TestTable" },
      previous: undefined,
    });
    expect(getAdjacentExamples("/Table/Misc/TestTable", source)).toMatchObject({
      next: { id: "Table/Misc/AutoTable" },
      previous: { id: "Chart/Line" },
    });
    expect(getAdjacentExamples("/Table/Misc/AutoTable", source).next).toBe(
      undefined,
    );
  });

  it("finds adjacent examples within docs", () => {
    expect(getAdjacentExamples("/Docs/Table/Flash", source)).toEqual({
      next: undefined,
      previous: undefined,
    });
  });

  it("finds the parent node", () => {
    expect(getParentNode("/Table/Misc/TestTable", source)?.id).toBe(
      "Table/Misc",
    );
    expect(getParentNode("/Intro", source)).toBeUndefined();
  });

  it("builds source links", () => {
    const nodeData = {
      path: "./src/examples/Table/Misc.examples.tsx",
      sourceRange: [10, 20] as [number, number],
    };
    expect(getSourceLinks(nodeData)).toEqual({
      github:
        "https://github.com/finos/vuu/blob/main/vuu-ui/showcase/src/examples/Table/Misc.examples.tsx#L10-L20",
      vscode: undefined,
    });
    expect(getSourceLinks(nodeData, "/dev/vuu-ui/showcase/").vscode).toBe(
      "vscode://file/dev/vuu-ui/showcase/src/examples/Table/Misc.examples.tsx:10",
    );
  });
});

describe("getRelated", () => {
  it("lists the other examples in the file", () => {
    const { docs, siblings } = getRelated("/Table/Misc/TestTable", source);
    expect(siblings.map((n) => n.id)).toEqual(["Table/Misc/AutoTable"]);
    expect(docs).toEqual([]);
  });

  it("resolves the documents that embed the example", () => {
    const withDocs = structuredClone(source);
    const misc = withDocs[2].childNodes?.[0];
    const testTable = misc?.childNodes?.[0];
    if (testTable?.nodeData) {
      testTable.nodeData.docs = ["Intro", "Missing"];
    }
    const { docs } = getRelated("/Table/Misc/TestTable", withDocs);
    expect(docs.map((n) => n.id)).toEqual(["Intro"]);
  });
});
