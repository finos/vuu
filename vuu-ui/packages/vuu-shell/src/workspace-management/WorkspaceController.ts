import {
  GridLayoutDocumentController,
  type GridComponentRendererRegistry,
  type GridComponentSettingsRegistry,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
} from "@heswell/grid-layout";
import type { WorkspacePersistenceService } from "../persistence-manager";
import { WorkspacePersistentStateStore } from "./WorkspacePersistentState";
import { WorkspaceRepository } from "./WorkspaceRepository";
import {
  WORKSPACE_SNAPSHOT_VERSION,
  type WorkspaceSnapshotV1,
} from "./workspace-schemas";

export interface WorkspaceControllerOptions {
  readonly definitionId?: string;
  readonly instanceId: string;
  readonly name: string;
  readonly onError: (error: Error) => void;
  readonly renderers: GridComponentRendererRegistry;
  readonly service: WorkspacePersistenceService;
  readonly settingsCodecs: GridComponentSettingsRegistry;
  readonly snapshot: WorkspaceSnapshotV1;
  readonly revision?: number;
}

export class WorkspaceController {
  readonly definitionId?: string;
  readonly documentController: GridLayoutDocumentController;
  readonly instanceId: string;
  readonly name: string;
  readonly persistentState: WorkspacePersistentStateStore;
  readonly renderers: GridComponentRendererRegistry;
  readonly repository: WorkspaceRepository;
  readonly settingsCodecs: GridComponentSettingsRegistry;
  #disposed = false;
  #savingStructure = false;
  readonly #onError: (error: Error) => void;
  readonly #unsubscribe: () => void;

  constructor(options: WorkspaceControllerOptions) {
    this.definitionId = options.definitionId;
    this.instanceId = options.instanceId;
    this.name = options.name;
    this.renderers = options.renderers;
    this.settingsCodecs = options.settingsCodecs;
    this.#onError = options.onError;
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
      void this.repository.save(this.snapshot).catch((cause: unknown) => {
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
}
