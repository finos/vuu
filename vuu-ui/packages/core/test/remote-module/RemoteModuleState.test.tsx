import { Suspense, act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@module-federation/enhanced/runtime", () => ({
  loadRemote: vi.fn(),
  registerRemotes: vi.fn(),
}));

import { loadRemote } from "@module-federation/enhanced/runtime";
import { PortalPersistenceRoot } from "../../src/common-shell/PortalPersistenceRoot";
import {
  InMemoryPersistenceBackend,
  LocalStoragePersistenceBackend,
  PortalPersistenceProvider,
  type PortalPersistenceService,
  type StateMigration,
  createPortalPersistenceService,
  useOptionalApplicationState,
  useOptionalPortalPersistence,
  usePersistentState,
} from "../../src/persistence";
import { RemoteModule } from "../../src/remote-module/RemoteModule";
import { MemoryStorage, entry, stateDocument } from "../persistence/test-utils";

let remoteProps: Record<string, unknown> = {};

const Counter = (props: Record<string, unknown>) => {
  remoteProps = props;
  const store = useOptionalApplicationState();
  const [count] = usePersistentState("count", 0);
  return (
    <div data-testid="remote">
      {store ? `${store.applicationKey}@${store.applicationVersion}` : "none"}:
      {count}
    </div>
  );
};

let urlSequence = 0;
const nextUrl = () => `http://localhost:${6000 + urlSequence++}`;

describe("RemoteModule saved state", () => {
  let container: HTMLDivElement;
  let root: Root;
  let backend: InMemoryPersistenceBackend;
  let service: PortalPersistenceService;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    remoteProps = {};
    vi.mocked(loadRemote).mockResolvedValue({ default: Counter });
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    backend = new InMemoryPersistenceBackend({
      documents: [
        stateDocument({
          applicationKey: "orders",
          applicationVersion: 1,
          entries: { count: entry(7) },
        }),
      ],
    });
    service = createPortalPersistenceService({
      backend,
      user: "steve",
      window: null,
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    service.dispose();
    vi.restoreAllMocks();
  });

  const renderModule = async (
    props: Partial<Parameters<typeof RemoteModule>[0]> = {},
  ) => {
    const mfUrl = nextUrl();
    await act(async () => {
      root.render(
        <PortalPersistenceProvider service={service}>
          <Suspense fallback="Loading">
            <RemoteModule
              clientIdentifier="orders"
              mfComponent="Orders"
              mfScope="orders"
              mfUrl={mfUrl}
              title="Orders"
              version={1}
              {...props}
            />
          </Suspense>
        </PortalPersistenceProvider>,
      );
    });
    return mfUrl;
  };

  it("provides a store for the descriptor's key and version, ready on first render", async () => {
    await renderModule();
    expect(container.textContent).toBe("orders@1:7");
    expect(service.isOpen("orders", 1)).toBe(true);
  });

  it("uses persistenceKey in preference to clientIdentifier, without forwarding it", async () => {
    await renderModule({ persistenceKey: "orders-v2", version: 3 });
    expect(container.textContent).toBe("orders-v2@3:0");
    expect(remoteProps).not.toHaveProperty("persistenceKey");
    expect(remoteProps.clientIdentifier).toBe("orders");
  });

  it("hides the portal's own store from a module without a key", async () => {
    const portalStore = service.getStore("vuu.portal", 1);
    await portalStore.ready;
    const { ApplicationStateProvider } = await import("../../src/persistence");
    const mfUrl = nextUrl();
    await act(async () => {
      root.render(
        <PortalPersistenceProvider service={service}>
          <ApplicationStateProvider store={portalStore}>
            <Suspense fallback="Loading">
              <RemoteModule mfComponent="X" mfScope="x" mfUrl={mfUrl} />
            </Suspense>
          </ApplicationStateProvider>
        </PortalPersistenceProvider>,
      );
    });
    expect(container.textContent).toBe("none:0");
  });

  it("runs the remote's exported stateMigrations when carrying state forward", async () => {
    const migrations: StateMigration[] = [
      {
        version: 2,
        migrate: (state) =>
          state.update<number>("count", (count) => count * 10),
      },
    ];
    vi.mocked(loadRemote).mockResolvedValue({
      default: Counter,
      stateMigrations: migrations,
    });
    await renderModule({ version: 2 });
    expect(container.textContent).toBe("orders@2:70");
    const document = await backend.load({
      user: "steve",
      applicationKey: "orders",
      applicationVersion: 2,
    });
    expect(document).toMatchObject({
      carriedForwardFrom: 1,
      migrationsApplied: [2],
    });
  });

  it("loads the remote code once for both the component and its migrations", async () => {
    await renderModule({ version: 2 });
    expect(loadRemote).toHaveBeenCalledTimes(1);
  });

  it("renders without a store outside a portal", async () => {
    const mfUrl = nextUrl();
    await act(async () => {
      root.render(
        <Suspense fallback="Loading">
          <RemoteModule
            clientIdentifier="orders"
            mfComponent="Orders"
            mfScope="orders"
            mfUrl={mfUrl}
            version={1}
          />
        </Suspense>,
      );
    });
    expect(container.textContent).toBe("none:0");
  });
});

