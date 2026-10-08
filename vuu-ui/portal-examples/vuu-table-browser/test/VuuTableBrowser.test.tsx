import {
  AuthenticationProvider,
  type LocalVuuServer,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import {
  ApplicationStateProvider,
  type ApplicationStateStore,
  createPortalPersistenceService,
  InMemoryPersistenceBackend,
  type PortalPersistenceService,
} from "@vuu-ui/core/portal";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VuuTableBrowser, { browserBasePath } from "../src/VuuTableBrowser";

const viewerModule: PortalModuleRegistry["modules"][number] = {
  accessRole: "vuu-table-viewer-access",
  clientIdentifier: "vuu-table-viewer",
  description: "Vuu table viewer",
  id: "vuu-table-viewer",
  mfComponent: "VuuTableViewer",
  mfScope: "vuuTableViewer",
  mfUrl: "http://localhost:5005",
  name: "vuu-table-viewer",
  navLocation: "",
  path: "/tables/view",
  title: "Vuu Table Viewer",
  version: 1,
};

const localServer = (connectionId: string): LocalVuuServer => ({
  connectionId,
  DataSourceProvider: ({ children }: { children: ReactNode }) => children,
});

/** The config.json each test module publishes, keyed by its URL. */
const remoteConfigs = new Map<string, Record<string, string>>();

const stubRemoteConfigFetch = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async (url: string) =>
        new Response(JSON.stringify(remoteConfigs.get(url) ?? {})),
    ),
  );

const featureModule = (
  name: string,
  title: string,
  connectionId?: string,
): PortalModuleRegistry["modules"][number] => {
  const mfUrl = `http://localhost/${name}`;
  remoteConfigs.set(
    `${mfUrl}/config.json`,
    connectionId ? { connectionId } : {},
  );
  return {
    ...viewerModule,
    clientIdentifier: name,
    id: name,
    mfUrl,
    name,
    title,
  };
};

