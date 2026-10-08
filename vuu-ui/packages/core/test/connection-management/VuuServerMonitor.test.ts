import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AuthHandler } from "../../src/auth/AuthHandler";
import {
  VuuTokenExchangeError,
  type VuuAuthTarget,
  type VuuSession,
} from "../../src/auth/VuuTokenExchange";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import type {
  VuuConnectionRegistry,
  VuuConnectionStateListener,
  VuuServerConnectionState,
} from "../../src/connection-management/VuuConnectionRegistry";
import {
  LocalServerMonitor,
  VuuServerMonitor,
} from "../../src/connection-management/VuuServerMonitor";
import type { ServerMonitorOptions } from "../../src/connection-management/server-status";
import { testModule } from "./test-modules";

const session: VuuSession = {
  authorizations: [],
  token: "t",
  user: { userName: "u" },
};

/** A registry whose acquisitions are settled by the test. */
class FakeRegistry {
  acquisitions: Array<{
    connectionId: string;
    reject: (error: unknown) => void;
    resolve: () => void;
  }> = [];
  refCounts = new Map<string, number>();
  states = new Map<string, VuuServerConnectionState>();
  #listeners = new Set<VuuConnectionStateListener>();

  acquire = vi.fn((_authHandler: AuthHandler, target: VuuAuthTarget) => {
    const { connectionId } = target;
    this.refCounts.set(connectionId, this.getRefCount(connectionId) + 1);
    if (this.states.get(connectionId) === "connected") {
      return Promise.resolve(session);
    }
    this.setState(connectionId, "authenticating");
    return new Promise<VuuSession>((resolve, reject) => {
      this.acquisitions.push({
        connectionId,
        reject: (error) => {
          this.setState(
            connectionId,
            error instanceof VuuTokenExchangeError ? "unauthorized" : "failed",
          );
          reject(error);
        },
        resolve: () => {
          this.setState(connectionId, "connected");
          resolve(session);
        },
      });
    });
  });

  release = vi.fn((connectionId: string) => {
    const refCount = Math.max(0, this.getRefCount(connectionId) - 1);
    this.refCounts.set(connectionId, refCount);
    if (refCount === 0) {
      this.states.delete(connectionId);
      this.#emit(connectionId, "idle");
    }
  });

  getRefCount(connectionId: string) {
    return this.refCounts.get(connectionId) ?? 0;
  }

  getState(connectionId: string) {
    return this.states.get(connectionId);
  }

  onStateChange(listener: VuuConnectionStateListener) {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  setState(connectionId: string, state: VuuServerConnectionState) {
    this.states.set(connectionId, state);
    this.#emit(connectionId, state);
  }

  settle(connectionId: string, error?: unknown) {
    const index = this.acquisitions.findIndex(
      (acquisition) => acquisition.connectionId === connectionId,
    );
    const [acquisition] = this.acquisitions.splice(index, 1);
    if (error) {
      acquisition.reject(error);
    } else {
      acquisition.resolve();
    }
  }

  #emit(connectionId: string, state: VuuServerConnectionState) {
    for (const listener of this.#listeners) {
      listener(connectionId, state);
    }
  }
}

const authHandler: AuthHandler = {
  authenticate: vi.fn(),
  getIdentityToken: vi.fn(),
  logout: vi.fn(),
};

const resolveTarget = ({ connectionId }: { connectionId: string }) => ({
  connectionId,
  restUrl: `https://${connectionId}.example.test/api/authn`,
  websocketUrl: `wss://${connectionId}.example.test/websocket`,
});

/** Modules m0..m(n-1), each on server s0..s(n-1), unless mapped otherwise. */
const setup = async ({
  count = 3,
  options,
  servers = {},
  start = true,
}: {
  count?: number;
  start?: boolean;
  options?: ServerMonitorOptions;
  servers?: Record<string, string | null>;
} = {}) => {
  const modules = Array.from({ length: count }, (_, i) => testModule(`m${i}`));
  const loadConfig = vi.fn(async (mfUrl: string) => {
    const id = mfUrl.split("/").pop() as string;
    const server = id in servers ? servers[id] : `s${id.slice(1)}`;
    return server === null ? {} : { vuu: { connectionId: server } };
  });
  const map = new ModuleServerMap({
    loadConfig,
    modules,
    portalConnectionId: "portal",
  });
  const registry = new FakeRegistry();
  const monitor = new VuuServerMonitor({
    authHandler,
    moduleServerMap: map,
    options: { staggerMs: 100, ...options },
    random: () => 0.5,
    registry: registry as unknown as VuuConnectionRegistry,
    resolveTarget,
  });
  map.start();
  await vi.runAllTimersAsync();
  if (start) {
    monitor.start();
  }
  return { map, monitor, registry };
};

