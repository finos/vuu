import { describe, expect, it } from "vitest";
import {
  fromSerializedLayout,
  toSerializedLayout,
  workspaceGridId,
} from "../src/showcase-main/workspace/workspace-grid";
import {
  layoutForDrop,
  type WorkspacePanel,
} from "../src/showcase-main/workspace/workspace-model";

const panel = (id: string): WorkspacePanel => ({
  id,
  path: `/Path/${id}`,
  title: id.toUpperCase(),
});
const [a, b] = [panel("a"), panel("b")];

describe("workspace-grid", () => {
  it("serializes a workspace for GridLayoutProvider", () => {
    const serialized = toSerializedLayout({
      id: "ws",
      layout: layoutForDrop(a, b, "west"),
      panels: [a, b],
    });
    expect(serialized.id).toBe(workspaceGridId("ws"));
    expect(serialized.components.a).toEqual({
      props: { examplePath: "/Path/a", title: "A" },
      type: "ShowcaseWorkspacePanel",
    });
    expect(serialized.layout.gridLayoutItems?.b).toEqual({
      contentVisible: undefined,
      dropTarget: true,
      gridArea: "1/1/2/2",
      header: false,
      resizeable: "hv",
      stackId: undefined,
      title: "B",
    });
  });

  it("round trips, including stacked panels", () => {
    const workspace = {
      id: "ws",
      layout: layoutForDrop(a, b, "centre"),
      panels: [a, b],
    };
    expect(fromSerializedLayout(toSerializedLayout(workspace), [a, b])).toEqual(
      { layout: workspace.layout, panels: [a, b] },
    );
  });

  it("reads panels nested in serialized GridLayoutItems", () => {
    const serialized = toSerializedLayout({
      id: "ws",
      layout: layoutForDrop(a, b, "east"),
      panels: [a, b],
    });
    serialized.components.b = {
      children: [serialized.components.b],
      props: {},
      type: "GridLayoutItem",
    };
    // panels new to the layout are added at the end
    expect(fromSerializedLayout(serialized, [b])?.panels).toEqual([b, a]);
  });

  it("rejects an incomplete layout", () => {
    const serialized = toSerializedLayout({
      id: "ws",
      layout: layoutForDrop(a, b, "east"),
      panels: [a, b],
    });
    delete serialized.layout.gridLayoutItems?.a;
    expect(fromSerializedLayout(serialized)).toBeUndefined();
    serialized.components.c = { type: "Other" };
    expect(fromSerializedLayout(serialized)).toBeUndefined();
  });
});
