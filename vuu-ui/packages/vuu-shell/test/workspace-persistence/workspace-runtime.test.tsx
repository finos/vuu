import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
  type GridLayoutDocument,
} from "@heswell/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { ContextPanelProvider } from "@vuu-ui/vuu-ui-controls";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  UserPersistenceScope,
  WorkspacePersistenceService,
} from "../../src/persistence-manager";
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
} from "../../src/workspace-management";
import { LeftNav } from "../../src/left-nav";
import { AppHeader } from "../../src/app-header";
import { ApplicationSettingsContextPanel } from "../../src/shell-layout-templates/context-panel";

vi.mock("@vuu-ui/core", () => ({
  useLogout: () => vi.fn(),
}));

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

  const render = async (service: WorkspacePersistenceService) => {
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={service}
            settingsCodecs={codecs}
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

  it("hydrates navigation after session load and hides old-scope state during a switch", async () => {
    const first = new MemoryService("alice");
    const firstSession = deferred<ApplicationSessionV1 | undefined>();
    first.loadApplicationSession = () => firstSession.promise;
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={first}
            settingsCodecs={codecs}
            userId="alice"
          >
            <Capture />
            <LeftNav defaultActiveTabIndex={0} defaultExpanded />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    expect(container.querySelector(".vuuLeftNav-menu-full")).not.toBeNull();

    await act(async () => {
      firstSession.resolve({
        activeWorkspaceInstanceId: null,
        openWorkspaces: [],
        settings: {
          "leftNav.activeTabIndex": 3,
          "leftNav.expanded": false,
        },
        version: 1,
        workspaceOrder: [],
      });
    });
    await vi.waitFor(() =>
      expect(
        container.querySelector(".vuuLeftNav-menu-icons-content"),
      ).not.toBeNull(),
    );

    const second = new MemoryService("bob");
    const secondSession = deferred<ApplicationSessionV1 | undefined>();
    second.loadApplicationSession = () => secondSession.promise;
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
            <LeftNav defaultActiveTabIndex={0} defaultExpanded />
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    expect(container.querySelector(".vuuLeftNav-menu-full")).not.toBeNull();
    expect(
      container.querySelector(".vuuLeftNav-menu-icons-content"),
    ).toBeNull();

    await act(async () => secondSession.resolve(undefined));
  });

  it("opens the application settings panel and resets through the controller", async () => {
    const service = new MemoryService("alice");
    service.session = {
      activeWorkspaceInstanceId: null,
      openWorkspaces: [],
      settings: {},
      version: 1,
      workspaceOrder: [],
    };
    await act(async () => {
      root.render(
        <NotificationsProvider>
          <WorkspaceProvider
            componentRenderers={renderers}
            persistenceService={service}
            settingsCodecs={codecs}
            userId="alice"
          >
            <ContextPanelProvider showContextPanel={() => undefined}>
              <Capture />
              <AppHeader />
              <ApplicationSettingsContextPanel />
            </ContextPanelProvider>
          </WorkspaceProvider>
        </NotificationsProvider>,
      );
    });
    await vi.waitFor(() => expect(latest?.status).toBe("empty"));
    const buttons = [...container.querySelectorAll("button")];
    const settings = buttons.find((button) =>
      button.textContent?.includes("Settings"),
    );
    const reset = buttons.find((button) =>
      button.textContent?.includes("Reset"),
    );
    if (!settings || !reset) {
      throw new Error("Expected AppHeader controls");
    }

    await act(async () => settings.click());
    await vi.waitFor(() =>
      expect(
        container.querySelector(".vuuContextPanel-expanded"),
      ).not.toBeNull(),
    );
    expect(service.session?.settings).toEqual({
      "applicationSettings.panelOpen": true,
    });

    await act(async () => reset.click());
    await vi.waitFor(() => expect(service.session).toBeUndefined());
    expect(latest?.settings).toEqual({});
    expect(container.querySelector(".vuuContextPanel-expanded")).toBeNull();
  });
});
