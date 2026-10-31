import { useSyncExternalStore } from "react";
import {
  appendPanelToLayout,
  copyName,
  createId,
  createPanel,
  DEFAULT_WORKSPACE_PREVIEW,
  EMPTY_LAYOUT,
  nextWorkspaceName,
  sanitiseWorkspace,
  tileLayout,
  panelsInLayoutOrder,
  type Workspace,
  type WorkspaceLayout,
  type WorkspacePanel,
  type WorkspacePreview,
} from "./workspace-model";

export const WORKSPACES_KEY = "vuu-showcase.workspaces";

type Listener = () => void;

export interface CreateWorkspaceOptions {
  layout?: WorkspaceLayout;
  name?: string;
  panels?: WorkspacePanel[];
  preview?: WorkspacePreview;
}

/**
 * The user's workspaces, persisted to localStorage. Components subscribe
 * via useSyncExternalStore. Every change produces a new snapshot, changed
 * workspaces are replaced, unchanged workspaces are preserved.
 */
export class WorkspaceStore {
  #listeners = new Set<Listener>();
  #workspaces: Workspace[] | undefined;

  constructor(
    private storageKey = WORKSPACES_KEY,
    private now = () => Date.now(),
  ) {}

  subscribe = (listener: Listener) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  getSnapshot = (): Workspace[] => {
    if (this.#workspaces === undefined) {
      this.#workspaces = this.load();
    }
    return this.#workspaces;
  };

  get(id: string) {
    return this.getSnapshot().find((workspace) => workspace.id === id);
  }

  create({
    layout,
    name,
    panels = [],
    preview = DEFAULT_WORKSPACE_PREVIEW,
  }: CreateWorkspaceOptions = {}) {
    const workspaces = this.getSnapshot();
    const workspace: Workspace = {
      createdAt: this.now(),
      id: createId("ws"),
      layout: layout ?? tileLayout(panels),
      name: name ?? nextWorkspaceName(workspaces.map(({ name }) => name)),
      panels,
      preview,
      revision: 0,
    };
    this.save([...workspaces, workspace]);
    return workspace;
  }

  /**
   * Removes a workspace, returns a function that restores it, in its
   * original position (undo).
   */
  delete(id: string) {
    const workspaces = this.getSnapshot();
    const index = workspaces.findIndex((workspace) => workspace.id === id);
    if (index === -1) {
      return () => undefined;
    }
    const workspace = workspaces[index];
    this.save(workspaces.filter((w) => w !== workspace));
    return () => {
      const current = this.getSnapshot();
      if (!current.some((w) => w.id === id)) {
        const next = [...current];
        next.splice(Math.min(index, next.length), 0, workspace);
        this.save(next);
      }
    };
  }

  duplicate(id: string) {
    const workspace = this.get(id);
    if (workspace) {
      // panel ids are unique within a workspace only, they can be shared
      return this.create({
        layout: workspace.layout,
        name: copyName(
          workspace.name,
          this.getSnapshot().map(({ name }) => name),
        ),
        panels: workspace.panels,
        preview: workspace.preview,
      });
    }
  }

  rename(id: string, name: string) {
    const trimmed = name.trim();
    if (trimmed) {
      this.update(id, () => ({ name: trimmed }));
    }
  }

  setPreview(id: string, preview: Partial<WorkspacePreview>) {
    this.update(id, (workspace) => ({
      preview: { ...workspace.preview, ...preview },
    }));
  }

  /** Adds an example as a new panel, to the right of existing panels */
  addExample(id: string, path: string, title: string) {
    const panel = createPanel(path, title);
    this.update(id, ({ layout, panels, revision }) => ({
      layout: appendPanelToLayout(
        panels.length === 0 ? EMPTY_LAYOUT : layout,
        panel,
      ),
      panels: [...panels, panel],
      revision: revision + 1,
    }));
    return panel;
  }

  /** Replaces the layout (and optionally the panels), re-creating the grid */
  setLayout(id: string, layout: WorkspaceLayout, panels?: WorkspacePanel[]) {
    this.update(id, (workspace) => ({
      layout,
      panels: panels ?? workspace.panels,
      revision: workspace.revision + 1,
    }));
  }

  /** Re-arranges the panels in a regular grid */
  resetLayout(id: string) {
    this.update(id, (workspace) => {
      const panels = panelsInLayoutOrder(workspace);
      return {
        layout: tileLayout(panels),
        panels,
        revision: workspace.revision + 1,
      };
    });
  }

  removePanel(id: string, panelId: string) {
    this.update(id, (workspace) => {
      const panels = workspace.panels.filter(({ id }) => id !== panelId);
      return {
        layout: tileLayout(panelsInLayoutOrder({ ...workspace, panels })),
        panels,
        revision: workspace.revision + 1,
      };
    });
  }

  /**
   * Records changes made by the user within the GridLayout. The grid
   * already reflects these, so it is not re-created.
   */
  syncFromGrid(id: string, panels: WorkspacePanel[], layout: WorkspaceLayout) {
    this.update(id, () => ({ layout, panels }));
  }

  private update(
    id: string,
    changes: (workspace: Workspace) => Partial<Omit<Workspace, "id">>,
  ) {
    const workspaces = this.getSnapshot();
    if (workspaces.some((workspace) => workspace.id === id)) {
      this.save(
        workspaces.map((workspace) =>
          workspace.id === id
            ? { ...workspace, ...changes(workspace) }
            : workspace,
        ),
      );
    }
  }

  private load(): Workspace[] {
    try {
      const value = JSON.parse(localStorage.getItem(this.storageKey) ?? "[]");
      return Array.isArray(value)
        ? value
            .map(sanitiseWorkspace)
            .filter((w): w is Workspace => w !== undefined)
        : [];
    } catch {
      return [];
    }
  }

  private save(workspaces: Workspace[]) {
    this.#workspaces = workspaces;
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(workspaces));
    } catch {
      // storage may be unavailable, workspaces survive for this session only
    }
    this.#listeners.forEach((listener) => listener());
  }
}

export const workspaceStore = new WorkspaceStore();

export const useWorkspaces = () =>
  useSyncExternalStore(workspaceStore.subscribe, workspaceStore.getSnapshot);

export const useWorkspace = (id?: string) =>
  useWorkspaces().find((workspace) => workspace.id === id);
