import { describe, expect, it } from "vitest";
import type {
  VuuServerPresence,
  VuuServerStatus,
} from "../../src/connection-management/server-status";
import {
  canRetry,
  connectionStateText,
  formatNextAttempt,
  presenceSeverity,
  summarizeConnections,
  worstConnection,
} from "../../src/portal-nav-footer/connection-status-utils";

const status = (
  connectionId: string,
  presence: VuuServerPresence,
  detail?: VuuServerStatus["detail"],
): VuuServerStatus => ({
  connectionId,
  detail,
  monitored: true,
  presence,
  since: 0,
});

const item = (label: string, presence: VuuServerPresence) => ({
  connectionId: label.toLowerCase(),
  label,
  status: status(label.toLowerCase(), presence),
});

describe("presenceSeverity", () => {
  it.each<[VuuServerPresence, string]>([
    ["online", "ok"],
    ["connecting", "warning"],
    ["degraded", "warning"],
    ["offline", "error"],
    ["unavailable", "error"],
    ["unauthorized", "error"],
    ["unknown", "unknown"],
  ])("%s is %s", (presence, severity) => {
    expect(presenceSeverity(presence)).toBe(severity);
  });
});

describe("summarizeConnections", () => {
  it("is Connected when everything is online", () => {
    expect(
      summarizeConnections([
        item("Portal", "online"),
        item("Trading", "online"),
      ]),
    ).toEqual({
      label: "Connected",
      severity: "ok",
      title: "All systems connected",
    });
  });

  it("names a reconnecting connection", () => {
    expect(
      summarizeConnections([
        item("Portal", "online"),
        item("Trading", "degraded"),
      ]),
    ).toMatchObject({
      label: "Trading reconnecting…",
      severity: "warning",
      title: "Degraded",
    });
  });

  it("names the worst connection", () => {
    expect(
      summarizeConnections([
        item("Trading", "degraded"),
        item("Portal", "offline"),
      ]),
    ).toMatchObject({
      label: "Portal offline",
      severity: "error",
      title: "Partially offline",
    });
  });

  it("is Offline when every connection has failed", () => {
    expect(
      summarizeConnections([
        item("Portal", "offline"),
        item("Trading", "unauthorized"),
      ]).title,
    ).toBe("Offline");
  });

  it("handles no connections", () => {
    expect(summarizeConnections([]).label).toBe("No connections");
  });

  it("picks the first of equally bad connections", () => {
    expect(
      worstConnection([item("A", "offline"), item("B", "unavailable")])?.label,
    ).toBe("A");
  });
});

describe("connection state text", () => {
  const now = new Date(2025, 5, 1, 12, 0, 0).getTime();

  it("counts down to the next attempt", () => {
    expect(formatNextAttempt(now + 12_400, now)).toBe("retry in 13s");
    expect(formatNextAttempt(now, now)).toBe("retrying now");
    expect(formatNextAttempt(now + 120_000, now)).toMatch(/^retry at /);
  });

  it("includes the next attempt", () => {
    expect(
      connectionStateText(
        status("trading", "degraded", {
          nextAttemptAt: now + 5_000,
          reason: "Connection lost",
        }),
        now,
      ),
    ).toBe("reconnecting… · retry in 5s");
  });

  it("shows when a check is in flight", () => {
    expect(
      connectionStateText(
        status("portal", "offline", { checking: true, reason: "" }),
        now,
      ),
    ).toBe("offline · checking…");
  });

  it("only offers Retry when retrying can help", () => {
    expect(canRetry(status("a", "offline"))).toBe(true);
    expect(canRetry(status("a", "degraded"))).toBe(true);
    expect(canRetry(status("a", "online"))).toBe(false);
    expect(canRetry(status("a", "unauthorized"))).toBe(false);
  });
});
