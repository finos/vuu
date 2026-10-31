import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import { findTreeNode, isIndexNode } from "../src/shared-utils";

const tree: TreeSourceNode[] = [
  {
    id: "Layout",
    label: "Layout",
    nodeData: { count: 1 },
    childNodes: [
      {
        id: "Layout/Flexbox",
        label: "Flexbox",
        nodeData: { count: 1 },
        childNodes: [
          {
            id: "Layout/Flexbox/Simple",
            label: "Simple",
            nodeData: { componentName: "Simple", path: "Flexbox.examples.tsx" },
          },
        ],
      },
      {
        id: "Layout/Guide",
        label: "Guide",
        nodeData: { count: 0, path: "Guide.mdx" },
        childNodes: [{ id: "Layout/Guide/X", label: "X" }],
      },
    ],
  },
];

describe("findTreeNode", () => {
  it("finds folders and examples by pathname", () => {
    expect(findTreeNode("/Layout/Flexbox", tree)?.label).toEqual("Flexbox");
    expect(findTreeNode("/Layout/Flexbox/", tree)?.label).toEqual("Flexbox");
    expect(findTreeNode("/Layout/Flexbox/Simple", tree)?.label).toEqual(
      "Simple",
    );
  });
  it("returns undefined for unknown paths", () => {
    expect(findTreeNode("/Layout/Nope", tree)).toBeUndefined();
  });
});

describe("isIndexNode", () => {
  it("is true for a node with children and nothing of its own to render", () => {
    expect(isIndexNode(findTreeNode("/Layout/Flexbox", tree))).toBe(true);
  });
  it("is false for examples and documents", () => {
    expect(isIndexNode(findTreeNode("/Layout/Flexbox/Simple", tree))).toBe(
      false,
    );
    expect(isIndexNode(findTreeNode("/Layout/Guide", tree))).toBe(false);
    expect(isIndexNode(undefined)).toBe(false);
  });
});
