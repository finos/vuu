import { beforeEach, describe, expect, it, vi } from "vitest";
import { WorkspaceStore } from "../src/showcase-main/workspace/workspace-store";
import {
  layoutForDrop,
  type WorkspacePanel,
} from "../src/showcase-main/workspace/workspace-model";

const panel = (id: string): WorkspacePanel => ({
  id,
  path: `/Path/${id}`,
  title: id.toUpperCase(),
});

describe("WorkspaceStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("creates workspaces and persists them", () => {
    const store = new WorkspaceStore("test");
    const listener = vi.fn();
    store.subscribe(listener);
    const ws1 = store.create();
    const ws2 = store.create({ panels: [panel("a")] });
    expect(ws1.name).toBe("Workspace 1");
    expect(ws2.name).toBe("Workspace 2");
    expect(ws2.layout.items.a.gridArea).toBe("1/1/2/2");
    expect(listener).toHaveBeenCalledTimes(2);
    const reloaded = new WorkspaceStore("test");
    expect(reloaded.getSnapshot()).toEqual([ws1, ws2]);
  });

  it("deletes a workspace, with undo restoring its position", () => {
    const store = new WorkspaceStore("test");
    const [w1, w2, w3] = [store.create(), store.create(), store.create()];
    const undo = store.delete(w2.id);
    expect(store.getSnapshot()).toEqual([w1, w3]);
    undo();
    expect(store.getSnapshot()).toEqual([w1, w2, w3]);
    // undo is idempotent
    undo();
    expect(store.getSnapshot()).toHaveLength(3);
  });

  it("renames, ignoring blank names", () => {
    const store = new WorkspaceStore("test");
    const { id } = store.create();
    store.rename(id, "  Orders  ");
    expect(store.get(id)?.name).toBe("Orders");
    store.rename(id, "  ");
    expect(store.get(id)?.name).toBe("Orders");
  });

  it("duplicates a workspace", () => {
    const store = new WorkspaceStore("test");
    const original = store.create({ name: "Orders", panels: [panel("a")] });
    const copy = store.duplicate(original.id);
    expect(copy?.id).not.toBe(original.id);
    expect(copy?.name).toBe("Orders copy");
    expect(copy?.panels).toEqual(original.panels);
    expect(copy?.layout).toEqual(original.layout);
  });

  it("adds examples, re-creating the grid", () => {
    const store = new WorkspaceStore("test");
    const { id } = store.create();
    const p1 = store.addExample(id, "/A", "A");
    const p2 = store.addExample(id, "/B", "B");
    const workspace = store.get(id);
    expect(workspace?.panels).toEqual([p1, p2]);
    expect(workspace?.layout.items[p2.id].gridArea).toBe("1/2/2/3");
    expect(workspace?.revision).toBe(2);
  });

  it("records grid changes without re-creating the grid", () => {
    const store = new WorkspaceStore("test");
    const [a, b] = [panel("a"), panel("b")];
    const { id } = store.create({ panels: [a] });
    const layout = layoutForDrop(a, b, "east");
    store.syncFromGrid(id, [a, b], layout);
    expect(store.get(id)).toMatchObject({
      layout,
      panels: [a, b],
      revision: 0,
    });
  });

  it("resets the layout and removes panels", () => {
    const store = new WorkspaceStore("test");
    const [a, b, c] = [panel("a"), panel("b"), panel("c")];
    const { id } = store.create({
      layout: layoutForDrop(a, b, "north"),
      panels: [a, b],
    });
    store.resetLayout(id);
    // reading order, b was above a
    expect(store.get(id)?.panels).toEqual([b, a]);
    expect(store.get(id)?.layout.items.b.gridArea).toBe("1/1/2/2");
    store.syncFromGrid(id, [b, a, c], {
      ...store.get(id)!.layout,
      items: { ...store.get(id)!.layout.items, c: { gridArea: "1/3/2/4" } },
    });
    store.removePanel(id, "a");
    expect(store.get(id)?.panels).toEqual([b, c]);
    expect(Object.keys(store.get(id)!.layout.items)).toEqual(["b", "c"]);
  });

  it("stores preview settings per workspace", () => {
    const store = new WorkspaceStore("test");
    const [w1, w2] = [store.create(), store.create()];
    store.setPreview(w1.id, { mode: "dark" });
    expect(store.get(w1.id)?.preview.mode).toBe("dark");
    expect(store.get(w2.id)?.preview.mode).toBe("light");
  });
});
