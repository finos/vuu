import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuthHandler } from "../../src/auth/AuthHandler";
import {
  VuuConnectionRegistry,
  type VuuConnectionClient,
} from "../../src/auth/VuuConnectionRegistry";
import type {
  VuuAuthTarget,
  VuuSession,
} from "../../src/auth/VuuTokenExchange";

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

class TestConnectionClient implements VuuConnectionClient {
  connectCount = 0;
  destroyCount = 0;
  connected = false;
  listener?: (status: "disconnected") => void;

  async connectTo() {
    this.connectCount += 1;
    this.connected = true;
    return "connected" as const;
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

    expect(first).toBe(session);
    expect(second).toBe(session);
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

  it("re-authenticates a shared connection after disconnection", async () => {
    const connectionClient = new TestConnectionClient();
    const exchangeToken = vi.fn().mockResolvedValue(session);
    const registry = new VuuConnectionRegistry({
      connectionClient,
      exchangeToken,
      retryIntervals: [0],
    });

    await registry.acquire(authHandler, target);
    connectionClient.connected = false;
    connectionClient.listener?.("disconnected");
    await new Promise((resolve) => setTimeout(resolve, 1));

    expect(exchangeToken).toHaveBeenCalledTimes(2);
    expect(connectionClient.connectCount).toBe(2);

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

    await expect(registry.acquire(authHandler, target)).resolves.toBe(session);

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
    await expect(mountedDuringReconnect).resolves.toBe(session);
    expect(exchangeToken).toHaveBeenCalledTimes(2);

    registry.release(target.connectionId);
    registry.release(target.connectionId);
  });
});
