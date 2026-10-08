import type {
  DataSourceCallbackMessage,
  DataSourceConstructorProps,
  DataSourceRow,
} from "@vuu-ui/vuu-data-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import {
  defaultNotificationAttribution,
  NotificationFeedManager,
} from "../../src/notifications/NotificationFeedManager";
import { NotificationStore } from "../../src/notifications/NotificationStore";
import {
  type NotificationFeedScope,
  ServerNotificationFeed,
} from "../../src/notifications/ServerNotificationFeed";
import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import { testModule } from "../connection-management/test-modules";

const COLUMNS = [
  "id",
  "title",
  "message",
  "level",
  "type",
  "module",
  "vuuCreatedTimestamp",
];

type Values = {
  id: string;
  title?: string;
  module?: string;
  vuuCreatedTimestamp?: number;
};

const toRow = (index: number, v: Values): DataSourceRow =>
  [
    index,
    index,
    true,
    false,
    0,
    0,
    v.id,
    0,
    0,
    0,
    v.id,
    v.title ?? `title ${v.id}`,
    "message",
    "INFO",
    "toast",
    v.module ?? "",
    v.vuuCreatedTimestamp ?? 1000,
  ] as unknown as DataSourceRow;

const fakeScope = ({ supported = true } = {}) => {
  const sources: FakeDataSource[] = [];
  class FakeDataSource {
    callback?: (message: DataSourceCallbackMessage) => void;
    unsubscribe = vi.fn();
    constructor(public props: DataSourceConstructorProps) {
      sources.push(this);
    }
    async subscribe(
      _: unknown,
      callback: (message: DataSourceCallbackMessage) => void,
    ) {
      this.callback = callback;
    }
    send(rows: Values[], size = rows.length, from = 0) {
      this.callback?.({
        clientViewportId: "vp",
        mode: "batch",
        rows: rows.map((v, i) => toRow(from + i, v)),
        size,
        type: "viewport-update",
      } as DataSourceCallbackMessage);
    }
  }
  const scope: NotificationFeedScope = {
    getServerAPI: async () => ({
      getTableList: async () => ({
        tables: supported
          ? [{ module: "NOTIFICATIONS", table: "notifications" }]
          : [{ module: "SIMUL", table: "instruments" }],
      }),
      getTableSchema: async (table) => ({
        columns: COLUMNS.map((name) => ({ name, serverDataType: "string" })),
        key: "id",
        table,
      }),
    }),
    VuuDataSource:
      FakeDataSource as unknown as NotificationFeedScope["VuuDataSource"],
  };
  return { scope, sources };
};

const flush = async () => {
  for (let i = 0; i < 20; i++) await Promise.resolve();
};

describe("ServerNotificationFeed", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const startFeed = async (
    options: { supported?: boolean; maxRows?: number } = {},
  ) => {
    const { scope, sources } = fakeScope(options);
    let time = 0;
    const sink = { expire: vi.fn(), upsert: vi.fn() };
    const feed = new ServerNotificationFeed({
      connectionId: "s1",
      maxRows: options.maxRows,
      now: () => time,
      scope,
      sink,
    });
    await feed.start();
    return {
      advance: (ms: number) => {
        time += ms;
        vi.advanceTimersByTime(ms);
      },
      feed,
      sink,
      sources,
    };
  };

  it("subscribes newest first with the table's columns", async () => {
    const { feed, sources } = await startFeed();
    expect(feed.status).toBe("subscribed");
    expect(sources[0].props).toMatchObject({
      columns: COLUMNS,
      sort: { sortDefs: [{ column: "vuuCreatedTimestamp", sortType: "D" }] },
      table: { module: "NOTIFICATIONS", table: "notifications" },
    });
  });

  it("leaves servers without the table alone", async () => {
    const { feed, sources } = await startFeed({ supported: false });
    expect(feed.status).toBe("unsupported");
    expect(sources).toHaveLength(0);
  });

  it("passes rows on, marking the first snapshot initial", async () => {
    const { advance, sink, sources } = await startFeed();
    sources[0].send([{ id: "1" }, { id: "2" }]);
    expect(sink.upsert).toHaveBeenCalledTimes(2);
    expect(sink.upsert).toHaveBeenCalledWith(
      {
        connectionId: "s1",
        rowKey: "1",
        values: expect.objectContaining({ id: "1", title: "title 1" }),
      },
      true,
    );
    advance(1000);
    sources[0].send([{ id: "3" }, { id: "1" }, { id: "2" }]);
    // Shifted rows with unchanged values aren't passed on again.
    expect(sink.upsert).toHaveBeenCalledTimes(3);
    expect(sink.upsert).toHaveBeenLastCalledWith(
      expect.objectContaining({ rowKey: "3" }),
      false,
    );
  });

  it("expires rows that disappear from a table smaller than the window", async () => {
    const { advance, sink, sources } = await startFeed();
    sources[0].send([{ id: "1" }, { id: "2" }]);
    advance(100);
    sources[0].send([{ id: "2" }], 1);
    advance(100);
    expect(sink.expire).toHaveBeenCalledWith("s1", "1");
    expect(sink.expire).toHaveBeenCalledTimes(1);
  });

  it("does not expire rows pushed out of a full window", async () => {
    const { advance, sink, sources } = await startFeed({ maxRows: 2 });
    sources[0].send([{ id: "1" }, { id: "2" }], 2);
    advance(100);
    sources[0].send([{ id: "3" }, { id: "1" }], 3);
    advance(100);
    expect(sink.expire).not.toHaveBeenCalled();
  });

  it("unsubscribes when disposed and ignores later messages", async () => {
    const { feed, sink, sources } = await startFeed();
    feed.dispose();
    expect(sources[0].unsubscribe).toHaveBeenCalled();
    sources[0].send([{ id: "1" }]);
    expect(sink.upsert).not.toHaveBeenCalled();
    expect(feed.status).toBe("disposed");
  });
});

