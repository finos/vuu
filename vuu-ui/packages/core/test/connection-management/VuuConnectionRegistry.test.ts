import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthHandler } from "../../src/auth/AuthHandler";
import {
  VuuConnectionRegistry,
  type VuuConnectionClient,
} from "../../src/connection-management/VuuConnectionRegistry";
import type {
  VuuAuthTarget,
  VuuSession,
} from "../../src/auth/VuuTokenExchange";
import { VuuTokenExchangeError } from "../../src/auth/VuuTokenExchange";

const target: VuuAuthTarget = {
  connectionId: "orders",
  restUrl: "https://orders.example.test/api/authn",
  websocketUrl: "wss://orders.example.test/websocket",
};

const session: VuuSession = {
  authorizations: ["orders.read"],
  token: "vuu-token",
  user: { userName: "alice" },
};

const moduleRegistry = {
  modules: [
    {
      description: "Manage users",
      enabled: true,
      id: 1,
      location: "/Admin/Users",
      mfComponent: "UserAdmin",
      mfScope: "userAdmin",
      mfUrl: "http://localhost:5007",
      name: "user-admin",
      path: "/users/admin",
      title: "Manage users",
      version: 1,
      vuu: {
        connectionId: "user-admin",
        restUrl: "https://localhost:8444/api/authn",
        websocketUrl: "wss://localhost:8092/websocket-user-admin",
      },
    },
    {
      description: "Manage modules",
      enabled: true,
      id: 2,
      location: "/Admin/Modules",
      mfComponent: "ModuleAdmin",
      mfScope: "moduleAdmin",
      mfUrl: "http://localhost:5008",
      name: "module-admin",
      path: "/modules/admin",
      title: "Manage modules",
      version: 1,
      vuu: {
        connectionId: "module-admin",
        restUrl: "https://localhost:8443/api/authn/module-admin",
        websocketUrl: "wss://localhost:8091/websocket-portal",
      },
    },
    {
      description: "Trade baskets",
      enabled: true,
      id: 3,
      location: "/Trading/Baskets",
      mfComponent: "VuuBasketTradingFeature",
      mfScope: "basketTrading",
      mfUrl: "http://localhost:5005",
      name: "basket-trading",
      path: "/trading/baskets",
      title: "Basket Trading",
      version: 1,
      vuu: {
        connectionId: "basket-trading",
        restUrl: "https://localhost:8445/api/authn",
        websocketUrl: "wss://localhost:8093/websocket-basket-trading",
      },
    },
  ],
};

class TestConnectionClient implements VuuConnectionClient {
  connections: Array<{
    connectionId: string;
    options: { token: string; url: string };
  }> = [];
  connectCount = 0;
  destroyCount = 0;
  connected = false;
  listener?: (status: "disconnected") => void;

  async connectWithLoginResponseTo(
    connectionId: string,
    options: { token: string; url: string },
  ) {
    this.connectCount += 1;
    this.connected = true;
    this.connections.push({ connectionId, options });
    return {
      loginResponse: {
        moduleRegistry,
        sessionId: "session-1",
        type: "LOGIN_SUCCESS" as const,
        vuuServerId: "portal",
      },
      status: "connected" as const,
    };
  }

  connectedFor() {
    return this.connected;
  }

  async destroyConnection() {
    this.destroyCount += 1;
    this.connected = false;
  }

  onConnectionStatus(
    _connectionId: string,
    listener: (status: "disconnected") => void,
  ) {
    this.listener = listener;
    return () => {
      this.listener = undefined;
    };
  }
}

const authHandler: AuthHandler = {
  authenticate: vi.fn(),
  getIdentityToken: vi.fn().mockResolvedValue("identity-token"),
  logout: vi.fn(),
};

