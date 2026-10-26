import type { GridLayoutDocument } from "@vuu-ui/grid-layout";
import { NotificationsProvider } from "@vuu-ui/vuu-notifications";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import {
  MemoryRouter,
  type NavigateFunction,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationStore } from "../../src/notifications/NotificationStore";
import { PortalNotificationsContext } from "../../src/notifications/PortalNotificationsContext";
import {
  ApplicationStateProvider,
  type ApplicationStateStore,
  createPortalPersistenceService,
  InMemoryPersistenceBackend,
  type PortalPersistenceService,
} from "../../src/persistence";
import { useContextPanel } from "../../src/context-panel/ContextPanelProvider";
import {
  ShellContextPanel,
  ShellContextPanelProvider,
} from "../../src/context-panel/ShellContextPanel";
import {
  AddPanelButton,
  type PanelsPaletteProps,
} from "../../src/panels-palette";
import { CloseContextPanelOnNavigation } from "../../src/portal-shell/PortalShell";
import { createPortalComponentRegistries } from "../../src/portal-components";
import { PortalModuleRegistryProvider } from "../../src/portal-module-registry/PortalModuleRegistry";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import { PortalNav } from "../../src/portal-nav/PortalNav";
import type { PortalNavProps } from "../../src/portal-nav/portal-nav-types";
import { PortalWorkspace } from "../../src/portal-workspaces/PortalWorkspace";
import { formatEdited } from "../../src/portal-workspaces/PortalWorkspaceHeader";
import {
  getWorkspaceIdFromPath,
  getWorkspacePath,
  nextWorkspaceName,
  WORKSPACE_ROUTE,
} from "../../src/portal-workspaces/workspace-routing";
import {
  type ApplicationSessionV1,
  type NamedWorkspaceDefinitionV1,
  type NamedWorkspaceMetadataV1,
  type UserPersistenceScope,
  useWorkspace,
  type WorkspaceContextValue,
  type WorkspacePersistenceService,
  WorkspaceProvider,
  type WorkspaceSnapshotRecordV1,
} from "../../src/workspace";

const layout = (id: string): GridLayoutDocument => ({
  components: [],
  kind: "grid-layout",
  layout: {
    columns: ["1fr"],
    id,
    items: [],
    placeholderIds: [],
    rows: ["1fr"],
    stacks: [],
  },
  version: 2,
});

const definition = (
  id: string,
  name: string,
  updatedAt = "2026-01-01T00:00:00.000Z",
): NamedWorkspaceDefinitionV1 => ({
  createdAt: "2026-01-01T00:00:00.000Z",
  id,
  name,
  snapshot: { componentState: {}, layout: layout(`${id}-layout`), version: 1 },
  updatedAt,
  version: 1,
});

class MemoryService implements WorkspacePersistenceService {
  readonly definitions = new Map<string, NamedWorkspaceDefinitionV1>();
  readonly scope: UserPersistenceScope = {
    applicationId: "test",
    applicationNamespace: "finos",
    userId: "alice",
  };
  readonly snapshots = new Map<string, WorkspaceSnapshotRecordV1>();
  session: ApplicationSessionV1 | undefined;

  constructor(definitions: NamedWorkspaceDefinitionV1[] = []) {
    for (const item of definitions) {
      this.definitions.set(item.id, item);
    }
  }

  loadApplicationSession = async () => this.session;
  saveApplicationSession = async (session: ApplicationSessionV1) => {
    this.session = session;
  };
  deleteApplicationSession = async () => {
    this.session = undefined;
  };
  listWorkspaceSnapshots = async () => [...this.snapshots.values()];
  loadWorkspaceSnapshot = async (id: string) => this.snapshots.get(id);
  saveWorkspaceSnapshot = async (record: WorkspaceSnapshotRecordV1) => {
    this.snapshots.set(record.workspaceInstanceId, record);
  };
  deleteWorkspaceSnapshot = async (id: string) => {
    this.snapshots.delete(id);
  };
  listNamedWorkspaceMetadata = async (): Promise<
    readonly NamedWorkspaceMetadataV1[]
  > =>
    [...this.definitions.values()].map(
      ({ createdAt, id, name, updatedAt, version }) => ({
        createdAt,
        id,
        name,
        updatedAt,
        version,
      }),
    );
  loadNamedWorkspaceDefinition = async (id: string) => this.definitions.get(id);
  saveNamedWorkspaceDefinition = async (value: NamedWorkspaceDefinitionV1) => {
    this.definitions.set(value.id, value);
  };
  deleteNamedWorkspaceDefinition = async (id: string) => {
    this.definitions.delete(id);
  };
}

