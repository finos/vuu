import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import {
  documentFolderRoute,
  documentLabel,
  embeddedExampleRoute,
  flattenDocuments,
  formatLastUpdated,
  getDocNeighbours,
  readingMinutes,
} from "../src/showcase-main/docs/docs-model";
import type { NavNodeData } from "../src/showcase-main/tree-nav/nav-tree";

const doc = (
  id: string,
  path: string,
  extra: Partial<TreeSourceNode<NavNodeData>> = {},
): TreeSourceNode<NavNodeData> => ({
  id,
  label: id.split("/").pop() ?? id,
  nodeData: { path } as NavNodeData,
  ...extra,
});

const treeSource: TreeSourceNode<NavNodeData>[] = [
  {
    id: "Docs",
    label: "Docs",
    childNodes: [
      doc("Docs/Table", "src/examples/Docs/Table/Index.mdx", {
        childNodes: [
          doc("Docs/Table/GettingStarted", "src/.../01-GettingStarted.mdx"),
          doc("Docs/Table/Columns", "src/.../02-Columns.mdx", {
            childNodes: [
              {
                id: "Docs/Table/Columns/PinnedColumns",
                label: "PinnedColumns",
                nodeData: {
                  componentName: "PinnedColumns",
                  path: "src/.../02-Columns.mdx",
                } as NavNodeData,
              },
            ],
          }),
        ],
      }),
      doc("Docs/Remote", "src/examples/Docs/Remote.mdx"),
    ],
  },
  { id: "Table", label: "Table", childNodes: [] },
];

describe("docs-model", () => {
  it("resolves the folder of a document", () => {
    expect(documentFolderRoute("/Docs/Table/Columns", "a/02-Columns.mdx")).toBe(
      "Docs/Table",
    );
    expect(documentFolderRoute("/Docs/Table", "a/Table/Index.mdx")).toBe(
      "Docs/Table",
    );
  });

  it("resolves embedded example routes", () => {
    expect(
      embeddedExampleRoute(
        "/Docs/Table/Columns",
        "src/examples/Docs/Table/02-Columns.mdx",
        "./02-Columns.examples",
        "PinnedColumns",
      ),
    ).toBe("/Docs/Table/Columns/PinnedColumns");
    // an index document embeds examples from sibling modules
    expect(
      embeddedExampleRoute(
        "/Docs/DateTime",
        "src/examples/Docs/DateTime/Index.mdx",
        "./01-Columns.examples",
        "DateColumn",
      ),
    ).toBe("/Docs/DateTime/Columns/DateColumn");
    expect(
      embeddedExampleRoute(
        "/Docs/Table/Columns",
        "src/examples/Docs/Table/02-Columns.mdx",
        "../Shared/03-Misc.examples",
        "Simple",
      ),
    ).toBe("/Docs/Shared/Misc/Simple");
  });

  it("estimates reading time, at least one minute", () => {
    expect(readingMinutes("")).toBe(1);
    expect(readingMinutes("word ".repeat(1000))).toBe(5);
  });

  it("formats last updated dates", () => {
    expect(formatLastUpdated("2026-10-05")).toBe("5 Oct 2026");
    expect(formatLastUpdated("not a date")).toBe("not a date");
  });

  it("lists documents in reading order, skipping examples", () => {
    expect(flattenDocuments(treeSource).map(({ id }) => id)).toEqual([
      "Docs/Table",
      "Docs/Table/GettingStarted",
      "Docs/Table/Columns",
      "Docs/Remote",
    ]);
  });

  it("finds the previous and next documents", () => {
    const { next, previous } = getDocNeighbours(
      "/Docs/Table/Columns",
      treeSource,
    );
    expect(previous?.id).toBe("Docs/Table/GettingStarted");
    expect(next?.id).toBe("Docs/Remote");
    expect(getDocNeighbours("/Docs/Table", treeSource).previous).toBe(
      undefined,
    );
    expect(getDocNeighbours("/Docs/Remote", treeSource).next).toBe(undefined);
    expect(getDocNeighbours("/Nope", treeSource)).toEqual({
      next: undefined,
      previous: undefined,
    });
  });

  it("labels numbered chapters", () => {
    expect(
      documentLabel({
        id: "x",
        label: "Columns",
        nodeData: { order: 2 } as NavNodeData,
      }),
    ).toBe("02 Columns");
    expect(documentLabel({ id: "x", label: "Columns" })).toBe("Columns");
  });
});
