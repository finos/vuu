import {
  GRID_LAYOUT_DOCUMENT_KIND,
  GRID_LAYOUT_DOCUMENT_VERSION,
  createSequentialGridLayoutIdAllocator,
  remapGridLayoutDocumentIds,
  type GridComponentRendererRegistry,
  type GridComponentSettingsRegistry,
  type GridLayoutDocument,
  type JsonValue,
} from "@vuu-ui/grid-layout";
import { useNotifications } from "@vuu-ui/vuu-notifications";
import type { LayoutJSON } from "@vuu-ui/vuu-utils";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";
import { useOptionalWorkspacePersistenceService } from "./WorkspacePersistenceContext";
import type { WorkspacePersistenceService } from "./WorkspacePersistenceService";
import { WorkspaceController } from "./WorkspaceController";
import {
  APPLICATION_SESSION_VERSION,
  NAMED_WORKSPACE_DEFINITION_VERSION,
  WORKSPACE_SNAPSHOT_VERSION,
  cloneWorkspaceValue,
  workspaceMetadata,
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type WorkspaceSnapshotV1,
} from "./workspace-schemas";

const emptyLayout: GridLayoutDocument = {
  components: [],
  kind: GRID_LAYOUT_DOCUMENT_KIND,
  layout: {
    columns: ["1fr"],
    id: "empty-workspace",
    items: [
      {
        column: { span: 1, start: 1 },
        id: "empty-workspace-placeholder",
        row: { span: 1, start: 1 },
      },
    ],
    placeholderIds: ["empty-workspace-placeholder"],
    rows: ["1fr"],
    stacks: [],
  },
  version: GRID_LAYOUT_DOCUMENT_VERSION,
};

export const emptyWorkspaceSnapshot: WorkspaceSnapshotV1 = {
  componentState: {},
  layout: emptyLayout,
  version: WORKSPACE_SNAPSHOT_VERSION,
};

export type WorkspaceStatus = "empty" | "error" | "loading" | "ready";

export type WorkspaceKind = "named" | "system";

/** A workspace entry suitable for listing in navigation. */
export interface WorkspaceSummary {
  readonly description?: string;
  readonly id: string;
  /**
   * True when a system workspace has been edited by the user, i.e. a
   * personal copy is shadowing the read-only system definition. Always
   * false for named workspaces.
   */
  readonly isModified: boolean;
  /** True when a per-user personal copy shadows this system workspace. */
  readonly isPersonalCopy: boolean;
  readonly kind: WorkspaceKind;
  readonly name: string;
  readonly updatedAt?: string;
}

export interface WorkspaceProps {
  /** @deprecated Migrate this layout to defaultWorkspace. */
  readonly activeLayoutIndex?: number;
  readonly componentRenderers?: GridComponentRendererRegistry;
  readonly defaultWorkspace?: WorkspaceSnapshotV1;
  /** @deprecated Migrate this layout to defaultWorkspace. */
  readonly layoutJSON?: LayoutJSON | readonly LayoutJSON[];
  /** @deprecated Workspace snapshots contain their own placeholders. */
  readonly layoutPlaceholderJSON?: LayoutJSON;
  readonly settingsCodecs?: GridComponentSettingsRegistry;
  /** @deprecated Tabs are managed by WorkspaceHost. */
  readonly showTabs?: boolean | "left" | "right";
  readonly systemWorkspaces?: readonly NamedWorkspaceDefinitionV1[];
  /** @deprecated Tabs are managed by WorkspaceHost. */
  readonly TabstripProps?: Readonly<Record<string, unknown>>;
  /** @deprecated Migrate this layout to defaultWorkspace. */
  readonly workspaceJSON?: LayoutJSON | readonly LayoutJSON[];
}

export interface WorkspaceProviderProps extends WorkspaceProps {
  readonly children: ReactNode;
  readonly persistenceService?: WorkspacePersistenceService;
  readonly userId?: string;
}

export interface WorkspaceContextValue {
  readonly activeWorkspace?: WorkspaceController;
  /** The system or named workspace id backing the active workspace instance. */
  readonly activeWorkspaceId: string | null;
  readonly activeWorkspaceInstanceId: string | null;
  readonly closeWorkspace: (instanceId: string) => Promise<void>;
  readonly componentRenderers?: GridComponentRendererRegistry;
  readonly controllers: readonly WorkspaceController[];
  readonly createWorkspaceFromSnapshot: (
    snapshot: WorkspaceSnapshotV1,
    title?: string,
  ) => Promise<string>;
  /** Creates, persists, opens and activates a new empty named workspace. Resolves to its id. */
  readonly createWorkspace: (name?: string) => Promise<string>;
  /** Deletes a named workspace and closes any open instance of it. System workspaces cannot be deleted. */
  readonly deleteNamedWorkspace: (definitionId: string) => Promise<void>;
  readonly error?: Error;
  readonly getApplicationSetting: (key: string) => JsonValue | undefined;
  readonly getApplicationSettings: (
    key?: string,
  ) => JsonValue | Readonly<Record<string, JsonValue>> | undefined;
  readonly namedWorkspaces: readonly NamedWorkspaceMetadataV1[];
  readonly openNamedWorkspace: (definitionId: string) => Promise<void>;
  readonly openSystemWorkspace: (
    definition: NamedWorkspaceDefinitionV1,
  ) => Promise<void>;
  /** Renames a named workspace and any open instance of it. System workspaces cannot be renamed. */
  readonly renameNamedWorkspace: (
    definitionId: string,
    name: string,
  ) => Promise<void>;
  readonly renameWorkspace: (
    instanceId: string,
    title: string,
  ) => Promise<void>;
  /** Discards the personal copy of a system workspace, restoring its default layout. */
  readonly resetToDefault: (workspaceId: string) => Promise<void>;
  /** Saves the active workspace as a new named workspace ("Save as new…"). Resolves to its id. */
  readonly saveActiveWorkspaceAs: (
    name: string,
    description?: string,
  ) => Promise<string>;
  readonly saveApplicationSettings: (
    settings: JsonValue,
    key?: string,
  ) => Promise<void>;
  readonly selectWorkspace: (instanceId: string) => Promise<void>;
  /** Activates the system or named workspace with this id, opening it if necessary. */
  readonly setActiveWorkspace: (workspaceId: string) => Promise<void>;
  readonly setApplicationSetting: (
    key: string,
    value: JsonValue,
  ) => Promise<void>;
  readonly settings: Readonly<Record<string, JsonValue>>;
  readonly settingsCodecs?: GridComponentSettingsRegistry;
  /** Identifies the authenticated persistence scope. Changes synchronously on a scope transition. */
  readonly scopeIdentity: string;
  readonly status: WorkspaceStatus;
  readonly systemWorkspaces: readonly NamedWorkspaceDefinitionV1[];
  readonly resetApplication: () => Promise<void>;
  /** System workspaces (with personal copies applied) followed by named workspaces. */
  readonly workspaces: readonly WorkspaceSummary[];
}