describe("VuuTableBrowser", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    stubRemoteConfigFetch();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
  });

  const renderBrowser = async (
    registry: PortalModuleRegistry,
    wrap: (children: ReactNode) => ReactNode = (children) => children,
  ) => {
    await act(async () => {
      root.render(
        <AuthenticationProvider
          localServers={[localServer("simul"), localServer("basket")]}
          mode="local"
          registry={registry}
        >
          <MemoryRouter initialEntries={["/tables/browse"]}>
            <Routes>
              <Route
                element={wrap(<VuuTableBrowser />)}
                path="/tables/browse/*"
              />
            </Routes>
          </MemoryRouter>
        </AuthenticationProvider>,
      );
    });
  };

  it("lists the distinct servers of registered modules that have a local implementation", async () => {
    await renderBrowser({
      modules: [
        viewerModule,
        featureModule("simple-div", "Saved state demo", "simul"),
        featureModule("orders", "Orders", "orders"),
        featureModule("baskets", "Basket Trading", "basket"),
        featureModule("tiles", "Instrument tiles", "simul"),
      ],
    });

    const labels = Array.from(
      container.querySelectorAll(
        '[aria-label="Vuu servers"] .saltVerticalNavigationItemLabel',
      ),
      (label) => [label.textContent, label.getAttribute("title")],
    );
    expect(labels).toEqual([
      ["basket", "Used by Basket Trading"],
      ["simul", "Used by Saved state demo, Instrument tiles"],
    ]);
    expect(container.textContent).toContain(
      "Select a server and table to begin.",
    );
  });

  it("explains when no table viewer is registered", async () => {
    await renderBrowser({
      modules: [featureModule("simple-div", "Saved state demo", "simul")],
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "The Vuu table viewer is not available.",
    );
  });

  describe("manually added servers", () => {
    let service: PortalPersistenceService;
    let store: ApplicationStateStore;

    beforeEach(async () => {
      service = createPortalPersistenceService({
        backend: new InMemoryPersistenceBackend(),
        user: "steve",
        window: null,
      });
      store = service.getStore("vuu-table-browser", 1);
      await store.ready;
    });

    afterEach(() => service.dispose());

    const registry = {
      modules: [
        viewerModule,
        featureModule("baskets", "Basket Trading", "basket"),
      ],
    };

    const renderWithStore = () =>
      renderBrowser(registry, (children) => (
        <ApplicationStateProvider store={store}>
          {children}
        </ApplicationStateProvider>
      ));

    const serverLabels = () =>
      Array.from(
        container.querySelectorAll(
          '[aria-label="Vuu servers"] .saltVerticalNavigationItemLabel',
        ),
        (label) => [label.textContent, label.getAttribute("title")],
      );

    const buttonNamed = (name: string) =>
      Array.from(container.querySelectorAll("button")).find(
        (button) => button.textContent === name,
      ) as HTMLButtonElement;

    const setInput = (name: string, value: string) => {
      const input = container.querySelector(
        `input[name="${name}"]`,
      ) as HTMLInputElement;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      act(() => {
        setter?.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    };

    const submitForm = (values: Record<string, string>) => {
      act(() => buttonNamed("Add server").click());
      for (const [name, value] of Object.entries(values)) {
        setInput(name, value);
      }
      act(() => buttonNamed("Add").click());
    };

    it("adds a server entered by the user and saves it", async () => {
      await renderWithStore();
      submitForm({
        connectionId: "dev",
        restUrl: "https://dev:8443/api/authn",
        websocketUrl: "wss://dev:8090/websocket",
      });

      expect(serverLabels()).toEqual([
        ["basket", "Used by Basket Trading"],
        ["dev", "Added manually: wss://dev:8090/websocket"],
      ]);
      expect(container.querySelector("form")).toBeNull();
      expect(store.get("manualServers")).toEqual([
        {
          connectionId: "dev",
          restUrl: "https://dev:8443/api/authn",
          websocketUrl: "wss://dev:8090/websocket",
        },
      ]);
    });

    it("restores saved servers", async () => {
      store.set("manualServers", [
        {
          connectionId: "dev",
          restUrl: "https://dev:8443/api/authn",
          websocketUrl: "wss://dev:8090/websocket",
        },
      ]);
      await renderWithStore();

      expect(serverLabels()).toEqual([
        ["basket", "Used by Basket Trading"],
        ["dev", "Added manually: wss://dev:8090/websocket"],
      ]);
    });

    it("rejects invalid or duplicate entries", async () => {
      await renderWithStore();
      submitForm({
        connectionId: "basket",
        restUrl: "ftp://dev/api/authn",
        websocketUrl: "https://dev:8090/websocket",
      });

      expect(container.querySelector("form")?.textContent).toContain(
        "A server with this name is already listed",
      );
      expect(container.querySelector("form")?.textContent).toContain(
        "Enter a ws:// or wss:// URL",
      );
      expect(container.querySelector("form")?.textContent).toContain(
        "Enter an http:// or https:// URL",
      );
      expect(store.get("manualServers")).toBeUndefined();
    });

    it("prefers a registered server over a saved server of the same name", async () => {
      store.set("manualServers", [
        {
          connectionId: "basket",
          restUrl: "https://dev:8443/api/authn",
          websocketUrl: "wss://dev:8090/websocket",
        },
      ]);
      await renderWithStore();

      expect(serverLabels()).toEqual([["basket", "Used by Basket Trading"]]);
    });

    it("removes a manually added server", async () => {
      store.set("manualServers", [
        {
          connectionId: "dev",
          restUrl: "https://dev:8443/api/authn",
          websocketUrl: "wss://dev:8090/websocket",
        },
      ]);
      await renderWithStore();

      const devTrigger = Array.from(
        container.querySelectorAll('[aria-label="Vuu servers"] button'),
      ).find((button) => button.textContent?.includes("dev")) as HTMLElement;
      await act(async () => devTrigger.click());
      await act(async () => buttonNamed("Remove server").click());

      expect(serverLabels()).toEqual([["basket", "Used by Basket Trading"]]);
      expect(store.get("manualServers")).toEqual([]);
    });
  });

  it.each([
    ["/tables/browse", undefined, "/tables/browse"],
    ["/tables/browse/", "", "/tables/browse"],
    [
      "/tables/browse/simul/SIMUL/instruments",
      "simul/SIMUL/instruments",
      "/tables/browse",
    ],
    [
      "/tables/browse/simul/SIMUL/instruments/",
      "simul/SIMUL/instruments/",
      "/tables/browse",
    ],
    [
      "/tables/browse/my%20server/SIMUL/instruments",
      "my server/SIMUL/instruments",
      "/tables/browse",
    ],
  ])("links tables from the browser path for %s", (pathname, route, base) => {
    expect(browserBasePath(pathname, route)).toBe(base);
  });
});
