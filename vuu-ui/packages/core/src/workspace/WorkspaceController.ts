import {
  GridLayoutDocumentController,
  type GridComponentRendererRegistry,
  type GridComponentSettingsRegistry,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
} from "@vuu-ui/grid-layout";
import type { WorkspacePersistenceService } from "./WorkspacePersistenceService";
import { WorkspacePersistentStateStore } from "./WorkspacePersistentState";
import { WorkspaceRepository } from "./WorkspaceRepository";
import {
  WORKSPACE_SNAPSHOT_VERSION,
  type WorkspaceSnapshotV1,
} from "./workspace-schemas";

export interface WorkspaceControllerOptions {
  readonly definitionId?: string;
  readonly instanceId: string;
  name: string;
  readonly onError: (error: Error) => void;
  /**
   * Invoked with the latest snapshot whenever the user edits the workspace.
   * Changes that leave the workspace identical to its initial snapshot are
   * not reported until a real edit has occurred. Changes to view state alone,
   * e.g. the selected tab of a stack, are not edits: they are saved with the
   * workspace instance, but are not reported until a real edit has occurred.
   */
  readonly onEdit?: (snapshot: WorkspaceSnapshotV1) => void;
  readonly renderers: GridComponentRendererRegistry;
  readonly service: WorkspacePersistenceService;
  readonly settingsCodecs: GridComponentSettingsRegistry;
  readonly snapshot: WorkspaceSnapshotV1;
  readonly revision?: number;
}

const byId = <T extends { id: string }>(a: T, b: T) =>
  a.id < b.id ? -1 : a.id > b.id ? 1 : 0;

const stableStringify = (value: unknown): string =>
  JSON.stringify(value, (_key, v: unknown) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v as Record<string, unknown>).sort(([a], [b]) =>
            a < b ? -1 : a > b ? 1 : 0,
          ),
        )
      : v,
  );

/**
 * A canonical form of a workspace snapshot, used to decide whether it has
 * diverged from the definition it was opened from.
 * - Ordering of components, items and stacks and the order of object keys is
 *   not significant, nor are defaults GridLayout fills in when it normalises a
 *   document (`resizeable: false`).
 * - The selected tab of a stack, and the content visibility of grid items that
 *   follows from it, is view state: it is saved, but changing it is not an edit.
 */
const editKey = ({ componentState, layout }: WorkspaceSnapshotV1) =>
  stableStringify({
    componentState,
    layout: {
      ...layout,
      components: [...layout.components].sort(byId),
      layout: {
        ...layout.layout,
        items: layout.layout.items
          .map(({ contentVisible: _, resizeable = false, ...item }) => ({
            ...item,
            resizeable,
          }))
          .sort(byId),
        stacks: layout.layout.stacks
          .map(({ id, itemIds }) => ({ id, itemIds }))
          .sort(byId),
      },
    },
  });

export class WorkspaceController {
  readonly definitionId?: string;
  readonly documentController: GridLayoutDocumentController;
  readonly instanceId: string;
  name: string;
  readonly persistentState: WorkspacePersistentStateStore;
  readonly renderers: GridComponentRendererRegistry;
  readonly repository: WorkspaceRepository;
  readonly settingsCodecs: GridComponentSettingsRegistry;
  #disposed = false;
  #savingStructure = false;
  readonly #onError: (error: Error) => void;
  readonly #onEdit?: (snapshot: WorkspaceSnapshotV1) => void;
  #baseline: string | undefined;
  readonly #unsubscribe: () => void;

  constructor(options: WorkspaceControllerOptions) {
    this.definitionId = options.definitionId;
    this.instanceId = options.instanceId;
    this.name = options.name;
    this.renderers = options.renderers;
    this.settingsCodecs = options.settingsCodecs;
    this.#onError = options.onError;
    this.#onEdit = options.onEdit;
    this.repository = new WorkspaceRepository(
      options.service,
      options.instanceId,
      options.revision === undefined
        ? undefined
        : {
            revision: options.revision,
            snapshot: options.snapshot,
            version: 1,
            workspaceInstanceId: options.instanceId,
          },
    );
    // State is hydrated synchronously before the document can be rendered.
    this.persistentState = new WorkspacePersistentStateStore(
      options.snapshot.componentState,
    );
    this.documentController = new GridLayoutDocumentController(
      options.snapshot.layout,
    );
    if (this.#onEdit) {
      this.#baseline = editKey(this.snapshot);
    }
    this.#unsubscribe = this.persistentState.subscribe(() => {
      if (!this.#savingStructure) {
        this.#save();
      }
    });
  }

  get snapshot(): WorkspaceSnapshotV1 {
    const layout = this.documentController.getSnapshot();
    if (!layout) {
      throw new Error(`Workspace "${this.instanceId}" has no layout document`);
    }
    return {
      version: WORKSPACE_SNAPSHOT_VERSION,
      layout,
      componentState: this.persistentState.getSnapshot(),
    };
  }

  handleDocumentChange = (
    document: GridLayoutDocument,
    change: GridLayoutDocumentChange,
  ): void => {
    if (this.#disposed) {
      return;
    }
    this.documentController.replace(document);
    this.#savingStructure = true;
    try {
      for (const componentId of change.removedComponentInstanceIds) {
        this.persistentState.purge(componentId);
      }
    } finally {
      this.#savingStructure = false;
    }
    this.#save();
  };

  rename(name: string): void {
    this.name = name;
  }

  dispose(): Promise<void> {
    if (!this.#disposed) {
      this.#disposed = true;
      this.#unsubscribe();
      return this.repository.dispose();
    }
    return this.repository.dispose();
  }

  #save(): void {
    if (!this.#disposed) {
      const snapshot = this.snapshot;
      this.#notifyEdit(snapshot);
      void this.repository.save(snapshot).catch((cause: unknown) => {
        if (!this.#disposed) {
          this.#onError(
            cause instanceof Error
              ? cause
              : new Error("Workspace snapshot persistence failed"),
          );
        }
      });
    }
  }

  #notifyEdit(snapshot: WorkspaceSnapshotV1): void {
    if (!this.#onEdit) {
      return;
    }
    if (this.#baseline !== undefined) {
      if (editKey(snapshot) === this.#baseline) {
        return;
      }
      this.#baseline = undefined;
    }
    try {
      this.#onEdit(snapshot);
    } catch (cause: unknown) {
      this.#onError(
        cause instanceof Error ? cause : new Error("Workspace edit failed"),
      );
    }
  }
}
