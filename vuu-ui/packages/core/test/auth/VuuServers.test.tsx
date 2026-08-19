import { act, Component, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationProvider,
  useVuuConnectionId,
  useVuuServers,
} from "../../src/auth/AuthenticationProvider";
import type { AuthConfig } from "../../src/auth/AuthConfig";
import type { AuthHandler } from "../../src/auth/AuthHandler";
import type { VuuConnectionRegistry } from "../../src/connection-management/VuuConnectionRegistry";
import type { PortalModuleRegistry } from "../../src/RemoteModuleDescriptor";
import type {
  LocalVuuServer,
  VuuServerDescriptor,
} from "../../src/VuuServerDescriptor";

const moduleDescriptor = (
  name: string,
  vuu?: PortalModuleRegistry["modules"][number]["vuu"],
): PortalModuleRegistry["modules"][number] => ({
  accessRole: `${name}-access`,
  clientIdentifier: name,
  description: name,
  id: name,
  mfComponent: name,
  mfScope: name,
  mfUrl: "http://localhost:5010",
  name,
  navLocation: `/${name}`,
  path: `/${name}`,
  title: name,
  version: 1,
  ...(vuu ? { vuu } : {}),
});

const localServer = (
  connectionId: string,
  marker = connectionId,
): LocalVuuServer => ({
  connectionId,
  DataSourceProvider: ({ children }) => (
    <div data-local-server={marker}>{children}</div>
  ),
});

class ErrorBoundary extends Component<
  { children: ReactNode },
  { error?: Error }
> {
  state: { error?: Error } = {};
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    return this.state.error ? (
      <output data-error={this.state.error.name}>
        {this.state.error.message}
      </output>
    ) : (
      this.props.children
    );
  }
}

describe("Vuu servers", () => {
  let container: HTMLDivElement;
  let root: Root;
  let servers: VuuServerDescriptor[] | undefined;

  const ServersProbe = () => {
    servers = useVuuServers();
    return null;
  };

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    servers = undefined;
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("local mode", () => {
    it("scopes a vuu-connection to the matching local server without a websocket", async () => {
      const webSocketConstructor = vi.fn();
      vi.stubGlobal("WebSocket", webSocketConstructor);
      const Probe = () => {
        const connectionId = useVuuConnectionId();
        return <output>{connectionId}</output>;
      };

      await act(async () => {
        root.render(
          <AuthenticationProvider
            localServers={[localServer("simul"), localServer("basket")]}
            mode="local"
          >
            <AuthenticationProvider
              connection={{ connectionId: "basket" }}
              mode="vuu-connection"
            >
              <Probe />
            </AuthenticationProvider>
          </AuthenticationProvider>,
        );
      });

      expect(
        container.querySelector('[data-local-server="basket"] output')
          ?.textContent,
      ).toBe("basket");
      expect(webSocketConstructor).not.toHaveBeenCalled();
    });

    it("reports a configuration error when no local server matches", async () => {
      vi.spyOn(console, "error").mockImplementation(() => undefined);

      await act(async () => {
        root.render(
          <AuthenticationProvider localServers={[]} mode="local">
            <ErrorBoundary>
              <AuthenticationProvider
                connection={{ connectionId: "orders" }}
                mode="vuu-connection"
              >
                <span>unreachable</span>
              </AuthenticationProvider>
            </ErrorBoundary>
          </AuthenticationProvider>,
        );
      });

      const error = container.querySelector("output");
      expect(error?.dataset.error).toBe("AuthenticationConfigurationError");
      expect(error?.textContent).toBe(
        "No local Vuu server is registered for connection orders",
      );
    });

    it("lists module servers that have a local implementation", async () => {
      await act(async () => {
        root.render(
          <AuthenticationProvider
            localServers={[localServer("simul"), localServer("basket")]}
            mode="local"
            registry={{
              modules: [
                moduleDescriptor("baskets", { connectionId: "basket" }),
                moduleDescriptor("no-vuu"),
                moduleDescriptor("orders", { connectionId: "orders" }),
                moduleDescriptor("tiles", { connectionId: "simul" }),
                moduleDescriptor("basket-admin", { connectionId: "basket" }),
              ],
            }}
          >
            <ServersProbe />
          </AuthenticationProvider>,
        );
      });

      expect(servers).toEqual([
        { connectionId: "basket", moduleTitles: ["baskets", "basket-admin"] },
        { connectionId: "simul", moduleTitles: ["tiles"] },
      ]);
    });

    it("lists no servers when no module has a vuu connection", async () => {
      await act(async () => {
        root.render(
          <AuthenticationProvider
            localServers={[localServer("simul")]}
            mode="local"
            registry={{ modules: [moduleDescriptor("no-vuu")] }}
          >
            <ServersProbe />
          </AuthenticationProvider>,
        );
      });

      expect(servers).toEqual([]);
    });
  });

  describe("identity mode", () => {
    const authConfig: AuthConfig = {
      authUrl: "https://portal.example.test/auth",
      restUrl: "https://portal.example.test/api/authn",
      websocketUrl: "wss://portal.example.test/websocket",
    };

    class TestAuthHandler implements AuthHandler {
      async authenticate() {
        return { user: { userName: "steve" } };
      }
      async getIdentityToken() {
        return "identity-token";
      }
      async logout() {}
    }

    const renderWithRegistry = async (moduleRegistry: PortalModuleRegistry) => {
      const connectionRegistry = {
        acquire: vi.fn(async () => ({
          authorizations: [],
          moduleRegistry,
          token: "vuu-token",
          user: { userName: "steve" },
        })),
        disconnectAll: vi.fn(async () => undefined),
        release: vi.fn(),
        subscribe: vi.fn(() => () => undefined),
      } as unknown as VuuConnectionRegistry;

      await act(async () => {
        root.render(
          <AuthenticationProvider
            authConfig={authConfig}
            authHandlerClass={TestAuthHandler}
            mode="identity"
            registry={connectionRegistry}
          >
            <ServersProbe />
          </AuthenticationProvider>,
        );
      });
    };

    it("derives servers from module connections, keyed by connectionId", async () => {
      const ordersConnection = {
        connectionId: "orders",
        restUrl: "https://orders.example.test/api/authn",
        websocketUrl: "wss://orders.example.test/websocket",
      };
      await renderWithRegistry({
        modules: [
          moduleDescriptor("blotter", ordersConnection),
          moduleDescriptor("no-vuu"),
          moduleDescriptor("portal-tables", { connectionId: "portal" }),
          moduleDescriptor("tickets", ordersConnection),
          moduleDescriptor("incomplete", { connectionId: "risk" }),
        ],
      });

      expect(servers).toEqual([
        { ...ordersConnection, moduleTitles: ["blotter", "tickets"] },
        { connectionId: "portal", moduleTitles: ["portal-tables"] },
      ]);
    });
  });

  it("lists no servers without an identity provider", async () => {
    await act(async () => {
      root.render(<ServersProbe />);
    });
    expect(servers).toEqual([]);
  });
});
