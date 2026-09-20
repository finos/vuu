import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthenticationProvider,
  useModuleRegistry,
  useVuuAccessToken,
  useVuuAuthorizations,
  useVuuConnectionId,
} from "../../src/auth/AuthenticationProvider";
import type { PortalModuleRegistry } from "../../src/RemoteModuleDescriptor";

const registry = {
  modules: [
    {
      clientIdentifier: "local-orders",
      description: "Local orders",
      id: "local-orders",
      location: "/Trading/Orders",
      accessRole: "local",
      mfComponent: "OrdersLocal",
      mfScope: "orders",
      mfUrl: "http://localhost:5008",
      name: "orders",
      path: "/trading/orders",
      title: "Orders",
      version: 1,
    },
  ],
} satisfies PortalModuleRegistry;

describe("AuthenticationProvider local mode", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("publishes the local registry and synthetic VUU session without network authentication", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const webSocketConstructor = vi.fn();
    vi.stubGlobal("WebSocket", webSocketConstructor);
    const Probe = () => {
      const moduleRegistry = useModuleRegistry();
      const connectionId = useVuuConnectionId();
      const token = useVuuAccessToken();
      const authorizations = useVuuAuthorizations();
      return (
        <output>
          {JSON.stringify({
            authorizations,
            connectionId,
            moduleCount: moduleRegistry.modules.length,
            token,
          })}
        </output>
      );
    };

    await act(async () => {
      root.render(
        <AuthenticationProvider
          authorizations={["orders.read"]}
          mode="local"
          registry={registry}
        >
          <Probe />
        </AuthenticationProvider>,
      );
    });

    expect(JSON.parse(container.textContent ?? "")).toEqual({
      authorizations: ["orders.read"],
      connectionId: "local",
      moduleCount: 1,
      token: "",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(webSocketConstructor).not.toHaveBeenCalled();
  });

  it("defaults to an empty registry", async () => {
    const Probe = () => <output>{useModuleRegistry().modules.length}</output>;

    await act(async () => {
      root.render(
        <AuthenticationProvider mode="local">
          <Probe />
        </AuthenticationProvider>,
      );
    });

    expect(container.textContent).toBe("0");
  });
});
