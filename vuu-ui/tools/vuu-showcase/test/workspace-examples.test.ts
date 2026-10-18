import type { TreeSourceNode } from "@vuu-ui/vuu-utils";
import { describe, expect, it } from "vitest";
import type { NavNodeData } from "../src/showcase-main/tree-nav/nav-tree";
import {
  collectWorkspaceExamples,
  filterWorkspaceExamples,
} from "../src/showcase-main/workspace/workspace-examples";

const example = (
  id: string,
  label: string,
  tags?: string[],
): TreeSourceNode<NavNodeData> => ({
  id,
  label,
  nodeData: { componentName: label.replace(/ /g, ""), path: "./x.tsx", tags },
});

const treeSource: TreeSourceNode<NavNodeData>[] = [
  {
    childNodes: [
      {
        childNodes: [
          example("Filters/FilterBar/Default", "Default filter bar"),
          example("Filters/FilterBar/Odd", "Odd one", ["no-workspace"]),
        ],
        id: "Filters/FilterBar",
        label: "Filter bar",
      },
    ],
    id: "Filters",
    label: "Filters",
  },
  { childNodes: [example("Docs/Intro", "Intro")], id: "Docs", label: "Docs" },
];

describe("workspace-examples", () => {
  it("collects examples that can be added to a workspace", () => {
    expect(collectWorkspaceExamples(treeSource)).toEqual([
      {
        folder: "Filters › Filter bar",
        path: "/Filters/FilterBar/Default",
        title: "Default filter bar",
      },
    ]);
  });

  it("filters by every word of the query", () => {
    const examples = collectWorkspaceExamples(treeSource);
    expect(filterWorkspaceExamples(examples, "")).toHaveLength(1);
    expect(filterWorkspaceExamples(examples, "filters default")).toHaveLength(
      1,
    );
    expect(filterWorkspaceExamples(examples, "default table")).toHaveLength(0);
  });
});