describe("VuuConnectionRegistry", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("shares authentication and a connection by connectionId", async () => {
    const connectionClient = new TestConnectionClient();
    const exchangeToken = vi.fn().mockResolvedValue(session);
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
    });

    const [first, second] = await Promise.all([
      registry.acquire(authHandler, target),
      registry.acquire(authHandler, target),
    ]);

    expect(first).toEqual({ ...session, moduleRegistry });
    expect(second).toBe(first);
    expect(exchangeToken).toHaveBeenCalledTimes(1);
    expect(connectionClient.connectCount).toBe(1);
    expect(registry.getRefCount(target.connectionId)).toBe(2);

    registry.release(target.connectionId);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(connectionClient.destroyCount).toBe(0);

    registry.release(target.connectionId);
    await new Promise((resolve) => setTimeout(resolve, 1));
    expect(connectionClient.destroyCount).toBe(1);
  });

  it("forwards the shared portal URL to separate portal and module-admin connections", async () => {
    const connectionClient = new TestConnectionClient();
    const portalTarget = {
      connectionId: "portal",
      restUrl: "https://localhost:8443/api/authn",
      websocketUrl: "wss://localhost:8091/websocket-portal",
    };
    const moduleAdminTarget = {
      connectionId: "module-admin",
      restUrl: "https://localhost:8443/api/authn/module-admin",
      websocketUrl: portalTarget.websocketUrl,
    };
    const exchangeToken = vi.fn(
      async (_identityToken: string, authTarget: VuuAuthTarget) => ({
        ...session,
        token: `${authTarget.connectionId}-token`,
      }),
    );
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
    });

    const [portalSession, moduleAdminSession] = await Promise.all([
      registry.acquire(authHandler, portalTarget),
      registry.acquire(authHandler, moduleAdminTarget),
    ]);

    expect(portalSession.token).toBe("portal-token");
    expect(moduleAdminSession.token).toBe("module-admin-token");
    expect(exchangeToken).toHaveBeenCalledTimes(2);
    expect(exchangeToken).toHaveBeenCalledWith(
      "identity-token",
      moduleAdminTarget,
    );
    expect(connectionClient.connections).toEqual([
      {
        connectionId: "portal",
        options: {
          token: "portal-token",
          url: portalTarget.websocketUrl,
        },
      },
      {
        connectionId: "module-admin",
        options: {
          token: "module-admin-token",
          url: portalTarget.websocketUrl,
        },
      },
    ]);
    expect(registry.getRefCount("portal")).toBe(1);
    expect(registry.getRefCount("module-admin")).toBe(1);

    registry.release("portal");
    registry.release("module-admin");
  });

  it("isolates a denied remote from concurrent connections", async () => {
    const connectionClient = new TestConnectionClient();
    const targets = [
      {
        connectionId: "portal",
        restUrl: "https://localhost:8443/api/authn",
        websocketUrl: "wss://localhost:8091/websocket-portal",
      },
      {
        connectionId: "module-admin",
        restUrl: "https://localhost:8443/api/authn/module-admin",
        websocketUrl: "wss://localhost:8091/websocket-portal",
      },
      {
        connectionId: "basket-trading",
        restUrl: "https://localhost:8445/api/authn",
        websocketUrl: "wss://localhost:8093/websocket-basket-trading",
      },
      {
        connectionId: "user-admin",
        restUrl: "https://localhost:8444/api/authn",
        websocketUrl: "wss://localhost:8092/websocket-user-admin",
      },
    ];
    const exchangeToken = vi.fn(
      async (_identityToken: string, authTarget: VuuAuthTarget) => {
        if (authTarget.connectionId === "module-admin") {
          throw new VuuTokenExchangeError(
            "VUU authorization denied for module-admin (403)",
            403,
          );
        }
        return { ...session, token: `${authTarget.connectionId}-token` };
      },
    );
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
    });

    const [portalResult, moduleAdminResult, basketResult, userAdminResult] =
      await Promise.allSettled(
        targets.map((authTarget) => registry.acquire(authHandler, authTarget)),
      );

    expect(portalResult).toMatchObject({
      status: "fulfilled",
      value: { token: "portal-token" },
    });
    expect(moduleAdminResult).toMatchObject({
      reason: {
        failure: "authorization-denied",
        status: 403,
      },
      status: "rejected",
    });
    expect(basketResult).toMatchObject({
      status: "fulfilled",
      value: { token: "basket-trading-token" },
    });
    expect(userAdminResult).toMatchObject({
      status: "fulfilled",
      value: { token: "user-admin-token" },
    });
    expect(
      connectionClient.connections.map(({ connectionId, options }) => ({
        connectionId,
        url: options.url,
      })),
    ).toEqual([
      {
        connectionId: "portal",
        url: "wss://localhost:8091/websocket-portal",
      },
      {
        connectionId: "basket-trading",
        url: "wss://localhost:8093/websocket-basket-trading",
      },
      {
        connectionId: "user-admin",
        url: "wss://localhost:8092/websocket-user-admin",
      },
    ]);

    targets.forEach(({ connectionId }) => {
      registry.release(connectionId);
    });
  });

  it("gets a fresh identity and exchanges for the same target on reconnect", async () => {
    const connectionClient = new TestConnectionClient();
    const reconnectAuthHandler: AuthHandler = {
      authenticate: vi.fn(),
      getIdentityToken: vi
        .fn()
        .mockResolvedValueOnce("identity-token-1")
        .mockResolvedValueOnce("identity-token-2"),
      logout: vi.fn(),
    };
    const exchangeToken = vi.fn().mockResolvedValue(session);
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
      retryIntervals: [0],
    });

    await registry.acquire(reconnectAuthHandler, target);
    connectionClient.connected = false;
    connectionClient.listener?.("disconnected");
    await new Promise((resolve) => setTimeout(resolve, 1));

    expect(reconnectAuthHandler.getIdentityToken).toHaveBeenCalledTimes(2);
    expect(exchangeToken.mock.calls).toEqual([
      ["identity-token-1", target],
      ["identity-token-2", target],
    ]);
    expect(exchangeToken).toHaveBeenCalledTimes(2);
    expect(connectionClient.connectCount).toBe(2);
    expect(connectionClient.connections).toEqual([
      {
        connectionId: target.connectionId,
        options: { token: session.token, url: target.websocketUrl },
      },
      {
        connectionId: target.connectionId,
        options: { token: session.token, url: target.websocketUrl },
      },
    ]);

    registry.release(target.connectionId);
  });

  it("reports a reconnect authorization denial without retrying it", async () => {
    const connectionClient = new TestConnectionClient();
    const authorizationError = new VuuTokenExchangeError(
      "VUU authorization denied for orders (403)",
      403,
    );
    const exchangeToken = vi
      .fn()
      .mockResolvedValueOnce(session)
      .mockRejectedValue(authorizationError);
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
      retryIntervals: [0, 0],
    });
    const errorListener = vi.fn();

    await registry.acquire(authHandler, target);
    registry.subscribe(target.connectionId, vi.fn(), errorListener);
    connectionClient.connected = false;
    connectionClient.listener?.("disconnected");
    await new Promise((resolve) => setTimeout(resolve, 1));

    expect(exchangeToken).toHaveBeenCalledTimes(2);
    expect(errorListener).toHaveBeenCalledWith(authorizationError);

    registry.release(target.connectionId);
  });

  it("uses the configured direct VUU session resolver", async () => {
    const connectionClient = new TestConnectionClient();
    const exchangeToken = vi.fn();
    const sessionResolver = { resolve: vi.fn().mockResolvedValue(session) };
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
      sessionResolver,
    });

    await expect(registry.acquire(authHandler, target)).resolves.toEqual({
      ...session,
      moduleRegistry,
    });

    expect(sessionResolver.resolve).toHaveBeenCalledWith(authHandler, target);
    expect(exchangeToken).not.toHaveBeenCalled();
    registry.release(target.connectionId);
  });

  it("shares reconnect work with consumers mounted during an outage", async () => {
    const connectionClient = new TestConnectionClient();
    let resolveReconnect: ((session: VuuSession) => void) | undefined;
    const exchangeToken = vi
      .fn()
      .mockResolvedValueOnce(session)
      .mockImplementationOnce(
        () =>
          new Promise<VuuSession>((resolve) => {
            resolveReconnect = resolve;
          }),
      );
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
      retryIntervals: [0],
    });

    await registry.acquire(authHandler, target);
    connectionClient.connected = false;
    connectionClient.listener?.("disconnected");
    await new Promise((resolve) => setTimeout(resolve, 1));

    const mountedDuringReconnect = registry.acquire(authHandler, target);
    resolveReconnect?.(session);
    await expect(mountedDuringReconnect).resolves.toEqual({
      ...session,
      moduleRegistry,
    });
    expect(exchangeToken).toHaveBeenCalledTimes(2);

    registry.release(target.connectionId);
    registry.release(target.connectionId);
  });
});
