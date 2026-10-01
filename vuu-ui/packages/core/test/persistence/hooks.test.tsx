import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  type ApplicationStateStore,
  ApplicationStateProvider,
  InMemoryPersistenceBackend,
  PortalPersistenceProvider,
  type PortalPersistenceService,
  createPortalPersistenceService,
  useApplicationState,
  useOptionalApplicationState,
  type PersistedStateAPI,
  usePersistedState,
  usePortalPersistence,
} from "../../src/persistence";

describe("persistence hooks", () => {
  let container: HTMLDivElement;
  let root: Root;
  let service: PortalPersistenceService;
  let store: ApplicationStateStore;

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    service = createPortalPersistenceService({
      backend: new InMemoryPersistenceBackend(),
      user: "steve",
      window: null,
    });
    store = service.getStore("orders", 1);
    await store.ready;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    service.dispose();
    vi.restoreAllMocks();
  });

  let api: PersistedStateAPI;
  let renders = 0;
  const Probe = () => {
    renders += 1;
    api = usePersistedState();
    return null;
  };

  it("loads and saves through the application's store", async () => {
    store.set("count", 3);
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <Probe />
        </ApplicationStateProvider>,
      ),
    );
    expect(api.load("count")).toBe(3);
    expect(api.load("missing")).toBeUndefined();
    act(() => api.save(5, "count", { label: "Count", group: "Demo" }));
    expect(store.get("count")).toBe(5);
    expect(api.load("count")).toBe(5);
    await store.flush();
    const [summary] = await service.list();
    expect(summary.entries[0]).toMatchObject({ label: "Count", group: "Demo" });
  });

  it("does not render when state is saved or changed elsewhere", () => {
    renders = 0;
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <Probe />
        </ApplicationStateProvider>,
      ),
    );
    const first = api;
    const rendersBefore = renders;
    act(() => api.save(1, "count"));
    act(() => store.set("count", 2));
    expect(renders).toBe(rendersBefore);
    expect(api).toBe(first);
  });

  it("waits for the store to load before rendering", async () => {
    const loading = service.getStore("orders", 2);
    expect(loading.status).toBe("loading");
    await act(async () =>
      root.render(
        <ApplicationStateProvider store={loading}>
          <Probe />
        </ApplicationStateProvider>,
      ),
    );
    expect(loading.status).toBe("ready");
    expect(api.load("count")).toBeUndefined();
  });

  it("does nothing outside a portal", () => {
    act(() => root.render(<Probe />));
    expect(api.load("count")).toBeUndefined();
    expect(() => api.save(3, "count")).not.toThrow();
  });

  it("does nothing when the provider has no store", () => {
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <ApplicationStateProvider store={undefined}>
            <Probe />
          </ApplicationStateProvider>
        </ApplicationStateProvider>,
      ),
    );
    act(() => api.save(3, "count"));
    expect(api.load("count")).toBeUndefined();
    expect(store.get("count")).toBeUndefined();
  });

  it("useApplicationState throws outside a portal; the optional variant doesn't", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    let optional: ApplicationStateStore | undefined | "unset" = "unset";
    const Optional = () => {
      optional = useOptionalApplicationState();
      return null;
    };
    act(() => root.render(<Optional />));
    expect(optional).toBeUndefined();

    const Required = () => {
      useApplicationState();
      return null;
    };
    expect(() => act(() => root.render(<Required />))).toThrow(
      /useApplicationState/,
    );
  });

  it("usePortalPersistence returns the service", () => {
    let found: PortalPersistenceService | undefined;
    const Probe = () => {
      found = usePortalPersistence();
      return null;
    };
    act(() =>
      root.render(
        <PortalPersistenceProvider service={service}>
          <Probe />
        </PortalPersistenceProvider>,
      ),
    );
    expect(found).toBe(service);
  });
});
