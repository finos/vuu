import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationProvider,
  type LocalVuuServer,
} from "../../src/auth/AuthenticationProvider";
import {
  ApplicationStateProvider,
  type ApplicationStateStore,
  createPortalPersistenceService,
  InMemoryPersistenceBackend,
  type PortalPersistenceService,
} from "../../src/persistence";
import {
  VUU_TABLE_CHANGE_SERVER_EVENT,
  type VuuTableChangeServerRequest,
} from "../../src/portal-components/vuu-table-component";
import {
  getVuuServerBrowsePath,
  getVuuServerIdFromPath,
  INVALID_AUTH_URL_MESSAGE,
  INVALID_WEBSOCKET_URL_MESSAGE,
  MANUAL_VUU_SERVERS_KEY,
  ManualVuuServersProvider,
  PortalNavVuuServers,
  getVuuServerCredentials,
  MISSING_USERNAME_MESSAGE,
  validateManualServer,
  VuuTableChangeServerDialog,
} from "../../src/portal-servers";

const Passthrough = ({ children }: { children: ReactNode }) => <>{children}</>;

const localServers: LocalVuuServer[] = [
  { connectionId: "simul", DataSourceProvider: Passthrough },
  { connectionId: "basket", DataSourceProvider: Passthrough },
];

const MY_SERVER = {
  connectionId: "my-server",
  restUrl: "https://host:8443/api/authn",
  websocketUrl: "wss://host:8090/websocket",
};

let location = "";
const LocationProbe = () => {
  location = useLocation().pathname;
  return null;
};

