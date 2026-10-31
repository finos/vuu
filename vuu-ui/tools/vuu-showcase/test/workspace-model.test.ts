import { describe, expect, it } from "vitest";
import {
  appendPanelToLayout,
  copyName,
  describePanels,
  exampleCountLabel,
  isWorkspaceExample,
  layoutForDrop,
  layoutFromGridDescriptor,
  nextWorkspaceName,
  panelsInLayoutOrder,
  sanitiseWorkspace,
  tileLayout,
  workspaceIdFromPath,
  type WorkspacePanel,
} from "../src/showcase-main/workspace/workspace-model";

const panel = (id: string): WorkspacePanel => ({
  id,
  path: `/Path/${id}`,
  title: id.toUpperCase(),
});

const a = panel("a");
const b = panel("b");
const c = panel("c");

describe("workspace-model", () => {
  it("parses workspace routes", () => {
    expect(workspaceIdFromPath("/workspaces/ws-1")).toBe("ws-1");
    expect(workspaceIdFromPath("/workspaces/ws-1/")).toBe("ws-1");
    expect(workspaceIdFromPath("/workspaces")).toBeUndefined();
    expect(workspaceIdFromPath("/Filters/FilterBar")).toBeUndefined();
  });

  it("gates examples on the no-workspace tag", () => {
    expect(isWorkspaceExample({ componentName: "A" })).toBe(true);
    expect(
      isWorkspaceExample({ componentName: "A", tags: ["no-workspace"] }),
    ).toBe(false);
    expect(isWorkspaceExample({ count: 3 })).toBe(false);
    expect(isWorkspaceExample(undefined)).toBe(false);
  });

  it("names new and copied workspaces", () => {
    expect(nextWorkspaceName([])).toBe("Workspace 1");
    expect(nextWorkspaceName(["Workspace 1", "Workspace 3"])).toBe(
      "Workspace 2",
    );
    expect(copyName("Orders", [])).toBe("Orders copy");
    expect(copyName("Orders", ["Orders copy", "Orders copy 2"])).toBe(
      "Orders copy 3",
    );
  });

  it("splits the workspace for a drop on an edge", () => {
    expect(layoutForDrop(a, b, "north")).toEqual({
      cols: ["1fr"],
      items: {
        a: { gridArea: "2/1/3/2", title: "A" },
        b: { gridArea: "1/1/2/2", title: "B" },
      },
      rows: ["1fr", "1fr"],
    });
    expect(layoutForDrop(a, b, "east").items).toEqual({
      a: { gridArea: "1/1/2/2", title: "A" },
      b: { gridArea: "1/2/2/3", title: "B" },
    });
    expect(layoutForDrop(a, b, "west").items.b.gridArea).toBe("1/1/2/2");
    expect(layoutForDrop(a, b, "south").items.b.gridArea).toBe("2/1/3/2");
  });

  it("stacks the panels for a drop in the centre", () => {
    const { items } = layoutForDrop(a, b, "centre");
    expect(items.a.stackId).toBeDefined();
    expect(items.a.stackId).toBe(items.b.stackId);
    expect(items.a.contentVisible).toBe(false);
    expect(items.b.contentVisible).toBe(true);
    expect(items.a.gridArea).toBe(items.b.gridArea);
  });

  it("appends a panel as a new column spanning all rows", () => {
    const layout = layoutForDrop(a, b, "north");
    expect(appendPanelToLayout(layout, c)).toEqual({
      cols: ["1fr", "1fr"],
      items: { ...layout.items, c: { gridArea: "1/2/3/3", title: "C" } },
      rows: ["1fr", "1fr"],
    });
    expect(appendPanelToLayout(tileLayout([]), c).items).toEqual({
      c: { gridArea: "1/1/2/2", title: "C" },
    });
  });

  it("tiles panels in a near square grid", () => {
    expect(tileLayout([a]).items.a.gridArea).toBe("1/1/2/2");
    const three = tileLayout([a, b, c]);
    expect(three.cols).toHaveLength(2);
    expect(three.rows).toHaveLength(2);
    expect(three.items.c.gridArea).toBe("2/1/3/3");
    expect(tileLayout([a, b, c, panel("d")]).items.d.gridArea).toBe("2/2/3/3");
  });

  it("orders panels by layout position", () => {
    const layout = layoutForDrop(a, b, "north");
    expect(panelsInLayoutOrder({ layout, panels: [a, b] })).toEqual([b, a]);
  });

  it("reduces a grid descriptor to the layout of the panels", () => {
    const descriptor = {
      cols: ["1fr", "200px"],
      gridLayoutItems: {
        a: { gridArea: "1/1/2/2", header: false, title: "A" },
        b: { gridArea: "1/2/2/3", stackId: "s1", contentVisible: true },
        placeholder: { gridArea: "2/1/3/2" },
      },
      rows: ["1fr"],
    };
    expect(layoutFromGridDescriptor(descriptor, ["a", "b"])).toEqual({
      cols: ["1fr", "200px"],
      items: {
        a: { gridArea: "1/1/2/2", title: "A" },
        b: {
          contentVisible: true,
          gridArea: "1/2/2/3",
          stackId: "s1",
          title: undefined,
        },
      },
      rows: ["1fr"],
    });
    expect(layoutFromGridDescriptor(descriptor, ["a", "x"])).toBeUndefined();
    expect(
      layoutFromGridDescriptor({ ...descriptor, cols: ["auto"] }, ["a"]),
    ).toBeUndefined();
  });

  it("sanitises stored workspaces", () => {
    expect(sanitiseWorkspace(null)).toBeUndefined();
    expect(sanitiseWorkspace({ id: "x" })).toBeUndefined();
    const workspace = sanitiseWorkspace({
      id: "ws",
      layout: { cols: ["bad"], rows: ["1fr"], items: {} },
      name: "W",
      panels: [a, { id: 1 }],
      preview: { density: "low", mode: "neon", theme: "salt-theme-next" },
    });
    expect(workspace?.panels).toEqual([a]);
    // an invalid layout is replaced by a tiled layout
    expect(workspace?.layout).toEqual(tileLayout([a]));
    expect(workspace?.preview).toEqual({
      density: "low",
      mode: "light",
      theme: "salt-theme-next",
    });
    expect(workspace?.revision).toBe(0);
  });

  it("describes the panels of a workspace", () => {
    expect(describePanels([a, b])).toBe("A + B");
    expect(describePanels([a, b, c])).toBe("A + 2 others");
    expect(exampleCountLabel(0)).toBe("empty");
    expect(exampleCountLabel(1)).toBe("1 example");
    expect(exampleCountLabel(2)).toBe("2 examples");
  });
});
