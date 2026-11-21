import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  InMemoryPersistenceBackend,
  type PersistenceBackend,
  createPortalPersistenceService,
} from "../../src/persistence";

const SAVED_AT = new Date("2025-06-01T12:00:00.000Z");

const createService = (
  backend: PersistenceBackend = new InMemoryPersistenceBackend(),
) =>
  createPortalPersistenceService({
    backend,
    user: "steve",
    window: null,
    now: () => SAVED_AT,
  });

describe("PortalPersistenceService save status", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("is idle and never saved initially", () => {
    expect(createService().getSaveStatus()).toEqual({ saving: false });
  });

  it("reports saving while a write is pending, then when it was saved", async () => {
    const service = createService();
    const listener = vi.fn();
    service.subscribeSaveStatus(listener);
    const store = service.getStore("orders", 1);
    await store.ready;

    store.set("a", 1);
    expect(service.getSaveStatus()).toEqual({ saving: true });
    expect(listener).toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(500);
    expect(service.getSaveStatus()).toEqual({
      saving: false,
      lastSavedAt: SAVED_AT.getTime(),
    });
  });

  it("keeps the same snapshot when nothing changed", async () => {
    const service = createService();
    const store = service.getStore("orders", 1);
    await store.ready;
    store.set("a", 1);
    const first = service.getSaveStatus();
    store.set("a", 2);
    expect(service.getSaveStatus()).toBe(first);
  });

  it("stays saving until every store has written", async () => {
    const service = createService();
    const orders = service.getStore("orders", 1);
    const trades = service.getStore("trades", 1);
    await Promise.all([orders.ready, trades.ready]);

    orders.set("a", 1);
    await vi.advanceTimersByTimeAsync(300);
    trades.set("b", 1);
    await vi.advanceTimersByTimeAsync(250);
    expect(service.getSaveStatus().saving).toBe(true);
    await vi.advanceTimersByTimeAsync(300);
    expect(service.getSaveStatus()).toEqual({
      saving: false,
      lastSavedAt: SAVED_AT.getTime(),
    });
  });

  it("doesn't record a save when the write fails", async () => {
    const backend = new InMemoryPersistenceBackend();
    vi.spyOn(backend, "save").mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const service = createService(backend);
    const store = service.getStore("orders", 1);
    await store.ready;
    store.set("a", 1);
    await vi.advanceTimersByTimeAsync(500);
    expect(service.getSaveStatus().lastSavedAt).toBeUndefined();
    vi.restoreAllMocks();
  });

  it("stops notifying after unsubscribe", async () => {
    const service = createService();
    const listener = vi.fn();
    const unsubscribe = service.subscribeSaveStatus(listener);
    unsubscribe();
    const store = service.getStore("orders", 1);
    await store.ready;
    store.set("a", 1);
    expect(listener).not.toHaveBeenCalled();
  });
});
