import type { GridLayoutDocument } from "@heswell/grid-layout";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  LocalWorkspacePersistenceService,
  RemoteWorkspacePersistenceService,
  WorkspacePersistenceError,
  type UserPersistenceScope,
  type WorkspacePersistenceService,
} from "../../src/persistence-manager";
import {
  WorkspaceRepository,
  WorkspaceRepositoryDisposedError,
  WorkspacePersistentStateStore,
  validateApplicationSessionV1,
  validateWorkspaceSnapshotV1,
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type WorkspaceSnapshotRecordV1,
  type WorkspaceSnapshotV1,
  WorkspaceValidationError,
} from "../../src/workspace-management";

const scope: UserPersistenceScope = {
  applicationNamespace: "com.finos",
  applicationId: "vuu",
  userId: "alice@example.com",
};

const layout: GridLayoutDocument = {
  kind: "grid-layout",
  version: 2,
  components: [],
  layout: {
    id: "grid",
    columns: ["1fr"],
    rows: ["1fr"],
    items: [],
    placeholderIds: [],
    stacks: [],
  },
};

const snapshot = (value: string): WorkspaceSnapshotV1 => ({
  version: 1,
  layout,
  componentState: {
    component: {
      componentType: "test",
      schemaVersion: 1,
      value,
    },
  },
});

const session: ApplicationSessionV1 = {
  version: 1,
  openWorkspaces: [
    { instanceId: "one", definitionId: "named", snapshotId: "one" },
  ],
  workspaceOrder: ["one"],
  activeWorkspaceInstanceId: "one",
  settings: { density: "compact" },
};

const definition: NamedWorkspaceDefinitionV1 = {
  version: 1,
  id: "named",
  name: "Named workspace",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  snapshot: snapshot("named"),
};

describe("workspace schemas", () => {
  it("validates current JSON-safe schemas", () => {
    expect(validateWorkspaceSnapshotV1(snapshot("valid"))).toEqual(
      snapshot("valid"),
    );
    expect(validateApplicationSessionV1(session)).toEqual(session);
  });

  it("rejects unsupported, legacy, malformed, and non-JSON data explicitly", () => {
    expect(() =>
      validateWorkspaceSnapshotV1({ ...snapshot("old"), version: 0 }),
    ).toThrowError(WorkspaceValidationError);
    expect(() =>
      validateWorkspaceSnapshotV1({
        version: 1,
        layout: { type: "View" },
        componentState: {},
      }),
    ).toThrowError(/grid layout version/);
    expect(() =>
      validateWorkspaceSnapshotV1({
        ...snapshot("bad"),
        componentState: {
          bad: {
            componentType: "test",
            schemaVersion: 1,
            value: undefined,
          },
        },
      }),
    ).toThrowError(/JSON|undefined/);
  });
});

describe("LocalWorkspacePersistenceService", () => {
  beforeEach(() => localStorage.clear());

  it("round trips all entities", async () => {
    const service = new LocalWorkspacePersistenceService(scope);
    const record: WorkspaceSnapshotRecordV1 = {
      version: 1,
      workspaceInstanceId: "one",
      revision: 1,
      snapshot: snapshot("saved"),
    };

    await service.saveApplicationSession(session);
    await service.saveWorkspaceSnapshot(record);
    await service.saveNamedWorkspaceDefinition(definition);

    expect(await service.loadApplicationSession()).toEqual(session);
    expect(await service.loadWorkspaceSnapshot("one")).toEqual(record);
    expect(await service.listWorkspaceSnapshots()).toEqual([record]);
    expect(await service.loadNamedWorkspaceDefinition("named")).toEqual(
      definition,
    );
    expect(await service.listNamedWorkspaceMetadata()).toEqual([
      {
        version: 1,
        id: "named",
        name: "Named workspace",
        createdAt: definition.createdAt,
        updatedAt: definition.updatedAt,
      },
    ]);

    await service.deleteWorkspaceSnapshot("one");
    await service.deleteNamedWorkspaceDefinition("named");
    await service.deleteApplicationSession();
    expect(await service.listWorkspaceSnapshots()).toEqual([]);
    expect(await service.listNamedWorkspaceMetadata()).toEqual([]);
    expect(await service.loadApplicationSession()).toBeUndefined();
  });

  it("strictly isolates application and user keys", async () => {
    const alice = new LocalWorkspacePersistenceService(scope);
    const bob = new LocalWorkspacePersistenceService({
      ...scope,
      userId: "bob@example.com",
    });
    await alice.saveApplicationSession(session);
    await alice.saveNamedWorkspaceDefinition(definition);

    expect(await bob.loadApplicationSession()).toBeUndefined();
    expect(await bob.listNamedWorkspaceMetadata()).toEqual([]);
    await bob.deleteNamedWorkspaceDefinition(definition.id);
    expect(await alice.loadNamedWorkspaceDefinition(definition.id)).toEqual(
      definition,
    );
  });
});

