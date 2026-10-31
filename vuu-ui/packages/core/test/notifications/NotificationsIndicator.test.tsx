import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import { NotificationsIndicator } from "../../src/notifications/NotificationsIndicator";
import type {
  PortalNotificationsAPI,
  PortalNotificationsPresentation,
} from "../../src/notifications/PortalNotificationsContext";
import {
  PortalNotificationsProvider,
  useNotificationPresentation,
  usePortalNotifications,
} from "../../src/notifications/PortalNotificationsProvider";
import type { PortalNotification } from "../../src/notifications/notification-types";
import { testModule } from "../connection-management/test-modules";

const modules = [testModule("m0"), testModule("m1")];

const notification = (
  id: string,
  rest: Partial<PortalNotification> = {},
): PortalNotification => ({
  attributes: {},
  createdAt: Date.now(),
  expired: false,
  id,
  initial: false,
  key: `simul:${id}`,
  kind: "silent",
  level: "warning",
  message: `message ${id}`,
  origin: { connectionId: "simul", moduleIds: ["m1"], source: "server" },
  read: false,
  receivedAt: Date.now(),
  title: `title ${id}`,
  ...rest,
});

// Long enough that the ticker never hides on its own mid-test, however slow
// the runner. The test of hiding advances fake timers instead.
const TICKER_MS = 60_000;

let api: PortalNotificationsAPI | undefined;
let presentation: PortalNotificationsPresentation | undefined;

const Probe = () => {
  api = usePortalNotifications();
  presentation = useNotificationPresentation();
  return null;
};

describe("NotificationsIndicator", () => {
  let container: HTMLDivElement;
  let root: Root;
  const render = (
    content = <NotificationsIndicator tickerDurationMs={TICKER_MS} />,
  ) =>
    act(async () =>
      root.render(
        <AuthenticationProvider mode="local" registry={{ modules }}>
          <PortalNotificationsProvider>
            <Probe />
            {content}
          </PortalNotificationsProvider>
        </AuthenticationProvider>,
      ),
    );

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({}),
    );
  });

  afterEach(async () => {
    vi.useRealTimers();
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const bell = () =>
    container.querySelector<HTMLButtonElement>(
      ".vuuNotificationsIndicator-bell",
    );
  const ticker = () =>
    container.querySelector<HTMLButtonElement>(
      ".vuuNotificationsIndicator-ticker",
    );
  const upsert = (n: PortalNotification) =>
    act(async () => api?.store.upsert(n));

  it("labels the bell with the unread count and toggles the panel", async () => {
    await render();
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications");
    await upsert(notification("1", { initial: true }));
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications, 1 unread");
    expect(container.querySelector(".saltBadge")?.textContent).toContain("1");
    await act(async () => bell()?.click());
    expect(presentation?.panelOpen).toBe(true);
    expect(bell()?.getAttribute("aria-expanded")).toBe("true");
    await act(async () => bell()?.click());
    expect(presentation?.panelOpen).toBe(false);
  });

  it("strikes through the bell and says so while Do not disturb is on", async () => {
    await render();
    expect(bell()?.hasAttribute("data-do-not-disturb")).toBe(false);
    await act(async () => presentation?.setDoNotDisturb(true));
    expect(bell()?.hasAttribute("data-do-not-disturb")).toBe(true);
    expect(bell()?.getAttribute("aria-label")).toBe(
      "Notifications, do not disturb",
    );
    await upsert(notification("1", { initial: true }));
    expect(bell()?.getAttribute("aria-label")).toBe(
      "Notifications, 1 unread, do not disturb",
    );
    await act(async () => presentation?.setDoNotDisturb(false));
    expect(bell()?.hasAttribute("data-do-not-disturb")).toBe(false);
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications, 1 unread");
  });

  it("does not show or announce initial notifications", async () => {
    await render();
    await upsert(notification("1", { initial: true }));
    expect(ticker()).toBeNull();
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
  });

  it("shows and announces a new notification, then hides the ticker", async () => {
    await render();
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
    await upsert(notification("2"));
    expect(ticker()?.textContent).toContain("title 2");
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "New warning from m1: title 2",
    );
    await act(async () => ticker()?.click());
    expect(presentation?.panelRequest).toEqual({ focusKey: "simul:2" });
    await act(async () => vi.advanceTimersByTime(TICKER_MS - 1));
    expect(ticker()).not.toBeNull();
    await act(async () => vi.advanceTimersByTime(1));
    expect(ticker()).toBeNull();
  });

  it("only shows the bell in bell style", async () => {
    await render(<NotificationsIndicator compactStyle="bell" />);
    await upsert(notification("3"));
    expect(ticker()).toBeNull();
    expect(container.querySelector("[aria-live]")?.textContent).toContain(
      "title 3",
    );
  });

  it("counts only unclaimed notifications with scope unclaimed", async () => {
    await render(
      <NotificationsIndicator scope="unclaimed" tickerDurationMs={TICKER_MS} />,
    );
    await upsert(notification("4"));
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications");
    expect(container.querySelector(".saltBadge")).toBeNull();
    expect(ticker()).toBeNull();
    // Claimed notifications are still announced.
    expect(container.querySelector("[aria-live]")?.textContent).toContain(
      "title 4",
    );
    await upsert(
      notification("5", {
        origin: { connectionId: "simul", moduleIds: [], source: "server" },
      }),
    );
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications, 1 unread");
    expect(ticker()?.textContent).toContain("title 5");
    await act(async () => api?.store.markRead(["simul:5"]));
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications");
  });

  it("counts all notifications by default", async () => {
    await render(<NotificationsIndicator compactStyle="bell" />);
    await upsert(notification("6"));
    await upsert(
      notification("7", {
        origin: { connectionId: "simul", moduleIds: [], source: "server" },
      }),
    );
    expect(bell()?.getAttribute("aria-label")).toBe("Notifications, 2 unread");
  });

  it("renders nothing without notifications", async () => {
    await act(async () => root.render(<NotificationsIndicator />));
    expect(container.innerHTML).toBe("");
  });
});