describe("PortalPersistenceRoot", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  let captured: PortalPersistenceService | undefined;
  const Probe = () => {
    captured = useOptionalPortalPersistence();
    const store = useOptionalApplicationState();
    const [value, setValue] = usePersistentState(
      "nav/expanded",
      [] as string[],
    );
    return (
      <button type="button" onClick={() => setValue(["/Orders"])}>
        {store?.applicationKey}:{value.join(",")}
      </button>
    );
  };

  it("provides a service and the portal's own store, defaulting to localStorage", async () => {
    const storage = new MemoryStorage();
    vi.spyOn(globalThis, "localStorage", "get").mockReturnValue(storage);
    await act(async () => {
      root.render(
        <PortalPersistenceRoot portalId="demo">
          <Probe />
        </PortalPersistenceRoot>,
      );
    });
    expect(captured?.user).toBe("anonymous");
    expect(container.textContent).toBe("vuu.portal:");
    await act(async () => {
      container.querySelector("button")?.click();
      await captured?.flushAll();
    });
    expect(storage.keys()).toEqual([
      "vuu-portal:demo:state:anonymous:vuu.portal:v1",
    ]);
  });

  it("restores the portal's own state", async () => {
    const backend = new InMemoryPersistenceBackend({
      documents: [
        stateDocument({
          user: "anonymous",
          applicationKey: "vuu.portal",
          applicationVersion: 1,
          entries: { "nav/expanded": entry(["/Orders"]) },
        }),
      ],
    });
    await act(async () => {
      root.render(
        <PortalPersistenceRoot persistence={backend}>
          <Probe />
        </PortalPersistenceRoot>,
      );
    });
    expect(container.textContent).toBe("vuu.portal:/Orders");
  });

  it("uses an in-memory backend when persistence is disabled", async () => {
    await act(async () => {
      root.render(
        <PortalPersistenceRoot persistence={false}>
          <Probe />
        </PortalPersistenceRoot>,
      );
    });
    expect(captured?.getStore("x", 1)).toBeDefined();
    const backend = (captured as unknown as { backend: unknown }).backend;
    expect(backend).toBeInstanceOf(InMemoryPersistenceBackend);
    expect(backend).not.toBeInstanceOf(LocalStoragePersistenceBackend);
  });

  it("disposes the service, writing pending changes, when unmounted", async () => {
    const backend = new InMemoryPersistenceBackend();
    await act(async () => {
      root.render(
        <PortalPersistenceRoot persistence={backend}>
          <Probe />
        </PortalPersistenceRoot>,
      );
    });
    await act(async () => {
      container.querySelector("button")?.click();
    });
    const service = captured;
    await act(async () => root.unmount());
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(service?.isDisposed()).toBe(true);
    const [summary] = await backend.list("anonymous");
    expect(summary.entries.map(({ key }) => key)).toEqual(["nav/expanded"]);
    root = createRoot(container);
  });
});
