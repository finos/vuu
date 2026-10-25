import { act, useContext } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PortalModuleIdContext } from "../../src/notifications/PortalNotificationsContext";
import {
  PortalModuleComponent,
  PortalModuleRegistryProvider,
  type RemoteModuleDescriptor,
} from "../../src/portal";

const remoteModuleProps = vi.fn();

vi.mock("../../src/remote-module/RemoteModule", () => ({
  RemoteModule: (props: Record<string, unknown>) => {
    const moduleId = useContext(PortalModuleIdContext);
    remoteModuleProps(props);
    return <div data-module-id={moduleId} data-testid="remote-module" />;
  },
}));

const descriptor = (
  overrides: Partial<RemoteModuleDescriptor> = {},
): RemoteModuleDescriptor => ({
  accessRole: "",
  clientIdentifier: "baskets-ui",
  description: "",
  id: 3,
  mfComponent: "./Baskets",
  mfScope: "baskets",
  mfUrl: "http://localhost/baskets",
  name: "baskets",
  navLocation: "/Trading/Baskets",
  path: "/baskets",
  title: "Baskets",
  version: 2,
  ...overrides,
});

describe("PortalModuleComponent", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    remoteModuleProps.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderWith = (
    modules: RemoteModuleDescriptor[],
    moduleId: string,
    props?: Record<string, string>,
  ) =>
    act(() =>
      root.render(
        <PortalModuleRegistryProvider remoteModules={modules}>
          <PortalModuleComponent moduleId={moduleId} props={props} />
        </PortalModuleRegistryProvider>,
      ),
    );

  it("renders the registered module, resolved from the live registry", () => {
    renderWith([descriptor()], "3", { mode: "compact", mfUrl: "http://stale" });
    expect(
      container
        .querySelector("[data-testid='remote-module']")
        ?.getAttribute("data-module-id"),
    ).toBe("3");
    expect(remoteModuleProps).toHaveBeenCalledWith(
      expect.objectContaining({
        clientIdentifier: "baskets-ui",
        mfComponent: "./Baskets",
        mfScope: "baskets",
        mfUrl: "http://localhost/baskets",
        mode: "compact",
        title: "Baskets",
        version: 2,
      }),
    );
  });

  it("resolves a module by clientIdentifier", () => {
    renderWith([descriptor()], "baskets-ui");
    expect(
      container.querySelector("[data-testid='remote-module']"),
    ).not.toBeNull();
  });

  it("shows a placeholder for an unknown module", () => {
    renderWith([descriptor()], "99");
    expect(container.querySelector("[data-testid='remote-module']")).toBeNull();
    expect(container.querySelector("[role='alert']")?.textContent).toContain(
      'The module "99" is not available',
    );
  });

  it("shows a placeholder for a disabled module", () => {
    renderWith([descriptor({ enabled: false })], "3");
    expect(container.querySelector("[data-testid='remote-module']")).toBeNull();
    expect(container.querySelector("[role='alert']")?.textContent).toContain(
      "is disabled",
    );
  });

  it("renders the module with a custom renderModule", () => {
    act(() =>
      root.render(
        <PortalModuleRegistryProvider remoteModules={[descriptor()]}>
          <PortalModuleComponent
            moduleId="3"
            props={{ mode: "compact" }}
            renderModule={(module, props) => (
              <span data-testid="custom">
                {module.title}:{String(props?.mode)}
              </span>
            )}
          />
        </PortalModuleRegistryProvider>,
      ),
    );
    expect(remoteModuleProps).not.toHaveBeenCalled();
    expect(container.querySelector("[data-testid='custom']")?.textContent).toBe(
      "Baskets:compact",
    );
  });
});
