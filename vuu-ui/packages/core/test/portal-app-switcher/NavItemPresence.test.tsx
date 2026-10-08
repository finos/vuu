import { act } from "react";
import { type Root, createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModuleServerMap } from "../../src/connection-management/ModuleServerMap";
import { LocalServerMonitor } from "../../src/connection-management/VuuServerMonitor";
import {
  PortalAppSwitcher,
  type PortalAppSwitcherProps,
} from "../../src/portal-app-switcher/PortalAppSwitcher";
import { VuuServerMonitorProvider } from "../../src/server-monitor";
import { testModule } from "../connection-management/test-modules";

let pathname = "";
const LocationProbe = () => {
  pathname = useLocation().pathname;
  return null;
};

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
    getUnusableReason: ({ connectionId }) =>
      connectionId === "simul" || connectionId === "risk"
        ? undefined
        : "no local server",
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
  return { map, modules, monitor };
};

describe("PortalAppSwitcher presence", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    pathname = "";
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.useRealTimers();
  });

  const render = async (
    monitor: LocalServerMonitor,
    props: PortalAppSwitcherProps,
  ) => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={["/"]}>
          <VuuServerMonitorProvider monitor={monitor}>
            <PortalAppSwitcher {...props} />
            <LocationProbe />
          </VuuServerMonitorProvider>
        </MemoryRouter>,
      ),
    );
  };

  const link = (title: string) =>
    container.querySelector<HTMLAnchorElement>(`a[aria-label="${title}"]`)!;

  it("greys an item whose server is offline and describes why", async () => {
    const { modules, monitor } = await createMonitor();
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });

    const offline = link("m2");
    expect(offline.getAttribute("aria-disabled")).toBe("true");
    expect(offline.classList).toContain("vuuNavItem-unavailable");
    expect(
      offline.querySelector(".vuuNavItemPresence-statusBadge"),
    ).not.toBeNull();
    const description = document.getElementById(
      offline.getAttribute("aria-describedby")!,
    );
    expect(description?.textContent).toMatch(
      /^Unavailable: server not responding/,
    );

    const online = link("m0");
    expect(online.hasAttribute("aria-disabled")).toBe(false);
    expect(online.classList).not.toContain("vuuNavItem-unavailable");
    expect(online.hasAttribute("aria-describedby")).toBe(false);
  });

  it("does not navigate to an unavailable item; it opens the details and retries", async () => {
    const { modules, monitor } = await createMonitor();
    monitor.setPresence("risk", "offline");
    const retryModule = vi.spyOn(monitor, "retryModule");
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });

    await act(async () => link("m2").click());

    expect(pathname).toBe("/");
    expect(retryModule).toHaveBeenCalledWith("m2");
    const dialog = container.querySelector('[role="dialog"]')!;
    expect(dialog).not.toBeNull();
    const headline = document.getElementById(
      dialog.getAttribute("aria-labelledby")!,
    );
    expect(headline?.textContent).toBe("m2 is unavailable");
    expect(dialog.textContent).toContain("Server not responding");

    retryModule.mockClear();
    const retryButton = [...dialog.querySelectorAll("button")].find(
      (button) => button.textContent === "Retry now",
    )!;
    await act(async () => retryButton.click());
    expect(retryModule).toHaveBeenCalledWith("m2");

    await act(async () => link("m0").click());
    expect(pathname).toBe("/m0");
  });

  it("closes the details on Escape", async () => {
    const { modules, monitor } = await createMonitor();
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });

    await act(async () => link("m2").click());
    const dialog = container.querySelector('[role="dialog"]')!;
    await act(async () =>
      dialog.dispatchEvent(
        new KeyboardEvent("keydown", { bubbles: true, key: "Escape" }),
      ),
    );
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("shows 'Available again' when the server recovers, then un-greys", async () => {
    const { modules, monitor } = await createMonitor();
    vi.useFakeTimers();
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });
    await act(async () => link("m2").click());

    await act(async () => monitor.setPresence("risk", undefined));

    expect(container.querySelector('[role="dialog"]')?.textContent).toBe(
      "Available again",
    );
    expect(link("m2").hasAttribute("aria-disabled")).toBe(false);

    await act(async () => vi.advanceTimersByTime(2000));
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("marks a module whose config failed as unavailable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const modules = [testModule("m0")];
    const map = new ModuleServerMap({
      loadConfig: async () => {
        throw new Error("404");
      },
      modules,
      portalConnectionId: "local",
    });
    const monitor = new LocalServerMonitor({
      localServerIds: ["simul"],
      moduleServerMap: map,
    });
    map.start();
    await settle(map);
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
    });

    await act(async () => link("m0").click());
    expect(container.querySelector('[role="dialog"]')?.textContent).toContain(
      "Application configuration could not be loaded",
    );
  });

  it("does not grey items when showPresence is false", async () => {
    const { modules, monitor } = await createMonitor();
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "icon-only",
      remoteModules: modules,
      showPresence: false,
    });
    expect(link("m2").hasAttribute("aria-disabled")).toBe(false);
  });

  it("greys a group only when all its children are unavailable", async () => {
    const { modules, monitor } = await createMonitor([
      testModule("m0", "/Trading/Baskets"),
      testModule("m1", "/Trading/Orders"),
      testModule("m2", "/Risk/Limits"),
    ]);
    monitor.setPresence("risk", "offline");
    await render(monitor, {
      displayStyle: "text-only",
      menuStyle: "two-level",
      remoteModules: modules,
    });

    const groupContent = (title: string) =>
      [
        ...container.querySelectorAll(".saltVerticalNavigationItemContent"),
      ].find((element) =>
        element.textContent?.startsWith(title),
      ) as HTMLElement;

    expect(groupContent("Risk").classList).toContain("vuuNavItem-unavailable");
    expect(groupContent("Trading").classList).not.toContain(
      "vuuNavItem-unavailable",
    );

    await act(async () => monitor.setPresence("simul", "unauthorized"));
    const trading = groupContent("Trading");
    expect(trading.classList).toContain("vuuNavItem-unavailable");
    expect(
      trading.querySelector(".vuuNavItemPresence-statusBadge svg"),
    ).not.toBeNull();
  });

  it("reports the display order to the monitor", async () => {
    const { modules, monitor } = await createMonitor([
      testModule("m0", "/B/x"),
      testModule("m1", "/A"),
      testModule("m2", "/B/y"),
    ]);
    const setDisplayOrder = vi.spyOn(monitor, "setDisplayOrder");
    await render(monitor, {
      displayStyle: "text-only",
      menuStyle: "two-level",
      remoteModules: modules,
    });
    expect(setDisplayOrder).toHaveBeenLastCalledWith(["m0", "m2", "m1"]);
  });
});
