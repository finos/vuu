import { describe, expect, it } from "vitest";
import type {
  WorkspaceLayout,
  WorkspacePanel,
} from "../src/showcase-main/workspace/workspace-model";
import {
  workspaceComponentName,
  workspaceLayoutSource,
} from "../src/showcase-main/workspace/workspace-source";

const panels: WorkspacePanel[] = [
  {
    id: "p1",
    path: "/Filters/FilterBar/DefaultFilterBar",
    title: "Default filter bar",
  },
  { id: "p2", path: "/Table/Table/SimpleTable", title: "Simple table" },
  { id: "p3", path: "/Table/Table/TableWithMenu", title: "Table with menu" },
  { id: "p4", path: "/Unknown/Thing", title: "Simple table" },
];

const resolve = (route: string) =>
  route.startsWith("/Unknown")
    ? undefined
    : {
        componentName: route.split("/").pop() as string,
        path: `./${route.split("/").slice(1, 3).join("/")}.examples.tsx`,
      };

const layout: WorkspaceLayout = {
  cols: ["1fr", "1fr"],
  items: {
    p1: { gridArea: "1/1/2/3" },
    p2: { gridArea: "2/1/3/2" },
    p3: { contentVisible: false, gridArea: "2/2/3/3", stackId: "s" },
    p4: { contentVisible: true, gridArea: "2/2/3/3", stackId: "s" },
  },
  rows: ["auto", "1fr"],
};

describe("workspace-source", () => {
  it("names the component from the workspace name", () => {
    expect(workspaceComponentName("Blotter with filters")).toBe(
      "BlotterWithFilters",
    );
    expect(workspaceComponentName("2 tables")).toBe("_2Tables");
    expect(workspaceComponentName("!!")).toBe("Workspace");
  });

  it("generates a GridLayout reproducing the workspace", () => {
    const source = workspaceLayoutSource(
      { layout, name: "Blotter with filters", panels },
      resolve,
    );
    expect(source).toContain(
      'import { GridLayout, GridLayoutItem, GridLayoutStackedItem } from "@vuu-ui/grid-layout";',
    );
    expect(source).toContain(
      'import { SimpleTable, TableWithMenu } from "./Table/Table.examples";',
    );
    expect(source).toContain(
      'import { DefaultFilterBar } from "./Filters/FilterBar.examples";',
    );
    expect(source).toContain("export const BlotterWithFilters = () => (");
    expect(source).toContain(
      'colsAndRows={{ cols: ["1fr", "1fr"], rows: ["auto", "1fr"] }}',
    );
    expect(source).toContain(
      '<GridLayoutItem id="default-filter-bar" title="Default filter bar" header',
    );
    expect(source).toContain('style={{ gridArea: "1/1/2/3" }}>');
    // ids are unique, panels with the same title are numbered
    expect(source).toContain(
      '<GridLayoutItem id="simple-table-2" stackId="stack-1" title="Simple table">',
    );
    // the visible panel of a stack is active
    expect(source).toContain('<GridLayoutStackedItem id="stack-1" active={1}');
    // examples not found in the tree are not imported
    expect(source).toContain("<Thing />");
    expect(source).not.toContain("Unknown");
  });

  it("omits GridLayoutStackedItem when nothing is stacked", () => {
    const source = workspaceLayoutSource(
      {
        layout: {
          cols: ["1fr"],
          items: { p2: { gridArea: "1/1/2/2" } },
          rows: ["1fr"],
        },
        name: "One",
        panels: [panels[1]],
      },
      resolve,
    );
    expect(source).toContain(
      'import { GridLayout, GridLayoutItem } from "@vuu-ui/grid-layout";',
    );
    expect(source).not.toContain("GridLayoutStackedItem");
  });
});