describe("RemoteWorkspacePersistenceService", () => {
  it("centrally applies encoded scope, auth, payload, and response validation", async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify(session), { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const service = new RemoteWorkspacePersistenceService(scope, {
      baseUrl: "https://persistence.example/api/",
      fetch: fetchMock,
      requestInitProvider: () => ({
        headers: { Authorization: "Bearer token" },
      }),
    });

    await service.saveApplicationSession(session);
    const [url, init] = fetchMock.mock.calls[0];
    const headers = new Headers(init?.headers);
    expect(url).toBe(
      "https://persistence.example/api/com.finos/vuu/alice%40example.com/application-session",
    );
    expect(init?.method).toBe("PUT");
    expect(JSON.parse(String(init?.body))).toEqual(session);
    expect(headers.get("Authorization")).toBe("Bearer token");
    expect(headers.get("X-Vuu-User-Id")).toBe(scope.userId);
    await expect(service.loadApplicationSession()).resolves.toEqual(session);
  });

  it("rejects HTTP and invalid responses without local fallback", async () => {
    localStorage.setItem("unrelated", JSON.stringify(session));
    const failing = new RemoteWorkspacePersistenceService(scope, {
      baseUrl: "/api",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          new Response(null, { status: 503, statusText: "Unavailable" }),
        ),
    });
    await expect(failing.loadApplicationSession()).rejects.toEqual(
      expect.objectContaining({
        name: "WorkspacePersistenceError",
        status: 503,
      }),
    );

    const invalid = new RemoteWorkspacePersistenceService(scope, {
      baseUrl: "/api",
      fetch: vi.fn<typeof fetch>().mockResolvedValue(
        new Response(JSON.stringify({ ...session, version: 99 }), {
          status: 200,
        }),
      ),
    });
    await expect(invalid.loadApplicationSession()).rejects.toBeInstanceOf(
      WorkspaceValidationError,
    );
  });
});

class ControlledService implements WorkspacePersistenceService {
  readonly scope = scope;
  readonly writes: WorkspaceSnapshotRecordV1[] = [];
  readonly completions: Array<{
    reject: (error: Error) => void;
    resolve: () => void;
  }> = [];
  loadResult: Promise<WorkspaceSnapshotRecordV1 | undefined> =
    Promise.resolve(undefined);

  loadApplicationSession = async () => undefined;
  saveApplicationSession = async () => undefined;
  deleteApplicationSession = async () => undefined;
  listWorkspaceSnapshots = async () => [];
  loadWorkspaceSnapshot = async () => this.loadResult;
  deleteWorkspaceSnapshot = async () => undefined;
  listNamedWorkspaceMetadata = async (): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > => [];
  loadNamedWorkspaceDefinition = async () => undefined;
  saveNamedWorkspaceDefinition = async () => undefined;
  deleteNamedWorkspaceDefinition = async () => undefined;

  saveWorkspaceSnapshot(record: WorkspaceSnapshotRecordV1): Promise<void> {
    this.writes.push(record);
    return new Promise((resolve, reject) =>
      this.completions.push({ reject, resolve }),
    );
  }
}

describe("WorkspaceRepository", () => {
  it("captures immutable atomic snapshots and coalesces rapid writes in order", async () => {
    const service = new ControlledService();
    const repository = new WorkspaceRepository(service, "one");
    const first = snapshot("first");
    const firstSave = repository.save(first);
    const secondSave = repository.save(snapshot("second"));
    const thirdSave = repository.save(snapshot("third"));
    (
      first.componentState.component as {
        value: string;
      }
    ).value = "mutated";

    expect(service.writes.map(({ revision }) => revision)).toEqual([1]);
    service.completions[0].resolve();
    await firstSave;
    await vi.waitFor(() =>
      expect(service.writes.map(({ revision }) => revision)).toEqual([1, 3]),
    );
    service.completions[1].resolve();

    await expect(secondSave).resolves.toMatchObject({ revision: 3 });
    await expect(thirdSave).resolves.toMatchObject({ revision: 3 });
    expect(service.writes[0].snapshot.componentState.component.value).toBe(
      "first",
    );
    expect(repository.current).toMatchObject({
      revision: 3,
      snapshot: { componentState: { component: { value: "third" } } },
    });

    describe("WorkspacePersistentStateStore", () => {
      it("provides synchronous immutable updates and scoped purge", () => {
        const store = new WorkspacePersistentStateStore();
        store.update("component", {
          componentType: "test",
          schemaVersion: 1,
          value: { selected: 1 },
        });
        expect(store.get("component")?.value).toEqual({ selected: 1 });
        store.update("component", (current) => ({
          componentType: current?.componentType ?? "test",
          schemaVersion: current?.schemaVersion ?? 1,
          value: { selected: 2 },
        }));
        expect(store.getSnapshot().component.value).toEqual({ selected: 2 });
        store.purge("component");
        expect(store.get("component")).toBeUndefined();
      });
    });
  });

  it("propagates failures and prevents stale completion after disposal", async () => {
    const service = new ControlledService();
    const repository = new WorkspaceRepository(service, "one");
    const save = repository.save(snapshot("failure"));
    service.completions[0].reject(
      new WorkspacePersistenceError("down", "save"),
    );
    await expect(save).rejects.toThrow("down");

    let resolveLoad:
      | ((value: WorkspaceSnapshotRecordV1 | undefined) => void)
      | undefined;
    service.loadResult = new Promise((resolve) => {
      resolveLoad = resolve;
    });
    const load = repository.load();
    repository.dispose();
    resolveLoad?.({
      version: 1,
      workspaceInstanceId: "one",
      revision: 10,
      snapshot: snapshot("stale"),
    });
    await expect(load).rejects.toBeInstanceOf(WorkspaceRepositoryDisposedError);
    expect(repository.current).toBeUndefined();
  });
});
