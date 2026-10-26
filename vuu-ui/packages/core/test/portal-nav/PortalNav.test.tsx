import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import { LocalServerMonitor } from "../../src/connection-management/VuuServerMonitor";
import { NotificationStore } from "../../src/notifications/NotificationStore";
import { PortalNotificationsContext } from "../../src/notifications/PortalNotificationsContext";
import type { PortalNotification } from "../../src/notifications/notification-types";
import {
  ApplicationStateProvider,
  type ApplicationStateStore,
  createPortalPersistenceService,
  InMemoryPersistenceBackend,
  type PortalPersistenceService,
} from "../../src/persistence";
import { PortalNav } from "../../src/portal-nav/PortalNav";
import type { PortalNavProps } from "../../src/portal-nav/portal-nav-types";
import { NAV_DISPLAY_MODE_KEY } from "../../src/portal-nav/usePortalNavDisplayMode";
import { NAV_COLLAPSED_SECTIONS_KEY } from "../../src/portal-nav/usePortalNavSectionCollapse";
import { PortalShellNavContext } from "../../src/portal-shell/PortalShellNavContext";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import { VuuServerMonitorProvider } from "../../src/server-monitor";
import { testModule } from "../connection-management/test-modules";

/** Trading: m0, m1. Market: m2. */
const modules = [
  testModule("m0", "/Trading/Orders"),
  testModule("m1", "/Trading/Fills"),
  testModule("m2", "/Market/Depth"),
].map((module, i) =>
  i === 0 ? { ...module, navBadge: "workingOrders" } : module,
);

let nextId = 0;
const notification = (
  moduleIds: string[],
  level: PortalNotification["level"] = "info",
): PortalNotification => {
  const id = String(nextId++);
  return {
    attributes: {},
    createdAt: 1000,
    expired: false,
    id,
    initial: false,
    key: `test:${id}`,
    kind: "toast",
    level,
    message: `message ${id}`,
    origin: { connectionId: "test", moduleIds, source: "server" },
    read: false,
    receivedAt: 1000,
    title: `title ${id}`,
  };
};

let location = "";
const LocationProbe = () => {
  location = useLocation().pathname;
  return null;
};

