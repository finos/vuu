import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MAX_RECENT,
  PathListStore,
} from "../src/showcase-main/tree-nav/nav-store";

describe("PathListStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("loads from and persists to localStorage", () => {
    localStorage.setItem("test", JSON.stringify(["/a", 42, "/b"]));
    const store = new PathListStore("test");
    expect(store.getSnapshot()).toEqual(["/a", "/b"]);
    store.toggle("/c");
    expect(JSON.parse(localStorage.getItem("test") ?? "")).toEqual([
      "/a",
      "/b",
      "/c",
    ]);
  });

  it("tolerates invalid stored values", () => {
    localStorage.setItem("test", "{not json");
    expect(new PathListStore("test").getSnapshot()).toEqual([]);
  });

  it("toggles paths and notifies subscribers", () => {
    const store = new PathListStore("test");
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    store.toggle("/a");
    expect(store.has("/a")).toBe(true);
    store.toggle("/a");
    expect(store.has("/a")).toBe(false);
    expect(listener).toHaveBeenCalledTimes(2);
    unsubscribe();
    store.toggle("/a");
    expect(listener).toHaveBeenCalledTimes(2);
  });

  it("keeps the most recent push first, without duplicates, capped", () => {
    const store = new PathListStore("test", MAX_RECENT);
    for (let i = 0; i < MAX_RECENT + 3; i++) {
      store.push(`/${i}`);
    }
    store.push("/5");
    const paths = store.getSnapshot();
    expect(paths).toHaveLength(MAX_RECENT);
    expect(paths[0]).toEqual("/5");
    expect(paths[1]).toEqual(`/${MAX_RECENT + 2}`);
    expect(paths.filter((p) => p === "/5")).toHaveLength(1);
  });

  it("returns a stable snapshot until changed", () => {
    const store = new PathListStore("test");
    const snapshot = store.getSnapshot();
    expect(store.getSnapshot()).toBe(snapshot);
    store.push("/a");
    expect(store.getSnapshot()).not.toBe(snapshot);
    store.push("/a");
    expect(store.getSnapshot()).toBe(store.getSnapshot());
  });
});
