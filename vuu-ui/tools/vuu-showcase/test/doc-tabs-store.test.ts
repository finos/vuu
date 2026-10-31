import { beforeEach, describe, expect, it } from "vitest";
import {
  docTabHref,
  fitTabs,
  parseDocTabsState,
} from "../src/showcase-main/doc-tabs/doc-tabs-model";
import { DocTabsStore } from "../src/showcase-main/doc-tabs/doc-tabs-store";

const KEY = "test-doc-tabs";
const paths = (store: DocTabsStore) => store.tabs.map((tab) => tab.path);
const activePath = (store: DocTabsStore) => store.activeTab?.path;

/** A store that has synced with the url, showing the given documents */
const storeWith = (...docs: string[]) => {
  const store = new DocTabsStore(KEY);
  for (const doc of docs) {
    store.requestNewTab(doc);
    store.show(doc);
  }
  return store;
};

describe("DocTabsStore", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("opens the first document shown in a tab", () => {
    const store = new DocTabsStore(KEY);
    store.show("/A/One", "?theme=salt");
    expect(store.tabs).toEqual([
      { id: expect.any(String), path: "/A/One", search: "?theme=salt" },
    ]);
    expect(activePath(store)).toBe("/A/One");
  });

  it("replaces the content of the active tab", () => {
    const store = storeWith("/A/One", "/A/Two");
    store.show("/A/Three");
    expect(paths(store)).toEqual(["/A/One", "/A/Three"]);
    expect(activePath(store)).toBe("/A/Three");
  });

  it("opens a requested new tab after the active tab", () => {
    const store = storeWith("/A/One", "/A/Two");
    store.show("/A/One");
    store.requestNewTab("/A/Three");
    store.show("/A/Three");
    expect(paths(store)).toEqual(["/A/One", "/A/Three", "/A/Two"]);
    expect(activePath(store)).toBe("/A/Three");
  });

  it("activates the tab of a document that is already open", () => {
    const store = storeWith("/A/One", "/A/Two");
    store.show("/A/One", "?tab=source");
    expect(paths(store)).toEqual(["/A/One", "/A/Two"]);
    expect(activePath(store)).toBe("/A/One");
    expect(store.activeTab?.search).toBe("?tab=source");
  });

  it("does not let the first document after load replace a restored tab", () => {
    storeWith("/A/One");
    const reloaded = new DocTabsStore(KEY);
    expect(paths(reloaded)).toEqual(["/A/One"]);
    reloaded.show("/A/Two");
    expect(paths(reloaded)).toEqual(["/A/One", "/A/Two"]);
    reloaded.show("/A/Three");
    expect(paths(reloaded)).toEqual(["/A/One", "/A/Three"]);
  });

  it("replaces the active tab once a non document page has been shown", () => {
    storeWith("/A/One");
    const reloaded = new DocTabsStore(KEY);
    reloaded.markSynced();
    reloaded.show("/A/Two");
    expect(paths(reloaded)).toEqual(["/A/Two"]);
  });

  it("persists tabs and the active tab", () => {
    const store = storeWith("/A/One", "/workspaces/ws1");
    const reloaded = new DocTabsStore(KEY);
    expect(reloaded.getSnapshot()).toEqual(store.getSnapshot());
  });

  it("closes the active tab, its right neighbour takes its place", () => {
    const store = storeWith("/A/One", "/A/Two", "/A/Three");
    store.show("/A/Two");
    const next = store.close(store.activeTab?.id ?? "");
    expect(next?.path).toBe("/A/Three");
    expect(activePath(store)).toBe("/A/Three");
    expect(store.close(store.activeTab?.id ?? "")?.path).toBe("/A/One");
    expect(paths(store)).toEqual(["/A/One"]);
  });

  it("closes an inactive tab without changing the active tab", () => {
    const store = storeWith("/A/One", "/A/Two");
    const first = store.findByPath("/A/One");
    expect(store.close(first?.id ?? "")).toBeUndefined();
    expect(paths(store)).toEqual(["/A/Two"]);
    expect(activePath(store)).toBe("/A/Two");
  });

  it("closes other tabs, and tabs to the right", () => {
    const store = storeWith("/A/One", "/A/Two", "/A/Three", "/A/Four");
    const two = store.findByPath("/A/Two");
    expect(store.closeToRight(two?.id ?? "")?.path).toBe("/A/Two");
    expect(paths(store)).toEqual(["/A/One", "/A/Two"]);
    const one = store.findByPath("/A/One");
    expect(store.closeOthers(one?.id ?? "")?.path).toBe("/A/One");
    expect(paths(store)).toEqual(["/A/One"]);
    expect(store.closeOthers(one?.id ?? "")).toBeUndefined();
  });

  it("closes all tabs", () => {
    const store = storeWith("/A/One", "/A/Two");
    store.closeAll();
    expect(store.tabs).toEqual([]);
    expect(store.activeTab).toBeUndefined();
  });

  it("prunes tabs whose document no longer exists", () => {
    const store = storeWith("/A/One", "/workspaces/ws1", "/A/Two");
    store.show("/workspaces/ws1");
    store.prune((path) => path !== "/workspaces/ws1");
    expect(paths(store)).toEqual(["/A/One", "/A/Two"]);
    expect(activePath(store)).toBe("/A/Two");
  });

  it("offers examples to the active, else most recent, workspace tab", () => {
    const store = storeWith("/workspaces/ws1", "/workspaces/ws2", "/A/One");
    expect(store.targetWorkspacePath()).toBe("/workspaces/ws2");
    store.show("/workspaces/ws1");
    expect(store.targetWorkspacePath()).toBe("/workspaces/ws1");
    store.show("/A/One");
    expect(store.targetWorkspacePath()).toBe("/workspaces/ws1");
    store.closePath("/workspaces/ws1");
    expect(store.targetWorkspacePath()).toBe("/workspaces/ws2");
    localStorage.clear();
    expect(storeWith("/A/One").targetWorkspacePath()).toBeUndefined();
  });

  it("ignores invalid persisted state", () => {
    localStorage.setItem(KEY, "{not json");
    expect(new DocTabsStore(KEY).tabs).toEqual([]);
  });
});

