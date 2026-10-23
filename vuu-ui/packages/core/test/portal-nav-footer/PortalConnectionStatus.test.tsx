import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  CONNECTION_STATUS_OPEN_DELAY_MS,
  type PortalConnectionDescriptor,
  PortalConnectionStatus,
} from "../../src/portal-nav-footer/PortalConnectionStatus";
import type { PortalNavFooterVariant } from "../../src/portal-nav-footer/useFooterPopover";
import { VuuServerMonitorProvider } from "../../src/server-monitor/VuuServerMonitorProvider";
import {
  FakeServerMonitor,
  click,
  hover,
  keyDown,
  serverStatus,
  unhover,
} from "./test-utils";

const connections: PortalConnectionDescriptor[] = [
  {
    connectionId: "portal",
    label: "Portal",
    impact: "Applications can't be opened.",
  },
  {
    connectionId: "trading",
    label: "Trading",
    impact: "Prices are paused.",
    detail: "Session: continuous",
  },
];

describe("PortalConnectionStatus", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const render = async (
    monitor: FakeServerMonitor,
    {
      variant = "expanded",
      withConnections = true,
    }: { variant?: PortalNavFooterVariant; withConnections?: boolean } = {},
  ) => {
    await act(async () => {
      root.render(
        <VuuServerMonitorProvider monitor={monitor}>
          <PortalConnectionStatus
            connections={withConnections ? connections : undefined}
            variant={variant}
          />
        </VuuServerMonitorProvider>,
      );
    });
  };

  const trigger = () =>
    container.querySelector<HTMLButtonElement>(
      ".vuuPortalConnectionStatus-trigger",
    );
  const popover = () => container.querySelector('[role="dialog"]');
  const row = (connectionId: string) =>
    container.querySelector<HTMLElement>(
      `[data-connection-id="${connectionId}"]`,
    );

  const healthy = () =>
    new FakeServerMonitor([
      serverStatus("portal", "online", { endpoint: "portal.test", reason: "" }),
      serverStatus("trading", "online", {
        endpoint: "trading.test:8443",
        reason: "",
      }),
    ]);

  it("shows Connected with a green dot when everything is online", async () => {
    await render(healthy());
    expect(trigger()?.dataset.severity).toBe("ok");
    expect(trigger()?.textContent).toBe("Connected");
    expect(trigger()?.getAttribute("aria-label")).toBe(
      "Connection status: Connected",
    );
  });

  it("names the worst connection", async () => {
    const monitor = new FakeServerMonitor([
      serverStatus("portal", "online"),
      serverStatus("trading", "degraded"),
    ]);
    await render(monitor);
    expect(trigger()?.dataset.severity).toBe("warning");
    expect(trigger()?.textContent).toBe("Trading reconnecting…");

    await act(async () =>
      monitor.update(serverStatus("portal", "offline", { reason: "Down" })),
    );
    expect(trigger()?.dataset.severity).toBe("error");
    expect(trigger()?.textContent).toBe("Portal offline");
  });

  it("labels connections by id when none are given", async () => {
    await render(
      new FakeServerMonitor([
        serverStatus("portal", "online"),
        serverStatus("trading", "offline"),
      ]),
      { withConnections: false },
    );
    expect(trigger()?.textContent).toBe("trading offline");
  });

  it("shows the dot only in the rail", async () => {
    await render(healthy(), { variant: "rail" });
    expect(trigger()?.textContent).toBe("");
    expect(trigger()?.getAttribute("aria-label")).toBe(
      "Connection status: Connected",
    );
    expect(
      container.querySelector(".vuuPortalConnectionStatus-dot"),
    ).not.toBeNull();
  });

  it("opens a breakdown on click with a row per connection", async () => {
    const now = Date.now();
    await render(
      new FakeServerMonitor([
        serverStatus("portal", "online", {
          endpoint: "portal.test",
          reason: "",
        }),
        serverStatus("trading", "degraded", {
          endpoint: "trading.test:8443",
          nextAttemptAt: now + 10_000,
          reason: "Connection lost",
        }),
      ]),
    );
    expect(popover()).toBeNull();
    await click(trigger());

    expect(popover()).not.toBeNull();
    expect(trigger()?.getAttribute("aria-expanded")).toBe("true");
    expect(trigger()?.getAttribute("aria-controls")).toBe(popover()?.id);
    expect(document.activeElement).toBe(popover());
    expect(popover()?.textContent).toContain("Degraded");

    const portal = row("portal");
    expect(portal?.dataset.severity).toBe("ok");
    expect(portal?.textContent).toContain("Portal");
    expect(portal?.textContent).toContain("connected");
    expect(portal?.textContent).toContain("portal.test");
    expect(portal?.textContent).not.toContain("Applications can't be opened.");
    expect(portal?.querySelector("button")).toBeNull();

    const trading = row("trading");
    expect(trading?.dataset.severity).toBe("warning");
    expect(trading?.textContent).toMatch(/reconnecting… · retry in (9|10)s/);
    expect(trading?.textContent).toContain("trading.test:8443");
    expect(trading?.textContent).toContain("Connection lost");
    expect(trading?.textContent).toContain("Session: continuous");
    expect(trading?.textContent).toContain("Prices are paused.");
  });

  it("retries a connection", async () => {
    const monitor = new FakeServerMonitor([
      serverStatus("portal", "offline", { reason: "Down" }),
      serverStatus("trading", "online"),
    ]);
    await render(monitor);
    await click(trigger());
    const retry = container.querySelector<HTMLButtonElement>(
      '[aria-label="Retry Portal"]',
    );
    expect(retry?.textContent).toBe("Reconnect");
    await click(retry);
    expect(monitor.retry).toHaveBeenCalledWith("portal");
    // Retrying doesn't close the breakdown.
    expect(popover()).not.toBeNull();
  });

  it("disables Retry while a check is in flight", async () => {
    await render(
      new FakeServerMonitor([
        serverStatus("portal", "offline", { checking: true, reason: "Down" }),
      ]),
    );
    await click(trigger());
    expect(
      container.querySelector<HTMLButtonElement>('[aria-label="Retry Portal"]')
        ?.disabled,
    ).toBe(true);
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    await render(healthy());
    await click(trigger());
    await keyDown(popover(), "Escape");
    expect(popover()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(trigger()?.getAttribute("aria-expanded")).toBe("false");
  });

  it("closes on a second click and on a click outside", async () => {
    await render(healthy());
    await click(trigger());
    await click(trigger());
    expect(popover()).toBeNull();

    await click(trigger());
    await act(() => {
      document.body.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true }),
      );
    });
    expect(popover()).toBeNull();
  });

  it("opens 400ms after hovering, without taking focus", async () => {
    vi.useFakeTimers();
    await render(healthy());
    await hover(trigger() as HTMLElement);
    await act(() =>
      vi.advanceTimersByTime(CONNECTION_STATUS_OPEN_DELAY_MS - 1),
    );
    expect(popover()).toBeNull();
    await act(() => vi.advanceTimersByTime(1));
    expect(popover()).not.toBeNull();
    expect(document.activeElement).not.toBe(popover());
  });

  it("doesn't open when the pointer leaves before the delay", async () => {
    vi.useFakeTimers();
    await render(healthy());
    await hover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(200));
    await unhover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(1000));
    expect(popover()).toBeNull();
  });

  it("closes a hover-opened breakdown after the pointer leaves, unless it moves onto it", async () => {
    vi.useFakeTimers();
    await render(healthy());
    await hover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(CONNECTION_STATUS_OPEN_DELAY_MS));
    await unhover(trigger() as HTMLElement);
    await hover(popover() as HTMLElement);
    await act(() => vi.advanceTimersByTime(1000));
    expect(popover()).not.toBeNull();

    await unhover(popover() as HTMLElement);
    await act(() => vi.advanceTimersByTime(300));
    expect(popover()).toBeNull();
  });

  it("stays open after the pointer leaves once clicked", async () => {
    vi.useFakeTimers();
    await render(healthy());
    await hover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(CONNECTION_STATUS_OPEN_DELAY_MS));
    await click(trigger());
    expect(popover()).not.toBeNull();
    await unhover(trigger() as HTMLElement);
    await act(() => vi.advanceTimersByTime(1000));
    expect(popover()).not.toBeNull();
  });
});
