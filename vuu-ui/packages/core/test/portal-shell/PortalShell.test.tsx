import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";

vi.mock("@salt-ds/core", () => ({
  FlexItem: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  FlexLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SaltProviderNext: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
}));
vi.mock("@vuu-ui/vuu-data-react", () => ({
  VuuDataSourceProvider: ({ children }: { children: ReactNode }) => (
    <div data-provider="remote">{children}</div>
  ),
}));
vi.mock("@vuu-ui/vuu-icons", () => ({
  VuuLogo: () => <div />,
}));
vi.mock("../../src/portal-header/PortalHeader", () => ({
  PortalHeader: () => <div />,
}));
vi.mock("../../src/portal-nav/PortalNav", () => ({
  PortalNav: () => <div />,
}));
vi.mock("../../src/remote-module/RemoteModule", async () => {
  const { usePortalModuleRegistry } = await import(
    "../../src/portal-module-registry/PortalModuleRegistry"
  );
  return {
    RemoteModule: ({ mfComponent }: { mfComponent: string }) => {
      const { remoteModules } = usePortalModuleRegistry();
      return <output data-module={mfComponent}>{remoteModules.length}</output>;
    },
  };
});

import { PortalShell } from "../../src/portal-shell/PortalShell";

const modules = [
  {
    clientIdentifier: "vuu-user-admin",
    description: "Manage users",
    id: 1,
    location: "/Admin/Users",
    accessRole: "user-admin-login",
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
    location: "/Trading/Orders",
    accessRole: "orders-login",
    mfComponent: "Orders",
    mfScope: "orders",
    mfUrl: "http://localhost:5008",
    name: "orders",
    path: "/orders",
    title: "Orders",
    version: 1,
  },
] satisfies RemoteModuleDescriptor[];

describe("PortalShell module registry scope", () => {
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

  it("provides the complete registry to every remote route", async () => {
    await act(async () => {
      root.render(
        <>
          <MemoryRouter initialEntries={["/users/admin"]}>
            <PortalShell remoteModules={modules} title="Portal" />
          </MemoryRouter>
          <MemoryRouter initialEntries={["/orders"]}>
            <PortalShell remoteModules={modules} title="Portal" />
          </MemoryRouter>
        </>,
      );
    });

    expect(
      [...container.querySelectorAll("output")].map((element) => [
        element.dataset.module,
        element.textContent,
      ]),
    ).toEqual([
      ["UserAdmin", "2"],
      ["Orders", "2"],
    ]);
    expect(container.querySelectorAll('[data-provider="remote"]')).toHaveLength(
      2,
    );
  });

  it("uses an injected data source provider instead of the remote default", async () => {
    const LocalDataSourceProvider = ({ children }: { children: ReactNode }) => (
      <div data-provider="local">{children}</div>
    );

    await act(async () => {
      root.render(
        <MemoryRouter>
          <PortalShell
            DataSourceProvider={LocalDataSourceProvider}
            remoteModules={[]}
            title="Local Portal"
          />
        </MemoryRouter>,
      );
    });

    expect(container.querySelector('[data-provider="local"]')).not.toBeNull();
    expect(container.querySelector('[data-provider="remote"]')).toBeNull();
  });
});
