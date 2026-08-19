import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type DocumentRef,
  InMemoryPersistenceBackend,
  LocalStoragePersistenceBackend,
  type PersistenceBackend,
  PersistenceConflictError,
  PersistenceQuotaError,
  PersistenceValidationError,
} from "../../src/persistence";
import { MemoryStorage, entry, stateDocument } from "./test-utils";

const ref = (applicationKey: string, applicationVersion = 1): DocumentRef => ({
  user: "steve",
  applicationKey,
  applicationVersion,
});

const contract = (name: string, createBackend: () => PersistenceBackend) => {
  describe(`${name} (PersistenceBackend contract)`, () => {
    it("saves, loads and assigns revisions", async () => {
      const backend = createBackend();
      const document = stateDocument({
        applicationKey: "orders",
        applicationVersion: 1,
        revision: 0,
        entries: { a: entry(1) },
      });
      expect(await backend.load(ref("orders"))).toBeUndefined();
      expect(await backend.save(document, 0)).toEqual({ revision: 1 });
      expect(await backend.save(document, 1)).toEqual({ revision: 2 });
      const loaded = await backend.load(ref("orders"));
      expect(loaded?.revision).toBe(2);
      expect(loaded?.entries.a.value).toBe(1);
    });

    it("rejects a stale revision with the current document", async () => {
      const backend = createBackend();
      const document = stateDocument({
        applicationKey: "orders",
        applicationVersion: 1,
      });
      await backend.save(document, 0);
      const error = await backend.save(document, 0).catch((e) => e);
      expect(error).toBeInstanceOf(PersistenceConflictError);
      expect((error as PersistenceConflictError).current?.revision).toBe(1);
    });

    it("saves without a revision check when none is expected", async () => {
      const backend = createBackend();
      const document = stateDocument({
        applicationKey: "a",
        applicationVersion: 1,
      });
      await backend.save(document);
      expect(await backend.save(document)).toEqual({ revision: 2 });
    });

    it("lists metadata for the user's documents only", async () => {
      const backend = createBackend();
      await backend.save(
        stateDocument({
          applicationKey: "orders",
          applicationVersion: 2,
          applicationTitle: "Orders",
          carriedForwardFrom: 1,
          entries: {
            "table/sort": entry("x", { label: "Sort", group: "Table" }),
          },
          notCarriedForward: [{ key: "old", fromVersion: 1, reason: "Gone" }],
        }),
      );
      await backend.save(
        stateDocument({
          applicationKey: "orders",
          applicationVersion: 1,
          user: "other",
        }),
      );
      const summaries = await backend.list("steve");
      expect(summaries).toHaveLength(1);
      expect(summaries[0]).toMatchObject({
        applicationKey: "orders",
        applicationVersion: 2,
        applicationTitle: "Orders",
        carriedForwardFrom: 1,
        notCarriedForward: [{ key: "old" }],
        entries: [{ key: "table/sort", label: "Sort", group: "Table" }],
      });
      expect(summaries[0].size).toBeGreaterThan(0);
      expect(summaries[0].entries[0].size).toBeGreaterThan(0);
      expect(summaries[0].entries[0]).not.toHaveProperty("value");
    });

    it("deletes documents", async () => {
      const backend = createBackend();
      await backend.save(
        stateDocument({ applicationKey: "a", applicationVersion: 1 }),
      );
      await backend.delete(ref("a"));
      expect(await backend.load(ref("a"))).toBeUndefined();
      expect(await backend.list("steve")).toEqual([]);
    });

    it("rejects invalid documents", async () => {
      const backend = createBackend();
      await expect(
        backend.save({ applicationKey: "a" } as never),
      ).rejects.toThrow();
    });
  });
};

contract("InMemoryPersistenceBackend", () => new InMemoryPersistenceBackend());
contract(
  "LocalStoragePersistenceBackend",
  () =>
    new LocalStoragePersistenceBackend({
      storage: new MemoryStorage(),
      eventTarget: null,
    }),
);

