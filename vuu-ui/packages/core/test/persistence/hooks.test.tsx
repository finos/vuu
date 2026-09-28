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
  usePersistentState,
  usePortalPersistence,
} from "../../src/persistence";

type Setter = (value: number | ((previous: number) => number)) => void;

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

  let setCount: Setter;
  const Counter = () => {
    const [count, set] = usePersistentState("count", 0, {
      label: "Count",
      group: "Demo",
    });
    setCount = set;
    return <span data-testid="count">{count}</span>;
  };
  const text = () =>
    container.querySelector("[data-testid=count]")?.textContent;

  it("reads and writes through the application's store", () => {
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <Counter />
        </ApplicationStateProvider>,
      ),
    );
    expect(text()).toBe("0");
    act(() => setCount(5));
    expect(text()).toBe("5");
    expect(store.get("count")).toBe(5);
    act(() => setCount((n) => n + 1));
    expect(store.get("count")).toBe(6);
  });

  it("declares metadata on mount", async () => {
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <Counter />
        </ApplicationStateProvider>,
      ),
    );
    act(() => setCount(1));
    await store.flush();
    const [summary] = await service.list();
    expect(summary.entries[0]).toMatchObject({ label: "Count", group: "Demo" });
  });

  it("reflects changes made elsewhere, and reverts to the default when cleared", async () => {
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <Counter />
        </ApplicationStateProvider>,
      ),
    );
    act(() => store.set("count", 9));
    expect(text()).toBe("9");
    await act(async () => {
      await service.clear([
        { applicationKey: "orders", applicationVersion: 1 },
      ]);
    });
    expect(text()).toBe("0");
  });

  it("falls back to plain state outside a portal", () => {
    act(() => root.render(<Counter />));
    expect(text()).toBe("0");
    act(() => setCount(3));
    expect(text()).toBe("3");
  });

  it("falls back to plain state when the provider has no store", () => {
    act(() =>
      root.render(
        <ApplicationStateProvider store={store}>
          <ApplicationStateProvider store={undefined}>
            <Counter />
          </ApplicationStateProvider>
        </ApplicationStateProvider>,
      ),
    );
    act(() => setCount(3));
    expect(text()).toBe("3");
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