const missing = async () => {
  throw new Error("WorkspaceProvider is not mounted");
};

const WorkspaceContext = createContext<WorkspaceContextValue>({
  activeWorkspaceId: null,
  activeWorkspaceInstanceId: null,
  closeWorkspace: missing,
  createWorkspaceFromSnapshot: async () => {
    throw new Error("WorkspaceProvider is not mounted");
  },
  controllers: [],
  createWorkspace: missing,
  deleteNamedWorkspace: missing,
  getApplicationSetting: () => undefined,
  getApplicationSettings: () => undefined,
  namedWorkspaces: [],
  openNamedWorkspace: missing,
  openSystemWorkspace: missing,
  renameNamedWorkspace: missing,
  renameWorkspace: missing,
  resetToDefault: missing,
  saveActiveWorkspaceAs: missing,
  saveApplicationSettings: missing,
  selectWorkspace: missing,
  setActiveWorkspace: missing,
  setApplicationSetting: missing,
  settings: {},
  scopeIdentity: "missing",
  status: "loading",
  systemWorkspaces: [],
  resetApplication: missing,
  workspaces: [],
});

const NO_SYSTEM_WORKSPACES: readonly NamedWorkspaceDefinitionV1[] = [];

let nextWorkspaceInstance = 1;
const createInstanceId = () =>
  `workspace-${Date.now().toString(36)}-${nextWorkspaceInstance++}`;

const errorFrom = (cause: unknown, message: string) =>
  cause instanceof Error ? cause : new Error(message);

export class StaleWorkspaceScopeError extends Error {
  constructor() {
    super("Workspace operation belongs to an inactive persistence scope");
    this.name = "StaleWorkspaceScopeError";
  }
}

interface ScopeGuard {
  readonly generation: number;
  readonly scopeKey: string;
  readonly service: WorkspacePersistenceService;
}

const remapSnapshot = (
  source: WorkspaceSnapshotV1,
  instanceId: string,
): WorkspaceSnapshotV1 => {
  const { document, mappings } = remapGridLayoutDocumentIds(
    source.layout,
    createSequentialGridLayoutIdAllocator(instanceId),
  );
  const componentIds = new Map(
    mappings
      .filter(({ kind }) => kind === "component")
      .map(({ newId, oldId }) => [oldId, newId]),
  );
  return {
    version: WORKSPACE_SNAPSHOT_VERSION,
    layout: document,
    componentState: Object.fromEntries(
      Object.entries(source.componentState).map(([id, state]) => [
        componentIds.get(id) ?? id,
        cloneWorkspaceValue(state),
      ]),
    ),
  };
};

