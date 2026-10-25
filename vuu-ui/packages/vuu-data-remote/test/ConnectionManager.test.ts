import type { ServerAPI } from "@vuu-ui/vuu-data-types";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const workers = vi.hoisted(
  () => [] as Array<{ onMessage: (message: unknown) => void }>,
);

vi.mock("../src/DedicatedWorker", () => ({
  DedicatedWorker: class {
    onMessage: (message: unknown) => void;
    constructor(onMessage: (message: unknown) => void) {
      this.onMessage = onMessage;
      workers.push(this);
    }
    connect = vi.fn(async () => ({
      loginResponse: { sessionId: "session-1" },
      status: "connected",
    }));
    send = vi.fn();
    terminate = vi.fn();
  },
}));

import ConnectionManager from "../src/ConnectionManager";

const subscribeMessage = (viewport: string) =>
  ({
    viewport,
    table: { module: "SIMUL", table: "instruments" },
  }) as unknown as Parameters<ServerAPI["subscribe"]>[0];

const viewportUpdate = (clientViewportId: string) => ({
  clientViewportId,
  rows: [],
  type: "viewport-update",
});

describe("ConnectionManager", () => {
  let connectionId = 0;
  let serverAPI: ServerAPI;
  let postMessage: (message: unknown) => void;

  beforeEach(async () => {
    const id = `test-${++connectionId}`;
    await ConnectionManager.connectTo(id, {
      token: "token",
      url: "wss://localhost/websocket",
    });
    serverAPI = await ConnectionManager.serverAPIFor(id);
    postMessage = workers[workers.length - 1].onMessage;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("routes viewport messages to the subscribed viewport", () => {
    const callback = vi.fn();
    serverAPI.subscribe(subscribeMessage("vp-1"), callback);
    postMessage(viewportUpdate("vp-1"));
    expect(callback).toHaveBeenCalledWith(viewportUpdate("vp-1"));
  });

  it("drops messages in flight for a viewport that has been closed", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const callback = vi.fn();
    serverAPI.subscribe(subscribeMessage("vp-2"), callback);
    serverAPI.unsubscribe("vp-2");
    serverAPI.destroy("vp-2");
    postMessage(viewportUpdate("vp-2"));
    expect(callback).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
  });

  it("logs an error for messages for an unknown viewport", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    postMessage(viewportUpdate("vp-unknown"));
    expect(error).toHaveBeenCalledWith(
      "[ConnectionManager] %s message received, viewport not found",
      "viewport-update",
    );
  });

  it("delivers messages again when a closed viewport id is resubscribed", () => {
    const callback = vi.fn();
    serverAPI.subscribe(subscribeMessage("vp-3"), vi.fn());
    serverAPI.unsubscribe("vp-3");
    serverAPI.destroy("vp-3");
    serverAPI.subscribe(subscribeMessage("vp-3"), callback);
    postMessage(viewportUpdate("vp-3"));
    expect(callback).toHaveBeenCalledTimes(1);
  });
});