const TRADER = definition("trader", "Trader");
const ASIA = definition("asia-open", "Asia open");
const EUROPE = definition("europe-close", "Europe close");
const { renderers, settingsCodecs: codecs } = createPortalComponentRegistries({
  renderModule: (module) => <div>{module.title}</div>,
});
const BLOTTER: RemoteModuleDescriptor = {
  accessRole: "",
  clientIdentifier: "blotter",
  id: "blotter",
  mfComponent: "./Module",
  mfScope: "blotter",
  mfUrl: "http://localhost/blotter",
  name: "blotter",
  navLocation: "/Apps",
  path: "/blotter",
  title: "Blotter",
  version: 1,
  workspace: { paletteGroup: "Trading" },
};
const paletteModules = [BLOTTER];

let pathname = "";
let navigate: NavigateFunction;
let latest: WorkspaceContextValue;
const Probe = () => {
  pathname = useLocation().pathname;
  navigate = useNavigate();
  latest = useWorkspace();
  return null;
};

/** A module, outside the workspace, that shows its own context panel. */
const ModuleContextPanelButton = () => {
  const showContextPanel = useContextPanel();
  return (
    <button
      onClick={() =>
        showContextPanel(<div data-testid="module-panel" />, "Order details")
      }
      type="button"
    >
      Show module panel
    </button>
  );
};

const setInputValue = (input: HTMLInputElement, value: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  setter?.call(input, value);
  input.dispatchEvent(new Event("input", { bubbles: true }));
};

const keyDown = (target: Element, key: string) =>
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }));

const settle = () =>
  act(async () => new Promise((resolve) => setTimeout(resolve, 0)));

const q = <T extends Element = HTMLElement>(selector: string) =>
  document.querySelector<T>(selector);
const qa = <T extends Element = HTMLElement>(selector: string) =>
  Array.from(document.querySelectorAll<T>(selector));
const section = () => q(".vuuPortalNav-workspaces");
const rows = () => qa("li[data-workspace-id]");
const row = (id: string) => q(`li[data-workspace-id="${id}"]`);
const rowLink = (id: string) =>
  row(id)?.querySelector<HTMLAnchorElement>("a") ?? null;
const rowMenuButton = (id: string) =>
  row(id)?.querySelector<HTMLButtonElement>(".vuuPortalNav-rowMenu") ?? null;
const buttonByText = (text: string, scope: ParentNode = document) =>
  Array.from(scope.querySelectorAll<HTMLButtonElement>("button")).find(
    (button) => button.textContent?.trim() === text,
  );
const menuItem = (label: string) =>
  qa('[role="menuitem"]').find((el) => el.textContent?.includes(label));
const contextPanelTitle = () =>
  q(".vuuContextPanel-title")?.textContent ?? undefined;
const contextPanelExpanded = () =>
  q(".vuuContextPanel")?.classList.contains("vuuContextPanel-expanded");
const contextPanelPlacement = () => ({
  host: q("#vuu-shell-context")?.getAttribute("data-placement"),
  inline: q(".vuuContextPanel")?.classList.contains("vuuContextPanel-inline"),
});
const click = async (element: Element | null | undefined) => {
  expect(element).toBeTruthy();
  await act(async () => {
    (element as HTMLElement).click();
  });
  await settle();
};