describe("parseDocTabsState", () => {
  it("drops invalid and duplicate tabs, defaults the active tab", () => {
    expect(
      parseDocTabsState({
        activeId: "missing",
        tabs: [
          { id: "1", path: "/A", search: "" },
          { id: "2", path: "/A", search: "" },
          { id: 3, path: "/B" },
          null,
          { id: "4", path: "/C", search: "?x=1" },
        ],
      }),
    ).toEqual({
      activeId: "1",
      tabs: [
        { id: "1", path: "/A", search: "" },
        { id: "4", path: "/C", search: "?x=1" },
      ],
    });
    expect(parseDocTabsState("nonsense")).toEqual({ tabs: [] });
  });
});

describe("docTabHref", () => {
  it("appends the search, if any", () => {
    expect(docTabHref({ path: "/A", search: "" })).toBe("/A");
    expect(docTabHref({ path: "/A", search: "?" })).toBe("/A");
    expect(docTabHref({ path: "/A", search: "?x=1" })).toBe("/A?x=1");
    expect(docTabHref({ path: "/A", search: "x=1" })).toBe("/A?x=1");
  });
});

describe("fitTabs", () => {
  const fit = (activeIndex: number, available: number, widths: number[]) =>
    fitTabs({ activeIndex, available, gap: 2, overflowWidth: 50, widths });

  it("shows every tab when they fit", () => {
    expect(fit(0, 304, [100, 100, 100])).toEqual([0, 1, 2]);
  });

  it("shows the tabs that fit, leaving room for the overflow button", () => {
    // 300 - 50 - 2 = 248, two tabs of 100 (+ gaps) fit
    expect(fit(0, 300, [100, 100, 100, 100])).toEqual([0, 1]);
  });

  it("always shows the active tab", () => {
    expect(fit(3, 300, [100, 100, 100, 100])).toEqual([0, 3]);
    expect(fit(2, 100, [100, 100, 100])).toEqual([2]);
  });
});
