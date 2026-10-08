import { afterEach, describe, expect, it, vi } from "vitest";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import { RemoteModuleConfigError } from "../../src/remote-module/remote-module-config";
import type { RemoteModuleConnection } from "@vuu-ui/vuu-data-types";
import { testModule } from "./test-modules";

type Deferred = {
  resolve: (config: { vuu?: RemoteModuleConnection }) => void;
  reject: (error: unknown) => void;
};

const deferredLoader = () => {
  const pending = new Map<string, Deferred>();
  const loadConfig = vi.fn(
    (mfUrl: string) =>
      new Promise<{ vuu?: RemoteModuleConnection }>((resolve, reject) => {
        pending.set(mfUrl, { reject, resolve });
      }),
  );
  return { loadConfig, pending };
};

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("ModuleServerMap", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads navigable modules first, then nested modules", () => {
    const { loadConfig } = deferredLoader();
    const map = new ModuleServerMap({
      loadConfig,
      modules: [testModule("nested", ""), testModule("a"), testModule("b")],
      portalConnectionId: "portal",
    });
    map.start();
    expect(loadConfig.mock.calls.map(([url]) => url)).toEqual([
      "http://localhost:5010/a",
      "http://localhost:5010/b",
      "http://localhost:5010/nested",
    ]);
  });

  it("resolves modules and notifies subscribers", async () => {
    const { loadConfig, pending } = deferredLoader();
    const map = new ModuleServerMap({
      loadConfig,
      modules: [testModule("a"), testModule("b"), testModule("c")],
      portalConnectionId: "portal",
    });
    const listener = vi.fn();
    map.subscribe(listener);
    map.start();

    expect(map.get("a")).toEqual({ status: "loading" });
    expect(map.settled).toBe(false);

    pending.get("http://localhost:5010/a")?.resolve({
      vuu: { connectionId: "orders" },
    });
    pending.get("http://localhost:5010/b")?.resolve({});
    pending.get("http://localhost:5010/c")?.resolve({
      vuu: { connectionId: "orders" },
    });
    await flush();

    expect(map.get("a")).toEqual({
      connection: { connectionId: "orders" },
      connectionId: "orders",
      status: "resolved",
    });
    // {} resolves to the portal server
    expect(map.get("b")).toEqual({
      connectionId: "portal",
      status: "resolved",
    });
    expect(map.modulesFor("orders")).toEqual(["a", "c"]);
    expect(map.modulesFor("portal")).toEqual(["b"]);
    expect(map.settled).toBe(true);
    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("reports a failed config as an error and reloads it on retry", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { loadConfig, pending } = deferredLoader();
    const forgetConfig = vi.fn();
    const map = new ModuleServerMap({
      forgetConfig,
      loadConfig,
      modules: [testModule("a")],
      now: () => 1000,
      portalConnectionId: "portal",
    });
    map.start();
    pending
      .get("http://localhost:5010/a")
      ?.reject(
        new RemoteModuleConfigError(
          "http://localhost:5010/a/config.json",
          "request failed with status 404",
        ),
      );
    await flush();

    const resolution = map.get("a");
    expect(resolution).toMatchObject({ failedAt: 1000, status: "error" });
    expect(
      resolution.status === "error" ? resolution.error.reason : undefined,
    ).toBe("request failed with status 404");

    map.retry("a");
    expect(forgetConfig).toHaveBeenCalledWith("http://localhost:5010/a");
    expect(map.get("a")).toEqual({ status: "loading" });
    expect(loadConfig).toHaveBeenCalledTimes(2);

    pending.get("http://localhost:5010/a")?.resolve({});
    await flush();
    expect(map.get("a")).toMatchObject({ status: "resolved" });
  });

  it("reports a server that can't be used as an error", async () => {
    const { loadConfig, pending } = deferredLoader();
    const map = new ModuleServerMap({
      getUnusableReason: ({ connectionId }) =>
        connectionId === "missing" ? "no local server" : undefined,
      loadConfig,
      modules: [testModule("a")],
      portalConnectionId: "portal",
    });
    map.start();
    pending.get("http://localhost:5010/a")?.resolve({
      vuu: { connectionId: "missing" },
    });
    await flush();

    const resolution = map.get("a");
    expect(resolution.status).toBe("error");
    expect(
      resolution.status === "error" ? resolution.error.reason : undefined,
    ).toBe("no local server");
  });

  it("ignores configs that arrive after stop", async () => {
    const { loadConfig, pending } = deferredLoader();
    const map = new ModuleServerMap({
      loadConfig,
      modules: [testModule("a")],
      portalConnectionId: "portal",
    });
    map.start();
    map.stop();
    pending.get("http://localhost:5010/a")?.resolve({});
    await flush();
    expect(map.get("a")).toEqual({ status: "loading" });
  });
});