describe("Portal workspaces", () => {
  let container: HTMLDivElement;
  let root: Root;
  let notifications: NotificationStore;
  let portalPersistence: PortalPersistenceService;
  let appState: ApplicationStateStore;

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    notifications = new NotificationStore();
    portalPersistence = createPortalPersistenceService({
      backend: new InMemoryPersistenceBackend(),
      user: "alice",
      window: null,
    });
    appState = portalPersistence.getStore("portal", 1);
    await appState.ready;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    document.body.innerHTML = "";
    portalPersistence.dispose();
    vi.restoreAllMocks();
  });

  const render = async ({
    nav = {},
    palette = false,
    paletteProps,
    path = "/",
    service = new MemoryService([ASIA]),
    systemWorkspaces = [TRADER],
  }: {
    nav?: Partial<PortalNavProps>;
    palette?: boolean;
    paletteProps?: PanelsPaletteProps;
    path?: string;
    service?: MemoryService;
    systemWorkspaces?: NamedWorkspaceDefinitionV1[];
  } = {}) => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <PortalNotificationsContext.Provider
            value={{ registerHost: () => undefined, store: notifications }}
          >
            <ApplicationStateProvider store={appState}>
              <NotificationsProvider>
                <WorkspaceProvider
                  componentRenderers={renderers}
                  persistenceService={service}
                  settingsCodecs={codecs}
                  systemWorkspaces={systemWorkspaces}
                  userId="alice"
                >
                  <PortalModuleRegistryProvider remoteModules={paletteModules}>
                    <ShellContextPanelProvider>
                      <CloseContextPanelOnNavigation />
                      <PortalNav remoteModules={[]} {...nav} />
                      <Routes>
                        <Route
                          element={
                            <PortalWorkspace
                              headerActions={
                                palette ? (
                                  <AddPanelButton />
                                ) : (
                                  <button type="button">Add panel</button>
                                )
                              }
                              paletteProps={paletteProps}
                            />
                          }
                          path={WORKSPACE_ROUTE}
                        />
                        <Route element={<div data-testid="home" />} path="*" />
                      </Routes>
                      <ModuleContextPanelButton />
                      <ShellContextPanel />
                      <Probe />
                    </ShellContextPanelProvider>
                  </PortalModuleRegistryProvider>
                </WorkspaceProvider>
              </NotificationsProvider>
            </ApplicationStateProvider>
          </PortalNotificationsContext.Provider>
        </MemoryRouter>,
      ),
    );
    await vi.waitFor(() => expect(latest.status).not.toBe("loading"));
    await settle();
    return service;
  };

  describe("routing helpers", () => {
    it("builds and parses workspace paths", () => {
      expect(getWorkspacePath("a b")).toBe("/workspaces/a%20b");
      expect(getWorkspaceIdFromPath("/workspaces/a%20b")).toBe("a b");
      expect(getWorkspaceIdFromPath("/Trading/Orders")).toBeUndefined();
      // A sub-path keeps the workspace, rather than matching nothing.
      expect(getWorkspaceIdFromPath("/workspaces/ws-1/admin/users")).toBe(
        "ws-1",
      );
    });

    it("names new workspaces uniquely", () => {
      expect(nextWorkspaceName([])).toBe("Untitled workspace");
      expect(
        nextWorkspaceName(["Untitled workspace", "Untitled workspace 2"]),
      ).toBe("Untitled workspace 3");
    });

    it("formats the edited time", () => {
      const now = Date.parse("2026-01-01T00:10:00.000Z");
      expect(formatEdited("2026-01-01T00:08:00.000Z", now)).toBe(
        "edited 2 min ago",
      );
      expect(formatEdited("2026-01-01T00:09:59.000Z", now)).toBe(
        "edited just now",
      );
      expect(formatEdited(undefined, now)).toBe("edited");
    });
  });

  describe("nav section", () => {
    it("lists system and named workspaces, then + New workspace", async () => {
      await render();
      expect(section()).not.toBeNull();
      expect(rows().map((el) => el.dataset.workspaceId)).toEqual([
        "trader",
        "asia-open",
      ]);
      expect(row("trader")?.dataset.workspaceKind).toBe("system");
      expect(
        row("trader")?.querySelector('[data-workspace-tag="default"]'),
      ).not.toBeNull();
      expect(row("asia-open")?.dataset.workspaceKind).toBe("named");
      expect(q(".vuuPortalNav-sectionCount")?.textContent).toBe("2");
      const items = section()?.querySelectorAll("ul > li");
      expect(items?.[items.length - 1]?.textContent).toBe("New workspace");
      expect(rowLink("asia-open")?.getAttribute("href")).toBe(
        "/workspaces/asia-open",
      );
    });

    it("is hidden when workspaces is false", async () => {
      await render({ nav: { workspaces: false } });
      expect(section()).toBeNull();
    });

    it("tags a system workspace with a personal copy", async () => {
      await render({
        service: new MemoryService([ASIA, definition("trader", "Trader")]),
      });
      const tag = row("trader")?.querySelector(
        '[data-workspace-tag="personal-copy"]',
      );
      expect(tag?.textContent).toBe("Your copy");
      expect(tag?.getAttribute("title")).toBe("Your copy · edited");
    });

    it("highlights the workspace in the URL", async () => {
      await render({ path: "/workspaces/asia-open" });
      expect(rowLink("asia-open")?.getAttribute("aria-current")).toBe("page");
      expect(rowLink("asia-open")?.className).toContain(
        "vuuPortalNav-link-active",
      );
      expect(rowLink("trader")?.getAttribute("aria-current")).toBeNull();
    });

    it("rows are not drop targets", async () => {
      await render();
      for (const target of rows()) {
        const event = new Event("dragover", {
          bubbles: true,
          cancelable: true,
        });
        target.querySelector("a")?.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(false);
      }
    });

    it.each([
      "icons-and-text",
      "text",
      "icons",
    ] as const)("works in %s mode", async (displayMode) => {
      await render({ nav: { displayMode } });
      expect(rows()).toHaveLength(2);
      expect(q(".vuuPortalNav-newWorkspace")).not.toBeNull();
      const heading = section()?.querySelector(".vuuPortalNav-sectionHeading");
      if (displayMode === "icons") {
        expect(heading).toBeNull();
        expect(q(".vuuPortalNav-rowMenu")).toBeNull();
        expect(section()?.querySelector("ul")?.getAttribute("aria-label")).toBe(
          "Workspaces",
        );
        expect(row("trader")?.querySelector("svg")).not.toBeNull();
      } else {
        expect(heading).not.toBeNull();
        expect(rowMenuButton("asia-open")).not.toBeNull();
      }
      if (displayMode === "text") {
        expect(row("trader")?.querySelector(".vuuPortalNav-icon")).toBeNull();
      }
    });

    it("works in minimized mode, in the overlay", async () => {
      await render({ nav: { displayMode: "minimized" } });
      await click(q(".vuuPortalNav-handle"));
      expect(q(".vuuPortalNav-overlayOpen")).not.toBeNull();
      expect(rows()).toHaveLength(2);
      await click(rowLink("asia-open"));
      expect(pathname).toBe("/workspaces/asia-open");
    });

    it("collapses with collapsible sections", async () => {
      await render({ nav: { sections: "collapsible" } });
      const toggle = section()?.querySelector<HTMLButtonElement>(
        ".vuuPortalNav-sectionToggle",
      );
      await click(toggle);
      expect(toggle?.getAttribute("aria-expanded")).toBe("false");
      expect(section()?.querySelector("ul")?.hidden).toBe(true);
    });
  });

  describe("route", () => {
    it("makes the workspace in the URL active and renders it", async () => {
      await render({ path: "/workspaces/trader" });
      await vi.waitFor(() => expect(latest.activeWorkspaceId).toBe("trader"));
      await settle();
      expect(q(".vuuPortalWorkspaceHeader-title")?.textContent).toBe("Trader");
      expect(
        q('.vuuPortalWorkspaceHeader [data-workspace-tag="default"]')
          ?.textContent,
      ).toBe("Default");
      expect(q(".vuuPortalWorkspace-body .vuuGridLayout")).not.toBeNull();
      expect(buttonByText("Add panel")).toBeTruthy();
      expect(buttonByText("Reset to default")).toBeUndefined();
    });

    it("follows the URL", async () => {
      await render({ path: "/workspaces/trader" });
      await vi.waitFor(() => expect(latest.activeWorkspaceId).toBe("trader"));
      await click(rowLink("asia-open"));
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      expect(pathname).toBe("/workspaces/asia-open");
      expect(q(".vuuPortalWorkspaceHeader-title")?.textContent).toBe(
        "Asia open",
      );
      await act(async () => navigate("/workspaces/trader"));
      await vi.waitFor(() => expect(latest.activeWorkspaceId).toBe("trader"));
      expect(
        latest.controllers.filter(
          ({ definitionId }) => definitionId === "trader",
        ),
      ).toHaveLength(1);
    });

    it("shows not found for an unknown id", async () => {
      await render({ path: "/workspaces/nope" });
      const state = q('[data-workspace-state="not-found"]');
      expect(state?.textContent).toContain("Workspace not found");
      expect(latest.activeWorkspaceId).toBeNull();
      await click(buttonByText("Open Trader", state ?? document));
      expect(pathname).toBe("/workspaces/trader");
    });
  });

  describe("panels palette", () => {
    it("a new workspace shows a drop zone and opens the palette", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      expect(q(".vuuPanelsPalette")).toBeNull();
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "false",
      );

      await click(q(".vuuPortalNav-newWorkspace button"));
      await vi.waitFor(() =>
        expect(pathname).not.toBe("/workspaces/asia-open"),
      );
      await vi.waitFor(() => expect(q(".vuuPanelsPalette")).not.toBeNull());
      expect(
        q(".vuuPortalWorkspace-body .vuuWorkspaceDropZone")?.textContent,
      ).toContain("This workspace is empty");
      expect(q(".vuuPortalWorkspace-body .vuuWorkspaceStartPanel")).toBeNull();
      // The palette doesn't take focus from the new workspace's name.
      await settle();
      expect(document.activeElement).toBe(
        q(".vuuPortalWorkspaceHeader-nameInput"),
      );
    });

    it("the palette offers Modules and Recent, not Tables, by default", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      expect(
        qa(".vuuPanelsPalette [role='tab']").map(
          (element) => element.textContent,
        ),
      ).toEqual(["Modules", "Recent"]);
    });

    it("passes paletteProps to the palette, e.g. to offer Tables", async () => {
      await render({
        palette: true,
        paletteProps: { tabs: ["modules", "tables", "recent"] },
        path: "/workspaces/asia-open",
      });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      expect(
        qa(".vuuPanelsPalette [role='tab']").map(
          (element) => element.textContent,
        ),
      ).toEqual(["Modules", "Tables", "Recent"]);
    });

    it("Add panel toggles the palette", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      expect(contextPanelTitle()).toBe("Panels");
      expect(
        q(".vuuContextPanel-content aside[aria-label='Panels']"),
      ).not.toBeNull();
      // The context panel's chrome replaces the palette's own header.
      expect(q(".vuuPanelsPalette-title")).toBeNull();
      expect(
        q(".vuuPanelsPalette-search button[aria-label='Pin panels open']"),
      ).not.toBeNull();
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "true",
      );
      await click(buttonByText("Add panel"));
      expect(q(".vuuPanelsPalette")).toBeNull();
      expect(contextPanelExpanded()).toBe(false);
    });

    it("the context panel's close button and Escape close the palette", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      await click(q("button[aria-label='Close context panel']"));
      expect(q(".vuuPanelsPalette")).toBeNull();
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "false",
      );

      await click(buttonByText("Add panel"));
      await act(async () =>
        keyDown(
          q("input[aria-label='Search panels']") as HTMLElement,
          "Escape",
        ),
      );
      expect(q(".vuuPanelsPalette")).toBeNull();
      expect(contextPanelExpanded()).toBe(false);
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "false",
      );
    });

    it("shares the context panel with modules", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      await click(q(".vuuPanelsPalette-search button[aria-pressed]"));
      expect(appState.get("workspace/palettePinned")).toBe(true);
      expect(contextPanelPlacement()).toEqual({ host: "inline", inline: true });

      // A module's panel replaces the palette, which stays pinned. The
      // module's panel overlays the content, the default.
      await click(buttonByText("Show module panel"));
      expect(contextPanelTitle()).toBe("Order details");
      expect(contextPanelPlacement()).toEqual({
        host: "overlay",
        inline: false,
      });
      expect(q("[data-testid='module-panel']")).not.toBeNull();
      expect(q(".vuuPanelsPalette")).toBeNull();
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "false",
      );
      expect(appState.get("workspace/palettePinned")).toBe(true);

      // And the palette replaces the module's panel.
      await click(buttonByText("Add panel"));
      expect(contextPanelTitle()).toBe("Panels");
      expect(q("[data-testid='module-panel']")).toBeNull();
      expect(q(".vuuContextPanel-content .vuuPanelsPalette")).not.toBeNull();
      expect(contextPanelPlacement()).toEqual({ host: "inline", inline: true });
    });

    it("displays the palette inline, beside the workspace", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      expect(contextPanelPlacement()).toEqual({
        host: "overlay",
        inline: false,
      });
      await click(buttonByText("Add panel"));
      expect(contextPanelExpanded()).toBe(true);
      expect(contextPanelPlacement()).toEqual({ host: "inline", inline: true });
      // The workspace is not within the panel's column.
      const workspace = q(".vuuPortalWorkspace");
      expect(workspace).not.toBeNull();
      expect(q("#vuu-shell-context")?.contains(workspace)).toBe(false);

      // No scrim: clicking the workspace leaves the palette open.
      await act(async () => {
        workspace?.dispatchEvent(
          new PointerEvent("pointerdown", { bubbles: true }),
        );
      });
      await click(workspace);
      expect(contextPanelExpanded()).toBe(true);
      expect(q(".vuuContextPanel-scrim, .saltScrim")).toBeNull();

      // Closing keeps the inline placement, so it slides closed in place.
      await click(buttonByText("Add panel"));
      expect(contextPanelExpanded()).toBe(false);
      expect(contextPanelPlacement()).toEqual({ host: "inline", inline: true });
    });

    it("stays open between workspaces and closes on other routes", async () => {
      await render({
        palette: true,
        path: "/workspaces/asia-open",
        service: new MemoryService([ASIA, EUROPE]),
      });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      await act(async () => navigate("/workspaces/europe-close"));
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("europe-close"),
      );
      await settle();
      expect(contextPanelTitle()).toBe("Panels");
      expect(q(".vuuContextPanel-content .vuuPanelsPalette")).not.toBeNull();
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "true",
      );

      await act(async () => navigate("/Apps/blotter"));
      await settle();
      expect(q("[data-testid='home']")).not.toBeNull();
      expect(q(".vuuPanelsPalette")).toBeNull();
      expect(contextPanelExpanded()).toBe(false);

      // Unpinned, it stays closed on returning to a workspace.
      await act(async () => navigate("/workspaces/asia-open"));
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await settle();
      expect(q(".vuuPanelsPalette")).toBeNull();
    });

    it("a pinned palette reopens on returning to a workspace", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      await click(q(".vuuPanelsPalette-search button[aria-pressed]"));
      await act(async () => navigate("/Apps/blotter"));
      await settle();
      expect(contextPanelExpanded()).toBe(false);
      await act(async () => navigate("/workspaces/asia-open"));
      await vi.waitFor(() =>
        expect(q(".vuuContextPanel-content .vuuPanelsPalette")).not.toBeNull(),
      );
      expect(contextPanelTitle()).toBe("Panels");
    });

    it("drags rows from the context panel into the workspace", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(q(".vuuPortalNav-newWorkspace button"));
      await vi.waitFor(() =>
        expect(q(".vuuContextPanel-content .vuuPanelsPalette")).not.toBeNull(),
      );
      const source = qa(".vuuPanelsPalette-row").find((row) =>
        row.textContent?.includes("Blotter"),
      ) as HTMLElement;
      const dataTransfer = {
        effectAllowed: "uninitialized",
        setData: () => undefined,
      };
      const drag = (type: string) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperties(event, {
          clientX: { value: 50 },
          clientY: { value: 50 },
          dataTransfer: { value: dataTransfer },
        });
        act(() => source.dispatchEvent(event));
      };
      drag("dragstart");
      expect(q(".vuuTemplateDragHint")?.textContent).toContain(
        "Drop on a panel edge to split, centre to tab",
      );
      expect(q(".vuuWorkspaceDropZone")?.dataset.dragActive).toBe("true");
      drag("dragend");
      expect(q(".vuuTemplateDragHint")).toBeNull();
    });

    it("a module's panel still closes on navigation between workspaces", async () => {
      await render({
        palette: true,
        path: "/workspaces/asia-open",
        service: new MemoryService([ASIA, EUROPE]),
      });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Show module panel"));
      expect(contextPanelTitle()).toBe("Order details");
      await act(async () => navigate("/workspaces/europe-close"));
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("europe-close"),
      );
      await settle();
      expect(q("[data-testid='module-panel']")).toBeNull();
      expect(contextPanelExpanded()).toBe(false);
    });

    it("adds panels with a header", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(q(".vuuPortalNav-newWorkspace button"));
      await vi.waitFor(() => expect(q(".vuuPanelsPalette")).not.toBeNull());
      await click(
        qa(".vuuPanelsPalette-row").find((row) =>
          row.textContent?.includes("Blotter"),
        ),
      );
      await vi.waitFor(() =>
        expect(q(".vuuPortalWorkspace-body .vuuGridLayoutItem")).not.toBeNull(),
      );
      expect(
        q(".vuuPortalWorkspace-body .vuuGridLayoutItemHeader-title")
          ?.textContent,
      ).toContain("Blotter");
    });
  });

  describe("new, rename and delete", () => {
    it("+ New workspace creates, opens and navigates to an empty workspace", async () => {
      const service = await render({ path: "/workspaces/trader" });
      await click(q(".vuuPortalNav-newWorkspace button"));
      await vi.waitFor(() => expect(pathname).not.toBe("/workspaces/trader"));
      const id = getWorkspaceIdFromPath(pathname) ?? "";
      expect(id).not.toBe("");
      await vi.waitFor(() => expect(latest.activeWorkspaceId).toBe(id));
      expect(service.definitions.get(id)?.name).toBe("Untitled workspace");
      expect(
        latest.controllers.find(({ definitionId }) => definitionId === id)
          ?.snapshot.layout.components,
      ).toEqual([]);
      expect(rowLink(id)?.getAttribute("aria-current")).toBe("page");

      // The name is in edit mode; Enter commits a new name.
      const input = q<HTMLInputElement>(".vuuPortalWorkspaceHeader-nameInput");
      expect(input).not.toBeNull();
      expect(document.activeElement).toBe(input);
      await act(async () => setInputValue(input as HTMLInputElement, "Close"));
      await act(async () => keyDown(input as HTMLInputElement, "Enter"));
      await vi.waitFor(() =>
        expect(service.definitions.get(id)?.name).toBe("Close"),
      );
      await vi.waitFor(() =>
        expect(q(".vuuPortalWorkspaceHeader-title")?.textContent).toBe("Close"),
      );
    });

    it("Escape keeps the default name, and names are unique", async () => {
      const service = await render();
      await click(q(".vuuPortalNav-newWorkspace button"));
      await vi.waitFor(() => expect(pathname).toMatch(/^\/workspaces\//));
      const input = q<HTMLInputElement>(".vuuPortalWorkspaceHeader-nameInput");
      await act(async () => keyDown(input as HTMLInputElement, "Escape"));
      expect(q(".vuuPortalWorkspaceHeader-nameInput")).toBeNull();
      // The + in the heading does the same.
      await click(q(".vuuPortalNav-sectionAction"));
      await vi.waitFor(() =>
        expect(
          [...service.definitions.values()].map(({ name }) => name).sort(),
        ).toEqual(["Asia open", "Untitled workspace", "Untitled workspace 2"]),
      );
    });

    it("renames a named workspace from the row menu", async () => {
      const service = await render();
      await click(rowMenuButton("asia-open"));
      await vi.waitFor(() => expect(menuItem("Rename")).toBeTruthy());
      await click(menuItem("Rename"));
      const input = row("asia-open")?.querySelector<HTMLInputElement>("input");
      expect(input?.value).toBe("Asia open");
      await act(async () =>
        setInputValue(input as HTMLInputElement, "Asia session"),
      );
      await act(async () => keyDown(input as HTMLInputElement, "Enter"));
      await vi.waitFor(() =>
        expect(service.definitions.get("asia-open")?.name).toBe("Asia session"),
      );
      await vi.waitFor(() =>
        expect(rowLink("asia-open")?.textContent).toContain("Asia session"),
      );
    });

    it("has no row menu for system workspaces", async () => {
      await render();
      expect(rowMenuButton("trader")).toBeNull();
    });

    it("deletes a named workspace after confirmation", async () => {
      const service = await render({ path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      const dialog = () => q('[role="dialog"]');
      const openDelete = async () => {
        await click(rowMenuButton("asia-open"));
        await vi.waitFor(() => expect(menuItem("Delete")).toBeTruthy());
        await click(menuItem("Delete"));
        await vi.waitFor(() => expect(dialog()).not.toBeNull());
      };

      await openDelete();
      expect(dialog()?.textContent).toContain("Delete “Asia open”?");
      await click(buttonByText("Cancel", dialog() ?? document));
      await vi.waitFor(() => expect(dialog()).toBeNull());
      expect(service.definitions.has("asia-open")).toBe(true);

      await openDelete();
      await click(buttonByText("Delete", dialog() ?? document));
      await vi.waitFor(() =>
        expect(service.definitions.has("asia-open")).toBe(false),
      );
      await vi.waitFor(() => expect(row("asia-open")).toBeNull());
      // The deleted workspace was open: go to another one.
      expect(pathname).toBe("/workspaces/trader");
    });
  });

  describe("personal copy", () => {
    const withPanels = (): NamedWorkspaceDefinitionV1 => {
      const base = definition("overview", "Overview");
      return {
        ...base,
        snapshot: {
          ...base.snapshot,
          layout: {
            ...base.snapshot.layout,
            components: ["a", "b"].map((id) => ({
              id,
              settings: { moduleId: "blotter" },
              type: "portal-module",
              version: 1,
            })),
            layout: {
              ...base.snapshot.layout.layout,
              columns: ["1fr", "1fr", "1fr"],
              items: [
                ...["a", "b"].map((id, index) => ({
                  column: { span: 1, start: index + 1 },
                  componentInstanceId: id,
                  id,
                  row: { span: 1, start: 1 },
                })),
                {
                  column: { span: 1, start: 3 },
                  id: "placeholder",
                  row: { span: 1, start: 1 },
                },
              ],
              placeholderIds: ["placeholder"],
            },
          },
        },
      };
    };

    it("keeps panels mounted when the first edit creates it", async () => {
      const service = new MemoryService([ASIA]);
      await render({
        palette: true,
        path: "/workspaces/overview",
        service,
        systemWorkspaces: [withPanels()],
      });
      await vi.waitFor(() => expect(latest.activeWorkspaceId).toBe("overview"));
      await settle();
      const panels = qa(".vuuPortalWorkspace-body .vuuGridLayoutItemContent");
      expect(panels).toHaveLength(2);
      const contents = panels.map((panel) => panel.firstElementChild);
      expect(latest.workspaces[0]).toMatchObject({ isPersonalCopy: false });

      await click(buttonByText("Add panel"));
      await vi.waitFor(() => expect(q(".vuuPanelsPalette")).not.toBeNull());
      await click(q('.vuuPanelsPalette button[aria-label="Add Blotter"]'));
      await vi.waitFor(() =>
        expect(service.definitions.has("overview")).toBe(true),
      );
      await vi.waitFor(() =>
        expect(
          q('.vuuPortalWorkspaceHeader [data-workspace-tag="personal-copy"]'),
        ).not.toBeNull(),
      );
      await settle();
      const after = qa(".vuuPortalWorkspace-body .vuuGridLayoutItemContent");
      expect(after).toHaveLength(3);
      // The same elements, in the same DOM order: nothing was remounted or
      // moved (moving a node resets the scroll position of its content).
      expect(after.slice(0, 2)).toEqual(panels);
      expect(
        panels.every(
          (panel, i) =>
            panel.isConnected && panel.firstElementChild === contents[i],
        ),
      ).toBe(true);
    });
  });

  describe("reset to default", () => {
    const withPersonalCopy = () =>
      new MemoryService([
        ASIA,
        definition("trader", "Trader", new Date().toISOString()),
      ]);

    const openReset = async () => {
      await vi.waitFor(() => expect(latest.activeWorkspaceId).toBe("trader"));
      await settle();
      const status = q(
        '.vuuPortalWorkspaceHeader [data-workspace-tag="personal-copy"]',
      );
      expect(status?.textContent).toContain("Your copy");
      expect(status?.textContent).toContain("edited");
      await click(buttonByText("Reset to default"));
      await vi.waitFor(() =>
        expect(q(".vuuPortalWorkspaceReset")).not.toBeNull(),
      );
      return q(".vuuPortalWorkspaceReset") as HTMLElement;
    };

    it("shows Reset to default only for a modified personal copy", async () => {
      await render({ path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      expect(buttonByText("Reset to default")).toBeUndefined();
    });

    it("Cancel keeps the personal copy", async () => {
      const service = await render({
        path: "/workspaces/trader",
        service: withPersonalCopy(),
      });
      const popover = await openReset();
      expect(popover.textContent).toContain("Reset Trader to default?");
      expect(
        ["Save as new…", "Cancel", "Reset"].map((label) =>
          Boolean(buttonByText(label, popover)),
        ),
      ).toEqual([true, true, true]);
      await click(buttonByText("Cancel", popover));
      await vi.waitFor(() => expect(q(".vuuPortalWorkspaceReset")).toBeNull());
      expect(service.definitions.has("trader")).toBe(true);
    });

    it("Reset discards the personal copy", async () => {
      const service = await render({
        path: "/workspaces/trader",
        service: withPersonalCopy(),
      });
      const popover = await openReset();
      await click(buttonByText("Reset", popover));
      await vi.waitFor(() =>
        expect(service.definitions.has("trader")).toBe(false),
      );
      await vi.waitFor(() =>
        expect(buttonByText("Reset to default")).toBeUndefined(),
      );
      expect(
        row("trader")?.querySelector('[data-workspace-tag="default"]'),
      ).not.toBeNull();
      expect(pathname).toBe("/workspaces/trader");
    });

    it("Save as new… saves the copy as a named workspace, then resets", async () => {
      const service = await render({
        path: "/workspaces/trader",
        service: withPersonalCopy(),
      });
      const popover = await openReset();
      await click(buttonByText("Save as new…", popover));
      const input = popover.querySelector<HTMLInputElement>("input");
      expect(input?.value).toBe("Trader copy");
      await act(async () =>
        setInputValue(input as HTMLInputElement, "My trader"),
      );
      await click(buttonByText("Save and reset", popover));
      await vi.waitFor(() =>
        expect(service.definitions.has("trader")).toBe(false),
      );
      const saved = [...service.definitions.values()].find(
        ({ name }) => name === "My trader",
      );
      expect(saved).toBeDefined();
      await vi.waitFor(() =>
        expect(pathname).toBe(getWorkspacePath(saved?.id ?? "")),
      );
      expect(row(saved?.id ?? "")?.dataset.workspaceKind).toBe("named");
    });
  });
});
