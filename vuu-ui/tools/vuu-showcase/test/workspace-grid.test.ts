import { describe, expect, it } from "vitest";
import {
  fromGridLayoutDocument,
  toGridLayoutDocument,
  workspaceGridId,
  workspaceSettingsCodecs,
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
  it("creates a GridLayout document for a workspace", () => {
    const document = toGridLayoutDocument({
      id: "ws",
      layout: layoutForDrop(a, b, "west"),
      panels: [a, b],
    });
    expect(document.layout.id).toBe(workspaceGridId("ws"));
    expect(document.components[0]).toEqual({
      id: "a",
      settings: { examplePath: "/Path/a", title: "A" },
      type: "ShowcaseWorkspacePanel",
      version: 1,
    });
    expect(document.layout.items[1]).toEqual({
      column: { span: 1, start: 1 },
      dropTarget: true,
      header: false,
      id: "b",
      resizeable: "hv",
      row: { span: 1, start: 1 },
      title: "B",
    });
  });

  it("creates a document GridLayoutProvider can decode", () => {
    const encoded = toGridLayoutDocument({
      id: "ws",
      layout: layoutForDrop(a, b, "centre"),
      panels: [a, b],
    });
    for (const component of encoded.components) {
      expect(workspaceSettingsCodecs.decode(component).ok).toBe(true);
    }
  });

  it("round trips, including stacked panels", () => {
    for (const position of ["east", "centre"] as const) {
      const workspace = {
        id: "ws",
        layout: layoutForDrop(a, b, position),
        panels: [a, b],
      };
      expect(
        fromGridLayoutDocument(toGridLayoutDocument(workspace), [a, b]),
      ).toEqual({ layout: workspace.layout, panels: [a, b] });
    }
  });

  it("reads panels whose component id differs from the item id", () => {
    const document = toGridLayoutDocument({
      id: "ws",
      layout: layoutForDrop(a, b, "east"),
      panels: [a, b],
    });
    const renamed = {
      ...document,
      components: document.components.map((component) =>
        component.id === "a" ? { ...component, id: "a-content" } : component,
      ),
      layout: {
        ...document.layout,
        items: document.layout.items.map((item) =>
          item.id === "a" ? { ...item, componentInstanceId: "a-content" } : item,
        ),
      },
    };
    // panels new to the layout are added at the end
    expect(fromGridLayoutDocument(renamed, [b])?.panels).toEqual([b, a]);
  });

  it("rejects an incomplete document", () => {
    const document = toGridLayoutDocument({
      id: "ws",
      layout: layoutForDrop(a, b, "east"),
      panels: [a, b],
    });
    expect(
      fromGridLayoutDocument({
        ...document,
        components: document.components.slice(1),
      }),
    ).toBeUndefined();
    expect(
      fromGridLayoutDocument({
        ...document,
        components: document.components.map((component) => ({
          ...component,
          type: "Other",
        })),
      }),
    ).toBeUndefined();
  });
});
