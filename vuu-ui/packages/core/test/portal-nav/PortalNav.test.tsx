import { fireEvent, getByRole, queryByRole } from "@testing-library/dom";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import { PortalNav } from "../../src/portal-nav/PortalNav";

const modules: RemoteModuleDescriptor[] = [
  {
    clientIdentifier: "orders",
    description: "Orders",
    id: "local orders",
    location: "/Trading/Orders",
    accessRole: "orders-login",
    mfComponent: "Orders",
    mfScope: "orders",
    mfUrl: "https://modules.example",
    name: "orders",
    path: "/trading/orders/*",
    title: "Orders",
    version: 1,
  },
  {
    clientIdentifier: "admin",
    description: "Admin",
    id: 42,
    location: "/Administration",
    accessRole: "admin-login",
    mfComponent: "Admin",
    mfScope: "admin",
    mfUrl: "https://admin.example",
    name: "admin",
    path: "/admin",
    title: "Administration",
    version: 1,
  },
];

const Location = () => <output>{useLocation().pathname}</output>;

describe("PortalNav module launch actions", () => {
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

  const renderNav = async (basename = "/") => {
    await act(async () => {
      root.render(
        <MemoryRouter basename={basename} initialEntries={[basename]}>
          <PortalNav remoteModules={modules} />
          <Location />
        </MemoryRouter>,
      );
    });
    await act(async () => {
      fireEvent.click(getByRole(container, "button", { name: "Trading" }));
    });
  };

  it.each([
    ["Open in new Tab", "noopener,noreferrer"],
    ["Open in new Window", "popup,width=1200,height=800,noopener,noreferrer"],
  ])("opens %s with only the module ID and leaves the current route unchanged", async (label, features) => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await renderNav("/portal");
    const orders = getByRole(container, "link", { name: "Orders" });
    expect(orders.getAttribute("href")).toBe("/portal/trading/orders");
    await act(async () => {
      fireEvent.contextMenu(orders, { clientX: 10, clientY: 20 });
    });
    await act(async () => {
      fireEvent.click(getByRole(document.body, "menuitem", { name: label }));
    });
    expect(open).toHaveBeenCalledExactlyOnceWith(
      "/portal/window/local%20orders",
      "_blank",
      features,
    );
    expect(container.querySelector("output")?.textContent).toBe("/");
  });

  it.each([
    { key: "F10", shiftKey: true },
    { key: "ContextMenu" },
  ])("supports keyboard invocation with $key on a single-level module", async (key) => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await renderNav();
    const admin = getByRole(container, "link", { name: "Administration" });
    expect(admin.getAttribute("href")).toBe("/admin");
    await act(async () => {
      admin.focus();
      fireEvent.keyDown(admin, key);
    });
    await act(async () => {
      fireEvent.click(
        getByRole(document.body, "menuitem", { name: "Open in new Tab" }),
      );
    });
    expect(open).toHaveBeenCalledExactlyOnceWith(
      "/window/42",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("keeps normal module navigation and category behavior", async () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    await renderNav();
    await act(async () => {
      fireEvent.contextMenu(
        getByRole(container, "button", { name: "Trading" }),
      );
    });
    expect(queryByRole(document.body, "menu")).toBeNull();
    await act(async () => {
      fireEvent.click(getByRole(container, "link", { name: "Orders" }));
    });
    expect(container.querySelector("output")?.textContent).toBe(
      "/trading/orders",
    );
    expect(open).not.toHaveBeenCalled();
  });
});
