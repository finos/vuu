import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import { PortalNotificationBanners } from "../../src/notifications/PortalNotificationBanners";
import type { PortalNotificationsAPI } from "../../src/notifications/PortalNotificationsContext";
import {
  PortalNotificationsProvider,
  useNotificationPresentation,
  usePortalNotifications,
} from "../../src/notifications/PortalNotificationsProvider";
import type { PortalNotificationsPresentation } from "../../src/notifications/PortalNotificationsContext";
import type { PortalNotification } from "../../src/notifications/notification-types";
import { testModule } from "../connection-management/test-modules";

const modules = [testModule("m0"), testModule("m1")];

const banner = (
  id: string,
  rest: Partial<PortalNotification> = {},
): PortalNotification => ({
  attributes: {},
  createdAt: Number(id),
  expired: false,
  id,
  initial: true,
  key: `simul:${id}`,
  kind: "banner",
  level: "warning",
  message: `message ${id}`,
  origin: { connectionId: "simul", moduleIds: ["m0"], source: "server" },
  read: false,
  receivedAt: Number(id),
  title: `title ${id}`,
  ...rest,
});

describe("PortalNotificationBanners", () => {
  let container: HTMLDivElement;
  let root: Root;
  let api: PortalNotificationsAPI | undefined;
  let presentation: PortalNotificationsPresentation | undefined;

  const Probe = () => {
    api = usePortalNotifications();
    presentation = useNotificationPresentation();
    return null;
  };

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(globalThis, "fetch").mockImplementation(async () =>
      Response.json({}),
    );
    await act(async () =>
      root.render(
        <AuthenticationProvider mode="local" registry={{ modules }}>
          <PortalNotificationsProvider openModuleId="m0">
            <Probe />
            <PortalNotificationBanners />
          </PortalNotificationsProvider>
        </AuthenticationProvider>,
      ),
    );
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const titles = () =>
    [...container.querySelectorAll(".saltBanner strong")].map(
      (title) => title.textContent,
    );
  const upsert = (...notifications: PortalNotification[]) =>
    act(async () => {
      for (const notification of notifications) {
        api?.store.upsert(notification);
      }
    });
  const click = (element: Element | null | undefined) =>
    act(async () => (element as HTMLElement).click());

  it("shows unread banners, labelled with their application, until closed", async () => {
    await upsert(banner("1"), banner("2", { kind: "toast" }));
    expect(titles()).toEqual(["title 1"]);
    expect(
      container.querySelector(".vuuPortalNotificationBanners-source")
        ?.textContent,
    ).toBe("m0");
    await click(container.querySelector("[aria-label='Close']"));
    expect(titles()).toEqual([]);
    expect(api?.store.get("simul:1")?.read).toBe(true);
  });

  it("shows two banners, then a button for the rest", async () => {
    await upsert(banner("1"), banner("2"), banner("3"));
    expect(titles()).toEqual(["title 3", "title 2"]);
    const more = container.querySelector(".vuuPortalNotificationBanners-more");
    expect(more?.textContent).toBe("+1 more");
    await click(more);
    expect(titles()).toEqual(["title 3", "title 2", "title 1"]);
  });

  it("hides expired banners and all banners in do not disturb", async () => {
    await upsert(banner("1", { expired: true }), banner("2"));
    expect(titles()).toEqual(["title 2"]);
    await act(async () => presentation?.setDoNotDisturb(true));
    expect(titles()).toEqual([]);
  });
});
