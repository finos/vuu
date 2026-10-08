import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import { LocalServerMonitor } from "../../src/connection-management/VuuServerMonitor";
import { NotificationStore } from "../../src/notifications/NotificationStore";
import { PortalNotificationsContext } from "../../src/notifications/PortalNotificationsContext";
import type { PortalNotification } from "../../src/notifications/notification-types";
import {
  PortalAppSwitcher,
  type PortalAppSwitcherProps,
} from "../../src/portal-app-switcher/PortalAppSwitcher";
import { VuuServerMonitorProvider } from "../../src/server-monitor";
import { testModule } from "../connection-management/test-modules";

const settle = async (map: ModuleServerMap) => {
  while (!map.settled) {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
};

/** m0 and m1 on the "simul" local server, m2 on "risk". */
const createMonitor = async (
  modules = [testModule("m0"), testModule("m1"), testModule("m2")],
) => {
  const map = new ModuleServerMap({
    getUnusableReason: () => undefined,
    loadConfig: async (mfUrl) => ({
      vuu: { connectionId: mfUrl.endsWith("m2") ? "risk" : "simul" },
    }),
    modules,
    portalConnectionId: "local",
  });
  const monitor = new LocalServerMonitor({
    localServerIds: ["simul", "risk"],
    moduleServerMap: map,
  });
  map.start();
  await settle(map);
  return { modules, monitor };
};

let nextId = 0;
const notification = (moduleIds: string[]): PortalNotification => {
  const id = String(nextId++);
  return {
    attributes: {},
    createdAt: 1000,
    expired: false,
    id,
    initial: false,
    key: `test:${id}`,
    kind: "toast",
    level: "info",
    message: `message ${id}`,
    origin: { connectionId: "test", moduleIds, source: "server" },
    read: false,
    receivedAt: 1000,
    title: `title ${id}`,
  };
};

describe("PortalAppSwitcher notification badges", () => {
  let container: HTMLDivElement;
  let root: Root;
  let store: NotificationStore;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    store = new NotificationStore();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
  });

  const render = async (
    monitor: LocalServerMonitor,
    props: PortalAppSwitcherProps,
  ) => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={["/"]}>
          <VuuServerMonitorProvider monitor={monitor}>
            <PortalNotificationsContext.Provider
              value={{ registerHost: () => undefined, store }}
            >
              <PortalAppSwitcher {...props} />
            </PortalNotificationsContext.Provider>
          </VuuServerMonitorProvider>
        </MemoryRouter>,
      ),
    );
  };

  const link = (title: string) =>
    container.querySelector<HTMLAnchorElement>(`a[aria-label="${title}"]`)!;
  const badgeText = (element: Element) =>
    element.querySelector(".vuuNavItemPresence-unreadBadge")?.textContent;
  const description = (element: Element) =>
    document.getElementById(element.getAttribute("aria-describedby") ?? "")
      ?.textContent;

  it("shows each item's unread count and updates it live", async () => {
    const { modules, monitor } = await createMonitor();
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });
    expect(badgeText(link("m0"))).toBeUndefined();
    expect(link("m0").hasAttribute("aria-describedby")).toBe(false);

    await act(async () => {
      store.upsert(notification(["m0"]));
      store.upsert(notification(["m0", "m1"]));
    });
    expect(badgeText(link("m0"))).toBe("2");
    expect(badgeText(link("m1"))).toBe("1");
    expect(badgeText(link("m2"))).toBeUndefined();
    expect(description(link("m0"))).toBe("2 unread notifications.");
    expect(description(link("m1"))).toBe("1 unread notification.");

    await act(async () =>
      store.markRead(store.query({ moduleIds: ["m0"] }).map(({ key }) => key)),
    );
    expect(badgeText(link("m0"))).toBeUndefined();
    expect(badgeText(link("m1"))).toBeUndefined();
  });

  it("caps the count at 99", async () => {
    const { modules, monitor } = await createMonitor();
    await render(monitor, {
      displayStyle: "dashboard",
      remoteModules: modules,
    });
    await act(async () => {
      for (let i = 0; i < 120; i++) {
        store.upsert(notification(["m2"]));
      }
    });
    expect(badgeText(link("m2"))).toBe("99+");
  });

  it("shows the status badge instead while unavailable, and the count in the overlay description", async () => {
    const { modules, monitor } = await createMonitor();
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });
    await act(async () => store.upsert(notification(["m2"])));

    const m2 = link("m2");
    expect(badgeText(m2)).toBeUndefined();
    expect(m2.querySelector(".vuuNavItemPresence-statusBadge")).not.toBeNull();
    expect(description(m2)).toMatch(/^Unavailable: .*\.$/);
  });

  it("sums a collapsed group's available children", async () => {
    const { modules, monitor } = await createMonitor([
      testModule("m0", "/Trading/Baskets"),
      testModule("m1", "/Trading/Orders"),
      testModule("m2", "/Trading/Limits"),
    ]);
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "text-only",
      menuStyle: "two-level",
      remoteModules: modules,
    });
    await act(async () => {
      store.upsert(notification(["m0"]));
      store.upsert(notification(["m1"]));
      store.upsert(notification(["m2"]));
    });
    const trading = [
      ...container.querySelectorAll(".saltVerticalNavigationItemContent"),
    ].find((element) => element.textContent?.startsWith("Trading"))!;
    // m2 is offline, so its notification isn't counted.
    expect(badgeText(trading)).toBe("2");
  });

  it("can be turned off", async () => {
    const { modules, monitor } = await createMonitor();
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
      showNotificationBadges: false,
    });
    await act(async () => store.upsert(notification(["m0"])));
    expect(badgeText(link("m0"))).toBeUndefined();
  });
});
