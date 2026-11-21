import {
  GridComponentRendererRegistry,
  GridComponentSettingsRegistry,
} from "@vuu-ui/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SavedStateWorkspaces } from "../../src/portal-workspaces/SavedStateWorkspaces";
import {
  SavedStateContext,
  type SavedStateContextValue,
  type SavedStateWorkspaces as Registered,
} from "../../src/saved-state/SavedStateContext";
import {
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  WorkspaceProvider,
  type WorkspacePersistenceService,
  type WorkspaceSnapshotRecordV1,
} from "../../src/workspace";

const definition = (id: string, name: string): NamedWorkspaceDefinitionV1 => ({
  createdAt: "2026-01-01T00:00:00.000Z",
  id,
  name,
  snapshot: {
    componentState: {},
    layout: {
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
    },
    version: 1,
  },
  updatedAt: "2026-01-02T00:00:00.000Z",
  version: 1,
});

class MemoryService implements WorkspacePersistenceService {
  readonly definitions = new Map<string, NamedWorkspaceDefinitionV1>();
  readonly snapshots = new Map<string, WorkspaceSnapshotRecordV1>();
  readonly scope = {
    applicationId: "test",
    applicationNamespace: "finos",
    userId: "alice",
  };
  session: ApplicationSessionV1 | undefined;

  constructor(definitions: NamedWorkspaceDefinitionV1[]) {
    for (const item of definitions) this.definitions.set(item.id, item);
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
      ({ createdAt, id, name, updatedAt, version }) => ({
        createdAt,
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

describe("SavedStateWorkspaces", () => {
  let container: HTMLDivElement;
  let root: Root;
  let registered: Registered | undefined;
  const registerWorkspaces = vi.fn((value: Registered | undefined) => {
    registered = value;
  });
  const savedState: SavedStateContextValue = {
    applicationKeyForModule: () => undefined,
    notify: () => undefined,
    open: () => undefined,
    registerWorkspaces,
    reportCarryForward: () => undefined,
  };

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    registered = undefined;
    registerWorkspaces.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const render = async (service: WorkspacePersistenceService) => {
    await act(async () => {
      root.render(
        <SavedStateContext.Provider value={savedState}>
          <NotificationsProvider>
            <WorkspaceProvider
              componentRenderers={new GridComponentRendererRegistry()}
              persistenceService={service}
              settingsCodecs={new GridComponentSettingsRegistry()}
              systemWorkspaces={[definition("trader", "Trader")]}
              userId="alice"
            >
              <SavedStateWorkspaces />
            </WorkspaceProvider>
          </NotificationsProvider>
        </SavedStateContext.Provider>,
      );
    });
  };

  it("registers personal copies and named workspaces, and clears them", async () => {
    // A personal copy of the Trader system workspace and a named workspace.
    const service = new MemoryService([
      definition("trader", "Trader"),
      definition("mine", "My layout"),
    ]);
    await render(service);
    await vi.waitFor(() => expect(registered?.items).toHaveLength(2));
    expect(registered?.items).toEqual([
      {
        id: "trader",
        kind: "system",
        name: "Trader",
        open: false,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
      {
        id: "mine",
        kind: "named",
        name: "My layout",
        open: false,
        updatedAt: "2026-01-02T00:00:00.000Z",
      },
    ]);

    let result: Awaited<ReturnType<Registered["clear"]>> | undefined;
    await act(async () => {
      result = await registered?.clear([
        { id: "trader", kind: "system" },
        { id: "mine", kind: "named" },
      ]);
    });
    expect(result).toEqual({ cleared: ["trader", "mine"], failed: [] });
    expect(service.definitions.size).toBe(0);
    await vi.waitFor(() => expect(registered?.items).toEqual([]));
  });

  it("doesn't list a system workspace the user hasn't changed", async () => {
    await render(new MemoryService([]));
    await vi.waitFor(() => expect(registered).toBeDefined());
    expect(registered?.items).toEqual([]);
  });

  it("reports workspaces it couldn't clear", async () => {
    const service = new MemoryService([definition("mine", "My layout")]);
    service.deleteNamedWorkspaceDefinition = async () => {
      throw Error("offline");
    };
    await render(service);
    await vi.waitFor(() => expect(registered?.items).toHaveLength(1));
    let result: Awaited<ReturnType<Registered["clear"]>> | undefined;
    await act(async () => {
      result = await registered?.clear([{ id: "mine", kind: "named" }]);
    });
    expect(result?.cleared).toEqual([]);
    expect(result?.failed.map(({ id }) => id)).toEqual(["mine"]);
  });

  it("unregisters when unmounted", async () => {
    await render(new MemoryService([]));
    await vi.waitFor(() => expect(registered).toBeDefined());
    act(() => root.render(null));
    expect(registered).toBeUndefined();
  });
});
