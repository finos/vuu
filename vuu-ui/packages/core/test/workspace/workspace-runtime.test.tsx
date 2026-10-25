import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  type GridLayoutDocument,
} from "@vuu-ui/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  UserPersistenceScope,
  WorkspacePersistenceService,
} from "../../src/workspace";
import {
  WorkspaceController,
  WorkspaceProvider,
  useWorkspace,
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type WorkspaceContextValue,
  type WorkspaceSnapshotRecordV1,
  type WorkspaceSnapshotV1,
} from "../../src/workspace";

const layout = (id: string): GridLayoutDocument => ({
  components: [],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id,
    items: [],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
});

const snapshot = (id: string): WorkspaceSnapshotV1 => ({
  componentState: {
    stateful: {
      componentType: "test",
      schemaVersion: 1,
      value: { hydrated: true },
    },
  },
  layout: layout(id),
  version: 1,
});

const droppedSnapshot = (id: string): WorkspaceSnapshotV1 => ({
  componentState: {},
  layout: {
    components: [
      {
        id: "dropped-component",
        settings: { label: "Dropped feature" },
        type: "test",
        version: 1,
      },
    ],
    kind: "grid-layout",
    layout: {
      columns: ["1fr"],
      id,
      items: [
        {
          column: { span: 1, start: 1 },
          id: "dropped-component",
          row: { span: 1, start: 1 },
        },
      ],
      placeholderIds: [],
      rows: ["1fr"],
      stacks: [],
    },
    version: 2,
  },
  version: 1,
});

const definition = (id: string): NamedWorkspaceDefinitionV1 => ({
  createdAt: "2026-01-01T00:00:00.000Z",
  id,
  name: id.toUpperCase(),
  snapshot: snapshot(id),
  updatedAt: "2026-01-01T00:00:00.000Z",
  version: 1,
});

class MemoryService implements WorkspacePersistenceService {
  readonly definitions = new Map<string, NamedWorkspaceDefinitionV1>();
  readonly scope: UserPersistenceScope;
  readonly snapshots = new Map<string, WorkspaceSnapshotRecordV1>();
  session: ApplicationSessionV1 | undefined;

  constructor(
    userId = "alice",
    definitions: NamedWorkspaceDefinitionV1[] = [],
  ) {
    this.scope = {
      applicationId: "test",
      applicationNamespace: "finos",
      userId,
    };
    definitions.forEach((item) => {
      this.definitions.set(item.id, item);
    });
  }

  loadApplicationSession = async () => this.session;
  saveApplicationSession = async (session: ApplicationSessionV1) => {
    this.session = session;
  };
  deleteApplicationSession = async () => {
    this.session = undefined;
  };
  listWorkspaceSnapshots = async () => [...this.snapshots.values()];
  loadWorkspaceSnapshot = async (id: string) => this.snapshots.get(id);
  saveWorkspaceSnapshot = async (record: WorkspaceSnapshotRecordV1) => {
    this.snapshots.set(record.workspaceInstanceId, record);
  };
  deleteWorkspaceSnapshot = async (id: string) => {
    this.snapshots.delete(id);
  };
  listNamedWorkspaceMetadata = async (): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > =>
    [...this.definitions.values()].map(
      ({ createdAt, description, id, name, updatedAt, version }) => ({
        createdAt,
        ...(description === undefined ? {} : { description }),
        id,
        name,
        updatedAt,
        version,
      }),
    );
  loadNamedWorkspaceDefinition = async (id: string) => this.definitions.get(id);
  saveNamedWorkspaceDefinition = async (value: NamedWorkspaceDefinitionV1) => {
    this.definitions.set(value.id, value);
  };
  deleteNamedWorkspaceDefinition = async (id: string) => {
    this.definitions.delete(id);
  };
}

const renderers = new GridComponentRendererRegistry();
const codecs = new GridComponentSettingsRegistry();
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((next, fail) => {
    resolve = next;
    reject = fail;
  });
  return { promise, reject, resolve };
};
let latest: WorkspaceContextValue | undefined;
const Capture = () => {
  latest = useWorkspace();
  return null;
};

