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

describe("NotificationsIndicator", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: PortalNotificationsAPI | undefined;
  let presentation: PortalNotificationsPresentation | undefined;

  const Probe = () => {
    api = usePortalNotifications();
    presentation = useNotificationPresentation();
    return null;
  };

  const render = (content = <NotificationsIndicator tickerDurationMs={50} />) =>
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

  it("does not show or announce initial notifications", async () => {
    await render();
    await upsert(notification("1", { initial: true }));
    expect(ticker()).toBeNull();
    expect(container.querySelector("[aria-live]")?.textContent).toBe("");
  });

  it("shows and announces a new notification, then hides the ticker", async () => {
    await render();
    await upsert(notification("2"));
    expect(ticker()?.textContent).toContain("title 2");
    expect(container.querySelector("[aria-live]")?.textContent).toBe(
      "New warning from m1: title 2",
    );
    await act(async () => ticker()?.click());
    expect(presentation?.panelRequest).toEqual({ focusKey: "simul:2" });
    await act(() => new Promise((resolve) => setTimeout(resolve, 80)));
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

  it("renders nothing without notifications", async () => {
    await act(async () => root.render(<NotificationsIndicator />));
    expect(container.innerHTML).toBe("");
  });
});