describe("NotificationFeedManager", () => {
  const createMap = (
    configs: Record<string, RemoteModuleConnection | undefined>,
  ) => {
    const map = new ModuleServerMap({
      loadConfig: async (mfUrl: string) => ({
        vuu: configs[mfUrl.split("/").pop() as string],
      }),
      modules: Object.keys(configs).map((id) => testModule(id)),
      portalConnectionId: "portal",
    });
    map.start();
    return map;
  };
  const server = (connectionId: string) =>
    ({ connectionId, url: `wss://${connectionId}` }) as RemoteModuleConnection;

  const setup = async (
    configs: Record<string, RemoteModuleConnection | undefined>,
  ) => {
    const map = createMap(configs);
    await flush();
    const store = new NotificationStore();
    const feeds = new Map<string, ReturnType<typeof fakeScope>>();
    const manager = new NotificationFeedManager({
      moduleServerMap: map,
      store,
    });
    const attach = async (connectionId: string) => {
      const fake = fakeScope();
      feeds.set(connectionId, fake);
      manager.attach(connectionId, fake.scope);
      await flush();
      return fake.sources[0];
    };
    return { attach, manager, map, store };
  };

  it("attributes a server's notifications to the one module using it", async () => {
    const { attach, store } = await setup({ a: server("s1"), b: server("s2") });
    const source = await attach("s1");
    source.send([{ id: "1" }]);
    expect(store.get("s1:1")?.origin).toEqual({
      connectionId: "s1",
      moduleIds: ["a"],
      source: "server",
    });
    expect(store.unreadCount({ moduleIds: ["a"] })).toBe(1);
  });

  it("splits a shared server by the module column, else all modules", async () => {
    const { attach, store } = await setup({ a: server("s1"), b: server("s1") });
    const source = await attach("s1");
    source.send([{ id: "1", module: "b" }, { id: "2" }]);
    expect(store.get("s1:1")?.origin.moduleIds).toEqual(["b"]);
    expect(store.get("s1:2")?.origin.moduleIds).toEqual(["a", "b"]);
  });

  it("attributes portal server notifications only when they name a module", async () => {
    const { attach, store } = await setup({ a: undefined, b: undefined });
    const source = await attach("portal");
    source.send([{ id: "1", module: "a" }, { id: "2" }]);
    expect(store.get("portal:1")?.origin.moduleIds).toEqual(["a"]);
    expect(store.get("portal:2")?.origin.moduleIds).toEqual([]);
    expect(store.unreadPortalCount).toBe(1);
  });

  it("attributes override servers to their host module", async () => {
    const { attach, manager, store } = await setup({ a: server("s1") });
    const source = await attach("override");
    source.send([{ id: "1" }]);
    expect(store.get("override:1")?.origin.moduleIds).toEqual([]);
    manager.registerHost("override", "a");
    expect(store.get("override:1")?.origin.moduleIds).toEqual(["a"]);
  });

  it("expires by row key and keeps notifications when detached", async () => {
    vi.useFakeTimers({ toFake: ["setTimeout"] });
    try {
      const { attach, manager, store } = await setup({ a: server("s1") });
      const source = await attach("s1");
      source.send([{ id: "1" }, { id: "2" }]);
      source.send([{ id: "2" }], 1);
      vi.advanceTimersByTime(100);
      expect(store.get("s1:1")?.expired).toBe(true);
      manager.detach("s1");
      expect(source.unsubscribe).toHaveBeenCalled();
      expect(store.get("s1:2")).toBeDefined();
    } finally {
      vi.useRealTimers();
    }
  });

  it("follows registry connection state", async () => {
    const { manager } = await setup({ a: server("s1") });
    const listeners: ((id: string, state: string) => void)[] = [];
    const registry = {
      connectedIds: () => ["s1"],
      onStateChange: (listener: (id: string, state: string) => void) => {
        listeners.push(listener);
        return () => {};
      },
    };
    const scopeFor = () => fakeScope().scope;
    manager.driveFromRegistry(
      registry as never,
      (id) => id !== "local",
      scopeFor,
    );
    expect(manager.connectionIds).toEqual(["s1"]);
    listeners[0]("s2", "connected");
    listeners[0]("local", "connected");
    listeners[0]("s1", "reconnecting");
    expect(manager.connectionIds).toEqual(["s1", "s2"]);
    listeners[0]("s1", "idle");
    listeners[0]("s2", "failed");
    expect(manager.connectionIds).toEqual([]);
  });

  it("supports custom attribution", () => {
    const attribution = defaultNotificationAttribution("portal");
    const modules = [testModule("a"), testModule("b")];
    const n = {
      attributes: { clientIdentifier: "b" },
      origin: { connectionId: "s1", moduleIds: [], source: "server" },
    } as never;
    expect(attribution(n, modules)).toEqual(["b"]);
  });
});
