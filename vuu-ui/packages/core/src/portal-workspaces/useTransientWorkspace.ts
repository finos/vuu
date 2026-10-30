import type {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
} from "@heswell/grid-layout";
import { useCallback, useMemo, useRef, useState } from "react";
import { WorkspaceController } from "../workspace/WorkspaceController";
import type { WorkspacePersistenceService } from "../workspace/WorkspacePersistenceService";
import {
  emptyWorkspaceSnapshot,
  useWorkspace,
} from "../workspace/WorkspaceProvider";
import type {
  ApplicationSessionV1,
  NamedWorkspaceDefinitionV1,
  NamedWorkspaceMetadataV1,
  WorkspaceSnapshotRecordV1,
  WorkspaceSnapshotV1,
} from "../workspace/workspace-schemas";

/**
 * A WorkspacePersistenceService that keeps everything in memory, for a
 * workspace that is not saved, e.g. a Browse page until "Save as workspace".
 */
export class MemoryWorkspacePersistenceService
  implements WorkspacePersistenceService
{
  readonly scope = {
    applicationId: "transient",
    applicationNamespace: "transient",
    userId: "transient",
  };
  #session: ApplicationSessionV1 | undefined;
  readonly #snapshots = new Map<string, WorkspaceSnapshotRecordV1>();
  readonly #definitions = new Map<string, NamedWorkspaceDefinitionV1>();

  async loadApplicationSession() {
    return this.#session;
  }
  async saveApplicationSession(session: ApplicationSessionV1) {
    this.#session = session;
  }
  async deleteApplicationSession() {
    this.#session = undefined;
  }
  async listWorkspaceSnapshots() {
    return Array.from(this.#snapshots.values());
  }
  async loadWorkspaceSnapshot(workspaceInstanceId: string) {
    return this.#snapshots.get(workspaceInstanceId);
  }
  async saveWorkspaceSnapshot(snapshot: WorkspaceSnapshotRecordV1) {
    this.#snapshots.set(snapshot.workspaceInstanceId, snapshot);
  }
  async deleteWorkspaceSnapshot(workspaceInstanceId: string) {
    this.#snapshots.delete(workspaceInstanceId);
  }
  async listNamedWorkspaceMetadata(): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > {
    return Array.from(this.#definitions.values()).map(
      ({ createdAt, description, id, name, updatedAt, version }) => ({
        createdAt,
        description,
        id,
        name,
        updatedAt,
        version,
      }),
    );
  }
  async loadNamedWorkspaceDefinition(id: string) {
    return this.#definitions.get(id);
  }
  async saveNamedWorkspaceDefinition(definition: NamedWorkspaceDefinitionV1) {
    this.#definitions.set(definition.id, definition);
  }
  async deleteNamedWorkspaceDefinition(id: string) {
    this.#definitions.delete(id);
  }
}

export interface TransientWorkspaceOptions {
  /** Defaults to the renderers of the enclosing `WorkspaceProvider`. */
  componentRenderers?: GridComponentRendererRegistry;
  name: string;
  /** Defaults to the codecs of the enclosing `WorkspaceProvider`. */
  settingsCodecs?: GridComponentSettingsRegistry;
  /** The initial layout. Default: an empty workspace. */
  snapshot?: WorkspaceSnapshotV1;
}

export interface TransientWorkspace {
  /** Render with `PortalWorkspaceGrid`, keyed by its `instanceId`. */
  readonly controller: WorkspaceController;
  /** True once the user has edited the layout. */
  readonly edited: boolean;
  /** Discards the layout, back to the initial snapshot. */
  readonly reset: () => void;
  /** The latest layout and component state. */
  readonly snapshot: WorkspaceSnapshotV1;
}

let transientInstanceCount = 0;

/**
 * A workspace that is kept in memory only: it is not in the user's
 * workspace list, and is lost when the page is left, unless it is saved,
 * e.g. with `createWorkspace(name, snapshot)`. Uses the component registries
 * of the enclosing `WorkspaceProvider`, unless given.
 */
export const useTransientWorkspace = ({
  componentRenderers,
  name,
  settingsCodecs,
  snapshot: initialSnapshot = emptyWorkspaceSnapshot,
}: TransientWorkspaceOptions): TransientWorkspace => {
  const workspace = useWorkspace();
  const renderers = componentRenderers ?? workspace.componentRenderers;
  const codecs = settingsCodecs ?? workspace.settingsCodecs;
  if (!renderers || !codecs) {
    throw Error(
      "useTransientWorkspace requires component renderers and settings codecs, from a WorkspaceProvider or as options",
    );
  }
  const [generation, setGeneration] = useState(0);
  const [state, setState] = useState<{
    edited: boolean;
    generation: number;
    snapshot: WorkspaceSnapshotV1;
  }>({ edited: false, generation: 0, snapshot: initialSnapshot });
  const nameRef = useRef(name);
  nameRef.current = name;

  // biome-ignore lint/correctness/useExhaustiveDependencies: a new controller per generation only
  const controller = useMemo(
    () =>
      new WorkspaceController({
        instanceId: `transient-${++transientInstanceCount}`,
        name: nameRef.current,
        onEdit: (snapshot) => setState({ edited: true, generation, snapshot }),
        onError: (error) =>
          console.warn("[TransientWorkspace] save failed", error),
        renderers,
        service: new MemoryWorkspacePersistenceService(),
        settingsCodecs: codecs,
        snapshot: initialSnapshot,
      }),
    [generation, renderers, codecs],
  );

  const reset = useCallback(() => {
    setGeneration((value) => value + 1);
  }, []);

  const current = state.generation === generation;
  return {
    controller,
    edited: current && state.edited,
    reset,
    snapshot: current ? state.snapshot : initialSnapshot,
  };
};
