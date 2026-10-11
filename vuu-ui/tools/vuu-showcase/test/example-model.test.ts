import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  getAdjacentExamples,
  getBreadcrumbs,
  getParentNode,
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

  it("builds breadcrumbs leading to the page a route was opened from", () => {
    expect(
      getBreadcrumbs("/Docs/Table/Flash/Example", source, "/Docs/Table"),
    ).toEqual([
      { label: "Docs", path: "/Docs" },
      { label: "Table", path: "/Docs/Table" },
    ]);
    expect(getBreadcrumbs("/Docs/Table/Flash", source, "/Docs")).toEqual([
      { label: "Docs", path: "/Docs" },
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