describe("PortalNav", () => {
  let container: HTMLDivElement;
  let root: Root;
  let notifications: NotificationStore;
  let service: PortalPersistenceService;
  let appState: ApplicationStateStore;
  let setNavWidth: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    notifications = new NotificationStore();
    service = createPortalPersistenceService({
      backend: new InMemoryPersistenceBackend(),
      user: "steve",
      window: null,
    });
    appState = service.getStore("portal", 1);
    await appState.ready;
    setNavWidth = vi.fn();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    service.dispose();
    vi.restoreAllMocks();
  });

  const render = async (
    props: Partial<PortalNavProps> = {},
    {
      path = "/",
      monitor,
    }: { path?: string; monitor?: LocalServerMonitor } = {},
  ) => {
    const nav = (
      <MemoryRouter initialEntries={[path]}>
        <PortalNotificationsContext.Provider
          value={{ registerHost: () => undefined, store: notifications }}
        >
          <ApplicationStateProvider store={appState}>
            <PortalShellNavContext.Provider value={{ setNavWidth }}>
              <PortalNav remoteModules={modules} {...props} />
              <LocationProbe />
            </PortalShellNavContext.Provider>
          </ApplicationStateProvider>
        </PortalNotificationsContext.Provider>
      </MemoryRouter>
    );
    await act(async () =>
      root.render(
        monitor ? (
          <VuuServerMonitorProvider monitor={monitor}>
            {nav}
          </VuuServerMonitorProvider>
        ) : (
          nav
        ),
      ),
    );
  };

  const navRoot = () => container.querySelector<HTMLElement>(".vuuPortalNav")!;
  const mode = () => navRoot().dataset.displayMode;
  const width = () => navRoot().style.getPropertyValue("--vuuPortalNav-width");
  const link = (title: string) =>
    Array.from(container.querySelectorAll<HTMLAnchorElement>("a")).find(
      (a) => a.querySelector(".vuuPortalNav-label")?.textContent === title,
    )!;
  const button = (label: string) =>
    container.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);
  const click = async (element: HTMLElement | null) =>
    act(async () => {
      element!.dispatchEvent(
        new MouseEvent("click", { bubbles: true, button: 0, cancelable: true }),
      );
    });
  const press = async (init: KeyboardEventInit, target: EventTarget = window) =>
    act(async () => {
      target.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          ...init,
        }),
      );
    });
  const dot = (element: Element) =>
    element.querySelector(".vuuPortalNav-indicator");
  const description = (element: Element) =>
    (element.getAttribute("aria-describedby") ?? "")
      .split(" ")
      .map((id) => document.getElementById(id)?.textContent)
      .join(" ");

  describe("display modes", () => {
    it("shows sections of items, icons and text, 248px wide by default", async () => {
      await render();
      expect(mode()).toBe("icons-and-text");
      expect(width()).toBe("248px");
      expect(setNavWidth).toHaveBeenLastCalledWith("248px");
      const headings = Array.from(
        container.querySelectorAll(".vuuPortalNav-sectionTitle"),
      ).map((el) => el.textContent);
      expect(headings).toEqual(["Trading", "Market"]);
      expect(link("Orders").getAttribute("href")).toBe("/m0");
      expect(link("Orders").querySelector(".vuuPortalNav-icon")).not.toBeNull();
      expect(container.querySelector("nav")?.getAttribute("aria-label")).toBe(
        "Main navigation",
      );
    });

    it.each([
      ["text", "208px"],
      ["icons", "60px"],
      ["minimized", "0px"],
    ] as const)("sizes the %s mode to %s", async (displayMode, expected) => {
      await render({ defaultDisplayMode: displayMode });
      expect(mode()).toBe(displayMode);
      expect(width()).toBe(expected);
      expect(setNavWidth).toHaveBeenLastCalledWith(expected);
    });

    it("has no icons in text mode and no headings in the rail", async () => {
      await render({ defaultDisplayMode: "text" });
      expect(link("Orders").querySelector(".vuuPortalNav-icon")).toBeNull();
      await act(async () => root.render(null));
      await render({ defaultDisplayMode: "icons" });
      expect(
        container.querySelector(".vuuPortalNav-sectionHeading"),
      ).toBeNull();
      expect(
        container.querySelectorAll("ul")[0].getAttribute("aria-label"),
      ).toBe("Trading");
    });

    it("sizes the icons-and-text mode with width", async () => {
      await render({ width: 280 });
      expect(width()).toBe("280px");
    });

    it("releases the shell column when unmounted", async () => {
      await render();
      await act(async () => root.render(null));
      expect(setNavWidth).toHaveBeenLastCalledWith(undefined);
    });

    it("collapses to icons with the collapse button and expands back", async () => {
      await render({ defaultDisplayMode: "text" });
      await click(button("Collapse navigation"));
      expect(mode()).toBe("icons");
      await click(button("Expand navigation"));
      expect(mode()).toBe("text");
    });

    it("toggles with Ctrl+B and ⌘B, to collapseTo", async () => {
      await render({ collapseTo: "minimized" });
      await press({ ctrlKey: true, key: "b" });
      expect(mode()).toBe("minimized");
      await press({ key: "B", metaKey: true });
      expect(mode()).toBe("icons-and-text");
      await press({ key: "b", metaKey: true, shiftKey: true });
      expect(mode()).toBe("icons-and-text");
      await press({ key: "b" });
      expect(mode()).toBe("icons-and-text");
    });

    it("is controlled by displayMode, reporting changes", async () => {
      const onDisplayModeChange = vi.fn();
      await render({ displayMode: "text", onDisplayModeChange });
      await press({ ctrlKey: true, key: "b" });
      expect(onDisplayModeChange).toHaveBeenCalledWith("icons");
      expect(mode()).toBe("text");
      expect(appState.get(NAV_DISPLAY_MODE_KEY)).toBeUndefined();
      await render({ displayMode: "icons", onDisplayModeChange });
      expect(mode()).toBe("icons");
    });

    it("keeps to allowedDisplayModes", async () => {
      await render({
        allowedDisplayModes: ["icons-and-text", "minimized"],
        defaultDisplayMode: "icons",
      });
      expect(mode()).toBe("icons-and-text");
      // collapseTo defaults to icons, which is not allowed.
      await press({ ctrlKey: true, key: "b" });
      expect(mode()).toBe("minimized");
    });

    it("shows the rail below autoCollapseBelow, without changing the saved mode", async () => {
      const listeners = new Set<(e: { matches: boolean }) => void>();
      const query = {
        addEventListener: (_: string, l: (e: { matches: boolean }) => void) =>
          listeners.add(l),
        matches: true,
        removeEventListener: (
          _: string,
          l: (e: { matches: boolean }) => void,
        ) => listeners.delete(l),
      };
      const matchMedia = vi
        .spyOn(window, "matchMedia")
        .mockReturnValue(query as unknown as MediaQueryList);
      await render({ autoCollapseBelow: 900 });
      expect(matchMedia).toHaveBeenCalledWith("(max-width: 899.98px)");
      expect(mode()).toBe("icons");
      // Expands while narrow, then collapses again, without saving.
      await press({ ctrlKey: true, key: "b" });
      expect(mode()).toBe("icons-and-text");
      await press({ ctrlKey: true, key: "b" });
      expect(mode()).toBe("icons");
      expect(appState.get(NAV_DISPLAY_MODE_KEY)).toBeUndefined();
      await act(async () => {
        query.matches = false;
        for (const l of listeners) l({ matches: false });
      });
      expect(mode()).toBe("icons-and-text");
    });
  });

  describe("persistence", () => {
    it("saves the user's display mode, labelled for the Saved State dialog", async () => {
      await render();
      await click(button("Collapse navigation"));
      expect(appState.get(NAV_DISPLAY_MODE_KEY)).toBe("icons");
      await appState.flush();
      const [summary] = await service.list();
      expect(summary.entries).toContainEqual(
        expect.objectContaining({
          group: "Navigation",
          label: "Navigation display mode",
        }),
      );
    });

    it("restores the saved display mode", async () => {
      appState.set(NAV_DISPLAY_MODE_KEY, "text");
      await render({ defaultDisplayMode: "icons" });
      expect(mode()).toBe("text");
    });

    it("ignores an invalid saved value", async () => {
      appState.set(NAV_DISPLAY_MODE_KEY, "sideways");
      await render({ defaultDisplayMode: "icons" });
      expect(mode()).toBe("icons");
    });
  });

  describe("sections", () => {
    it("collapses sections, remembering them in saved state", async () => {
      await render({ sections: "collapsible" });
      const trading = container.querySelector<HTMLButtonElement>(
        ".vuuPortalNav-sectionToggle",
      )!;
      expect(trading.getAttribute("aria-expanded")).toBe("true");
      await click(trading);
      expect(trading.getAttribute("aria-expanded")).toBe("false");
      expect(
        document.getElementById(trading.getAttribute("aria-controls")!)?.hidden,
      ).toBe(true);
      expect(appState.get(NAV_COLLAPSED_SECTIONS_KEY)).toEqual(["/Trading"]);

      await act(async () => root.render(null));
      await render({ sections: "collapsible" });
      expect(
        container
          .querySelector(".vuuPortalNav-sectionToggle")
          ?.getAttribute("aria-expanded"),
      ).toBe("false");
    });

    it("has no headings with sections none", async () => {
      await render({ sections: "none" });
      expect(
        container.querySelector(".vuuPortalNav-sectionHeading"),
      ).toBeNull();
      expect(link("Orders")).toBeDefined();
    });

    it("moves focus with the arrow keys, Home and End", async () => {
      await render();
      link("Orders").focus();
      await press({ key: "ArrowDown" }, document.activeElement!);
      expect(document.activeElement).toBe(link("Fills"));
      await press({ key: "End" }, document.activeElement!);
      expect(document.activeElement).toBe(link("Depth"));
      await press({ key: "Home" }, document.activeElement!);
      expect(document.activeElement).toBe(link("Orders"));
    });
  });

  describe("active item", () => {
    it("marks the item for the current location", async () => {
      await render({}, { path: "/m1/detail" });
      expect(link("Fills").getAttribute("aria-current")).toBe("page");
      expect(link("Fills").classList).toContain("vuuPortalNav-link-active");
      expect(link("Orders").hasAttribute("aria-current")).toBe(false);
    });
  });

  describe("minimized", () => {
    it("opens as an overlay from the edge handle, which closes on navigation", async () => {
      await render({ defaultDisplayMode: "minimized" });
      expect(container.querySelector("nav")).toBeNull();
      const handle = button("Open navigation")!;
      expect(handle.getAttribute("aria-expanded")).toBe("false");
      await click(handle);
      expect(handle.getAttribute("aria-expanded")).toBe("true");
      expect(
        container.querySelector("nav.vuuPortalNav-overlay"),
      ).not.toBeNull();
      expect(mode()).toBe("minimized");
      await click(link("Depth"));
      expect(location).toBe("/m2");
      expect(container.querySelector("nav")).toBeNull();
    });

    it("closes the overlay with Escape, or keeps the nav open", async () => {
      await render({ defaultDisplayMode: "minimized" });
      await click(button("Open navigation"));
      await press({ key: "Escape" }, link("Orders"));
      expect(container.querySelector("nav")).toBeNull();
      expect(document.activeElement).toBe(button("Open navigation"));
      await click(button("Open navigation"));
      await click(button("Keep navigation open"));
      expect(mode()).toBe("icons-and-text");
    });
  });

  describe("badges", () => {
    const renderBadge: PortalNavProps["renderBadge"] = (item) =>
      item.navBadge === "workingOrders" ? (
        12
      ) : item.moduleId === "m1" ? (
        0
      ) : (
        <span className="pnl">+18.4k</span>
      );

    it("shows renderBadge output inline when expanded", async () => {
      await render({ renderBadge });
      expect(
        link("Orders").querySelector(".vuuPortalNav-count")?.textContent,
      ).toBe("12");
      expect(link("Depth").querySelector(".pnl")?.textContent).toBe("+18.4k");
      expect(link("Orders").querySelector(".vuuPortalNav-pip")).toBeNull();
    });

    it("shows a count above zero as a pip in the rail, and nothing else", async () => {
      await render({ defaultDisplayMode: "icons", renderBadge });
      expect(link("Orders").querySelector(".vuuPortalNav-pip")).not.toBeNull();
      expect(link("Orders").querySelector(".vuuPortalNav-count")).toBeNull();
      expect(link("Fills").querySelector(".vuuPortalNav-pip")).toBeNull();
      expect(link("Depth").querySelector(".pnl")).toBeNull();
    });
  });

  describe("item children", () => {
    const renderItemChildren: PortalNavProps["renderItemChildren"] = (
      item,
      { active },
    ) =>
      item.moduleId === "m1" ? (
        <ul className="children" data-active={String(active)}>
          <li>child</li>
        </ul>
      ) : null;

    it("nests renderItemChildren output under its item", async () => {
      await render({ renderItemChildren });
      const children = container.querySelector<HTMLElement>(".children");
      expect(children?.closest("li")?.textContent).toContain("Fills");
      expect(children?.dataset.active).toBe("false");
      expect(container.querySelectorAll(".children")).toHaveLength(1);
    });

    it("tells the children whether their item is active", async () => {
      await render({ renderItemChildren }, { path: "/m1/detail" });
      expect(
        container.querySelector<HTMLElement>(".children")?.dataset.active,
      ).toBe("true");
    });

    it("hides them in the icons rail", async () => {
      await render({ defaultDisplayMode: "icons", renderItemChildren });
      expect(container.querySelector(".children")).toBeNull();
    });
  });

  describe("notification indicator", () => {
    it("shows a dot on the icon of an item with unread notifications", async () => {
      await render();
      expect(dot(link("Orders"))).toBeNull();
      await act(async () => notifications.upsert(notification(["m0"])));
      const indicator = dot(link("Orders"))!;
      expect(indicator.parentElement?.classList).toContain("vuuPortalNav-icon");
      expect(indicator.getAttribute("data-severity")).toBe("unread");
      expect(description(link("Orders"))).toContain("1 unread notification.");
    });

    it("shows the dot after the label in text mode", async () => {
      await render({ defaultDisplayMode: "text" });
      await act(async () => notifications.upsert(notification(["m0"])));
      const indicator = dot(link("Orders"))!;
      expect(indicator.previousElementSibling?.classList).toContain(
        "vuuPortalNav-label",
      );
    });

    it("replaces the rail pip with the dot", async () => {
      await render({ defaultDisplayMode: "icons", renderBadge: () => 3 });
      await act(async () => notifications.upsert(notification(["m0"])));
      expect(dot(link("Orders"))).not.toBeNull();
      expect(link("Orders").querySelector(".vuuPortalNav-pip")).toBeNull();
      expect(link("Fills").querySelector(".vuuPortalNav-pip")).not.toBeNull();
    });

    it("does not show the dot on the active item", async () => {
      await render({}, { path: "/m0" });
      await act(async () => notifications.upsert(notification(["m0", "m1"])));
      expect(dot(link("Orders"))).toBeNull();
      expect(dot(link("Fills"))).not.toBeNull();
    });

    it("shows the dot on a collapsed section heading, except for the active item", async () => {
      appState.set(NAV_COLLAPSED_SECTIONS_KEY, ["/Trading"]);
      await render({ sections: "collapsible" }, { path: "/m0" });
      const heading = container.querySelector<HTMLElement>(
        ".vuuPortalNav-sectionToggle",
      )!;
      await act(async () => notifications.upsert(notification(["m0"])));
      expect(dot(heading)).toBeNull();
      await act(async () => notifications.upsert(notification(["m1"])));
      expect(dot(heading)).not.toBeNull();
      expect(description(heading)).toContain("1 unread notification.");
      // Not on an expanded heading.
      await click(heading);
      expect(dot(heading)).toBeNull();
    });

    it("shows the dot on the minimized handle, except for the active item", async () => {
      await render({ defaultDisplayMode: "minimized" }, { path: "/m0" });
      const handle = button("Open navigation")!;
      await act(async () => notifications.upsert(notification(["m0"])));
      expect(dot(handle)).toBeNull();
      await act(async () => notifications.upsert(notification(["m2"])));
      expect(dot(handle)).not.toBeNull();
      expect(description(handle)).toContain("1 unread notification.");
    });
  });

  describe("notification severity", () => {
    it("shows the worst unread severity on an item", async () => {
      await render();
      await act(async () => notifications.upsert(notification(["m0"])));
      expect(dot(link("Orders"))?.getAttribute("data-severity")).toBe("unread");
      await act(async () =>
        notifications.upsert(notification(["m0"], "warning")),
      );
      expect(dot(link("Orders"))?.getAttribute("data-severity")).toBe(
        "warning",
      );
      expect(dot(link("Orders"))?.classList).toContain(
        "vuuPortalNav-indicator-warning",
      );
      const error = notification(["m0"], "error");
      await act(async () => notifications.upsert(error));
      expect(dot(link("Orders"))?.getAttribute("data-severity")).toBe("error");
      await act(async () => notifications.markRead([error.key]));
      expect(dot(link("Orders"))?.getAttribute("data-severity")).toBe(
        "warning",
      );
      await act(async () => notifications.markRead("all"));
      expect(dot(link("Orders"))).toBeNull();
    });

    it("aggregates the worst severity on a collapsed section heading", async () => {
      appState.set(NAV_COLLAPSED_SECTIONS_KEY, ["/Trading"]);
      await render({ sections: "collapsible" });
      const heading = container.querySelector<HTMLElement>(
        ".vuuPortalNav-sectionToggle",
      )!;
      await act(async () => notifications.upsert(notification(["m0"])));
      await act(async () =>
        notifications.upsert(notification(["m1"], "error")),
      );
      expect(dot(heading)?.getAttribute("data-severity")).toBe("error");
    });

    it("shows no dot for notifications the active item claims", async () => {
      await render({}, { path: "/m0" });
      notifications.setOpenModule("m0");
      await act(async () =>
        notifications.upsert(notification(["m0", "m1"], "error")),
      );
      expect(dot(link("Fills"))).toBeNull();
      await act(async () =>
        notifications.upsert(notification(["m1"], "warning")),
      );
      expect(dot(link("Fills"))?.getAttribute("data-severity")).toBe("warning");
    });
  });

  describe("brand", () => {
    it("renders the brand in the rail, passing the display mode", async () => {
      const brand = vi.fn(({ displayMode }: { displayMode: string }) => (
        <span className="test-brand">{displayMode}</span>
      ));
      await render({ brand, defaultDisplayMode: "icons" });
      expect(container.querySelector(".test-brand")?.textContent).toBe("icons");
      await click(button("Expand navigation"));
      expect(container.querySelector(".test-brand")?.textContent).toBe(
        "icons-and-text",
      );
    });

    const brandLink = () =>
      container.querySelector<HTMLAnchorElement>(".vuuPortalNav-brandLink");

    it.each([
      "/workspaces/w1",
      "/Trading/Orders/detail",
    ])("links the brand to the portal root, from %s", async (path) => {
      await render({ brand: <span>Logo</span> }, { path });
      expect(location).toBe(path);
      const home = brandLink()!;
      expect(home.tagName).toBe("A");
      expect(home.getAttribute("href")).toBe("/");
      expect(home.getAttribute("aria-label")).toBe("Home");
      await click(home);
      expect(location).toBe("/");
    });

    it("is a focusable link, named by brandLabel, reached with the arrow keys", async () => {
      await render({ brand: <span>Logo</span>, brandLabel: "Portal home" });
      const home = brandLink()!;
      expect(home.getAttribute("aria-label")).toBe("Portal home");
      home.focus();
      expect(document.activeElement).toBe(home);
      await press({ key: "ArrowDown" }, home);
      expect(document.activeElement).toBe(link("Orders"));
    });

    it("links to the basename of the portal router", async () => {
      await act(async () =>
        root.render(
          <MemoryRouter basename="/portal" initialEntries={["/portal/x"]}>
            <ApplicationStateProvider store={appState}>
              <PortalNav brand={<span>Logo</span>} remoteModules={modules} />
            </ApplicationStateProvider>
          </MemoryRouter>,
        ),
      );
      expect(brandLink()?.getAttribute("href")).toBe("/portal");
    });

    it("does not nest controls in the brand inside the link", async () => {
      const onClick = vi.fn();
      await render(
        {
          brand: (
            <>
              <span>Logo</span>
              <button aria-label="Bell" onClick={onClick} type="button" />
            </>
          ),
        },
        { path: "/Trading/Orders" },
      );
      expect(brandLink()?.childElementCount).toBe(0);
      expect(button("Bell")?.closest("a")).toBeNull();
      await click(button("Bell"));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(location).toBe("/Trading/Orders");
    });

    it("has no link with brandHref false", async () => {
      await render({ brand: <span>Logo</span>, brandHref: false });
      expect(brandLink()).toBeNull();
    });
  });

  describe("presence", () => {
    it("greys an unavailable item, with its status in place of the dot", async () => {
      const map = new ModuleServerMap({
        getUnusableReason: () => undefined,
        loadConfig: async (mfUrl) => ({
          vuu: { connectionId: mfUrl.endsWith("m2") ? "risk" : "simul" },
        }),
        modules: modules as RemoteModuleDescriptor[],
        portalConnectionId: "local",
      });
      const monitor = new LocalServerMonitor({
        localServerIds: ["simul", "risk"],
        moduleServerMap: map,
      });
      map.start();
      while (!map.settled) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
      monitor.setPresence("risk", "offline");
      await render({ renderBadge: () => 5 }, { monitor });
      await act(async () => notifications.upsert(notification(["m2"])));
      const depth = link("Depth");
      expect(depth.classList).toContain("vuuNavItem-unavailable");
      expect(depth.getAttribute("aria-disabled")).toBe("true");
      expect(
        depth.querySelector(".vuuNavItemPresence-statusBadge"),
      ).not.toBeNull();
      expect(dot(depth)).toBeNull();
      expect(depth.querySelector(".vuuPortalNav-count")).toBeNull();
      expect(link("Orders").classList).not.toContain("vuuNavItem-unavailable");
    });
  });
});
