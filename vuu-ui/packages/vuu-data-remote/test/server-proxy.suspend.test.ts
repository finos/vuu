import "./global-mocks";
import { describe, expect, it, vi } from "vitest";
import {
  clientRow,
  clientRows,
  disableVp,
  rows,
  serverProxyHarness,
  size,
  update,
  viewportUpdate,
} from "./server-proxy-dsl";

describe("suspend and resume", () => {
  it("suspend does not send message to server", async () => {
    const t = await serverProxyHarness();
    t.client.suspend();
    expect(t.viewportState().suspended).toBe(true);
    t.expectServer();
  });

  it("no updates sent to client whilst suspended", async () => {
    const t = await serverProxyHarness();
    t.client.suspend();
    t.server.sends(update(3, 2004), update(5, 2004));
    t.expectClient();
  });

  it("cached data IS updated whilst suspended", async () => {
    const t = await serverProxyHarness();
    t.server.sends(size(100), rows(0, 10));
    t.client.suspend();
    t.server.sends(update(3, 2004), update(5, 2004));

    expect(t.cachedRow(3)?.data).toEqual(["key-03", "name 03", 2004, true]);
    expect(t.cachedRow(5)?.data).toEqual(["key-05", "name 05", 2004, true]);
  });

  it("suspend is escalated to disable if not resumed within time threshold", async () => {
    const t = await serverProxyHarness();
    vi.useFakeTimers();

    t.client.suspend();
    expect(t.viewportState().suspended).toBe(true);
    t.expectServer();

    // 3000 is the default escalateDelay
    vi.advanceTimersByTime(3000);
    t.expectServer(disableVp());

    vi.useRealTimers();
  });

  it("suspend escalation can be prevented", async () => {
    const t = await serverProxyHarness();
    vi.useFakeTimers();

    t.client.suspend(undefined, { escalateToDisable: false });
    expect(t.viewportState().suspended).toBe(true);
    t.expectServer();

    // 3000 is the default escalateDelay
    vi.advanceTimersByTime(3000);
    t.expectServer();

    vi.useRealTimers();
  });

  it("suspend escalation delay can be configured", async () => {
    const t = await serverProxyHarness();
    vi.useFakeTimers();

    t.client.suspend(undefined, {
      escalateDelay: 5000,
      escalateToDisable: true,
    });
    expect(t.viewportState().suspended).toBe(true);
    t.expectServer();

    vi.advanceTimersByTime(3000);
    t.expectServer();

    vi.advanceTimersByTime(3000);
    t.expectServer(disableVp());

    vi.useRealTimers();
  });

  it("a row inserted whilst suspended, without escalation, is included in refresh on resume", async () => {
    const t = await serverProxyHarness();
    t.server.sends(size(100), rows(0, 10));
    t.discard();
    vi.useFakeTimers();

    t.client.suspend(undefined, { escalateToDisable: false });
    t.server.sends(size(101), update(3, 2004, { id: "inserted", vpSize: 101 }));
    vi.advanceTimersByTime(3000);

    t.expectClient();
    t.expectServer();

    t.client.resume();

    expect(t.takeClient()).toEqual([
      expect.objectContaining({
        rows: expect.arrayContaining([
          expect.arrayContaining(["key-inserted", "name inserted", 2004]),
        ]),
        size: 101,
        type: "viewport-update",
      }),
    ]);

    vi.useRealTimers();
  });

  it("resume does not send message to server", async () => {
    const t = await serverProxyHarness();
    t.client.suspend();
    t.client.resume();
    expect(t.viewportState().suspended).toBe(false);
    t.expectServer();
  });

  it("resume re-sends current data to client even if no updated have been received", async () => {
    const t = await serverProxyHarness();
    t.server.sends(size(100), rows(0, 10));
    t.discard();

    t.client.suspend();
    t.client.resume();

    t.expectClient(viewportUpdate({ size: 100, rows: clientRows(0, 10) }));
  });

  it("any updates received whilst suspended will be included in refresh on resume", async () => {
    const t = await serverProxyHarness();
    t.server.sends(size(100), rows(0, 10));
    t.discard();

    t.client.suspend();
    t.server.sends(update(3, 2004), update(5, 2004));
    t.client.resume();

    t.expectClient(
      viewportUpdate({
        size: 100,
        rows: [
          ...clientRows(0, 3),
          clientRow(3, { ts: 2, value: 2004 }),
          clientRow(4),
          clientRow(5, { ts: 2, value: 2004 }),
          ...clientRows(6, 10),
        ],
      }),
    );
  });
});