describe("LocalStoragePersistenceBackend", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const setup = (props: { portalId?: string } = {}) => {
    const storage = new MemoryStorage();
    const eventTarget = new EventTarget();
    const backend = new LocalStoragePersistenceBackend({
      storage,
      eventTarget: eventTarget as unknown as Window,
      now: () => 1234,
      ...props,
    });
    return { backend, eventTarget, storage };
  };

  it("uses the documented storage key", async () => {
    const { backend, storage } = setup({ portalId: "trading" });
    await backend.save(
      stateDocument({
        applicationKey: "vuu.orders",
        applicationVersion: 3,
        user: "s:m",
      }),
    );
    expect(storage.keys()).toEqual([
      "vuu-portal:trading:state:s%3Am:vuu.orders:v3",
    ]);
    expect(
      backend.storageKey({
        user: "a b",
        applicationKey: "x:y",
        applicationVersion: 1,
      }),
    ).toBe("vuu-portal:trading:state:a%20b:x%3Ay:v1");
  });

  it("defaults the portal id", () => {
    const { backend } = setup();
    expect(backend.storageKey(ref("a"))).toBe(
      "vuu-portal:vuu-portal:state:steve:a:v1",
    );
  });

  it("ignores other portals and unrelated keys", async () => {
    const { backend, storage } = setup({ portalId: "one" });
    storage.setItem("vuu-portal:two:state:steve:a:v1", "{}");
    storage.setItem("something-else", "x");
    expect(await backend.list("steve")).toEqual([]);
  });

  it("sets aside a corrupt document, keeping one copy", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { backend, storage } = setup();
    const key = backend.storageKey(ref("orders"));
    storage.setItem(key, "{not json");
    expect(await backend.load(ref("orders"))).toBeUndefined();
    expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem(`${key}:corrupt:1234`)).toBe("{not json");

    storage.setItem(key, JSON.stringify({ schemaVersion: 1 }));
    await backend.load(ref("orders"));
    expect(storage.keys().filter((k) => k.includes(":corrupt:"))).toHaveLength(
      1,
    );

    const summaries = await backend.list("steve");
    expect(summaries).toEqual([
      expect.objectContaining({
        applicationKey: "orders",
        applicationVersion: 1,
        unreadable: true,
        entries: [],
      }),
    ]);

    // A new document can be written alongside the unreadable copy
    await backend.save(
      stateDocument({ applicationKey: "orders", applicationVersion: 1 }),
      0,
    );
    expect(await backend.list("steve")).toHaveLength(2);

    await backend.delete(ref("orders"), { unreadable: true });
    expect(storage.keys()).toEqual([key]);
  });

  it("treats a document from a newer schema as unsupported and leaves it alone", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { backend, storage } = setup();
    const key = backend.storageKey(ref("orders"));
    const raw = JSON.stringify({
      ...stateDocument({ applicationKey: "orders", applicationVersion: 1 }),
      schemaVersion: 7,
    });
    storage.setItem(key, raw);
    const error = await backend.load(ref("orders")).catch((e) => e);
    expect(error).toBeInstanceOf(PersistenceValidationError);
    expect((error as PersistenceValidationError).unsupportedSchema).toBe(true);
    expect(storage.getItem(key)).toBe(raw);
    expect(await backend.list("steve")).toEqual([]);
  });

  it("sets aside a document stored under the wrong key", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { backend, storage } = setup();
    storage.setItem(
      backend.storageKey(ref("orders")),
      JSON.stringify(
        stateDocument({ applicationKey: "other", applicationVersion: 1 }),
      ),
    );
    expect(await backend.load(ref("orders"))).toBeUndefined();
  });

  it("reports quota errors", async () => {
    const { backend, storage } = setup();
    storage.quota = 100;
    await expect(
      backend.save(
        stateDocument({
          applicationKey: "orders",
          applicationVersion: 1,
          entries: { big: entry("x".repeat(200)) },
        }),
      ),
    ).rejects.toBeInstanceOf(PersistenceQuotaError);
  });

  it("notifies subscribers of changes made in other tabs", () => {
    const { backend, eventTarget, storage } = setup();
    const listener = vi.fn();
    const unsubscribe = backend.subscribe("steve", listener);
    const dispatch = (key: string | null) => {
      const event = new Event("storage") as StorageEvent;
      Object.defineProperty(event, "key", { value: key });
      Object.defineProperty(event, "storageArea", { value: storage });
      eventTarget.dispatchEvent(event);
    };

    dispatch(backend.storageKey(ref("orders", 2)));
    expect(listener).toHaveBeenLastCalledWith(ref("orders", 2));

    dispatch(null);
    expect(listener).toHaveBeenLastCalledWith(undefined);

    listener.mockClear();
    dispatch(backend.storageKey({ ...ref("orders"), user: "other" }));
    dispatch(`${backend.storageKey(ref("orders"))}:corrupt:1`);
    dispatch("unrelated");
    expect(listener).not.toHaveBeenCalled();

    unsubscribe();
    dispatch(backend.storageKey(ref("orders")));
    expect(listener).not.toHaveBeenCalled();
  });
});
