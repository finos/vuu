import { useSyncExternalStore } from "react";
import {
  createDocTabId,
  type DocTab,
  docTabKind,
  type DocTabsState,
  EMPTY_DOC_TABS,
  parseDocTabsState,
} from "./doc-tabs-model";

export const DOC_TABS_KEY = "vuu-showcase.doc-tabs";

type Listener = () => void;

/**
 * The documents (examples and workspaces) open in tabs, persisted to
 * localStorage. The url decides which tab is active: the store is told when
 * the url changes (show) and tab actions navigate, never the reverse.
 */
export class DocTabsStore {
  #listeners = new Set<Listener>();
  #state: DocTabsState | undefined;
  #pendingNewTab: string | undefined;
  #synced = false;
  #recentWorkspacePaths: string[] = [];

  constructor(private storageKey = DOC_TABS_KEY) {}

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  getSnapshot = (): DocTabsState => {
    if (this.#state === undefined) {
      this.#state = this.load();
    }
    return this.#state;
  };

  get tabs() {
    return this.getSnapshot().tabs;
  }

  get activeTab() {
    const { activeId, tabs } = this.getSnapshot();
    return tabs.find((tab) => tab.id === activeId);
  }

  findByPath(path: string) {
    return this.tabs.find((tab) => tab.path === path);
  }

  /** The next navigation to path opens it in a new tab */
  requestNewTab(path: string) {
    this.#pendingNewTab = path;
  }

  /**
   * The url now shows a page that is not a document. Documents shown from
   * here on replace the content of the active tab.
   */
  markSynced() {
    this.#synced = true;
  }

  /**
   * The url now shows a document. If it is already open, its tab becomes
   * active. Otherwise it replaces the content of the active tab, unless a
   * new tab was requested. The first document shown after the page loads
   * is never allowed to replace a restored tab.
   */
  show(path: string, search = "") {
    const { activeId, tabs } = this.getSnapshot();
    const newTab = this.#pendingNewTab === path || !this.#synced;
    this.#pendingNewTab = undefined;
    this.#synced = true;
    if (docTabKind(path) === "workspace") {
      this.#recentWorkspacePaths = [
        path,
        ...this.#recentWorkspacePaths.filter((p) => p !== path),
      ];
    }

    const existing = tabs.find((tab) => tab.path === path);
    if (existing) {
      if (existing.id !== activeId || existing.search !== search) {
        this.update({
          activeId: existing.id,
          tabs: tabs.map((tab) =>
            tab === existing ? { ...tab, search } : tab,
          ),
        });
      }
      return;
    }

    const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
    if (newTab || activeIndex === -1) {
      const tab: DocTab = { id: createDocTabId(), path, search };
      const next = [...tabs];
      next.splice(activeIndex === -1 ? tabs.length : activeIndex + 1, 0, tab);
      this.update({ activeId: tab.id, tabs: next });
    } else {
      this.update({
        activeId,
        tabs: tabs.map((tab, i) =>
          i === activeIndex ? { ...tab, path, search } : tab,
        ),
      });
    }
  }

  /**
   * Closes a tab. If it was the active tab, the tab that takes its place
   * (the one to its right, else its left) is returned, for the caller to
   * navigate to.
   */
  close(id: string): DocTab | undefined {
    const { activeId, tabs } = this.getSnapshot();
    const index = tabs.findIndex((tab) => tab.id === id);
    if (index === -1) {
      return undefined;
    }
    const next = tabs.filter((tab) => tab.id !== id);
    if (id === activeId) {
      const nextActive = next[index] ?? next[index - 1];
      this.update({ activeId: nextActive?.id, tabs: next });
      return nextActive;
    }
    this.update({ activeId, tabs: next });
  }

  closePath(path: string) {
    const tab = this.findByPath(path);
    return tab ? this.close(tab.id) : undefined;
  }

  /** Returns the tab kept open, if it was not already active */
  closeOthers(id: string): DocTab | undefined {
    const { activeId, tabs } = this.getSnapshot();
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      this.update({ activeId: id, tabs: [tab] });
      return id === activeId ? undefined : tab;
    }
  }

  /** Returns the given tab if the active tab was closed */
  closeToRight(id: string): DocTab | undefined {
    const { activeId, tabs } = this.getSnapshot();
    const index = tabs.findIndex((t) => t.id === id);
    if (index !== -1 && index < tabs.length - 1) {
      const next = tabs.slice(0, index + 1);
      const activeClosed = !next.some((tab) => tab.id === activeId);
      this.update({ activeId: activeClosed ? id : activeId, tabs: next });
      return activeClosed ? tabs[index] : undefined;
    }
  }

  closeAll() {
    if (this.tabs.length > 0) {
      this.update(EMPTY_DOC_TABS);
    }
  }

  /** Removes tabs whose document no longer exists */
  prune(isValid: (path: string) => boolean) {
    const { activeId, tabs } = this.getSnapshot();
    const next = tabs.filter((tab) => isValid(tab.path));
    if (next.length !== tabs.length) {
      const activeIndex = tabs.findIndex((tab) => tab.id === activeId);
      const nextActive = next.some((tab) => tab.id === activeId)
        ? activeId
        : (next[Math.min(activeIndex, next.length - 1)]?.id ?? next[0]?.id);
      this.update({ activeId: nextActive, tabs: next });
    }
  }

  /**
   * The workspace that examples are offered to, from a tab's menu: the
   * active tab if it is a workspace, else the workspace tab most recently
   * active, else the last workspace tab.
   */
  targetWorkspacePath(): string | undefined {
    const { tabs } = this.getSnapshot();
    const open = (path: string) => tabs.some((tab) => tab.path === path);
    const activePath = this.activeTab?.path;
    if (activePath && docTabKind(activePath) === "workspace") {
      return activePath;
    }
    return (
      this.#recentWorkspacePaths.find(open) ??
      tabs.findLast((tab) => docTabKind(tab.path) === "workspace")?.path
    );
  }

  private load(): DocTabsState {
    try {
      return parseDocTabsState(
        JSON.parse(localStorage.getItem(this.storageKey) ?? "null"),
      );
    } catch {
      return EMPTY_DOC_TABS;
    }
  }

  private update(state: DocTabsState) {
    this.#state = state;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch {
      // storage may be unavailable, tabs survive for this session only
    }
    this.#listeners.forEach((listener) => listener());
  }
}

export const docTabsStore = new DocTabsStore();

export const useDocTabs = () =>
  useSyncExternalStore(docTabsStore.subscribe, docTabsStore.getSnapshot);

/** More than one document is open, so the title area is a tab strip */
export const useTabbedDocuments = () => useDocTabs().tabs.length > 1;