describe("portal servers", () => {
  let container: HTMLDivElement;
  let root: Root;
  let service: PortalPersistenceService;
  let appState: ApplicationStateStore;

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    service = createPortalPersistenceService({
      backend: new InMemoryPersistenceBackend(),
      user: "alice",
      window: null,
    });
    appState = service.getStore("portal", 1);
    await appState.ready;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    service.dispose();
    vi.restoreAllMocks();
  });

  const render = async (children: ReactNode, path = "/tables/browse") => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <ApplicationStateProvider store={appState}>
            <AuthenticationProvider localServers={localServers} mode="local">
              <ManualVuuServersProvider>{children}</ManualVuuServersProvider>
            </AuthenticationProvider>
          </ApplicationStateProvider>
          <LocationProbe />
        </MemoryRouter>,
      ),
    );
  };

  const button = (name: string, scope: ParentNode = document.body) => {
    const element = [...scope.querySelectorAll<HTMLElement>("button")].find(
      (candidate) =>
        candidate.getAttribute("aria-label") === name ||
        candidate.textContent?.trim() === name,
    );
    if (!element) {
      throw Error(`no button ${name}`);
    }
    return element;
  };

  const click = async (element: Element) => {
    await act(async () => {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  const type = async (name: string, value: string) => {
    const input = container.querySelector<HTMLInputElement>(
      `input[name='${name}']`,
    );
    if (!input) {
      throw Error(`no input ${name}`);
    }
    await act(async () => {
      Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  const submit = async () => {
    const form = container.querySelector("form[aria-label='Add Vuu server']");
    await act(async () => {
      form?.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true }),
      );
    });
  };

  const servers = () =>
    [
      ...container.querySelectorAll<HTMLElement>(
        "ul[aria-label='Vuu servers'] > li",
      ),
    ].map((row) => ({
      current: row.querySelector("a")?.getAttribute("aria-current"),
      href: row.querySelector("a")?.getAttribute("href"),
      id: row.dataset.serverId,
      removable: row.querySelector("button") !== null,
      status: row
        .querySelector(".vuuPortalNavServers-status")
        ?.getAttribute("aria-label"),
    }));

  const addMyServer = async () => {
    await click(button("Add server"));
    await type("connectionId", MY_SERVER.connectionId);
    await type("websocketUrl", MY_SERVER.websocketUrl);
    await type("restUrl", MY_SERVER.restUrl);
    await submit();
  };

  describe("paths", () => {
    it("builds and parses Browse paths", () => {
      expect(getVuuServerBrowsePath("/tables/browse/", "my server")).toBe(
        "/tables/browse/my%20server",
      );
      expect(
        getVuuServerIdFromPath("/tables/browse", "/tables/browse/my%20server"),
      ).toBe("my server");
      expect(
        getVuuServerIdFromPath("/tables/browse", "/tables/browse/simul/x"),
      ).toBe("simul");
      expect(
        getVuuServerIdFromPath("/tables/browse", "/tables/browse"),
      ).toBeUndefined();
      expect(
        getVuuServerIdFromPath("/tables/browse", "/workspaces/a"),
      ).toBeUndefined();
    });
  });

  describe("PortalNavVuuServers", () => {
    it("lists the configured servers, with status, then Add server", async () => {
      await render(<PortalNavVuuServers basePath="/tables/browse" />);
      expect(servers()).toEqual([
        {
          current: null,
          href: "/tables/browse/simul",
          id: "simul",
          removable: false,
          status: "Online",
        },
        {
          current: null,
          href: "/tables/browse/basket",
          id: "basket",
          removable: false,
          status: "Online",
        },
      ]);
      expect(button("Add server")).toBeDefined();
    });

    it("marks the server being browsed", async () => {
      await render(
        <PortalNavVuuServers basePath="/tables/browse" />,
        "/tables/browse/basket",
      );
      expect(servers().map(({ current }) => current)).toEqual([null, "page"]);
    });

    it("validates a server to add", () => {
      expect(
        validateManualServer(
          { connectionId: "", restUrl: "ftp://x", websocketUrl: "http://x" },
          new Set(),
        ),
      ).toEqual({
        connectionId: "Enter a name for the server",
        restUrl: INVALID_AUTH_URL_MESSAGE,
        websocketUrl: INVALID_WEBSOCKET_URL_MESSAGE,
      });
      expect(
        validateManualServer(
          { ...MY_SERVER, connectionId: "simul" },
          new Set(["simul"]),
        ),
      ).toEqual({ connectionId: "A server with this name is already listed" });
      expect(
        validateManualServer(
          { ...MY_SERVER, restUrl: "/api/authn" },
          new Set(),
        ),
      ).toEqual({});
    });

    it("shows errors and adds nothing until the form is valid", async () => {
      await render(<PortalNavVuuServers basePath="/tables/browse" />);
      await click(button("Add server"));
      await type("connectionId", "simul");
      await submit();
      expect(container.textContent).toContain(
        "A server with this name is already listed",
      );
      expect(container.textContent).toContain(INVALID_WEBSOCKET_URL_MESSAGE);
      expect(servers()).toHaveLength(2);
      await click(button("Cancel"));
      expect(container.querySelector("form")).toBeNull();
      expect(appState.get(MANUAL_VUU_SERVERS_KEY)).toBeUndefined();
    });

    it("adds a server, saved for the user, and browses it", async () => {
      await render(<PortalNavVuuServers basePath="/tables/browse" />);
      await addMyServer();
      expect(container.querySelector("form")).toBeNull();
      expect(location).toBe("/tables/browse/my-server");
      expect(servers().map(({ id }) => id)).toEqual([
        "simul",
        "basket",
        "my-server",
      ]);
      // Local servers only: an added server can't be reached.
      expect(servers()[2]).toMatchObject({
        current: "page",
        removable: true,
        status: "Offline",
      });
      expect(appState.get(MANUAL_VUU_SERVERS_KEY)).toEqual([MY_SERVER]);

      // A new session loads the user's servers.
      await act(async () => root.unmount());
      root = createRoot(container);
      await render(<PortalNavVuuServers basePath="/tables/browse" />);
      expect(servers().map(({ id }) => id)).toEqual([
        "simul",
        "basket",
        "my-server",
      ]);
    });

    it("adds a Vuu-login server, saving the username but not the password", async () => {
      await render(<PortalNavVuuServers basePath="/tables/browse" />);
      await click(button("Add server"));
      expect(container.querySelector("input[name='username']")).toBeNull();
      await type("connectionId", MY_SERVER.connectionId);
      await type("websocketUrl", MY_SERVER.websocketUrl);
      await type("restUrl", MY_SERVER.restUrl);
      const vuuLogin = container.querySelector(
        "input[name='auth'][value='vuu-login']",
      );
      expect(vuuLogin).not.toBeNull();
      await click(vuuLogin as Element);
      await submit();
      expect(container.textContent).toContain(MISSING_USERNAME_MESSAGE);

      await type("username", "steve");
      await type("password", "secret");
      await submit();
      expect(appState.get(MANUAL_VUU_SERVERS_KEY)).toEqual([
        { ...MY_SERVER, auth: "vuu-login", username: "steve" },
      ]);
      expect(getVuuServerCredentials(MY_SERVER.connectionId)).toEqual({
        password: "secret",
        username: "steve",
      });

      await click(button("Remove my-server"));
      expect(getVuuServerCredentials(MY_SERVER.connectionId)).toBeUndefined();
    });

    it("removes an added server, leaving its Browse page", async () => {
      appState.set(MANUAL_VUU_SERVERS_KEY, [MY_SERVER]);
      await render(
        <PortalNavVuuServers basePath="/tables/browse" />,
        "/tables/browse/my-server",
      );
      await click(button("Remove my-server"));
      expect(servers().map(({ id }) => id)).toEqual(["simul", "basket"]);
      expect(appState.get(MANUAL_VUU_SERVERS_KEY)).toEqual([]);
      expect(location).toBe("/tables/browse");
    });

    it("ignores invalid saved servers", async () => {
      appState.set(MANUAL_VUU_SERVERS_KEY, [{ connectionId: 1 }, MY_SERVER]);
      await render(<PortalNavVuuServers basePath="/tables/browse" />);
      expect(servers().map(({ id }) => id)).toEqual([
        "simul",
        "basket",
        "my-server",
      ]);
    });
  });

  describe("VuuTableChangeServerDialog", () => {
    const requestChange = (setServerId = vi.fn(() => true)) => {
      const detail: VuuTableChangeServerRequest = {
        componentId: "c1",
        settings: { module: "SIMUL", serverId: "basket", table: "prices" },
        setServerId,
      };
      act(() => {
        document.dispatchEvent(
          new CustomEvent(VUU_TABLE_CHANGE_SERVER_EVENT, { detail }),
        );
      });
      return setServerId;
    };

    const dialog = () =>
      document.body.querySelector<HTMLElement>(".vuuTableChangeServerDialog");

    it("lists the servers and points the table at the one chosen", async () => {
      await render(<VuuTableChangeServerDialog />);
      expect(dialog()).toBeNull();
      const setServerId = requestChange();
      await vi.waitFor(() => expect(dialog()).not.toBeNull());
      expect(dialog()?.textContent).toContain("Change server");
      expect(dialog()?.textContent).toContain("SIMUL:prices");
      expect(button("basket", dialog() as HTMLElement)).toHaveProperty(
        "disabled",
        true,
      );
      await click(button("simul", dialog() as HTMLElement));
      expect(setServerId).toHaveBeenCalledWith("simul");
      await vi.waitFor(() => expect(dialog()).toBeNull());
    });

    it("Cancel leaves the table on its server", async () => {
      await render(<VuuTableChangeServerDialog />);
      const setServerId = requestChange();
      await vi.waitFor(() => expect(dialog()).not.toBeNull());
      await click(button("Cancel", dialog() as HTMLElement));
      await vi.waitFor(() => expect(dialog()).toBeNull());
      expect(setServerId).not.toHaveBeenCalled();
    });
  });
});