const acquiredIds = (registry: FakeRegistry) =>
  registry.acquire.mock.calls.map(([, target]) => target.connectionId);

describe("VuuServerMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("acquires servers in display order, staggered", async () => {
    const { registry } = await setup();
    expect(acquiredIds(registry)).toEqual(["s0"]);
    await vi.advanceTimersByTimeAsync(100);
    expect(acquiredIds(registry)).toEqual(["s0", "s1"]);
    await vi.advanceTimersByTimeAsync(100);
    expect(acquiredIds(registry)).toEqual(["s0", "s1", "s2"]);
  });

  it("does not acquire the portal server or duplicate servers", async () => {
    const { registry, monitor } = await setup({
      count: 4,
      servers: { m1: null, m2: "s0" },
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(acquiredIds(registry)).toEqual(["s0", "s3"]);
    expect(monitor.getStatus("portal")).toMatchObject({
      monitored: true,
      presence: "online",
    });
  });

  it("caps monitored servers, prioritising the open module then visible ones", async () => {
    const { monitor, registry } = await setup({
      count: 5,
      options: { maxMonitoredServers: 2 },
      start: false,
    });
    monitor.setOpenModule("m3");
    monitor.setVisibleModules(["m1", "m4"]);
    monitor.start();
    await vi.advanceTimersByTimeAsync(1000);

    expect(monitor.selectedIds).toEqual(["s3", "s1"]);
    expect(acquiredIds(registry)).toEqual(["s3", "s1"]);
    expect(monitor.getStatus("s0")).toMatchObject({
      monitored: false,
      presence: "unknown",
    });
  });

  it("reports presence as connections progress", async () => {
    const { monitor, registry } = await setup({ count: 1 });
    expect(monitor.getModuleStatus("m0")).toMatchObject({
      connectionId: "s0",
      monitored: true,
      presence: "connecting",
    });

    registry.settle("s0");
    await vi.advanceTimersByTimeAsync(0);
    expect(monitor.getModuleStatus("m0").presence).toBe("online");

    registry.setState("s0", "reconnecting");
    expect(monitor.getModuleStatus("m0").presence).toBe("degraded");
  });

  it("releases a server that drops out of the selection only after the release delay", async () => {
    const { monitor, registry } = await setup({
      count: 2,
      options: { maxMonitoredServers: 1, releaseDelayMs: 1000 },
    });
    registry.settle("s0");
    await vi.advanceTimersByTimeAsync(0);

    monitor.setOpenModule("m1");
    expect(monitor.selectedIds).toEqual(["s1"]);
    await vi.advanceTimersByTimeAsync(500);
    expect(registry.release).not.toHaveBeenCalled();

    // Switching back within the delay keeps the connection.
    monitor.setOpenModule("m0");
    await vi.advanceTimersByTimeAsync(1000);
    expect(registry.release).not.toHaveBeenCalledWith("s0");

    monitor.setOpenModule("m1");
    await vi.advanceTimersByTimeAsync(1000);
    expect(registry.release).toHaveBeenCalledWith("s0");
  });

  it("marks a server offline when it can't connect, and probes it", async () => {
    const { monitor, registry } = await setup({
      count: 1,
      options: { probeIntervalMs: 10_000 },
    });
    vi.setSystemTime(5000);
    registry.settle("s0", new Error("connection refused"));
    await vi.advanceTimersByTimeAsync(0);

    const status = monitor.getModuleStatus("m0");
    expect(status.presence).toBe("offline");
    expect(status.detail).toMatchObject({
      endpoint: "s0.example.test",
      error: "connection refused",
      nextAttemptAt: 15_000,
      reason: "Server not responding",
    });
    expect(registry.release).toHaveBeenCalledWith("s0");

    await vi.advanceTimersByTimeAsync(10_000);
    expect(acquiredIds(registry)).toEqual(["s0", "s0"]);
    // Still offline while the probe runs.
    expect(monitor.getModuleStatus("m0")).toMatchObject({
      detail: { checking: true },
      presence: "offline",
    });

    registry.settle("s0");
    await vi.advanceTimersByTimeAsync(0);
    expect(monitor.getModuleStatus("m0").presence).toBe("online");
  });

  it("retries an offline server immediately on request", async () => {
    const { monitor, registry } = await setup({ count: 1 });
    registry.settle("s0", new Error("down"));
    await vi.advanceTimersByTimeAsync(0);

    monitor.retryModule("m0");
    expect(acquiredIds(registry)).toEqual(["s0", "s0"]);
  });

  it("marks a denied server unauthorized and does not probe it", async () => {
    const { monitor, registry } = await setup({
      count: 1,
      options: { probeIntervalMs: 1000 },
    });
    registry.settle("s0", new VuuTokenExchangeError("denied", 403));
    await vi.advanceTimersByTimeAsync(5000);

    expect(monitor.getModuleStatus("m0")).toMatchObject({
      detail: {
        reason: "You don't have access to this application's server",
      },
      presence: "unauthorized",
    });
    expect(monitor.getModuleStatus("m0").detail?.nextAttemptAt).toBeUndefined();
    expect(acquiredIds(registry)).toEqual(["s0"]);
  });

  it("releases and probes a held server when the registry gives up", async () => {
    const { monitor, registry } = await setup({
      count: 1,
      options: { probeIntervalMs: 1000 },
    });
    registry.settle("s0");
    await vi.advanceTimersByTimeAsync(0);
    vi.setSystemTime(2000);

    registry.setState("s0", "failed");

    expect(registry.release).toHaveBeenCalledWith("s0");
    expect(monitor.getModuleStatus("m0")).toMatchObject({
      detail: { lastOnlineAt: 2000, reason: "Connection lost" },
      presence: "offline",
    });
    await vi.advanceTimersByTimeAsync(1100);
    expect(acquiredIds(registry)).toEqual(["s0", "s0"]);
  });

  it("reports a module with a failed config as unavailable and retries it", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const modules = [testModule("m0")];
    let fail = true;
    const map = new ModuleServerMap({
      loadConfig: async () => {
        if (fail) {
          throw new Error("404");
        }
        return { vuu: { connectionId: "s0" } };
      },
      modules,
      portalConnectionId: "portal",
    });
    const registry = new FakeRegistry();
    const monitor = new VuuServerMonitor({
      authHandler,
      moduleServerMap: map,
      registry: registry as unknown as VuuConnectionRegistry,
      resolveTarget,
    });
    map.start();
    monitor.start();
    await vi.advanceTimersByTimeAsync(0);

    expect(monitor.getModuleStatus("m0")).toMatchObject({
      detail: { reason: "Application configuration could not be loaded" },
      presence: "unavailable",
    });
    expect(registry.acquire).not.toHaveBeenCalled();

    fail = false;
    monitor.retryModule("m0");
    expect(monitor.getModuleStatus("m0").presence).toBe("unknown");
    await vi.advanceTimersByTimeAsync(0);
    expect(acquiredIds(registry)).toEqual(["s0"]);
  });

  it("returns the same status object until something changes", async () => {
    const { monitor, registry } = await setup({ count: 1 });
    const first = monitor.getModuleStatus("m0");
    expect(monitor.getModuleStatus("m0")).toBe(first);
    expect(monitor.getStatus("elsewhere")).toBe(monitor.getStatus("elsewhere"));

    registry.settle("s0");
    await vi.advanceTimersByTimeAsync(0);
    expect(monitor.getModuleStatus("m0")).not.toBe(first);
  });

  it("observes servers acquired by others beyond the cap", async () => {
    const { monitor, registry } = await setup({
      count: 2,
      options: { maxMonitoredServers: 1 },
    });
    registry.setState("s1", "connected");
    expect(monitor.getStatus("s1")).toMatchObject({
      monitored: false,
      presence: "online",
    });
  });

  it("acquires nothing when disabled", async () => {
    const { monitor, registry } = await setup({
      options: { enabled: false },
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(registry.acquire).not.toHaveBeenCalled();
    expect(monitor.getModuleStatus("m0").presence).toBe("unknown");
  });

  it("releases everything on stop", async () => {
    const { monitor, registry } = await setup({ count: 2 });
    await vi.advanceTimersByTimeAsync(100);
    registry.settle("s0");
    registry.settle("s1");
    await vi.advanceTimersByTimeAsync(0);

    monitor.stop();
    expect(registry.release.mock.calls.map(([id]) => id).sort()).toEqual([
      "s0",
      "s1",
    ]);
  });
});

describe("LocalServerMonitor", () => {
  it("reports local servers online and supports overrides", async () => {
    const map = new ModuleServerMap({
      loadConfig: async (mfUrl) =>
        mfUrl.endsWith("m0")
          ? { vuu: { connectionId: "simul" } }
          : { vuu: { connectionId: "absent" } },
      getUnusableReason: ({ connectionId }) =>
        connectionId === "simul" ? undefined : "no local server",
      modules: [testModule("m0"), testModule("m1")],
      portalConnectionId: "local",
    });
    const monitor = new LocalServerMonitor({
      localServerIds: ["simul"],
      moduleServerMap: map,
    });
    map.start();
    monitor.start();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(monitor.getModuleStatus("m0").presence).toBe("online");
    expect(monitor.getModuleStatus("m1").presence).toBe("unavailable");

    monitor.setPresence("simul", "offline");
    expect(monitor.getModuleStatus("m0")).toMatchObject({
      detail: { reason: "Server not responding" },
      presence: "offline",
    });
  });
});
