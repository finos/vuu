import { act, type HTMLAttributes, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  BrowserRouter,
  Link,
  MemoryRouter,
  Route,
  Routes,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";

vi.mock("@salt-ds/core", () => ({
  FlexItem: ({ children, className }: HTMLAttributes<HTMLDivElement>) => (
    <div className={className}>{children}</div>
  ),
  FlexLayout: ({ children, className, id }: HTMLAttributes<HTMLDivElement>) => (
    <div className={className} id={id}>
      {children}
    </div>
  ),
  SaltProviderNext: ({
    accent,
    children,
    corner,
    density,
    mode,
    theme,
  }: {
    accent: string;
    children: ReactNode;
    corner: string;
    density: string;
    mode: string;
    theme: string;
  }) => (
    <div
      data-accent={accent}
      data-corner={corner}
      data-density={density}
      data-mode={mode}
      data-theme={theme}
    >
      {children}
    </div>
  ),
  useAriaAnnouncer: () => ({ announce: () => undefined }),
}));
vi.mock("../../src/modal-provider/ModalProvider", () => ({
  ModalProvider: ({ children }: { children: ReactNode }) => (
    <div data-provider="modal">{children}</div>
  ),
}));
vi.mock("@vuu-ui/vuu-data-react", () => ({
  VuuDataSourceProvider: ({ children }: { children: ReactNode }) => (
    <div data-provider="remote">{children}</div>
  ),
}));
vi.mock("../../src/remote-module/RemoteModule", async () => {
  const { usePortalModuleRegistry } = await import(
    "../../src/portal-module-registry/PortalModuleRegistry"
  );
  return {
    RemoteModule: ({
      mfComponent,
      mfUrl,
    }: {
      mfComponent: string;
      mfUrl: string;
    }) => {
      const { remoteModules } = usePortalModuleRegistry();
      return (
        <>
          <output data-module={mfComponent} data-url={mfUrl}>
            {remoteModules.length}
          </output>
          <Routes>
            <Route index element={<Link to="details">Details</Link>} />
            <Route path="details" element={<p>Module details</p>} />
          </Routes>
        </>
      );
    },
  };
});

import { PortalShell } from "../../src/portal-shell/PortalShell";
import { PortalLandingPage } from "../../src/portal-shell/PortalLandingPage";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import { WindowShell } from "../../src/window-shell/WindowShell";
import { getWindowHostPath } from "../../src/window-host/window-host-routing";

const modules = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "Manage users",
    id: 1,
    navLocation: "/Admin/Users",
    accessRole: "user-admin-access",
    mfComponent: "UserAdmin",
    mfScope: "userAdmin",
    mfUrl: "http://localhost:5007",
    name: "user-admin",
    path: "/users/admin",
    title: "Manage users",
    version: 1,
  },
  {
    clientIdentifier: "vuu-orders",
    description: "Manage orders",
    id: 2,
    navLocation: "/Trading/Orders",
    accessRole: "orders-access",
    mfComponent: "Orders",
    mfScope: "orders",
    mfUrl: "http://localhost:5008",
    name: "orders",
    path: "/orders",
    title: "Orders",
    version: 1,
  },
] satisfies RemoteModuleDescriptor[];

