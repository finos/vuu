import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ApplicationStateStore,
  type DocumentRef,
  InMemoryPersistenceBackend,
  LocalStoragePersistenceBackend,
  type PersistenceBackend,
  PersistenceConflictError,
  type StateMigration,
  createPortalPersistenceService,
} from "../../src/persistence";
import { MemoryStorage, entry, stateDocument, tick } from "./test-utils";

const ref = (applicationKey: string, applicationVersion = 1): DocumentRef => ({
  user: "steve",
  applicationKey,
  applicationVersion,
});

const createService = (
  backend: PersistenceBackend = new InMemoryPersistenceBackend(),
  options: { debounceMs?: number; maxEntrySize?: number } = {},
) =>
  createPortalPersistenceService({
    backend,
    user: "steve",
    window: null,
    now: () => new Date("2025-06-01T12:00:00.000Z"),
    ...options,
  });

const readyStore = async (store: ApplicationStateStore) => {
  await store.ready;
  return store;
};

describe("PortalPersistenceService", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe("stores", () => {
    it("caches one store per application key and version", async () => {
      const service = createService();
      const a = service.getStore("orders", 1);
      expect(service.getStore("orders", 1)).toBe(a);
      expect(service.getStore("orders", 2)).not.toBe(a);
      expect(service.getStore("trades", 1)).not.toBe(a);
      expect(a.status).toBe("loading");
      await a.ready;
      expect(a.status).toBe("ready");
    });

    it("loads saved values", async () => {
      const backend = new InMemoryPersistenceBackend({
        documents: [
          stateDocument({
            applicationKey: "orders",
            applicationVersion: 1,
            entries: { sort: entry("price") },
          }),
        ],
      });
      const store = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      expect(store.get("sort")).toBe("price");
      expect(store.has("sort")).toBe(true);
      expect(store.keys()).toEqual(["sort"]);
      expect(store.getAll()).toEqual({ sort: "price" });
    });

    it("returns frozen values that callers can't mutate", async () => {
      const store = await readyStore(createService().getStore("orders", 1));
      const value = { columns: ["a"] };
      store.set("table", value);
      value.columns.push("b");
      const stored = store.get<{ columns: string[] }>("table");
      expect(stored).toEqual({ columns: ["a"] });
      expect(Object.isFrozen(stored?.columns)).toBe(true);
      expect(store.get("table")).toBe(stored);
    });

    it("validates values and keys", async () => {
      const store = await readyStore(createService().getStore("orders", 1));
      expect(() => store.set("x", (() => 1) as never)).toThrow(TypeError);
      expect(() => store.set("x", undefined as never)).toThrow(TypeError);
      expect(() => store.set("x", new Date() as never)).toThrow(/not JSON/);
      expect(() =>
        store.set("x", Object.assign([1], { extra: 2 }) as never),
      ).toThrow(/not JSON/);
      expect(() => store.set("", 1)).toThrow(TypeError);
      expect(() => store.set("k".repeat(257), 1)).toThrow(TypeError);
    });

    it("ignores values over the size limit", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const service = createService(undefined, { maxEntrySize: 20 });
      const store = await readyStore(service.getStore("orders", 1));
      store.set("big", "x".repeat(50));
      expect(store.has("big")).toBe(false);
    });

    it("notifies subscribers, but not for a no-op set", async () => {
      const store = await readyStore(createService().getStore("orders", 1));
      const listener = vi.fn();
      store.subscribe(listener);
      store.set("sort", { column: "price" });
      store.set("sort", { column: "price" });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({ keys: ["sort"], reason: "set" });
      store.remove("sort");
      expect(listener).toHaveBeenLastCalledWith({
        keys: ["sort"],
        reason: "remove",
      });
    });

    it("ignores writes before the document has loaded", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const store = createService().getStore("orders", 1);
      store.set("sort", "price");
      expect(store.has("sort")).toBe(false);
    });

    it("uses defaults when the document can't be loaded", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const backend = new InMemoryPersistenceBackend();
      vi.spyOn(backend, "load").mockRejectedValue(Error("offline"));
      const service = createService(backend);
      const store = await readyStore(service.getStore("orders", 1));
      expect(store.status).toBe("error");
      expect(store.keys()).toEqual([]);
      expect(service.problems()).toHaveLength(1);
    });

    it("records label and group metadata", async () => {
      const backend = new InMemoryPersistenceBackend();
      const service = createService(backend);
      const store = await readyStore(
        service.getStore("orders", 1, { title: "Orders" }),
      );
      store.describe("sort", { label: "Sort order", group: "Table" });
      store.set("sort", "price");
      store.set("layout", 1, { label: "Layout" });
      await store.flush();
      const [summary] = await backend.list("steve");
      expect(summary.applicationTitle).toBe("Orders");
      expect(summary.entries).toEqual([
        expect.objectContaining({
          key: "sort",
          label: "Sort order",
          group: "Table",
        }),
        expect.objectContaining({ key: "layout", label: "Layout" }),
      ]);
    });
  });

  describe("debounce and flush", () => {
    it("debounces writes", async () => {
      const backend = new InMemoryPersistenceBackend();
      const save = vi.spyOn(backend, "save");
      const store = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      store.set("a", 1);
      store.set("a", 2);
      store.set("b", 3);
      await vi.advanceTimersByTimeAsync(499);
      expect(save).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(save).toHaveBeenCalledTimes(1);
      const document = await backend.load(ref("orders"));
      expect(document?.entries.a.value).toBe(2);
      expect(document?.entries.b.value).toBe(3);
    });

    it("flushes immediately on request", async () => {
      const backend = new InMemoryPersistenceBackend();
      const service = createService(backend);
      const store = await readyStore(service.getStore("orders", 1));
      store.set("a", 1);
      await service.flushAll();
      expect((await backend.load(ref("orders")))?.entries.a.value).toBe(1);
    });

    it("never overlaps saves", async () => {
      const backend = new InMemoryPersistenceBackend();
      let active = 0;
      let maxActive = 0;
      const save = backend.save.bind(backend);
      vi.spyOn(backend, "save").mockImplementation(async (...args) => {
        active++;
        maxActive = Math.max(maxActive, active);
        await tick();
        active--;
        return save(...args);
      });
      const store = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      store.set("a", 1);
      const first = store.flush();
      store.set("a", 2);
      const second = store.flush();
      await vi.runAllTimersAsync();
      await Promise.all([first, second]);
      expect(maxActive).toBe(1);
      expect((await backend.load(ref("orders")))?.entries.a.value).toBe(2);
    });

    it("flushes when the page is hidden", async () => {
      const backend = new InMemoryPersistenceBackend();
      const service = createPortalPersistenceService({
        backend,
        user: "steve",
        window,
      });
      const store = await readyStore(service.getStore("orders", 1));
      store.set("a", 1);
      window.dispatchEvent(new Event("pagehide"));
      await vi.advanceTimersByTimeAsync(0);
      expect((await backend.load(ref("orders")))?.entries.a.value).toBe(1);
      service.dispose();
    });

    it("writes pending changes when disposed", async () => {
      const backend = new InMemoryPersistenceBackend();
      const service = createService(backend);
      const store = await readyStore(service.getStore("orders", 1));
      store.set("a", 1);
      service.dispose();
      await vi.advanceTimersByTimeAsync(0);
      expect((await backend.load(ref("orders")))?.entries.a.value).toBe(1);
      expect(() => service.getStore("orders", 1)).toThrow();
    });

    it("deletes the document when its last entry is removed", async () => {
      const backend = new InMemoryPersistenceBackend();
      const store = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      store.set("a", 1);
      await store.flush();
      store.remove("a");
      await store.flush();
      expect(await backend.list("steve")).toEqual([]);
    });

    it("reports quota errors as a problem", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const storage = new MemoryStorage();
      storage.quota = 1200;
      const service = createService(
        new LocalStoragePersistenceBackend({ storage, eventTarget: null }),
      );
      const store = await readyStore(service.getStore("orders", 1));
      store.set("a", "x".repeat(700));
      await store.flush();
      expect(store.status).toBe("error");
      expect(service.problems()[0].error.name).toBe("PersistenceQuotaError");
      store.set("a", "small");
      await store.flush();
      expect(store.status).toBe("ready");
      expect(service.problems()).toEqual([]);
    });
  });

  describe("conflicts and other tabs", () => {
    it("reapplies only its own changes after a conflict", async () => {
      const backend = new InMemoryPersistenceBackend();
      const tab1 = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      const tab2 = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      tab1.set("a", 1);
      await tab1.flush();
      tab2.set("b", 2);
      await tab2.flush();
      const document = await backend.load(ref("orders"));
      expect(document?.entries.a.value).toBe(1);
      expect(document?.entries.b.value).toBe(2);
      expect(tab2.get("a")).toBe(1);
    });

    it("gives up after one retry", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const backend = new InMemoryPersistenceBackend();
      vi.spyOn(backend, "save").mockImplementation(async (doc) => {
        throw new PersistenceConflictError(doc, undefined);
      });
      const store = await readyStore(
        createService(backend).getStore("orders", 1),
      );
      store.set("a", 1);
      await store.flush();
      expect(backend.save).toHaveBeenCalledTimes(2);
      expect(store.status).toBe("error");
      expect(store.get("a")).toBe(1);
    });

    it("reloads when another tab changes the document", async () => {
      const storage = new MemoryStorage();
      const eventTarget = new EventTarget() as unknown as Window;
      const backend1 = new LocalStoragePersistenceBackend({
        storage,
        eventTarget,
      });
      const backend2 = new LocalStoragePersistenceBackend({
        storage,
        eventTarget: null,
      });
      const service1 = createService(backend1);
      const tab1 = await readyStore(service1.getStore("orders", 1));
      const serviceListener = vi.fn();
      service1.subscribe(serviceListener);
      const listener = vi.fn();
      tab1.subscribe(listener);
      tab1.set("mine", 1);
      await tab1.flush();

      const tab2 = await readyStore(
        createService(backend2).getStore("orders", 1),
      );
      tab2.set("theirs", 2);
      await tab2.flush();
      listener.mockClear();

      const event = new Event("storage");
      Object.defineProperty(event, "key", {
        value: backend1.storageKey(ref("orders")),
      });
      (eventTarget as unknown as EventTarget).dispatchEvent(event);
      await vi.advanceTimersByTimeAsync(0);

      expect(tab1.get("theirs")).toBe(2);
      expect(listener).toHaveBeenCalledWith({
        keys: ["theirs"],
        reason: "external",
      });
      expect(serviceListener).toHaveBeenCalledWith(
        ref("orders"),
        expect.objectContaining({ reason: "external" }),
      );
    });

    it("keeps unsaved local changes when another tab writes", async () => {
      const storage = new MemoryStorage();
      const eventTarget = new EventTarget() as unknown as Window;
      const backend1 = new LocalStoragePersistenceBackend({
        storage,
        eventTarget,
      });
      const tab1 = await readyStore(
        createService(backend1).getStore("orders", 1),
      );
      const tab2 = await readyStore(
        createService(
          new LocalStoragePersistenceBackend({ storage, eventTarget: null }),
        ).getStore("orders", 1),
      );
      tab1.set("a", "pending");
      tab2.set("a", "other");
      tab2.set("b", "other");
      await tab2.flush();
      const event = new Event("storage");
      Object.defineProperty(event, "key", { value: null });
      (eventTarget as unknown as EventTarget).dispatchEvent(event);
      await vi.advanceTimersByTimeAsync(0);
      expect(tab1.get("a")).toBe("pending");
      expect(tab1.get("b")).toBe("other");
      await tab1.flush();
      const document = await backend1.load(ref("orders"));
      expect(document?.entries.a.value).toBe("pending");
      expect(document?.entries.b.value).toBe("other");
    });
  });

  describe("clear", () => {
    const seeded = () =>
      new InMemoryPersistenceBackend({
        documents: [
          stateDocument({
            applicationKey: "orders",
            applicationVersion: 2,
            entries: { a: entry(1), b: entry(2) },
          }),
          stateDocument({
            applicationKey: "trades",
            applicationVersion: 1,
            entries: { c: entry(3) },
          }),
        ],
      });

    it("lists documents after flushing pending writes", async () => {
      const service = createService(seeded());
      const store = await readyStore(service.getStore("fx", 1));
      store.set("x", 1);
      const summaries = await service.list();
      expect(
        summaries.map(({ applicationKey }) => applicationKey).sort(),
      ).toEqual(["fx", "orders", "trades"]);
    });

    it("clears selected keys of a document that isn't open", async () => {
      const backend = seeded();
      const service = createService(backend);
      const result = await service.clear([
        { applicationKey: "orders", applicationVersion: 2, keys: ["a"] },
      ]);
      expect(result.cleared).toEqual([{ ref: ref("orders", 2), keys: ["a"] }]);
      expect(result.failed).toEqual([]);
      const document = await backend.load(ref("orders", 2));
      expect(Object.keys(document?.entries ?? {})).toEqual(["b"]);
    });

    it("clears an open store, cancels pending writes and notifies with reason clear", async () => {
      const backend = seeded();
      const service = createService(backend);
      const store = await readyStore(service.getStore("orders", 2));
      const listener = vi.fn();
      store.subscribe(listener);
      store.set("a", 100);
      const release = service.markOpen("orders", 2);
      const result = await service.clear([
        { applicationKey: "orders", applicationVersion: 2, keys: ["a"] },
      ]);
      expect(listener).toHaveBeenLastCalledWith({
        keys: ["a"],
        reason: "clear",
      });
      expect(store.has("a")).toBe(false);
      expect(result.requiresReload).toEqual([]);
      await vi.advanceTimersByTimeAsync(1000);
      const document = await backend.load(ref("orders", 2));
      expect(document?.entries.a).toBeUndefined();
      expect(document?.entries.b.value).toBe(2);
      release();
    });

    it("reports open applications that can't react to a clear", async () => {
      const service = createService(seeded());
      await readyStore(service.getStore("orders", 2));
      service.markOpen("orders", 2);
      const result = await service.clear([
        { applicationKey: "orders", applicationVersion: 2 },
      ]);
      expect(result.requiresReload).toEqual([ref("orders", 2)]);
    });

    it("deletes a document when everything in it is cleared", async () => {
      const backend = seeded();
      const service = createService(backend);
      await service.clear([
        { applicationKey: "orders", applicationVersion: 2, keys: ["a", "b"] },
      ]);
      expect(await backend.load(ref("orders", 2))).toBeUndefined();
    });

    it("clears everything", async () => {
      const backend = seeded();
      const service = createService(backend);
      const store = await readyStore(service.getStore("fx", 1));
      store.set("x", 1);
      const result = await service.clearAll();
      expect(result.cleared).toHaveLength(3);
      expect(await backend.list("steve")).toEqual([]);
      expect(store.keys()).toEqual([]);
    });

    it("reports failures without stopping", async () => {
      const backend = seeded();
      const service = createService(backend);
      const original = backend.delete.bind(backend);
      vi.spyOn(backend, "delete").mockImplementation(
        async (target, options) => {
          if (target.applicationKey === "orders") throw Error("nope");
          return original(target, options);
        },
      );
      const result = await service.clear([
        { applicationKey: "orders", applicationVersion: 2 },
        { applicationKey: "trades", applicationVersion: 1 },
      ]);
      expect(result.failed.map(({ ref }) => ref.applicationKey)).toEqual([
        "orders",
      ]);
      expect(result.cleared.map(({ ref }) => ref.applicationKey)).toEqual([
        "trades",
      ]);
    });

    it("clears not-carried-forward records", async () => {
      const backend = new InMemoryPersistenceBackend({
        documents: [
          stateDocument({
            applicationKey: "orders",
            applicationVersion: 2,
            carriedForwardFrom: 1,
            entries: { a: entry(1) },
            notCarriedForward: [
              { key: "x", fromVersion: 1, reason: "r" },
              { key: "y", fromVersion: 1, reason: "r" },
            ],
          }),
        ],
      });
      const service = createService(backend);
      await service.clear([
        {
          applicationKey: "orders",
          applicationVersion: 2,
          keys: [],
          notCarriedForward: ["x"],
        },
      ]);
      const document = await backend.load(ref("orders", 2));
      expect(document?.notCarriedForward?.map(({ key }) => key)).toEqual(["y"]);
      expect(document?.entries.a).toBeDefined();
    });

    it("clears a retained copy of unreadable data", async () => {
      vi.spyOn(console, "warn").mockImplementation(() => undefined);
      const storage = new MemoryStorage();
      const backend = new LocalStoragePersistenceBackend({
        storage,
        eventTarget: null,
      });
      storage.setItem(backend.storageKey(ref("orders")), "garbage");
      const service = createService(backend);
      const [summary] = await service.list();
      expect(summary.unreadable).toBe(true);
      await service.clear([
        { applicationKey: "orders", applicationVersion: 1, unreadable: true },
      ]);
      expect(storage.length).toBe(0);
    });

    it("keeps a cleared document while an earlier version exists, so it isn't carried forward again", async () => {
      const backend = new InMemoryPersistenceBackend({
        documents: [
          stateDocument({
            applicationKey: "orders",
            applicationVersion: 1,
            entries: { a: entry(1) },
          }),
        ],
      });
      const service = createService(backend);
      const store = await readyStore(service.getStore("orders", 2));
      expect(store.get("a")).toBe(1);
      await service.clear([
        { applicationKey: "orders", applicationVersion: 2, keys: ["a"] },
      ]);
      const next = createService(backend);
      const reopened = await readyStore(next.getStore("orders", 2));
      expect(reopened.keys()).toEqual([]);

      // Clearing the earlier version too removes everything.
      await next.clear([{ applicationKey: "orders", applicationVersion: 1 }]);
      expect(await backend.list("steve")).toEqual([]);
    });
  });

  describe("carry-forward", () => {
    const history = () =>
      new InMemoryPersistenceBackend({
        documents: [1, 2, 4].map((version) =>
          stateDocument({
            applicationKey: "orders",
            applicationVersion: version,
            applicationTitle: "Orders",
            entries: {
              from: entry(version),
              sort: entry("price", { label: "Sort" }),
            },
          }),
        ),
      });

    it("carries forward from the latest earlier version, never a later one", async () => {
      const backend = history();
      const store = await readyStore(
        createService(backend).getStore("orders", 3),
      );
      expect(store.get("from")).toBe(2);
      const document = await backend.load(ref("orders", 3));
      expect(document).toMatchObject({ carriedForwardFrom: 2, revision: 1 });
    });

    it("starts empty when there's no earlier version", async () => {
      const backend = history();
      const store = await readyStore(createService(backend).getStore("fx", 1));
      expect(store.keys()).toEqual([]);
      expect(await backend.load(ref("fx", 1))).toBeUndefined();
    });

    it("runs migrations in order, only once", async () => {
      const backend = history();
      const migrate = vi.fn();
      const migrations: StateMigration[] = [
        { version: 5, migrate: (state) => migrate(state.toVersion) },
        { version: 3, migrate: (state) => migrate(state.toVersion) },
        { version: 2, migrate: (state) => migrate(state.toVersion) },
      ];
      const service = createService(backend);
      await readyStore(service.getStore("orders", 5, { migrations }));
      expect(migrate.mock.calls).toEqual([[5]]);
      const report = service.consumeCarryForwardReport("orders", 5);
      expect(report).toMatchObject({
        fromVersion: 4,
        toVersion: 5,
        aborted: false,
      });
      expect(service.consumeCarryForwardReport("orders", 5)).toBeUndefined();

      migrate.mockClear();
      await readyStore(
        createService(backend).getStore("orders", 5, { migrations }),
      );
      expect(migrate).not.toHaveBeenCalled();
      expect((await backend.load(ref("orders", 5)))?.migrationsApplied).toEqual(
        [5],
      );
    });

    it("accepts migrations as a promise, loading the document in parallel", async () => {
      const backend = history();
      const load = vi.spyOn(backend, "load");
      let resolveMigrations!: (migrations: StateMigration[]) => void;
      const migrations = new Promise<StateMigration[]>((resolve) => {
        resolveMigrations = resolve;
      });
      const store = createService(backend).getStore("orders", 5, {
        migrations,
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(load).toHaveBeenCalled();
      expect(store.status).toBe("loading");
      resolveMigrations([
        {
          version: 5,
          migrate: (state) => state.set("migrated", true),
        },
      ]);
      await store.ready;
      expect(store.get("migrated")).toBe(true);
    });

    it("doesn't wait for migrations when the version already has a document", async () => {
      const store = createService(history()).getStore("orders", 4, {
        migrations: new Promise(() => undefined),
      });
      await store.ready;
      expect(store.get("from")).toBe(4);
    });

    it("records entries that weren't carried forward, and notify messages", async () => {
      const service = createService(history());
      await readyStore(
        service.getStore("orders", 5, {
          title: "Orders",
          migrations: [
            {
              version: 5,
              migrate: (state) => {
                state.update("sort", (_, e) => e.reject("Sorting has changed"));
                state.update("from", (value, e) => {
                  e.notify("Something moved.");
                  return value;
                });
              },
            },
          ],
        }),
      );
      expect(service.consumeCarryForwardReport("orders", 5)).toEqual({
        applicationKey: "orders",
        applicationTitle: "Orders",
        fromVersion: 4,
        toVersion: 5,
        aborted: false,
        notifications: ["Something moved."],
        rejected: [
          {
            key: "sort",
            label: "Sort",
            fromVersion: 4,
            reason: "Sorting has changed",
          },
        ],
      });
      const [summary] = (await service.list()).filter(
        (s) => s.applicationVersion === 5,
      );
      expect(summary.notCarriedForward).toHaveLength(1);
    });

    it("starts empty, without saving, when carry-forward is aborted", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);
      const backend = history();
      const migrations: StateMigration[] = [
        {
          version: 5,
          migrate: () => {
            throw Error("bug");
          },
        },
      ];
      const service = createService(backend);
      const store = await readyStore(
        service.getStore("orders", 5, { migrations }),
      );
      expect(store.status).toBe("ready");
      expect(store.keys()).toEqual([]);
      expect(await backend.load(ref("orders", 5))).toBeUndefined();
      expect(service.consumeCarryForwardReport("orders", 5)).toMatchObject({
        aborted: true,
        fromVersion: 4,
      });
      // Earlier versions are untouched.
      expect((await backend.load(ref("orders", 4)))?.entries.from.value).toBe(
        4,
      );
    });

    it("tries again next time when the application code couldn't be loaded", async () => {
      const backend = history();
      const service = createService(backend);
      const store = service.getStore("orders", 5, {
        migrations: Promise.reject(Error("remote unavailable")),
      });
      await store.ready;
      expect(await backend.load(ref("orders", 5))).toBeUndefined();
      expect(service.getStore("orders", 5)).not.toBe(store);
    });

    it("handles the create-if-absent race between tabs", async () => {
      const backend = history();
      let migrateCount = 0;
      const migrations = (value: string): StateMigration[] => [
        {
          version: 5,
          migrate: (state) => {
            migrateCount++;
            state.set("winner", value);
          },
        },
      ];
      const tab1 = createService(backend).getStore("orders", 5, {
        migrations: migrations("tab1"),
      });
      const tab2 = createService(backend).getStore("orders", 5, {
        migrations: migrations("tab2"),
      });
      await Promise.all([tab1.ready, tab2.ready]);
      expect(migrateCount).toBe(2);
      expect(tab1.get("winner")).toBe(tab2.get("winner"));
      const document = await backend.load(ref("orders", 5));
      expect(document?.revision).toBe(1);
      expect(document?.entries.winner.value).toBe(tab1.get("winner"));
    });
  });
});
