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
import { AddPanelButton, PanelsPalette } from "../../src/panels-palette";
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
    path = "/",
    service = new MemoryService([ASIA]),
  }: {
    nav?: Partial<PortalNavProps>;
    palette?: boolean;
    path?: string;
    service?: MemoryService;
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
                  systemWorkspaces={[TRADER]}
                  userId="alice"
                >
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
                          sidePanel={
                            palette ? (
                              <PortalModuleRegistryProvider
                                remoteModules={paletteModules}
                              >
                                <PanelsPalette />
                              </PortalModuleRegistryProvider>
                            ) : undefined
                          }
                        />
                      }
                      path={WORKSPACE_ROUTE}
                    />
                    <Route element={<div data-testid="home" />} path="*" />
                  </Routes>
                  <Probe />
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
    });

    it("Add panel toggles the palette", async () => {
      await render({ palette: true, path: "/workspaces/asia-open" });
      await vi.waitFor(() =>
        expect(latest.activeWorkspaceId).toBe("asia-open"),
      );
      await click(buttonByText("Add panel"));
      expect(
        q(".vuuPortalWorkspace-body aside[aria-label='Panels']"),
      ).not.toBeNull();
      expect(buttonByText("Add panel")?.getAttribute("aria-pressed")).toBe(
        "true",
      );
      await click(buttonByText("Add panel"));
      expect(q(".vuuPanelsPalette")).toBeNull();
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