describe("Portal and window shells", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    window.history.replaceState(null, "", "/");
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    window.history.replaceState(null, "", "/");
  });

  it.each([
    BrowserRouter,
    MemoryRouter,
  ])("rejects an external $name instead of nesting routers", async (OuterRouter) => {
    const render = async () => {
      await act(async () => {
        root.render(
          <OuterRouter>
            <PortalShell remoteModules={modules} title="Portal" />
          </OuterRouter>,
        );
      });
    };
    await expect(render()).rejects.toThrow(
      "You cannot render a <Router> inside another <Router>. You should never have more than one in your app.",
    );
  });

  it.each([
    ["/users/admin", "UserAdmin"],
    ["/orders", "Orders"],
  ])("provides the complete registry at %s without an external router", async (path, module) => {
    window.history.replaceState(null, "", path);
    await act(async () => {
      root.render(<PortalShell remoteModules={modules} title="Portal" />);
    });

    expect(
      [...container.querySelectorAll("output")].map((element) => [
        element.dataset.module,
        element.textContent,
      ]),
    ).toEqual([[module, "2"]]);
    expect(container.querySelector("[data-portal-nav]")).toBeNull();
    expect(container.querySelector("[data-portal-header]")).toBeNull();
    expect(container.querySelector("h3")).toBeNull();
    expect(container.querySelectorAll(".vuuPortalShell")).toHaveLength(1);
    expect(container.querySelector(".vuuWindowShell")).toBeNull();
    expect(container.querySelectorAll('[data-provider="remote"]')).toHaveLength(
      1,
    );
    expect(container.querySelectorAll('[data-provider="modal"]')).toHaveLength(
      1,
    );
    expect(
      container.querySelector('[data-accent] [data-provider="modal"]'),
    ).not.toBeNull();
    expect(container.querySelector("[data-accent]")).toMatchObject({
      dataset: {
        accent: "purple",
        corner: "rounded",
        density: "medium",
        mode: "light",
        theme: "vuu-theme",
      },
    });
  });

  it("renders PortalLandingPage at the root path and navigates to a module", async () => {
    await act(async () => {
      root.render(
        <PortalShell remoteModules={modules} title="Portal">
          <header data-portal-chrome>Portal chrome</header>
          <PortalLandingPage>
            <section data-portal-landing-page>
              <p>Welcome to the portal</p>
              <Link to="/orders">Open orders</Link>
            </section>
          </PortalLandingPage>
        </PortalShell>,
      );
    });

    expect(
      container.querySelector(
        ".vuuPortalShell-content > .vuuPortalLandingPage [data-portal-landing-page]",
      ),
    ).not.toBeNull();
    expect(
      container.querySelector(".vuuPortalShell > [data-portal-chrome]"),
    ).not.toBeNull();
    expect(container.querySelector("output")).toBeNull();

    await act(async () => {
      container
        .querySelector<HTMLAnchorElement>(
          ".vuuPortalShell-content [data-portal-landing-page] a",
        )
        ?.click();
    });
    expect(window.location.pathname).toBe("/orders");
    expect(container.querySelector("output")?.dataset.module).toBe("Orders");
  });

  it("renders PortalLandingPage at the default route when hosted at a nested path", async () => {
    window.history.replaceState(null, "", "/showcase/VuuPortal/PortalShell");
    await act(async () => {
      root.render(
        <PortalShell remoteModules={modules} title="Portal">
          <PortalLandingPage>
            <p data-portal-landing-page>Welcome to the portal</p>
          </PortalLandingPage>
        </PortalShell>,
      );
    });

    expect(
      container.querySelector(
        ".vuuPortalShell-content .vuuPortalLandingPage [data-portal-landing-page]",
      ),
    ).not.toBeNull();
  });

  it("uses an injected data source provider instead of the remote default", async () => {
    const LocalDataSourceProvider = ({ children }: { children: ReactNode }) => (
      <div data-provider="local">{children}</div>
    );

    await act(async () => {
      root.render(
        <PortalShell
          DataSourceProvider={LocalDataSourceProvider}
          remoteModules={[]}
          title="Local Portal"
        />,
      );
    });

    expect(container.querySelector('[data-provider="local"]')).not.toBeNull();
    expect(container.querySelector('[data-provider="remote"]')).toBeNull();
  });

  it("configures the Salt theme characteristics", async () => {
    await act(async () => {
      root.render(
        <PortalShell
          accent="teal"
          corner="sharp"
          density="low"
          mode="dark"
          remoteModules={[]}
          theme="salt-theme"
          title="Themed Portal"
        />,
      );
    });

    expect(container.querySelector("[data-accent]")).toMatchObject({
      dataset: {
        accent: "teal",
        corner: "sharp",
        density: "low",
        mode: "dark",
        theme: "salt-theme",
      },
    });
  });

  it("renders a standalone WindowShell with its own layout and shared provider defaults", async () => {
    await act(async () => {
      root.render(
        <WindowShell id="module-window">
          <p>Hosted content</p>
        </WindowShell>,
      );
    });

    expect(container.querySelector(".vuuWindowShell")?.id).toBe(
      "module-window",
    );
    expect(container.querySelector(".vuuWindowShell-header")).toBeNull();
    expect(container.querySelector("[data-portal-header]")).toBeNull();
    expect(
      container.querySelector(".vuuWindowShell-content")?.textContent,
    ).toBe("Hosted content");
    expect(container.querySelector(".vuuPortalShell")).toBeNull();
    expect(container.querySelector("[data-portal-nav]")).toBeNull();
    expect(
      container.querySelector(
        '[data-accent] > [data-provider="modal"] > [data-provider="remote"] > .vuuWindowShell',
      ),
    ).not.toBeNull();
    expect(container.querySelector("[data-accent]")).toMatchObject({
      dataset: {
        accent: "purple",
        corner: "rounded",
        density: "medium",
        mode: "light",
        theme: "vuu-theme",
      },
    });
  });

  it("supports independent WindowShell theme and data-source configuration", async () => {
    const LocalDataSourceProvider = ({ children }: { children: ReactNode }) => (
      <div data-provider="local">{children}</div>
    );
    await act(async () => {
      root.render(
        <WindowShell
          accent="teal"
          corner="sharp"
          DataSourceProvider={LocalDataSourceProvider}
          density="low"
          mode="dark"
          theme="salt-theme"
        >
          <p>Local content</p>
        </WindowShell>,
      );
    });

    expect(
      container.querySelector('[data-provider="local"]')?.textContent,
    ).toBe("Local content");
    expect(container.querySelector('[data-provider="remote"]')).toBeNull();
    expect(container.querySelector("[data-accent]")).toMatchObject({
      dataset: {
        accent: "teal",
        corner: "sharp",
        density: "low",
        mode: "dark",
        theme: "salt-theme",
      },
    });
  });

  const renderWindow = async (
    path: string,
    remoteModules: RemoteModuleDescriptor[] = modules,
  ) => {
    window.history.replaceState(null, "", path);
    await act(async () => {
      root.render(
        <AuthenticationProvider
          mode="local"
          registry={{ modules: remoteModules }}
        >
          <PortalShell remoteModules={remoteModules} title="Portal">
            <nav data-portal-nav>Portal navigation</nav>
          </PortalShell>
        </AuthenticationProvider>,
      );
    });
  };

  it("preserves portal-relative navigation and mounted content across prop updates", async () => {
    window.history.replaceState(null, "", "/users/admin");
    await act(async () => {
      root.render(
        <PortalShell remoteModules={modules} title="Portal">
          <header>
            <h3>Portal</h3>
          </header>
          <nav data-portal-nav>
            <Link to="/orders">Orders</Link>
          </nav>
        </PortalShell>,
      );
    });
    const output = container.querySelector("output");
    const link = container.querySelector<HTMLAnchorElement>(
      ".vuuPortalShell-content a",
    );
    expect(link?.getAttribute("href")).toBe("/users/admin/details");
    await act(async () => link?.click());
    expect(window.location.pathname).toBe("/users/admin/details");
    expect(container.textContent).toContain("Module details");

    await act(async () => {
      root.render(
        <PortalShell
          id="updated-portal"
          mode="dark"
          remoteModules={[modules[0]]}
          title="Updated Portal"
        >
          <header>
            <h3>Updated Portal</h3>
          </header>
          <nav data-portal-nav>
            <Link to="/users/admin">Users</Link>
          </nav>
        </PortalShell>,
      );
    });
    expect(window.location.pathname).toBe("/users/admin/details");
    expect(container.querySelector("output")).toBe(output);
    expect(output?.textContent).toBe("1");
    expect(container.textContent).toContain("Module details");
    expect(container.querySelector("h3")?.textContent).toBe("Updated Portal");
    expect(
      container
        .querySelector('[data-provider="remote"] .vuuPortalShell > nav a')
        ?.getAttribute("href"),
    ).toBe("/users/admin");
    expect(container.querySelector(".vuuPortalShell")?.id).toBe(
      "updated-portal",
    );
    expect(
      container.querySelector("[data-mode]")?.getAttribute("data-mode"),
    ).toBe("dark");
  });

  it.each([
    "/users/admin",
    "/users/admin/*",
  ])("supports a fresh portal deep link with module path %s", async (path) => {
    window.history.replaceState(null, "", "/users/admin/details");
    await act(async () => {
      root.render(
        <PortalShell
          remoteModules={[{ ...modules[0], path }]}
          title="Portal"
        />,
      );
    });
    expect(container.textContent).toContain("Module details");
  });

  it("forwards shared shell configuration to window routes without portal chrome", async () => {
    const LocalDataSourceProvider = ({ children }: { children: ReactNode }) => (
      <div data-provider="local">{children}</div>
    );
    await renderWindow("/window/1");
    await act(async () => {
      root.render(
        <AuthenticationProvider mode="local" registry={{ modules }}>
          <PortalShell
            accent="teal"
            corner="sharp"
            DataSourceProvider={LocalDataSourceProvider}
            density="low"
            mode="dark"
            remoteModules={modules}
            theme="salt-theme"
            title="Portal"
          />
        </AuthenticationProvider>,
      );
    });
    expect(
      container.querySelector('[data-provider="local"] output'),
    ).not.toBeNull();
    expect(container.querySelector('[data-provider="remote"]')).toBeNull();
    expect(container.querySelectorAll('[data-provider="modal"]')).toHaveLength(
      1,
    );
    expect(container.querySelector(".vuuPortalShell")).toBeNull();
    expect(container.querySelector("[data-portal-nav]")).toBeNull();
    expect(container.querySelector("[data-accent]")).toMatchObject({
      dataset: {
        accent: "teal",
        corner: "sharp",
        density: "low",
        mode: "dark",
        theme: "salt-theme",
      },
    });
  });

  it("resolves a window module from the current registry, ignoring URL descriptors", async () => {
    await renderWindow(
      "/window/1?mfUrl=https://untrusted.example&token=ignored",
    );
    expect(container.querySelector("output")?.dataset).toMatchObject({
      module: "UserAdmin",
      url: "http://localhost:5007",
    });
    expect(container.querySelector("output")?.textContent).toBe("2");
    expect(container.querySelector(".vuuWindowShell")).not.toBeNull();
    expect(container.querySelector(".vuuPortalShell")).toBeNull();
    expect(container.querySelector("[data-portal-nav]")).toBeNull();
    expect(container.querySelector('[data-provider="modal"]')).not.toBeNull();
    expect(container.querySelector('[data-provider="remote"]')).not.toBeNull();

    await renderWindow("/window/1", [
      { ...modules[0], mfUrl: "https://updated.example" },
      modules[1],
    ]);
    expect(container.querySelector("output")?.dataset.url).toBe(
      "https://updated.example",
    );
    await renderWindow("/window/1", [modules[1]]);
    expect(container.querySelector("output")).toBeNull();
    expect(
      container.querySelector(".vuuWindowShell [role='alert']"),
    ).not.toBeNull();
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "unavailable",
    );
  });

  it.each([
    "missing",
    "01",
    "https%3A%2F%2Funtrusted.example",
  ])("does not load a remote for an unregistered module ID %s", async (id) => {
    await renderWindow(`/window/${id}`);
    expect(container.querySelector("output")).toBeNull();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });

  it("preserves module-relative links in a window", async () => {
    await renderWindow("/window/1");
    const link = container.querySelector<HTMLAnchorElement>("a");
    expect(link?.getAttribute("href")).toBe("/window/1/details");
    await act(async () => link?.click());
    expect(container.textContent).toContain("Module details");
  });

  it("renders a module-relative route on a fresh deep-link load", async () => {
    await renderWindow("/window/1/details");
    expect(container.textContent).toContain("Module details");
  });

  it("encodes string module identifiers as a single path segment", () => {
    expect(getWindowHostPath("local orders/a?b#c")).toBe(
      "/window/local%20orders%2Fa%3Fb%23c",
    );
    expect(getWindowHostPath(42)).toBe("/window/42");
  });

  it("resolves encoded string identifiers from a local registry", async () => {
    const id = "local orders/a?b#c";
    await renderWindow(getWindowHostPath(id), [{ ...modules[0], id }]);
    expect(container.querySelector("output")?.dataset.module).toBe("UserAdmin");
  });

  it("does not load a disabled module", async () => {
    await renderWindow("/window/1", [{ ...modules[0], enabled: false }]);
    expect(container.querySelector("output")).toBeNull();
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
  });
});
