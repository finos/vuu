import { afterEach, describe, expect, it, vi } from "vitest";
import { probeWebSocket } from "../src/showcase-main/example/useServerProbe";

type Outcome = "open" | "error" | "silent";

const stubWebSocket = (outcome: Outcome) => {
  const close = vi.fn();
  class FakeWebSocket {
    static OPEN = 1;
    readyState = 0;
    onopen: (() => void) | null = null;
    onerror: (() => void) | null = null;
    onclose: (() => void) | null = null;
    close = close;
    constructor() {
      setTimeout(() => {
        if (outcome === "open") {
          this.readyState = 1;
          this.onopen?.();
        } else if (outcome === "error") {
          this.readyState = 3;
          this.onerror?.();
        }
      }, 10);
    }
  }
  vi.stubGlobal("WebSocket", FakeWebSocket);
  return close;
};

describe("probeWebSocket", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("resolves true and closes the socket when it opens", async () => {
    const close = stubWebSocket("open");
    await expect(probeWebSocket("ws://test")).resolves.toBe(true);
    expect(close).toHaveBeenCalled();
  });

  it("resolves false on error", async () => {
    const close = stubWebSocket("error");
    await expect(probeWebSocket("ws://test")).resolves.toBe(false);
    expect(close).not.toHaveBeenCalled();
  });

  it("resolves false when the connection times out", async () => {
    vi.useFakeTimers();
    const close = stubWebSocket("silent");
    const result = probeWebSocket("ws://test", 500);
    vi.advanceTimersByTime(500);
    await expect(result).resolves.toBe(false);
    expect(close).toHaveBeenCalled();
  });
});
