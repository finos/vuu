import "./global-mocks";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  connect as connectWebsocket,
  ConnectionMessage,
} from "../src/websocket-connection";

describe("websocket-connection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("tries to connect by default a maximum of 5 times before throwing Exception", async () => {
    const statusMessages: ConnectionMessage[] = [];
    const callback = async (message: ConnectionMessage) => {
      statusMessages.push(message);
      await vi.advanceTimersByTimeAsync(2000);
    };

    try {
      await connectWebsocket("tst/url", "", callback);
    } catch (e) {
      expect(e.message).toEqual("Failed to establish connection");
    }

    expect(statusMessages.length).toEqual(11);
    expect(statusMessages).toEqual([
      { type: "connection-status", status: "connecting" },
      {
        type: "connection-status",
        status: "disconnected",
        reason: "failed to connect",
        retry: true,
      },
      { type: "connection-status", status: "connecting" },
      {
        type: "connection-status",
        status: "disconnected",
        reason: "failed to connect",
        retry: true,
      },
      { type: "connection-status", status: "connecting" },
      {
        type: "connection-status",
        status: "disconnected",
        reason: "failed to connect",
        retry: true,
      },
      { type: "connection-status", status: "connecting" },
      {
        type: "connection-status",
        status: "disconnected",
        reason: "failed to connect",
        retry: true,
      },
      { type: "connection-status", status: "connecting" },
      {
        type: "connection-status",
        status: "disconnected",
        reason: "failed to connect",
        retry: false,
      },
      {
        type: "connection-status",
        status: "failed",
        reason: "unable to connect",
        retry: false,
      },
    ]);
  });

  it("fires connection-status messages when connecting/connected", async () => {
    class MockWebSocket {
      private openHandler: any;
      private errorHandler: any;
      constructor() {
        setTimeout(() => {
          this?.openHandler();
        }, 0);
      }
      set onopen(callback) {
        this.openHandler = callback;
      }
      set onerror(callback) {
        this.errorHandler = callback;
      }
    }
    vi.stubGlobal("WebSocket", MockWebSocket);

    const statusMessages: ConnectionMessage[] = [];
    const callback = async (message: ConnectionMessage) => {
      statusMessages.push(message);
      await vi.advanceTimersByTimeAsync(10);
    };

    try {
      await connectWebsocket("tst/url", "", callback);
    } catch (e) {
      expect(e.message).toEqual("Failed to establish connection");
    }

    expect(statusMessages.length).toEqual(2);
    expect(statusMessages).toEqual([
      { type: "connection-status", status: "connecting" },
      {
        type: "connection-status",
        status: "connection-open-awaiting-session",
      },
    ]);
  });
});
