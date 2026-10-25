import {
  GridLayout,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
  GridLayoutProvider,
} from "@vuu-ui/grid-layout";
import { act, useContext } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  createMemoryRouter,
  RouterProvider,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePortalModuleInstanceId } from "../../src";
import { PortalModuleIdContext } from "../../src/notifications/PortalNotificationsContext";
import {
  createPortalComponentRegistries,
  PortalModuleComponent,
  type PortalModuleComponentSettings,
  PortalModuleRegistryProvider,
  type RemoteModuleDescriptor,
  WORKSPACE_ROUTE_PATTERN,
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

/** A module that navigates with its own router, as the admin modules do. */
const RoutingModule = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const instanceId = usePortalModuleInstanceId();
  return (
    <div data-instance-id={instanceId} data-testid="routing-module">
      <span data-testid="module-location">{pathname}</span>
      <button
        data-testid="navigate"
        onClick={() => navigate("/baskets/orders/7")}
        type="button"
      />
    </div>
  );
};

const documentFor = (
  settings: PortalModuleComponentSettings,
): GridLayoutDocument =>
  ({
    components: [
      { id: "component-m", settings, type: "portal-module", version: 1 },
    ],
    kind: "grid-layout",
    layout: {
      columns: ["1fr"],
      id: "workspace",
      items: [
        {
          column: { span: 1, start: 1 },
          componentInstanceId: "component-m",
          id: "m",
          row: { span: 1, start: 1 },
        },
      ],
      placeholderIds: [],
      rows: ["1fr"],
      stacks: [],
    },
    version: 2,
  }) as unknown as GridLayoutDocument;

type ChangeHandler = (
  document: GridLayoutDocument,
  change: GridLayoutDocumentChange,
) => void;

describe("PortalModuleComponent in a workspace", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onDocumentChange: ReturnType<typeof vi.fn<ChangeHandler>>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    onDocumentChange = vi.fn<ChangeHandler>();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  const renderWorkspace = (settings: PortalModuleComponentSettings) => {
    const { renderers, settingsCodecs } = createPortalComponentRegistries({
      renderModule: () => <RoutingModule />,
    });
    const router = createMemoryRouter(
      [
        {
          element: (
            <PortalModuleRegistryProvider remoteModules={[descriptor()]}>
              <GridLayoutProvider
                componentRenderers={renderers}
                document={documentFor(settings)}
                onDocumentChange={onDocumentChange}
                settingsCodecs={settingsCodecs}
              >
                <GridLayout id="workspace" />
              </GridLayoutProvider>
            </PortalModuleRegistryProvider>
          ),
          path: WORKSPACE_ROUTE_PATTERN,
        },
      ],
      { initialEntries: ["/workspaces/ws-1"] },
    );
    act(() => root.render(<RouterProvider router={router} />));
    return router;
  };

  const moduleLocation = () =>
    container.querySelector("[data-testid='module-location']")?.textContent;

  it("routes the module in memory, leaving the workspace URL alone", () => {
    const router = renderWorkspace({ moduleId: "3" });
    expect(moduleLocation()).toBe("/baskets");

    act(() => {
      container.querySelector<HTMLElement>("[data-testid='navigate']")?.click();
    });

    expect(moduleLocation()).toBe("/baskets/orders/7");
    expect(router.state.location.pathname).toBe("/workspaces/ws-1");
    expect(container.querySelector("[data-testid='routing-module']")).not.toBe(
      null,
    );
  });

  it("saves the module's location with the item and restores it", () => {
    renderWorkspace({ moduleId: "3", props: { mode: "compact" } });
    act(() => {
      container.querySelector<HTMLElement>("[data-testid='navigate']")?.click();
    });
    expect(onDocumentChange.mock.lastCall?.[1].kind).toBe("settings");
    const saved = onDocumentChange.mock.lastCall?.[0].components[0].settings;
    expect(saved).toEqual({
      location: "/baskets/orders/7",
      moduleId: "3",
      props: { mode: "compact" },
    });

    act(() => root.unmount());
    root = createRoot(container);
    renderWorkspace(saved as PortalModuleComponentSettings);
    expect(moduleLocation()).toBe("/baskets/orders/7");
  });

  it("identifies the module instance by its workspace item", () => {
    renderWorkspace({ moduleId: "3" });
    expect(
      container
        .querySelector("[data-testid='routing-module']")
        ?.getAttribute("data-instance-id"),
    ).toBe("component-m");
  });
});
