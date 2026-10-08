import type {
  DataSourceCallbackMessage,
  DataSourceConstructorProps,
  DataSourceRow,
} from "@vuu-ui/vuu-data-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import { DataProvider } from "../../src/context-definitions/DataProvider";
import type { DataSourceConstructor } from "../../src/context-definitions/DataContext";
import {
  NOTIFICATIONS_STATE_KEY,
  PortalNotificationsProvider,
  useModuleUnreadCount,
  useNotificationList,
  usePortalNotifications,
  useUnreadCount,
} from "../../src/notifications/PortalNotificationsProvider";
import { InMemoryPersistenceBackend } from "../../src/persistence/InMemoryPersistenceBackend";
import { PortalPersistenceRoot } from "../../src/common-shell/PortalPersistenceRoot";
import {
  PORTAL_APPLICATION_KEY,
  PORTAL_APPLICATION_VERSION,
} from "../../src/persistence/StateDocument";
import type { PortalNotificationsAPI } from "../../src/notifications/PortalNotificationsContext";
import { testModule } from "../connection-management/test-modules";

const COLUMNS = ["id", "title", "message", "level", "vuuCreatedTimestamp"];

const sources: FakeDataSource[] = [];

class FakeDataSource {
  callback?: (message: DataSourceCallbackMessage) => void;
  constructor(public props: DataSourceConstructorProps) {
    sources.push(this);
  }
  async subscribe(
    _: unknown,
    callback: (message: DataSourceCallbackMessage) => void,
  ) {
    this.callback = callback;
  }
  unsubscribe() {
    this.callback = undefined;
  }
  send(ids: string[]) {
    this.callback?.({
      clientViewportId: "vp",
      mode: "batch",
      rows: ids.map(
        (id, i) =>
          [
            i,
            i,
            true,
            false,
            0,
            0,
            id,
            0,
            0,
            0,
            id,
            `title ${id}`,
            "",
            "INFO",
            1000 + i,
          ] as unknown as DataSourceRow,
      ),
      size: ids.length,
      type: "viewport-update",
    } as DataSourceCallbackMessage);
  }
}

const getServerAPI = async () => ({
  getTableList: async () => ({
    tables: [{ module: "NOTIFICATIONS", table: "notifications" }],
  }),
  getTableSchema: async (table: { module: string; table: string }) => ({
    columns: COLUMNS.map((name) => ({ name, serverDataType: "string" as const })),
    key: "id",
    table,
  }),
  rpcCall: async () => undefined as never,
});

const SimulDataSourceProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider
    getServerAPI={getServerAPI}
    VuuDataSource={FakeDataSource as unknown as DataSourceConstructor}
  >
    {children}
  </DataProvider>
);

const localServers = [
  { connectionId: "simul", DataSourceProvider: SimulDataSourceProvider },
];
const modules = [testModule("m0"), testModule("m1")];

const flush = async () => {
  for (let i = 0; i < 5; i++) {
    await act(async () => new Promise((resolve) => setTimeout(resolve, 0)));
  }
};

describe("PortalNotificationsProvider", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: PortalNotificationsAPI | undefined;
  let backend: InMemoryPersistenceBackend;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    sources.length = 0;
    backend = new InMemoryPersistenceBackend();
    // m0 uses the simul local server, m1 the portal's own.
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url) =>
      Response.json(
        String(url).includes("/m0")
          ? { connectionId: "simul" }
          : {},
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const Probe = () => {
    api = usePortalNotifications();
    const total = useUnreadCount();
    const m0 = useModuleUnreadCount("m0");
    const list = useNotificationList();
    return (
      <output>
        {JSON.stringify({ list: list.map(({ key }) => key), m0, total })}
      </output>
    );
  };

  const render = async (openModuleId?: string) => {
    await act(async () =>
      root.render(
        <AuthenticationProvider
          localServers={localServers}
          mode="local"
          registry={{ modules }}
        >
          <PortalPersistenceRoot persistence={backend}>
            <PortalNotificationsProvider openModuleId={openModuleId}>
              <Probe />
            </PortalNotificationsProvider>
          </PortalPersistenceRoot>
        </AuthenticationProvider>,
      ),
    );
    await flush();
  };

  const output = () => JSON.parse(container.querySelector("output")!.textContent!);

  it("feeds local server notifications into the store, attributed to their module", async () => {
    await render();
    expect(sources).toHaveLength(1);
    expect(sources[0].props.table).toEqual({
      module: "NOTIFICATIONS",
      table: "notifications",
    });
    await act(async () => sources[0].send(["1", "2"]));
    expect(output()).toEqual({
      list: ["simul:2", "simul:1"],
      m0: 2,
      total: 2,
    });
  });

  it("marks the open module's notifications read", async () => {
    await render("m0");
    await act(async () => sources[0].send(["1"]));
    expect(output().m0).toBe(0);
    await render(undefined);
    await act(async () => sources[0].send(["1", "2"]));
    expect(output().m0).toBe(1);
  });

  it("persists read state in the portal's saved state", async () => {
    await render();
    await act(async () => sources[0].send(["1", "2"]));
    await act(async () => api?.markRead(["simul:1"]));
    await act(async () => root.unmount());
    root = createRoot(container);
    sources.length = 0;
    await flush();
    const saved = await backend.load({
      applicationKey: PORTAL_APPLICATION_KEY,
      applicationVersion: PORTAL_APPLICATION_VERSION,
      user: "local-user",
    });
    expect(
      (saved?.entries?.[NOTIFICATIONS_STATE_KEY]?.value as { read: object })
        ?.read,
    ).toHaveProperty("simul:1");

    await render();
    await act(async () => sources[0].send(["1", "2"]));
    expect(output()).toMatchObject({ m0: 1, total: 1 });
  });

  it("publishes client notifications", async () => {
    await render();
    await act(async () => {
      api?.publish({ id: "c1", level: "error", title: "Failed" });
    });
    expect(output()).toMatchObject({ list: ["client:portal:c1"], total: 1 });
  });

  it("renders without notifications when disabled", async () => {
    await act(async () =>
      root.render(
        <AuthenticationProvider
          localServers={localServers}
          mode="local"
          registry={{ modules }}
        >
          <PortalNotificationsProvider options={false}>
            <Probe />
          </PortalNotificationsProvider>
        </AuthenticationProvider>,
      ),
    );
    await flush();
    expect(sources).toHaveLength(0);
    expect(api).toBeUndefined();
    expect(output()).toEqual({ list: [], m0: 0, total: 0 });
  });
});
