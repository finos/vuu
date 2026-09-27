import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { Link, MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import type { NavItem } from "../../src/portal-app-switcher/PortalAppSwitcher";

vi.mock("@salt-ds/core", () => ({
  VerticalNavigation: ({ children }: { children: ReactNode }) => (
    <nav>{children}</nav>
  ),
}));
vi.mock("@vuu-ui/vuu-context-menu", () => ({
  ContextMenuProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("../../src/portal-app-switcher/NestedNavItem", () => ({
  NestedNavItem: ({ active, item }: { active: boolean; item: NavItem }) => (
    <Link data-item="nested" data-active={active} to={item.href}>
      {item.title}
    </Link>
  ),
}));
vi.mock("../../src/portal-app-switcher/IconNavItem", () => ({
  IconNavItem: ({ active, item }: { active: boolean; item: NavItem }) => (
    <Link data-item="icon" data-active={active} to={item.href}>
      {item.title}
    </Link>
  ),
}));

import { PortalAppSwitcher } from "../../src/portal-app-switcher/PortalAppSwitcher";

const modules: RemoteModuleDescriptor[] = ["Orders", "Baskets"].map((name) => ({
  clientIdentifier: name,
  description: name,
  id: name,
  navLocation: `/Trading/${name}`,
  navIconName: "filter",
  accessRole: "test-login",
  mfComponent: name,
  mfScope: name,
  mfUrl: "https://modules.example/mf-manifest.json",
  name,
  path: `/${name.toLowerCase()}`,
  title: name,
  version: 1,
}));

describe("PortalAppSwitcher menu style", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const titles = () =>
    [...container.querySelectorAll("[data-item]")].map(
      (item) => item.textContent,
    );

  it("rebuilds navigation when only menuStyle changes", async () => {
    for (const menuStyle of [
      "two-level",
      "single-level",
      "two-level",
    ] as const) {
      await act(async () => {
        root.render(
          <MemoryRouter>
            <PortalAppSwitcher menuStyle={menuStyle} remoteModules={modules} />
          </MemoryRouter>,
        );
      });
      expect(titles()).toEqual(
        menuStyle === "single-level"
          ? ["Trading: Orders", "Trading: Baskets"]
          : ["Trading"],
      );
    }
  });

  it("uses the effective single-level style in icon-only mode", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await act(async () => {
      root.render(
        <MemoryRouter>
          <PortalAppSwitcher
            displayStyle="icon-only"
            menuStyle="two-level"
            remoteModules={modules}
          />
        </MemoryRouter>,
      );
    });
    expect(titles()).toEqual(["Trading: Orders", "Trading: Baskets"]);
    expect(container.querySelectorAll('[data-item="icon"]')).toHaveLength(2);
    expect(warn).toHaveBeenCalledWith(
      'PortalAppSwitcher: menuStyle "two-level" is not supported with displayStyle "icon-only"; using "single-level".',
    );
  });

  it.each([
    "icon-only",
    "text-only",
  ] as const)("updates the active %s item after navigation", async (displayStyle) => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/orders/details"]}>
          <PortalAppSwitcher
            displayStyle={displayStyle}
            menuStyle="single-level"
            remoteModules={modules}
          />
        </MemoryRouter>,
      );
    });
    const links = container.querySelectorAll<HTMLAnchorElement>("a");
    expect(links[0].dataset.active).toBe("true");
    expect(links[1].dataset.active).toBe("false");
    await act(async () => links[1].click());
    expect(links[0].dataset.active).toBe("false");
    expect(links[1].dataset.active).toBe("true");
  });
});