export const WorkspaceProvider = ({
  activeLayoutIndex,
  children,
  componentRenderers,
  defaultWorkspace,
  layoutJSON,
  layoutPlaceholderJSON,
  persistenceService: serviceProp,
  settingsCodecs,
  showTabs,
  systemWorkspaces = NO_SYSTEM_WORKSPACES,
  TabstripProps,
  userId,
  workspaceJSON,
}: WorkspaceProviderProps): ReactElement => {
  const inheritedService = useOptionalWorkspacePersistenceService();
  const service = serviceProp ?? inheritedService;
  const { showNotification } = useNotifications();
  const [controllers, setControllers] = useState<WorkspaceController[]>([]);
  const controllersRef = useRef<WorkspaceController[]>([]);
  const [session, setSession] = useState<ApplicationSessionV1>();
  const sessionRef = useRef<ApplicationSessionV1 | undefined>(undefined);
  // Metadata for every persisted definition, including personal copies of
  // system workspaces (which share the id of the system workspace they shadow).
  const [definitionMetadata, setDefinitionMetadataState] = useState<
    readonly NamedWorkspaceMetadataV1[]
  >([]);
  const definitionMetadataRef = useRef<readonly NamedWorkspaceMetadataV1[]>([]);
  const systemWorkspacesRef = useRef(systemWorkspaces);
  systemWorkspacesRef.current = systemWorkspaces;
  const adHocSystemWorkspaces = useRef(
    new Map<string, NamedWorkspaceDefinitionV1>(),
  );
  const definitionQueue = useRef<Promise<void>>(Promise.resolve());
  const pendingDefinitionSnapshots = useRef(
    new Map<string, WorkspaceSnapshotV1>(),
  );
  const [loadedScope, setLoadedScope] = useState<string>();
  const [loadError, setLoadError] = useState<Error>();
  const generation = useRef(0);
  const operationQueue = useRef<Promise<void>>(Promise.resolve());
  const resetGeneration = useRef(0);
  const resetPending = useRef(false);

  const scopeKey = service
    ? `${service.scope.applicationNamespace}/${service.scope.applicationId}/${service.scope.userId}/authenticated:${userId ?? service.scope.userId}`
    : "missing";
  const scopeIsValid =
    service !== undefined && (!userId || service.scope.userId === userId);
  const activeScope = useRef<{
    generation: number;
    scopeKey: string;
    service: WorkspacePersistenceService | undefined;
  }>({ generation: 0, scopeKey, service });
  if (
    activeScope.current.scopeKey !== scopeKey ||
    activeScope.current.service !== service
  ) {
    activeScope.current = {
      generation: ++generation.current,
      scopeKey,
      service,
    };
  }
  const status: WorkspaceStatus =
    loadedScope !== scopeKey
      ? "loading"
      : loadError
        ? "error"
        : controllers.length === 0
          ? "empty"
          : "ready";

  const notifyError = useCallback(
    (header: string, cause: unknown) => {
      const error = errorFrom(cause, header);
      showNotification({
        content: error.message,
        header,
        status: "error",
        type: "toast",
      });
      return error;
    },
    [showNotification],
  );

  const captureScope = useCallback(
    (
      expectedService: WorkspacePersistenceService | undefined = service,
      expectedScopeKey = scopeKey,
    ): ScopeGuard => {
      const active = activeScope.current;
      if (
        !expectedService ||
        active.service !== expectedService ||
        active.scopeKey !== expectedScopeKey ||
        active.generation !== generation.current
      ) {
        throw new StaleWorkspaceScopeError();
      }
      return {
        generation: active.generation,
        scopeKey: active.scopeKey,
        service: expectedService,
      };
    },
    [scopeKey, service],
  );

  const assertScope = useCallback((guard: ScopeGuard) => {
    const active = activeScope.current;
    if (
      generation.current !== guard.generation ||
      active.generation !== guard.generation ||
      active.scopeKey !== guard.scopeKey ||
      active.service !== guard.service
    ) {
      throw new StaleWorkspaceScopeError();
    }
  }, []);

  const replaceControllers = useCallback((next: WorkspaceController[]) => {
    controllersRef.current = next;
    setControllers(next);
  }, []);

  const setDefinitionMetadata = useCallback(
    (
      update: (
        current: readonly NamedWorkspaceMetadataV1[],
      ) => readonly NamedWorkspaceMetadataV1[],
    ) => {
      const next = update(definitionMetadataRef.current);
      definitionMetadataRef.current = next;
      setDefinitionMetadataState(next);
    },
    [],
  );

  const upsertDefinitionMetadata = useCallback(
    (definition: NamedWorkspaceDefinitionV1) => {
      const metadata = workspaceMetadata(definition);
      setDefinitionMetadata((current) =>
        current.some(({ id }) => id === metadata.id)
          ? current.map((entry) =>
              entry.id === metadata.id ? metadata : entry,
            )
          : [...current, metadata],
      );
    },
    [setDefinitionMetadata],
  );

  const findSystemWorkspace = useCallback(
    (id: string): NamedWorkspaceDefinitionV1 | undefined =>
      systemWorkspacesRef.current.find((definition) => definition.id === id) ??
      adHocSystemWorkspaces.current.get(id),
    [],
  );

  const enqueueDefinitionTask = useCallback(
    <T,>(guard: ScopeGuard, task: () => Promise<T>): Promise<T> => {
      assertScope(guard);
      const result = definitionQueue.current
        .catch(() => undefined)
        .then(async () => {
          assertScope(guard);
          return task();
        });
      definitionQueue.current = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    [assertScope],
  );

  /**
   * Persists edits to the definition backing a workspace instance. Edits to a
   * read-only system workspace transparently create (then update) a personal
   * copy which shadows it, keeping the system workspace id. Writes are
   * serialized and coalesced so only the latest snapshot is written.
   */
  const syncDefinition = useCallback(
    (
      guard: ScopeGuard,
      definitionId: string,
      snapshot: WorkspaceSnapshotV1,
    ) => {
      const pending = pendingDefinitionSnapshots.current;
      const alreadyQueued = pending.has(definitionId);
      pending.set(definitionId, snapshot);
      if (alreadyQueued) {
        return;
      }
      void enqueueDefinitionTask(guard, async () => {
        const latest = pending.get(definitionId);
        pending.delete(definitionId);
        const system = findSystemWorkspace(definitionId);
        const existing = definitionMetadataRef.current.find(
          ({ id }) => id === definitionId,
        );
        if (!latest || (!system && !existing)) {
          return;
        }
        const now = new Date().toISOString();
        const description = existing
          ? existing.description
          : system?.description;
        const definition: NamedWorkspaceDefinitionV1 = {
          createdAt: existing?.createdAt ?? now,
          ...(description === undefined ? {} : { description }),
          id: definitionId,
          name: existing?.name ?? system?.name ?? definitionId,
          snapshot: latest,
          updatedAt: now,
          version: NAMED_WORKSPACE_DEFINITION_VERSION,
        };
        await guard.service.saveNamedWorkspaceDefinition(definition);
        assertScope(guard);
        upsertDefinitionMetadata(definition);
      }).catch((cause: unknown) => {
        if (!(cause instanceof StaleWorkspaceScopeError)) {
          notifyError("Failed to Save Workspace", cause);
        }
      });
    },
    [
      assertScope,
      enqueueDefinitionTask,
      findSystemWorkspace,
      notifyError,
      upsertDefinitionMetadata,
    ],
  );

  useEffect(() => {
    for (const controller of controllersRef.current) {
      void controller.dispose();
    }
    controllersRef.current = [];
    setControllers([]);
    setSession(undefined);
    sessionRef.current = undefined;
    setDefinitionMetadata(() => []);
    definitionQueue.current = Promise.resolve();
    pendingDefinitionSnapshots.current.clear();
    adHocSystemWorkspaces.current.clear();
    setLoadError(undefined);
    setLoadedScope(undefined);
    operationQueue.current = Promise.resolve();
    resetGeneration.current = 0;
    resetPending.current = false;

    if (!service) {
      const error = notifyError(
        "Workspace Persistence Is Not Configured",
        new Error("Shell requires an injected WorkspacePersistenceService"),
      );
      setLoadError(error);
      setLoadedScope(scopeKey);
      return;
    }
    const legacyProps = [
      activeLayoutIndex === undefined ? undefined : "activeLayoutIndex",
      layoutJSON === undefined ? undefined : "layoutJSON",
      layoutPlaceholderJSON === undefined ? undefined : "layoutPlaceholderJSON",
      showTabs === undefined ? undefined : "showTabs",
      TabstripProps === undefined ? undefined : "TabstripProps",
      workspaceJSON === undefined ? undefined : "workspaceJSON",
    ].filter((name): name is string => name !== undefined);
    if (legacyProps.length > 0) {
      const error = notifyError(
        "Legacy Workspace Configuration Is Not Supported",
        new Error(
          `WorkspaceProvider no longer accepts ${legacyProps.join(", ")}; inject a WorkspacePersistenceService and provide defaultWorkspace as a versioned snapshot`,
        ),
      );
      setLoadError(error);
      setLoadedScope(scopeKey);
      return;
    }
    if (!scopeIsValid) {
      const error = notifyError(
        "Workspace Scope Does Not Match",
        new Error(
          `Workspace persistence scope "${service.scope.userId}" does not match authenticated user "${userId}"`,
        ),
      );
      setLoadError(error);
      setLoadedScope(scopeKey);
      return;
    }
    const guard = captureScope();

    const load = async () => {
      const restored: WorkspaceController[] = [];
      try {
        assertScope(guard);
        const [loadedSession, metadata] = await Promise.all([
          guard.service.loadApplicationSession(),
          guard.service.listNamedWorkspaceMetadata(),
        ]);
        assertScope(guard);
        if (loadedSession) {
          const descriptors = new Map(
            loadedSession.openWorkspaces.map((entry) => [
              entry.instanceId,
              entry,
            ]),
          );
          for (const instanceId of loadedSession.workspaceOrder) {
            const descriptor = descriptors.get(instanceId);
            if (!descriptor) {
              throw new Error(
                `Session references missing workspace "${instanceId}"`,
              );
            }
            assertScope(guard);
            const record = await guard.service.loadWorkspaceSnapshot(
              descriptor.snapshotId,
            );
            assertScope(guard);
            if (!record) {
              throw new Error(
                `Snapshot for workspace "${instanceId}" was not found`,
              );
            }
            const definitionMetadata = metadata.find(
              ({ id }) => id === descriptor.definitionId,
            );
            restored.push(
              new WorkspaceController({
                definitionId: descriptor.definitionId,
                instanceId,
                name:
                  descriptor.title ?? definitionMetadata?.name ?? instanceId,
                onEdit:
                  descriptor.definitionId === undefined
                    ? undefined
                    : (edited) =>
                        syncDefinition(
                          guard,
                          descriptor.definitionId as string,
                          edited,
                        ),
                onError: (error) => {
                  try {
                    assertScope(guard);
                    notifyError("Failed to Save Workspace", error);
                  } catch {
                    // A disposed controller may finish an in-flight write.
                  }
                },
                renderers:
                  componentRenderers ??
                  (() => {
                    throw new Error(
                      "Workspace component renderers are required",
                    );
                  })(),
                service: guard.service,
                revision: record.revision,
                settingsCodecs:
                  settingsCodecs ??
                  (() => {
                    throw new Error("Workspace settings codecs are required");
                  })(),
                snapshot: record.snapshot,
              }),
            );
          }
        }
        let resolvedSession: ApplicationSessionV1 = loadedSession ?? {
          activeWorkspaceInstanceId: null,
          openWorkspaces: [],
          settings: {},
          version: APPLICATION_SESSION_VERSION,
          workspaceOrder: [],
        };
        if (!loadedSession && defaultWorkspace) {
          if (!componentRenderers || !settingsCodecs) {
            throw new Error(
              "Default workspace requires component renderers and settings codecs",
            );
          }
          const instanceId = createInstanceId();
          const initialSnapshot = remapSnapshot(defaultWorkspace, instanceId);
          const controller = new WorkspaceController({
            instanceId,
            name: "Workspace",
            onError: (error) => {
              try {
                assertScope(guard);
                notifyError("Failed to Save Workspace", error);
              } catch {
                // A disposed controller may finish an in-flight write.
              }
            },
            renderers: componentRenderers,
            service: guard.service,
            settingsCodecs,
            snapshot: initialSnapshot,
          });
          assertScope(guard);
          await controller.repository.save(initialSnapshot);
          assertScope(guard);
          restored.push(controller);
          resolvedSession = {
            activeWorkspaceInstanceId: instanceId,
            openWorkspaces: [
              { instanceId, snapshotId: instanceId, title: "Workspace" },
            ],
            settings: {},
            version: APPLICATION_SESSION_VERSION,
            workspaceOrder: [instanceId],
          };
          await guard.service.saveApplicationSession(resolvedSession);
          assertScope(guard);
        }
        assertScope(guard);
        replaceControllers(restored);
        sessionRef.current = resolvedSession;
        setSession(resolvedSession);
        setDefinitionMetadata(() => metadata);
        setLoadedScope(scopeKey);
      } catch (cause: unknown) {
        restored.forEach((controller) => {
          void controller.dispose();
        });
        if (!(cause instanceof StaleWorkspaceScopeError)) {
          try {
            assertScope(guard);
            const error = notifyError("Failed to Load Workspaces", cause);
            setLoadError(error);
            setLoadedScope(scopeKey);
          } catch {
            // The load failed after its scope was replaced.
          }
        }
      }
    };
    void load();
    return () => {
      if (activeScope.current.generation === guard.generation) {
        activeScope.current = {
          ...activeScope.current,
          generation: ++generation.current,
        };
      }
      for (const controller of controllersRef.current) {
        void controller.dispose();
      }
      controllersRef.current = [];
    };
  }, [
    componentRenderers,
    activeLayoutIndex,
    assertScope,
    captureScope,
    defaultWorkspace,
    layoutJSON,
    layoutPlaceholderJSON,
    notifyError,
    replaceControllers,
    scopeIsValid,
    scopeKey,
    service,
    setDefinitionMetadata,
    settingsCodecs,
    showTabs,
    syncDefinition,
    TabstripProps,
    userId,
    workspaceJSON,
  ]);

  const writeSession = useCallback(
    async (next: ApplicationSessionV1, guard: ScopeGuard) => {
      assertScope(guard);
      await guard.service.saveApplicationSession(next);
      assertScope(guard);
      sessionRef.current = next;
      setSession(next);
    },
    [assertScope],
  );

  const enqueueOperation = useCallback(
    <T,>(guard: ScopeGuard, operation: () => Promise<T>): Promise<T> => {
      assertScope(guard);
      if (resetPending.current) {
        return Promise.reject(
          new Error("Workspace operation was blocked by application reset"),
        );
      }
      const expectedResetGeneration = resetGeneration.current;
      const result = operationQueue.current
        .catch(() => undefined)
        .then(async () => {
          assertScope(guard);
          if (resetGeneration.current !== expectedResetGeneration) {
            throw new Error(
              "Workspace operation was invalidated by application reset",
            );
          }
          return operation();
        });
      operationQueue.current = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    [assertScope],
  );

  const addWorkspace = useCallback(
    async (
      sourceSnapshot: WorkspaceSnapshotV1,
      name: string,
      definitionId?: string,
      operationGuard?: ScopeGuard,
    ): Promise<string> => {
      if (!service || !componentRenderers || !settingsCodecs) {
        throw new Error("Workspace runtime is not configured");
      }
      const guard = operationGuard ?? captureScope();
      return enqueueOperation(guard, async () => {
        assertScope(guard);
        const instanceId = createInstanceId();
        const snapshot = remapSnapshot(sourceSnapshot, instanceId);
        const controller = new WorkspaceController({
          definitionId,
          instanceId,
          name,
          onError: (error) =>
            void notifyError("Failed to Save Workspace", error),
          onEdit:
            definitionId === undefined
              ? undefined
              : (edited) => syncDefinition(guard, definitionId, edited),
          renderers: componentRenderers,
          service: guard.service,
          settingsCodecs,
          snapshot,
        });
        await controller.repository.save(snapshot);
        assertScope(guard);
        const current = sessionRef.current ?? {
          activeWorkspaceInstanceId: null,
          openWorkspaces: [],
          settings: {},
          version: APPLICATION_SESSION_VERSION,
          workspaceOrder: [],
        };
        try {
          await writeSession(
            {
              ...current,
              activeWorkspaceInstanceId: instanceId,
              openWorkspaces: [
                ...current.openWorkspaces,
                {
                  ...(definitionId === undefined ? {} : { definitionId }),
                  instanceId,
                  snapshotId: instanceId,
                  title: name,
                },
              ],
              workspaceOrder: [...current.workspaceOrder, instanceId],
            },
            guard,
          );
          assertScope(guard);
          replaceControllers([...controllersRef.current, controller]);
        } catch (cause: unknown) {
          await controller.dispose();
          assertScope(guard);
          await guard.service.deleteWorkspaceSnapshot(instanceId);
          assertScope(guard);
          throw errorFrom(cause, "Failed to save application session");
        }
        return instanceId;
      });
    },
    [
      componentRenderers,
      assertScope,
      captureScope,
      enqueueOperation,
      notifyError,
      replaceControllers,
      service,
      settingsCodecs,
      syncDefinition,
      writeSession,
    ],
  );

  const addDefinition = useCallback(
    (definition: NamedWorkspaceDefinitionV1, operationGuard?: ScopeGuard) =>
      addWorkspace(
        definition.snapshot,
        definition.name,
        definition.id,
        operationGuard,
      ),
    [addWorkspace],
  );

  /** Resolves a system workspace to its personal copy, when one exists. */
  const resolveSystemDefinition = useCallback(
    async (
      definition: NamedWorkspaceDefinitionV1,
      guard: ScopeGuard,
    ): Promise<NamedWorkspaceDefinitionV1> => {
      if (
        !definitionMetadataRef.current.some(({ id }) => id === definition.id)
      ) {
        return definition;
      }
      const personalCopy = await guard.service.loadNamedWorkspaceDefinition(
        definition.id,
      );
      assertScope(guard);
      return personalCopy ?? definition;
    },
    [assertScope],
  );

  const openSystemWorkspace = useCallback(
    async (definition: NamedWorkspaceDefinitionV1): Promise<void> => {
      const guard = captureScope();
      if (!systemWorkspacesRef.current.some(({ id }) => id === definition.id)) {
        adHocSystemWorkspaces.current.set(definition.id, definition);
      }
      await addDefinition(
        await resolveSystemDefinition(definition, guard),
        guard,
      );
    },
    [addDefinition, captureScope, resolveSystemDefinition],
  );

  const createWorkspaceFromSnapshot = useCallback(
    async (
      snapshot: WorkspaceSnapshotV1,
      title = "Untitled",
    ): Promise<string> => {
      try {
        return await addWorkspace(snapshot, title);
      } catch (cause: unknown) {
        if (!(cause instanceof StaleWorkspaceScopeError)) {
          notifyError("Failed to Create Workspace", cause);
        }
        throw cause;
      }
    },
    [addWorkspace, notifyError],
  );

  const openNamedWorkspace = useCallback(
    async (definitionId: string) => {
      if (!service) {
        throw new Error("Workspace persistence service is not configured");
      }
      const guard = captureScope();
      const expectedResetGeneration = resetGeneration.current;
      try {
        assertScope(guard);
        const definition =
          await guard.service.loadNamedWorkspaceDefinition(definitionId);
        assertScope(guard);
        if (resetGeneration.current !== expectedResetGeneration) {
          throw new Error(
            "Workspace operation was invalidated by application reset",
          );
        }
        if (!definition) {
          throw new Error(
            `Workspace definition "${definitionId}" was not found`,
          );
        }
        await addDefinition(definition, guard);
      } catch (cause: unknown) {
        if (!(cause instanceof StaleWorkspaceScopeError)) {
          notifyError("Failed to Open Workspace", cause);
        }
      }
    },
    [addDefinition, assertScope, captureScope, notifyError, service],
  );

  const selectWorkspace = useCallback(
    async (instanceId: string) => {
      const guard = captureScope();
      await enqueueOperation(guard, async () => {
        const current = sessionRef.current;
        if (!current || !current.workspaceOrder.includes(instanceId)) {
          throw new Error(`Workspace "${instanceId}" is not open`);
        }
        await writeSession(
          {
            ...current,
            activeWorkspaceInstanceId: instanceId,
          },
          guard,
        );
      });
    },
    [captureScope, enqueueOperation, writeSession],
  );

  const renameWorkspace = useCallback(
    async (instanceId: string, title: string) => {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new Error("Workspace title must not be empty");
      }
      const guard = captureScope();
      try {
        await enqueueOperation(guard, async () => {
          const current = sessionRef.current;
          const controller = controllersRef.current.find(
            (candidate) => candidate.instanceId === instanceId,
          );
          if (!current || !controller) {
            throw new Error(`Workspace "${instanceId}" is not open`);
          }
          await writeSession(
            {
              ...current,
              openWorkspaces: current.openWorkspaces.map((workspace) =>
                workspace.instanceId === instanceId
                  ? { ...workspace, title: trimmedTitle }
                  : workspace,
              ),
            },
            guard,
          );
          assertScope(guard);
          controller.rename(trimmedTitle);
          replaceControllers([...controllersRef.current]);
        });
      } catch (cause: unknown) {
        if (!(cause instanceof StaleWorkspaceScopeError)) {
          notifyError("Failed to Rename Workspace", cause);
        }
        throw cause;
      }
    },
    [
      assertScope,
      captureScope,
      enqueueOperation,
      notifyError,
      replaceControllers,
      writeSession,
    ],
  );

  const closeWorkspace = useCallback(
    async (instanceId: string) => {
      if (!service) {
        throw new Error("Workspace persistence service is not configured");
      }
      const guard = captureScope();
      await enqueueOperation(guard, async () => {
        const current = sessionRef.current;
        const controller = controllersRef.current.find(
          (candidate) => candidate.instanceId === instanceId,
        );
        if (!current || !controller) {
          return;
        }
        const nextControllers = controllersRef.current.filter(
          (candidate) => candidate !== controller,
        );
        const closedIndex = current.workspaceOrder.indexOf(instanceId);
        const order = current.workspaceOrder.filter((id) => id !== instanceId);
        const active =
          current.activeWorkspaceInstanceId === instanceId
            ? (order[Math.min(closedIndex, order.length - 1)] ?? null)
            : current.activeWorkspaceInstanceId;
        await writeSession(
          {
            ...current,
            activeWorkspaceInstanceId: active,
            openWorkspaces: current.openWorkspaces.filter(
              ({ instanceId: id }) => id !== instanceId,
            ),
            workspaceOrder: order,
          },
          guard,
        );
        assertScope(guard);
        await controller.dispose();
        replaceControllers(nextControllers);
        await guard.service.deleteWorkspaceSnapshot(instanceId);
        assertScope(guard);
      });
    },
    [
      assertScope,
      captureScope,
      enqueueOperation,
      replaceControllers,
      service,
      writeSession,
    ],
  );

  const deleteNamedWorkspace = useCallback(
    async (definitionId: string) => {
      if (!service) {
        throw new Error("Workspace persistence service is not configured");
      }
      if (findSystemWorkspace(definitionId)) {
        throw new Error(
          `System workspace "${definitionId}" cannot be deleted; use resetToDefault to discard a personal copy`,
        );
      }
      const guard = captureScope();
      for (const controller of controllersRef.current.filter(
        (candidate) => candidate.definitionId === definitionId,
      )) {
        await closeWorkspace(controller.instanceId);
      }
      await enqueueDefinitionTask(guard, async () => {
        pendingDefinitionSnapshots.current.delete(definitionId);
        await guard.service.deleteNamedWorkspaceDefinition(definitionId);
        assertScope(guard);
        setDefinitionMetadata((current) =>
          current.filter(({ id }) => id !== definitionId),
        );
      });
    },
    [
      assertScope,
      captureScope,
      closeWorkspace,
      enqueueDefinitionTask,
      findSystemWorkspace,
      service,
      setDefinitionMetadata,
    ],
  );

  const saveActiveWorkspaceAs = useCallback(
    async (name: string, description?: string) => {
      if (!service) {
        throw new Error("Workspace persistence service is not configured");
      }
      const guard = captureScope();
      assertScope(guard);
      const activeId = sessionRef.current?.activeWorkspaceInstanceId;
      const active = controllersRef.current.find(
        ({ instanceId }) => instanceId === activeId,
      );
      if (!active) {
        throw new Error("There is no active workspace to save");
      }
      const now = new Date().toISOString();
      const id = createInstanceId();
      const definition: NamedWorkspaceDefinitionV1 = {
        createdAt: now,
        ...(description === undefined ? {} : { description }),
        id,
        name,
        snapshot: active.snapshot,
        updatedAt: now,
        version: NAMED_WORKSPACE_DEFINITION_VERSION,
      };
      await enqueueDefinitionTask(guard, async () => {
        await guard.service.saveNamedWorkspaceDefinition(definition);
        assertScope(guard);
        upsertDefinitionMetadata(definition);
      });
      return id;
    },
    [
      assertScope,
      captureScope,
      enqueueDefinitionTask,
      service,
      upsertDefinitionMetadata,
    ],
  );

  const createWorkspace = useCallback(
    async (name = "Untitled"): Promise<string> => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Workspace name must not be empty");
      }
      const guard = captureScope();
      const now = new Date().toISOString();
      const definition: NamedWorkspaceDefinitionV1 = {
        createdAt: now,
        id: createInstanceId(),
        name: trimmedName,
        snapshot: emptyWorkspaceSnapshot,
        updatedAt: now,
        version: NAMED_WORKSPACE_DEFINITION_VERSION,
      };
      await enqueueDefinitionTask(guard, async () => {
        await guard.service.saveNamedWorkspaceDefinition(definition);
        assertScope(guard);
        upsertDefinitionMetadata(definition);
      });
      await addDefinition(definition, guard);
      return definition.id;
    },
    [
      addDefinition,
      assertScope,
      captureScope,
      enqueueDefinitionTask,
      upsertDefinitionMetadata,
    ],
  );

  const renameNamedWorkspace = useCallback(
    async (definitionId: string, name: string) => {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new Error("Workspace name must not be empty");
      }
      if (findSystemWorkspace(definitionId)) {
        throw new Error(`System workspace "${definitionId}" cannot be renamed`);
      }
      const guard = captureScope();
      await enqueueDefinitionTask(guard, async () => {
        const definition =
          await guard.service.loadNamedWorkspaceDefinition(definitionId);
        assertScope(guard);
        if (!definition) {
          throw new Error(
            `Workspace definition "${definitionId}" was not found`,
          );
        }
        const renamed: NamedWorkspaceDefinitionV1 = {
          ...definition,
          name: trimmedName,
          updatedAt: new Date().toISOString(),
        };
        await guard.service.saveNamedWorkspaceDefinition(renamed);
        assertScope(guard);
        upsertDefinitionMetadata(renamed);
      });
      for (const controller of controllersRef.current.filter(
        (candidate) => candidate.definitionId === definitionId,
      )) {
        await renameWorkspace(controller.instanceId, trimmedName);
      }
    },
    [
      assertScope,
      captureScope,
      enqueueDefinitionTask,
      findSystemWorkspace,
      renameWorkspace,
      upsertDefinitionMetadata,
    ],
  );

  const resetToDefault = useCallback(
    async (workspaceId: string) => {
      const system = findSystemWorkspace(workspaceId);
      if (!system) {
        throw new Error(`"${workspaceId}" is not a system workspace`);
      }
      if (!componentRenderers || !settingsCodecs) {
        throw new Error("Workspace runtime is not configured");
      }
      const guard = captureScope();
      // Replace open instances first so their controllers can no longer
      // write to the personal copy we are about to discard.
      await enqueueOperation(guard, async () => {
        const current = sessionRef.current;
        const targets = controllersRef.current.filter(
          ({ definitionId }) => definitionId === workspaceId,
        );
        if (!current || targets.length === 0) {
          return;
        }
        const replacements = new Map<
          WorkspaceController,
          WorkspaceController
        >();
        try {
          for (const target of targets) {
            const instanceId = createInstanceId();
            const snapshot = remapSnapshot(system.snapshot, instanceId);
            const controller = new WorkspaceController({
              definitionId: workspaceId,
              instanceId,
              name: system.name,
              onEdit: (edited) => syncDefinition(guard, workspaceId, edited),
              onError: (error) =>
                void notifyError("Failed to Save Workspace", error),
              renderers: componentRenderers,
              service: guard.service,
              settingsCodecs,
              snapshot,
            });
            replacements.set(target, controller);
            await controller.repository.save(snapshot);
            assertScope(guard);
          }
          const instanceIds = new Map(
            [...replacements].map(([previous, next]) => [
              previous.instanceId,
              next.instanceId,
            ]),
          );
          await writeSession(
            {
              ...current,
              activeWorkspaceInstanceId:
                current.activeWorkspaceInstanceId === null
                  ? null
                  : (instanceIds.get(current.activeWorkspaceInstanceId) ??
                    current.activeWorkspaceInstanceId),
              openWorkspaces: current.openWorkspaces.map((workspace) => {
                const instanceId = instanceIds.get(workspace.instanceId);
                return instanceId === undefined
                  ? workspace
                  : {
                      ...workspace,
                      instanceId,
                      snapshotId: instanceId,
                      title: system.name,
                    };
              }),
              workspaceOrder: current.workspaceOrder.map(
                (id) => instanceIds.get(id) ?? id,
              ),
            },
            guard,
          );
        } catch (cause: unknown) {
          for (const controller of replacements.values()) {
            await controller.dispose();
            await guard.service.deleteWorkspaceSnapshot(controller.instanceId);
          }
          throw cause;
        }
        replaceControllers(
          controllersRef.current.map(
            (controller) => replacements.get(controller) ?? controller,
          ),
        );
        for (const previous of replacements.keys()) {
          await previous.dispose();
          assertScope(guard);
          await guard.service.deleteWorkspaceSnapshot(previous.instanceId);
          assertScope(guard);
        }
      });
      await enqueueDefinitionTask(guard, async () => {
        pendingDefinitionSnapshots.current.delete(workspaceId);
        if (
          definitionMetadataRef.current.some(({ id }) => id === workspaceId)
        ) {
          await guard.service.deleteNamedWorkspaceDefinition(workspaceId);
          assertScope(guard);
          setDefinitionMetadata((current) =>
            current.filter(({ id }) => id !== workspaceId),
          );
        }
      });
    },
    [
      assertScope,
      captureScope,
      componentRenderers,
      enqueueDefinitionTask,
      enqueueOperation,
      findSystemWorkspace,
      notifyError,
      replaceControllers,
      setDefinitionMetadata,
      settingsCodecs,
      syncDefinition,
      writeSession,
    ],
  );

  const setActiveWorkspace = useCallback(
    async (workspaceId: string) => {
      const open = controllersRef.current.find(
        ({ definitionId }) => definitionId === workspaceId,
      );
      if (open) {
        await selectWorkspace(open.instanceId);
        return;
      }
      const guard = captureScope();
      const system = findSystemWorkspace(workspaceId);
      let definition: NamedWorkspaceDefinitionV1 | undefined;
      if (system) {
        definition = await resolveSystemDefinition(system, guard);
      } else {
        definition =
          await guard.service.loadNamedWorkspaceDefinition(workspaceId);
        assertScope(guard);
      }
      if (!definition) {
        throw new Error(`Workspace "${workspaceId}" was not found`);
      }
      await addDefinition(definition, guard);
    },
    [
      addDefinition,
      assertScope,
      captureScope,
      findSystemWorkspace,
      resolveSystemDefinition,
      selectWorkspace,
    ],
  );

  const setApplicationSetting = useCallback(
    async (key: string, value: JsonValue) => {
      const guard = captureScope();
      await enqueueOperation(guard, async () => {
        const current = sessionRef.current;
        if (!current) {
          throw new Error("Application session has not loaded");
        }
        await writeSession(
          {
            ...current,
            settings: { ...current.settings, [key]: value },
          },
          guard,
        );
      });
    },
    [captureScope, enqueueOperation, writeSession],
  );

  const saveApplicationSettings = useCallback(
    async (value: JsonValue, key?: string) => {
      if (key !== undefined) {
        await setApplicationSetting(key, value);
        return;
      }
      if (typeof value !== "object" || value === null || Array.isArray(value)) {
        throw new Error("Application settings must be a JSON object");
      }
      const guard = captureScope();
      await enqueueOperation(guard, async () => {
        const current = sessionRef.current;
        if (!current) {
          throw new Error("Application session has not loaded");
        }
        await writeSession(
          {
            ...current,
            settings: value as Readonly<Record<string, JsonValue>>,
          },
          guard,
        );
      });
    },
    [captureScope, enqueueOperation, setApplicationSetting, writeSession],
  );

  const resetApplication = useCallback(async () => {
    const guard = captureScope();
    assertScope(guard);
    if (resetPending.current) {
      throw new Error("Application reset is already in progress");
    }
    resetPending.current = true;
    resetGeneration.current += 1;
    const reset = operationQueue.current
      .catch(() => undefined)
      .then(async () => {
        assertScope(guard);
        const instanceIds =
          sessionRef.current?.openWorkspaces.map(
            ({ snapshotId }) => snapshotId,
          ) ?? [];
        await guard.service.deleteApplicationSession();
        assertScope(guard);
        await Promise.all(
          controllersRef.current.map((controller) => controller.dispose()),
        );
        replaceControllers([]);
        const emptySession: ApplicationSessionV1 = {
          activeWorkspaceInstanceId: null,
          openWorkspaces: [],
          settings: {},
          version: APPLICATION_SESSION_VERSION,
          workspaceOrder: [],
        };
        sessionRef.current = emptySession;
        setSession(emptySession);
        for (const snapshotId of instanceIds) {
          assertScope(guard);
          await guard.service.deleteWorkspaceSnapshot(snapshotId);
          assertScope(guard);
        }
      });
    operationQueue.current = reset.then(
      () => undefined,
      () => undefined,
    );
    try {
      await reset;
    } finally {
      if (
        activeScope.current.generation === guard.generation &&
        activeScope.current.scopeKey === guard.scopeKey
      ) {
        resetPending.current = false;
      }
    }
  }, [assertScope, captureScope, replaceControllers]);

  const { namedWorkspaces, workspaces } = useMemo(() => {
    const systemIds = new Set(systemWorkspaces.map(({ id }) => id));
    const metadataById = new Map(
      definitionMetadata.map((metadata) => [metadata.id, metadata]),
    );
    const named = definitionMetadata.filter(({ id }) => !systemIds.has(id));
    const summaries: WorkspaceSummary[] = [
      ...systemWorkspaces.map((definition): WorkspaceSummary => {
        const personalCopy = metadataById.get(definition.id);
        const description = personalCopy
          ? personalCopy.description
          : definition.description;
        return {
          ...(description === undefined ? {} : { description }),
          id: definition.id,
          isModified: personalCopy !== undefined,
          isPersonalCopy: personalCopy !== undefined,
          kind: "system",
          name: personalCopy?.name ?? definition.name,
          updatedAt: personalCopy?.updatedAt ?? definition.updatedAt,
        };
      }),
      ...named.map(
        ({ description, id, name, updatedAt }): WorkspaceSummary => ({
          ...(description === undefined ? {} : { description }),
          id,
          isModified: false,
          isPersonalCopy: false,
          kind: "named",
          name,
          updatedAt,
        }),
      ),
    ];
    return { namedWorkspaces: named, workspaces: summaries };
  }, [definitionMetadata, systemWorkspaces]);

  const value = useMemo<WorkspaceContextValue>(() => {
    const settings = session?.settings ?? {};
    const visibleControllers = status === "loading" ? [] : controllers;
    const activeWorkspace = visibleControllers.find(
      ({ instanceId }) => instanceId === session?.activeWorkspaceInstanceId,
    );
    return {
      activeWorkspace,
      activeWorkspaceId: activeWorkspace?.definitionId ?? null,
      activeWorkspaceInstanceId: session?.activeWorkspaceInstanceId ?? null,
      closeWorkspace,
      componentRenderers,
      controllers: visibleControllers,
      createWorkspace,
      createWorkspaceFromSnapshot,
      deleteNamedWorkspace,
      error: loadError,
      getApplicationSetting: (key) => settings[key],
      getApplicationSettings: (key) =>
        key === undefined ? settings : settings[key],
      namedWorkspaces,
      openNamedWorkspace,
      openSystemWorkspace,
      renameNamedWorkspace,
      renameWorkspace,
      resetToDefault,
      saveActiveWorkspaceAs,
      saveApplicationSettings,
      selectWorkspace,
      setActiveWorkspace,
      setApplicationSetting,
      settings,
      settingsCodecs,
      scopeIdentity: scopeKey,
      status,
      systemWorkspaces,
      resetApplication,
      workspaces,
    };
  }, [
    closeWorkspace,
    componentRenderers,
    controllers,
    createWorkspace,
    createWorkspaceFromSnapshot,
    deleteNamedWorkspace,
    loadError,
    namedWorkspaces,
    openNamedWorkspace,
    openSystemWorkspace,
    renameNamedWorkspace,
    renameWorkspace,
    resetToDefault,
    saveActiveWorkspaceAs,
    saveApplicationSettings,
    selectWorkspace,
    session,
    setActiveWorkspace,
    setApplicationSetting,
    settingsCodecs,
    scopeKey,
    status,
    systemWorkspaces,
    resetApplication,
    workspaces,
  ]);

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextValue =>
  useContext(WorkspaceContext);
