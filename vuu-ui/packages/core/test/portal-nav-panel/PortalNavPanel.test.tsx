import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import { circleQuestionMarkIcon } from "../../src/portal-app-switcher/nav-item-utils";
import { PortalNavPanel } from "../../src/portal-nav-panel/PortalNavPanel";

const remoteModule = (
  navLocation: string,
  path: string,
  icon: Pick<RemoteModuleDescriptor, "navIconName" | "navIconUrl"> = {},
): RemoteModuleDescriptor => ({
  accessRole: "test-access",
  clientIdentifier: path,
  description: path,
  id: path,
  mfComponent: path,
  mfScope: path,
  mfUrl: "https://modules.example/mf-manifest.json",
  name: path,
  navLocation,
  path,
  title: path,
  version: 1,
  ...icon,
});

const modules = [
  remoteModule("/Trading/Orders", "/orders/*", { navIconName: "filter" }),
  remoteModule("/Dashboard", "/dashboard", {
    navIconUrl: "data:image/svg+xml;base64,AAAA",
  }),
  remoteModule("", "/nested"),
  remoteModule("/Reports", "/reports"),
];

describe("PortalNavPanel", () => {
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
  });

  const render = async () => {
    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route
              path="/"
              element={<PortalNavPanel remoteModules={modules} />}
            />
            <Route path="/orders" element={<p>Orders module</p>} />
          </Routes>
        </MemoryRouter>,
      );
    });
  };

  const links = () => [
    ...container.querySelectorAll<HTMLAnchorElement>(".vuuPortalNavPanel-link"),
  ];

  it("renders a link per navigable module, skipping nested modules", async () => {
    await render();
    expect(
      links().map((link) => [link.getAttribute("href"), link.textContent]),
    ).toEqual([
      ["/orders", "Trading: Orders"],
      ["/dashboard", "Dashboard"],
      ["/reports", "Reports"],
    ]);
  });

  it("renders named, url and fallback icons", async () => {
    await render();
    const icons = links().map((link) =>
      link.querySelector<HTMLElement>(".vuuIcon"),
    );
    expect(icons.map((icon) => icon?.dataset.icon)).toEqual([
      "filter",
      "custom",
      "custom",
    ]);
    expect(icons[0]?.style.getPropertyValue("--vuu-icon-svg")).toBe("");
    expect(icons[1]?.style.getPropertyValue("--vuu-icon-svg")).toBe(
      "url('data:image/svg+xml;base64,AAAA')",
    );
    expect(icons[2]?.style.getPropertyValue("--vuu-icon-svg")).toBe(
      `url('${circleQuestionMarkIcon}')`,
    );
  });

  it("navigates to the module when a link is clicked", async () => {
    await render();
    await act(async () => links()[0].click());
    expect(container.textContent).toBe("Orders module");
  });
});
