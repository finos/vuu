import {
  AuthenticationProvider,
  type LocalVuuServer,
  type PortalModuleRegistry,
} from "@vuu-ui/core";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import VuuTableBrowser, { browserBasePath } from "../src/VuuTableBrowser";

const viewerModule: PortalModuleRegistry["modules"][number] = {
  accessRole: "vuu-table-viewer-access",
  clientIdentifier: "vuu-table-viewer",
  description: "Vuu table viewer",
  id: "vuu-table-viewer",
  mfComponent: "VuuTableViewer",
  mfScope: "vuuTableViewer",
  mfUrl: "http://localhost:5005",
  name: "vuu-table-viewer",
  navLocation: "/Table",
  path: "/tables/view",
  title: "Vuu Table",
  version: 1,
};

const localServer = (connectionId: string): LocalVuuServer => ({
  connectionId,
  DataSourceProvider: ({ children }: { children: ReactNode }) => children,
});

const featureModule = (
  name: string,
  title: string,
  connectionId?: string,
): PortalModuleRegistry["modules"][number] => ({
  ...viewerModule,
  clientIdentifier: name,
  id: name,
  name,
  title,
  ...(connectionId ? { vuu: { connectionId } } : {}),
});

describe("VuuTableBrowser", () => {
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

  const renderBrowser = async (registry: PortalModuleRegistry) => {
    await act(async () => {
      root.render(
        <AuthenticationProvider
          localServers={[localServer("simul"), localServer("basket")]}
          mode="local"
          registry={registry}
        >
          <MemoryRouter initialEntries={["/tables/browse"]}>
            <Routes>
              <Route element={<VuuTableBrowser />} path="/tables/browse/*" />
            </Routes>
          </MemoryRouter>
        </AuthenticationProvider>,
      );
    });
  };

  it("lists the distinct servers of registered modules that have a local implementation", async () => {
    await renderBrowser({
      modules: [
        viewerModule,
        featureModule("simple-div", "Saved state demo", "simul"),
        featureModule("orders", "Orders", "orders"),
        featureModule("baskets", "Basket Trading", "basket"),
        featureModule("tiles", "Instrument tiles", "simul"),
      ],
    });

    const labels = Array.from(
      container.querySelectorAll(
        '[aria-label="Vuu servers"] .saltVerticalNavigationItemLabel',
      ),
      (label) => [label.textContent, label.getAttribute("title")],
    );
    expect(labels).toEqual([
      ["basket", "Used by Basket Trading"],
      ["simul", "Used by Saved state demo, Instrument tiles"],
    ]);
    expect(container.textContent).toContain(
      "Select a server and table to begin.",
    );
  });

  it("explains when no table viewer is registered", async () => {
    await renderBrowser({
      modules: [featureModule("simple-div", "Saved state demo", "simul")],
    });

    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "The Vuu table viewer is not available.",
    );
  });

  it.each([
    ["/tables/browse", undefined, "/tables/browse"],
    ["/tables/browse/", "", "/tables/browse"],
    [
      "/tables/browse/simul/SIMUL/instruments",
      "simul/SIMUL/instruments",
      "/tables/browse",
    ],
    [
      "/tables/browse/simul/SIMUL/instruments/",
      "simul/SIMUL/instruments/",
      "/tables/browse",
    ],
    [
      "/tables/browse/my%20server/SIMUL/instruments",
      "my server/SIMUL/instruments",
      "/tables/browse",
    ],
  ])("links tables from the browser path for %s", (pathname, route, base) => {
    expect(browserBasePath(pathname, route)).toBe(base);
  });
});