describe("workspace runtime", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    latest = undefined;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  const render = async (
    service: WorkspacePersistenceService,
    systemWorkspaces?: readonly NamedWorkspaceDefinitionV1[],
  ) => {
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={service}
            settingsCodecs={codecs}
            systemWorkspaces={systemWorkspaces}
            userId={service.scope.userId}
          >
            <Capture />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    await vi.waitFor(() => expect(latest?.status).not.toBe("loading"));
  };

  it("appends definitions in order, restores the active tab, and close does not delete definitions", async () => {
    const service = new MemoryService("alice", [
      definition("first"),
      definition("second"),
    ]);
    await render(service);

    await act(async () => latest?.openNamedWorkspace("first"));
    await act(async () => latest?.openNamedWorkspace("second"));
    expect(latest?.controllers.map(({ name }) => name)).toEqual([
      "FIRST",
      "SECOND",
    ]);
    expect(latest?.activeWorkspace?.name).toBe("SECOND");
    for (const record of service.snapshots.values()) {
      expect(record.snapshot.layout.layout.id).not.toContain("vuu-shell");
      expect(
        record.snapshot.layout.layout.items.some(({ id }) =>
          id.startsWith("vuu-shell"),
        ),
      ).toBe(false);
    }

    const firstInstance = latest?.controllers[0].instanceId;
    if (!firstInstance) {
      throw new Error("Expected first workspace instance");
    }
    await act(async () => latest?.closeWorkspace(firstInstance));
    expect(service.definitions.has("first")).toBe(true);
    expect(service.session?.workspaceOrder).toHaveLength(1);

    act(() => root.unmount());
    root = createRoot(container);
    await render(service);
    expect(latest?.controllers.map(({ name }) => name)).toEqual(["SECOND"]);
    expect(latest?.activeWorkspace?.name).toBe("SECOND");
  });

  it("persists renamed tabs and selects the adjacent tab when closing", async () => {
    const service = new MemoryService("alice", [
      definition("first"),
      definition("second"),
      definition("third"),
    ]);
    await render(service);

    await act(async () => latest?.openNamedWorkspace("first"));
    await act(async () => latest?.openNamedWorkspace("second"));
    await act(async () => latest?.openNamedWorkspace("third"));
    const secondInstance = latest?.controllers[1].instanceId;
    const thirdInstance = latest?.controllers[2].instanceId;
    if (!secondInstance || !thirdInstance) {
      throw new Error("Expected three open workspace instances");
    }

    await act(async () => latest?.renameWorkspace(secondInstance, "Renamed"));
    expect(latest?.controllers[1].name).toBe("Renamed");
    expect(service.session?.openWorkspaces[1].title).toBe("Renamed");

    act(() => root.unmount());
    root = createRoot(container);
    await render(service);
    expect(latest?.controllers[1].name).toBe("Renamed");

    await act(async () => latest?.selectWorkspace(secondInstance));
    await act(async () => latest?.closeWorkspace(secondInstance));
    expect(latest?.activeWorkspaceInstanceId).toBe(thirdInstance);
    expect(service.definitions.has("second")).toBe(true);
  });

  it("persists and restores ordered named and first-drop Untitled workspaces", async () => {
    const service = new MemoryService("alice", [
      definition("first"),
      definition("second"),
    ]);
    await render(service);

    await act(async () => latest?.openNamedWorkspace("first"));
    await act(async () => latest?.openNamedWorkspace("second"));
    let untitledId: string | undefined;
    await act(async () => {
      untitledId = await latest?.createWorkspaceFromSnapshot(
        droppedSnapshot("first-drop"),
      );
    });

    expect(untitledId).toBeDefined();
    expect(latest?.controllers.map(({ name }) => name)).toEqual([
      "FIRST",
      "SECOND",
      "Untitled",
    ]);
    expect(service.session?.workspaceOrder).toEqual(
      latest?.controllers.map(({ instanceId }) => instanceId),
    );
    expect(service.session?.activeWorkspaceInstanceId).toBe(untitledId);
    expect(service.session?.openWorkspaces.map(({ title }) => title)).toEqual([
      "FIRST",
      "SECOND",
      "Untitled",
    ]);
    expect(
      service.snapshots.get(untitledId ?? "")?.snapshot.layout.components,
    ).toHaveLength(1);

    act(() => root.unmount());
    root = createRoot(container);
    await render(service);

    expect(latest?.controllers.map(({ name }) => name)).toEqual([
      "FIRST",
      "SECOND",
      "Untitled",
    ]);
    expect(latest?.controllers.map(({ instanceId }) => instanceId)).toEqual(
      service.session?.workspaceOrder,
    );
    expect(latest?.activeWorkspace?.instanceId).toBe(untitledId);
    expect(latest?.activeWorkspace?.snapshot.layout.components).toHaveLength(1);
  });

  it("hydrates state before use, preserves it while inactive, and purges only committed removals", async () => {
    const service = new MemoryService();
    const controller = new WorkspaceController({
      instanceId: "one",
      name: "One",
      onError: (error) => {
        throw error;
      },
      renderers,
      service,
      settingsCodecs: codecs,
      snapshot: snapshot("one"),
    });
    expect(controller.persistentState.get("stateful")?.value).toEqual({
      hydrated: true,
    });
    expect(controller.persistentState.get("stateful")).toBeDefined();

    controller.handleDocumentChange(layout("one"), {
      document: layout("one"),
      kind: "dispatch",
      removedComponentInstanceIds: ["stateful"],
      revision: 1,
    });
    expect(controller.persistentState.get("stateful")).toBeUndefined();
    expect(service.snapshots.get("one")?.snapshot.componentState).toEqual({});
    controller.dispose();
  });

  it("shows a clean loading scope and ignores a stale service response", async () => {
    const first = new MemoryService("alice");
    first.session = {
      activeWorkspaceInstanceId: "old",
      openWorkspaces: [{ instanceId: "old", snapshotId: "old" }],
      settings: {},
      version: 1,
      workspaceOrder: ["old"],
    };
    first.snapshots.set("old", {
      revision: 1,
      snapshot: snapshot("old"),
      version: 1,
      workspaceInstanceId: "old",
    });
    await render(first);
    expect(latest?.controllers).toHaveLength(1);

    let resolveSecond:
      | ((value: ApplicationSessionV1 | undefined) => void)
      | undefined;
    const second = new MemoryService("bob");
    second.loadApplicationSession = () =>
      new Promise((resolve) => {
        resolveSecond = resolve;
      });
    act(() => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={second}
            settingsCodecs={codecs}
            userId="bob"
          >
            <Capture />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    expect(latest?.status).toBe("loading");
    expect(latest?.controllers).toEqual([]);
    await act(async () => resolveSecond?.(undefined));
    await vi.waitFor(() => expect(latest?.status).toBe("empty"));
    expect(latest?.controllers).toEqual([]);
  });

  it("does not let deferred old-scope actions mutate the new scope", async () => {
    const first = new MemoryService("alice", [definition("old")]);
    first.session = {
      activeWorkspaceInstanceId: "existing",
      openWorkspaces: [{ instanceId: "existing", snapshotId: "existing" }],
      settings: {},
      version: 1,
      workspaceOrder: ["existing"],
    };
    first.snapshots.set("existing", {
      revision: 1,
      snapshot: snapshot("existing"),
      version: 1,
      workspaceInstanceId: "existing",
    });
    await render(first);
    const oldContext = latest;
    if (!oldContext) {
      throw new Error("Expected workspace context");
    }

    const pendingDefinition = deferred<
      NamedWorkspaceDefinitionV1 | undefined
    >();
    first.loadNamedWorkspaceDefinition = () => pendingDefinition.promise;
    const opening = oldContext.openNamedWorkspace("old");

    const pendingSettingSave = deferred<void>();
    first.saveApplicationSession = async (next) => {
      await pendingSettingSave.promise;
      first.session = next;
    };
    const savingSetting = oldContext
      .setApplicationSetting("owner", "alice")
      .catch((error: unknown) => error);
    const pendingMetadataSave = deferred<void>();
    first.saveNamedWorkspaceDefinition = async (value) => {
      await pendingMetadataSave.promise;
      first.definitions.set(value.id, value);
    };
    const savingMetadata = oldContext
      .saveActiveWorkspaceAs("stale copy")
      .catch((error: unknown) => error);

    const second = new MemoryService("bob");
    second.session = {
      activeWorkspaceInstanceId: null,
      openWorkspaces: [],
      settings: { owner: "bob" },
      version: 1,
      workspaceOrder: [],
    };
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={second}
            settingsCodecs={codecs}
            userId="bob"
          >
            <Capture />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    await vi.waitFor(() => expect(latest?.status).toBe("empty"));

    await act(async () => {
      pendingDefinition.resolve(definition("old"));
      pendingSettingSave.resolve();
      pendingMetadataSave.resolve();
      await Promise.all([opening, savingSetting, savingMetadata]);
    });

    expect(latest?.controllers).toEqual([]);
    expect(latest?.settings).toEqual({ owner: "bob" });
    expect(latest?.namedWorkspaces).toEqual([]);
    expect(second.snapshots.size).toBe(0);
    expect(second.session?.settings).toEqual({ owner: "bob" });
  });

  it("resets scoped workspace snapshots, session, settings, and controllers", async () => {
    const service = new MemoryService("alice");
    service.session = {
      activeWorkspaceInstanceId: "one",
      openWorkspaces: [{ instanceId: "one", snapshotId: "one" }],
      settings: { expanded: true },
      version: 1,
      workspaceOrder: ["one"],
    };
    service.snapshots.set("one", {
      revision: 1,
      snapshot: snapshot("one"),
      version: 1,
      workspaceInstanceId: "one",
    });
    await render(service);

    await act(async () => latest?.resetApplication());

    expect(service.session).toBeUndefined();
    expect(service.snapshots.size).toBe(0);
    expect(latest?.controllers).toEqual([]);
    expect(latest?.settings).toEqual({});
    expect(latest?.activeWorkspaceInstanceId).toBeNull();
  });

  it("serializes concurrent settings and workspace opens without losing updates", async () => {
    const service = new MemoryService("alice", [
      definition("first"),
      definition("second"),
    ]);
    await render(service);
    const firstSave = deferred<void>();
    const originalSaveSession = service.saveApplicationSession;
    let saves = 0;
    service.saveApplicationSession = async (next) => {
      if (saves++ === 0) {
        await firstSave.promise;
      }
      await originalSaveSession(next);
    };

    const settingOne = latest?.setApplicationSetting("one", 1);
    const settingTwo = latest?.setApplicationSetting("two", 2);
    const openOne = latest?.openNamedWorkspace("first");
    const openTwo = latest?.openNamedWorkspace("second");
    expect(saves).toBe(0);

    await act(async () => {
      await vi.waitFor(() => expect(saves).toBe(1));
      firstSave.resolve();
      await Promise.all([settingOne, settingTwo, openOne, openTwo]);
    });

    expect(service.session?.settings).toEqual({ one: 1, two: 2 });
    expect(service.session?.workspaceOrder).toHaveLength(2);
    expect(service.session?.openWorkspaces).toHaveLength(2);
    expect(latest?.controllers.map(({ name }) => name)).toEqual([
      "FIRST",
      "SECOND",
    ]);
    expect(latest?.activeWorkspace?.name).toBe("SECOND");
    expect(
      latest?.controllers.every(({ instanceId }) =>
        service.session?.workspaceOrder.includes(instanceId),
      ),
    ).toBe(true);
  });

  it("waits for an active mutation, invalidates queued work, and cannot recreate a reset session", async () => {
    const service = new MemoryService("alice", [definition("first")]);
    await render(service);
    const pendingSave = deferred<void>();
    const saveStarted = deferred<void>();
    const originalSaveSession = service.saveApplicationSession;
    service.saveApplicationSession = async (next) => {
      saveStarted.resolve();
      await pendingSave.promise;
      await originalSaveSession(next);
    };
    const pendingDefinition = deferred<
      NamedWorkspaceDefinitionV1 | undefined
    >();
    service.loadNamedWorkspaceDefinition = () => pendingDefinition.promise;

    const setting = latest?.setApplicationSetting("before-reset", true);
    const racingOpen = latest?.openNamedWorkspace("first");
    await saveStarted.promise;
    let sessionDeleted = false;
    service.deleteApplicationSession = async () => {
      sessionDeleted = true;
      service.session = undefined;
    };
    let reset: Promise<void> | undefined;
    let blockedSetting: Promise<void> | undefined;
    await act(async () => {
      reset = latest?.resetApplication();
      blockedSetting = latest
        ?.setApplicationSetting("during-reset", true)
        .catch(() => undefined);
      await Promise.resolve();
    });
    expect(sessionDeleted).toBe(false);

    await act(async () => {
      pendingSave.resolve();
      pendingDefinition.resolve(definition("first"));
      await Promise.all([setting, racingOpen, reset, blockedSetting]);
    });

    expect(service.session).toBeUndefined();
    expect(service.snapshots.size).toBe(0);
    expect(latest?.controllers).toEqual([]);
    expect(latest?.settings).toEqual({});
  });

  it("deletes the session before snapshot cleanup and remains reset when cleanup fails", async () => {
    const service = new MemoryService("alice");
    service.session = {
      activeWorkspaceInstanceId: "one",
      openWorkspaces: [{ instanceId: "one", snapshotId: "one" }],
      settings: { expanded: true },
      version: 1,
      workspaceOrder: ["one"],
    };
    service.snapshots.set("one", {
      revision: 1,
      snapshot: snapshot("one"),
      version: 1,
      workspaceInstanceId: "one",
    });
    await render(service);
    service.deleteWorkspaceSnapshot = async () => {
      expect(service.session).toBeUndefined();
      throw new Error("snapshot cleanup failed");
    };

    let resetError: unknown;
    await act(async () => {
      try {
        await latest?.resetApplication();
      } catch (error) {
        resetError = error;
      }
    });

    expect(resetError).toEqual(new Error("snapshot cleanup failed"));
    expect(service.session).toBeUndefined();
    expect(latest?.controllers).toEqual([]);
    expect(latest?.settings).toEqual({});
    expect(latest?.activeWorkspaceInstanceId).toBeNull();
  });

  it("waits for outstanding snapshot writes before reset cleanup", async () => {
    const service = new MemoryService("alice");
    service.session = {
      activeWorkspaceInstanceId: "one",
      openWorkspaces: [{ instanceId: "one", snapshotId: "one" }],
      settings: {},
      version: 1,
      workspaceOrder: ["one"],
    };
    service.snapshots.set("one", {
      revision: 1,
      snapshot: snapshot("one"),
      version: 1,
      workspaceInstanceId: "one",
    });
    await render(service);
    const pendingSnapshot = deferred<void>();
    const snapshotStarted = deferred<void>();
    const originalSaveSnapshot = service.saveWorkspaceSnapshot;
    service.saveWorkspaceSnapshot = async (record) => {
      snapshotStarted.resolve();
      await pendingSnapshot.promise;
      await originalSaveSnapshot(record);
    };
    latest?.activeWorkspace?.persistentState.update("stateful", {
      componentType: "test",
      schemaVersion: 1,
      value: { changed: true },
    });
    await snapshotStarted.promise;

    const reset = latest?.resetApplication();
    await vi.waitFor(() => expect(service.session).toBeUndefined());
    expect(service.snapshots.has("one")).toBe(true);

    await act(async () => {
      pendingSnapshot.resolve();
      await reset;
    });
    expect(service.session).toBeUndefined();
    expect(service.snapshots.size).toBe(0);
  });

  describe("system workspaces and named workspace management", () => {
    const trader = definition("trader");
    const systemWorkspaces = [trader];
    const edit = (key: string, value: number) => {
      const controller = latest?.activeWorkspace;
      if (!controller) {
        throw new Error("Expected an active workspace");
      }
      act(() =>
        controller.persistentState.update(key, {
          componentType: "test",
          schemaVersion: 1,
          value,
        }),
      );
    };

    it("reports controller edits only once the snapshot differs from its initial state", () => {
      const service = new MemoryService();
      const onEdit = vi.fn();
      const controller = new WorkspaceController({
        instanceId: "edit",
        name: "Edit",
        onEdit,
        onError: (error) => {
          throw error;
        },
        renderers,
        service,
        settingsCodecs: codecs,
        snapshot: snapshot("edit"),
      });
      controller.handleDocumentChange(layout("edit"), {
        document: layout("edit"),
        kind: "dispatch",
        removedComponentInstanceIds: [],
        revision: 1,
      });
      expect(onEdit).not.toHaveBeenCalled();
      controller.persistentState.update("stateful", {
        componentType: "test",
        schemaVersion: 1,
        value: { hydrated: false },
      });
      expect(onEdit).toHaveBeenCalledTimes(1);
      controller.handleDocumentChange(layout("edit"), {
        document: layout("edit"),
        kind: "dispatch",
        removedComponentInstanceIds: [],
        revision: 2,
      });
      expect(onEdit).toHaveBeenCalledTimes(2);
      void controller.dispose();
    });

    it("lists system workspaces without creating a personal copy until the first edit", async () => {
      const service = new MemoryService("alice");
      await render(service, systemWorkspaces);
      expect(latest?.workspaces).toEqual([
        {
          id: "trader",
          isModified: false,
          isPersonalCopy: false,
          kind: "system",
          name: "TRADER",
          updatedAt: trader.updatedAt,
        },
      ]);

      await act(async () => latest?.setActiveWorkspace("trader"));
      expect(latest?.activeWorkspaceId).toBe("trader");
      expect(latest?.controllers).toHaveLength(1);
      expect(service.definitions.has("trader")).toBe(false);

      edit("added", 1);
      await vi.waitFor(() =>
        expect(
          service.definitions.get("trader")?.snapshot.componentState.added
            ?.value,
        ).toBe(1),
      );
      expect(latest?.workspaces[0]).toMatchObject({
        id: "trader",
        isModified: true,
        isPersonalCopy: true,
        kind: "system",
        name: "TRADER",
      });
      expect(latest?.namedWorkspaces).toEqual([]);

      edit("added", 2);
      await vi.waitFor(() =>
        expect(
          service.definitions.get("trader")?.snapshot.componentState.added
            ?.value,
        ).toBe(2),
      );
    });

    it("opens the personal copy in place of the system workspace and resets it to default", async () => {
      const service = new MemoryService("alice");
      await render(service, systemWorkspaces);
      await act(async () => latest?.setActiveWorkspace("trader"));
      edit("added", 1);
      await vi.waitFor(() =>
        expect(service.definitions.has("trader")).toBe(true),
      );

      const instanceId = latest?.activeWorkspaceInstanceId;
      if (!instanceId) {
        throw new Error("Expected an active workspace instance");
      }
      await act(async () => latest?.closeWorkspace(instanceId));
      expect(latest?.controllers).toHaveLength(0);

      act(() => root.unmount());
      root = createRoot(container);
      await render(service, systemWorkspaces);
      expect(latest?.workspaces[0].isPersonalCopy).toBe(true);

      await act(async () => latest?.setActiveWorkspace("trader"));
      expect(latest?.activeWorkspaceId).toBe("trader");
      expect(latest?.activeWorkspace?.persistentState.get("added")?.value).toBe(
        1,
      );
      const copiedInstanceId = latest?.activeWorkspaceInstanceId;

      await act(async () => latest?.resetToDefault("trader"));
      expect(service.definitions.has("trader")).toBe(false);
      expect(latest?.workspaces[0]).toMatchObject({
        isModified: false,
        isPersonalCopy: false,
      });
      expect(latest?.controllers).toHaveLength(1);
      expect(latest?.activeWorkspaceId).toBe("trader");
      expect(latest?.activeWorkspaceInstanceId).not.toBe(copiedInstanceId);
      expect(
        latest?.activeWorkspace?.persistentState.get("added"),
      ).toBeUndefined();
      expect(service.session?.workspaceOrder).toEqual([
        latest?.activeWorkspaceInstanceId,
      ]);
      expect(service.snapshots.has(copiedInstanceId ?? "")).toBe(false);

      await expect(latest?.resetToDefault("unknown")).rejects.toThrow(
        "not a system workspace",
      );
    });

    it("creates, activates, renames, edits and deletes named workspaces", async () => {
      const service = new MemoryService("alice");
      await render(service, systemWorkspaces);

      let id: string | undefined;
      await act(async () => {
        id = await latest?.createWorkspace("Mine");
      });
      if (!id) {
        throw new Error("Expected a new workspace id");
      }
      const workspaceId = id;
      expect(service.definitions.get(workspaceId)?.name).toBe("Mine");
      expect(latest?.activeWorkspaceId).toBe(workspaceId);
      expect(latest?.activeWorkspace?.name).toBe("Mine");
      expect(latest?.workspaces.map(({ id, kind }) => [id, kind])).toEqual([
        ["trader", "system"],
        [workspaceId, "named"],
      ]);

      await act(async () => latest?.setActiveWorkspace("trader"));
      expect(latest?.activeWorkspaceId).toBe("trader");
      await act(async () => latest?.setActiveWorkspace(workspaceId));
      expect(latest?.activeWorkspaceId).toBe(workspaceId);
      expect(latest?.controllers).toHaveLength(2);

      edit("named", 7);
      await vi.waitFor(() =>
        expect(
          service.definitions.get(workspaceId)?.snapshot.componentState.named
            ?.value,
        ).toBe(7),
      );

      await act(async () => latest?.renameNamedWorkspace(workspaceId, "Ours"));
      expect(service.definitions.get(workspaceId)?.name).toBe("Ours");
      expect(latest?.activeWorkspace?.name).toBe("Ours");
      expect(latest?.workspaces[1].name).toBe("Ours");

      await expect(
        latest?.renameNamedWorkspace("trader", "Nope"),
      ).rejects.toThrow("cannot be renamed");
      await expect(latest?.deleteNamedWorkspace("trader")).rejects.toThrow(
        "cannot be deleted",
      );

      await act(async () => latest?.deleteNamedWorkspace(workspaceId));
      expect(service.definitions.has(workspaceId)).toBe(false);
      expect(
        latest?.controllers.map(({ definitionId }) => definitionId),
      ).toEqual(["trader"]);
      expect(latest?.workspaces.map(({ id }) => id)).toEqual(["trader"]);
      await expect(latest?.setActiveWorkspace(workspaceId)).rejects.toThrow(
        "was not found",
      );
    });

    it("saves the active workspace as a new named workspace", async () => {
      const service = new MemoryService("alice");
      await render(service, systemWorkspaces);
      await act(async () => latest?.setActiveWorkspace("trader"));
      let id: string | undefined;
      await act(async () => {
        id = await latest?.saveActiveWorkspaceAs("Copy");
      });
      expect(id).toBeDefined();
      expect(service.definitions.get(id ?? "")?.name).toBe("Copy");
      expect(service.definitions.has("trader")).toBe(false);
      expect(latest?.namedWorkspaces.map(({ name }) => name)).toEqual(["Copy"]);
    });
  });
});
