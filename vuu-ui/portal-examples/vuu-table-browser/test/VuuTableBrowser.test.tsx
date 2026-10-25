import {
  AuthenticationProvider,
  DataProvider,
  LocalServerMonitor,
  type LocalVuuServer,
  ModuleServerMap,
  WorkspaceProvider,
} from "@vuu-ui/core";
import {
  ApplicationStateProvider,
  type ApplicationStateStore,
  createPortalComponentRegistries,
  createPortalPersistenceService,
  InMemoryPersistenceBackend,
  MemoryWorkspacePersistenceService,
  PANELS_PALETTE_PINNED_KEY,
  type PortalPersistenceService,
  VuuServerMonitorProvider,
} from "@vuu-ui/core/portal";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VuuTableBrowser, {
  browserBasePath,
  getDefaultWorkspaceName,
  getOpenTables,
} from "../src/VuuTableBrowser";

const tables: VuuTable[] = [
  { module: "SIMUL", table: "prices" },
  { module: "SIMUL", table: "instruments" },
  { module: "BASKET", table: "basket" },
];

const getTableList = vi.fn(async () => ({ tables }));
// Never resolves: table panels stay loading, the tests are about the layout.
const getTableSchema = vi.fn(
  (_table: VuuTable) => new Promise<never>(() => undefined),
);

type DataProviderProps = Parameters<typeof DataProvider>[0];

const LocalDataProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider
    getServerAPI={
      (async () => ({
        getTableList,
        getTableSchema,
      })) as unknown as DataProviderProps["getServerAPI"]
    }
    VuuDataSource={undefined as unknown as DataProviderProps["VuuDataSource"]}
  >
    {children}
  </DataProvider>
);

const localServers: LocalVuuServer[] = [
  { connectionId: "simul", DataSourceProvider: LocalDataProvider },
  { connectionId: "basket", DataSourceProvider: LocalDataProvider },
];

const { renderers, settingsCodecs } = createPortalComponentRegistries();

class TestDataTransfer {
  effectAllowed = "uninitialized";
  readonly values = new Map<string, string>();
  setData(type: string, value: string) {
    this.values.set(type, value);
  }
}

const dispatchDrag = (
  element: Element,
  type: string,
  dataTransfer: TestDataTransfer,
  point = { clientX: 50, clientY: 90 },
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: point.clientX },
    clientY: { value: point.clientY },
    dataTransfer: { value: dataTransfer },
  });
  act(() => element.dispatchEvent(event));
};

const setRect = (element: Element) => {
  element.getBoundingClientRect = () =>
    ({
      bottom: 100,
      height: 100,
      left: 0,
      right: 100,
      top: 0,
      width: 100,
      x: 0,
      y: 0,
    }) as DOMRect;
};

let location = "";
const LocationSpy = () => {
  location = useLocation().pathname;
  return null;
};

describe("VuuTableBrowser", () => {
  let container: HTMLDivElement;
  let root: Root;
  let persistence: PortalPersistenceService;
  let appState: ApplicationStateStore;
  let workspaceService: MemoryWorkspacePersistenceService;

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
      setTimeout(() => callback(0), 0),
    );
    vi.stubGlobal("cancelAnimationFrame", (id: number) => clearTimeout(id));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}")),
    );
    persistence = createPortalPersistenceService({
      backend: new InMemoryPersistenceBackend(),
      user: "alice",
      window: null,
    });
    appState = persistence.getStore("portal", 1);
    await appState.ready;
    workspaceService = new MemoryWorkspacePersistenceService();
    getTableList.mockClear();
    getTableSchema.mockClear();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const render = async ({
    monitor,
    path = "/tables/browse/simul",
    workspaces = true,
  }: {
    monitor?: LocalServerMonitor;
    path?: string;
    workspaces?: boolean;
  } = {}) => {
    const browser = (
      <Routes>
        <Route element={<VuuTableBrowser />} path="/tables/browse/*" />
        <Route
          element={<div data-route="workspace" />}
          path="/workspaces/:id"
        />
      </Routes>
    );
    const routes = monitor ? (
      <VuuServerMonitorProvider monitor={monitor}>
        {browser}
      </VuuServerMonitorProvider>
    ) : (
      browser
    );
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <LocationSpy />
          <ApplicationStateProvider store={appState}>
            <AuthenticationProvider localServers={localServers} mode="local">
              {workspaces ? (
                <WorkspaceProvider
                  componentRenderers={renderers}
                  persistenceService={workspaceService}
                  settingsCodecs={settingsCodecs}
                  userId="alice"
                >
                  {routes}
                </WorkspaceProvider>
              ) : (
                routes
              )}
            </AuthenticationProvider>
          </ApplicationStateProvider>
        </MemoryRouter>,
      ),
    );
  };

  const query = <T extends Element = HTMLElement>(selector: string) =>
    container.querySelector<T>(selector);

  const queryAll = (selector: string) => [
    ...container.querySelectorAll<HTMLElement>(selector),
  ];

  const rowLabels = () =>
    queryAll(".vuuPanelsPalette-row .vuuPanelsPalette-label").map(
      (element) => element.textContent,
    );

  const row = (label: string) => {
    const element = queryAll(".vuuPanelsPalette-row").find(
      (candidate) =>
        candidate.querySelector(".vuuPanelsPalette-label")?.textContent ===
        label,
    );
    if (!element) {
      throw Error(`no palette row ${label}`);
    }
    return element;
  };

  const button = (name: string, scope: ParentNode = container) => {
    const element = [...scope.querySelectorAll<HTMLElement>("button")].find(
      (candidate) =>
        candidate.getAttribute("aria-label") === name ||
        candidate.textContent?.trim() === name,
    );
    if (!element) {
      throw Error(`no button ${name}`);
    }
    return element;
  };

  const click = async (element: Element) => {
    await act(async () => {
      element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
  };

  const key = async (element: Element, keyName: string) => {
    await act(async () => {
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: keyName,
        }),
      );
    });
  };

  const prompt = () =>
    document.body.querySelector<HTMLElement>(".vuuOpenPanelPrompt");

  /** The tables requested by open panels, most recent last. */
  const openedTables = () => [
    ...new Set(getTableSchema.mock.calls.map(([{ table }]) => table)),
  ];

  const tablePanelCount = () => queryAll(".vuuTableComponent").length;

  const waitForTables = () =>
    vi.waitFor(() => expect(rowLabels()).toHaveLength(3));

  const savePopover = () => {
    const form = document.body.querySelector<HTMLElement>(
      "[aria-label='Save as workspace'] form",
    );
    if (!form) {
      throw Error("no save popover");
    }
    return form;
  };

  it("keeps the browser's base path when a server is selected", () => {
    expect(browserBasePath("/tables/browse/simul", "simul")).toBe(
      "/tables/browse",
    );
    expect(browserBasePath("/tables/browse", "")).toBe("/tables/browse");
  });

  it("lists the servers on the landing page", async () => {
    await render({ path: "/tables/browse" });
    const links = queryAll("ul[aria-label='Vuu servers'] a");
    expect(links.map((link) => link.textContent)).toEqual(["simul", "basket"]);
    expect(links[0].getAttribute("href")).toBe("/tables/browse/simul");
  });

  describe("Browse page", () => {
    it("opens with the Tables palette pinned, on the selected server", async () => {
      await render();
      expect(query("h1")?.textContent).toBe("simul");
      expect(query(".vuuPortalWorkspaceHeader-crumb")?.textContent).toBe(
        "Tables / Browse /",
      );
      expect(query("aside[aria-label='Panels']")).not.toBeNull();
      // Tables is the only tab, so there is no tab strip.
      expect(query("aside[aria-label='Panels'] [role='tablist']")).toBeNull();
      expect(
        query("aside[aria-label='Panels'] [role='listbox']")?.getAttribute(
          "aria-label",
        ),
      ).toBe("Tables");
      expect(
        query<HTMLSelectElement>(".vuuPanelsPalette-server select")?.value,
      ).toBe("simul");
      await waitForTables();
      expect(
        queryAll(".vuuPanelsPalette-groupHeader").map((e) => e.textContent),
      ).toEqual(["SIMUL", "BASKET"]);
      expect(rowLabels()).toEqual(["instruments", "prices", "basket"]);
      expect(queryAll(".vuuPanelsPalette-subtitle")).toHaveLength(0);
      expect(query(".vuuWorkspaceDropZone h4")?.textContent).toBe(
        "Pick a table",
      );
      expect(query(".vuuPortalWorkspaceHeader-status")?.textContent).toBe("");
    });

    it("preselects the server of the route, not the user's saved choice", async () => {
      await render({ path: "/tables/browse/basket" });
      expect(
        query<HTMLSelectElement>(".vuuPanelsPalette-server select")?.value,
      ).toBe("basket");
      expect(query("[data-server-id]")?.dataset.serverId).toBe("basket");
    });

    it("is pinned, without saving that as the user's choice", async () => {
      await render();
      await waitForTables();
      // Pinned: adding a table leaves the palette open.
      await click(button("Add instruments"));
      expect(query("aside[aria-label='Panels']")).not.toBeNull();
      await click(button("Unpin panels"));
      await click(button("Pin panels open"));
      expect(button("Unpin panels")).toBeDefined();
      expect(appState.get(PANELS_PALETTE_PINNED_KEY)).toBeUndefined();
    });
  });

  describe("opening tables", () => {
    it("click adds a table to the empty page, then replaces the only table", async () => {
      await render();
      await waitForTables();
      await click(row("instruments"));
      expect(prompt()).toBeNull();
      expect(tablePanelCount()).toBe(1);
      await vi.waitFor(() => expect(openedTables()).toEqual(["instruments"]));
      expect(query(".vuuPortalWorkspaceHeader-status")?.textContent).toBe(
        "Unsaved layout",
      );

      await click(row("prices"));
      expect(prompt()).toBeNull();
      expect(tablePanelCount()).toBe(1);
      await vi.waitFor(() =>
        expect(openedTables()).toEqual(["instruments", "prices"]),
      );
    });

    it("+ adds a table beside the others", async () => {
      await render();
      await waitForTables();
      await click(button("Add instruments"));
      await click(button("Add prices"));
      expect(prompt()).toBeNull();
      expect(tablePanelCount()).toBe(2);
    });

    it("with several tables, asks: R replaces the focused table, T opens a tab, Esc cancels", async () => {
      await render();
      await waitForTables();
      await click(button("Add instruments"));
      await click(button("Add prices"));
      expect(tablePanelCount()).toBe(2);

      await click(row("basket"));
      expect(prompt()?.textContent).toContain("Replace");
      expect(prompt()?.textContent).toContain("Open as new tab");
      await key(prompt() as Element, "Escape");
      expect(prompt()).toBeNull();
      expect(tablePanelCount()).toBe(2);

      await click(row("basket"));
      await key(prompt() as Element, "r");
      expect(prompt()).toBeNull();
      expect(tablePanelCount()).toBe(2);
      await vi.waitFor(() => expect(openedTables()).toContain("basket"));

      await click(row("instruments"));
      await key(prompt() as Element, "t");
      expect(prompt()).toBeNull();
      await vi.waitFor(() =>
        expect(query(".vuuPortalWorkspaceHeader-status")?.textContent).toBe(
          "Unsaved layout",
        ),
      );
      // Stacked with the focused table.
      expect(
        queryAll(".saltTabTrigger")
          .map((tab) => tab.textContent)
          .sort(),
      ).toEqual(["basket", "instruments"]);
    });

    it("dragging a table into the content area places it, without a prompt", async () => {
      await render();
      await waitForTables();
      await click(row("instruments"));
      const target = query(".vuuGridLayoutItem .vuuGridLayoutItemContent");
      const source = row("prices");
      if (!target) {
        throw Error("no panel");
      }
      setRect(source);
      setRect(target);
      const dataTransfer = new TestDataTransfer();
      dispatchDrag(source, "dragstart", dataTransfer);
      dispatchDrag(target, "dragenter", dataTransfer);
      dispatchDrag(target, "dragover", dataTransfer);
      dispatchDrag(target, "drop", dataTransfer);
      dispatchDrag(source, "dragend", dataTransfer);
      expect(prompt()).toBeNull();
      await vi.waitFor(() => expect(tablePanelCount()).toBe(2));
      expect(openedTables().sort()).toEqual(["instruments", "prices"]);
    });
  });

  describe("Save as workspace", () => {
    it("builds the default name from the open tables", () => {
      expect(getDefaultWorkspaceName("simul", [])).toBe("simul tables");
      expect(
        getDefaultWorkspaceName("simul", [
          { module: "SIMUL", table: "instruments" },
          { module: "SIMUL", table: "prices" },
        ]),
      ).toBe("SIMUL instruments + prices");
      expect(
        getDefaultWorkspaceName("simul", [
          { module: "SIMUL", table: "prices" },
          { module: "BASKET", table: "basket" },
        ]),
      ).toBe("SIMUL prices + BASKET basket");
    });

    it("saves the layout as a named workspace and opens it", async () => {
      await render();
      await waitForTables();
      await click(button("Add instruments"));
      await click(button("Add prices"));
      await click(button("Save as workspace"));

      const form = savePopover();
      const input = form.querySelector<HTMLInputElement>(
        "input[name='workspaceName']",
      );
      const name = input?.value;
      expect(name).toMatch(
        /^SIMUL (instruments \+ prices|prices \+ instruments)$/,
      );
      expect(
        form.querySelector<HTMLInputElement>("input[type='checkbox']")?.checked,
      ).toBe(true);

      await click(button("Save", form));

      await vi.waitFor(async () =>
        expect(
          await workspaceService.listNamedWorkspaceMetadata(),
        ).toHaveLength(1),
      );
      const [saved] = await workspaceService.listNamedWorkspaceMetadata();
      expect(saved.name).toBe(name);
      const definition = await workspaceService.loadNamedWorkspaceDefinition(
        saved.id,
      );
      expect(
        definition &&
          getOpenTables(definition.snapshot)
            .map(({ table }) => table)
            .sort(),
      ).toEqual(["instruments", "prices"]);
      await vi.waitFor(() =>
        expect(location).toBe(`/workspaces/${encodeURIComponent(saved.id)}`),
      );
    });

    it("can stay on Browse, which resets to empty", async () => {
      await render();
      await waitForTables();
      await click(button("Add instruments"));
      await click(button("Save as workspace"));
      const form = savePopover();
      await click(
        form.querySelector("input[type='checkbox']") as HTMLInputElement,
      );
      await click(button("Save", form));
      await vi.waitFor(async () =>
        expect(
          await workspaceService.listNamedWorkspaceMetadata(),
        ).toHaveLength(1),
      );
      expect(location).toBe("/tables/browse/simul");
      await vi.waitFor(() => expect(tablePanelCount()).toBe(0));
      expect(query(".vuuWorkspaceDropZone h4")?.textContent).toBe(
        "Pick a table",
      );
      expect(query(".vuuPortalWorkspaceHeader-status")?.textContent).toBe("");
    });

    it("is not offered without workspaces", async () => {
      await render({ workspaces: false });
      expect(() => button("Save as workspace")).toThrow();
      expect(query("aside[aria-label='Panels']")).not.toBeNull();
    });
  });

  describe("unreachable server", () => {
    it("shows an error with Retry and Change server", async () => {
      await render({ path: "/tables/browse/uat" });
      const alert = query("[role='alert']");
      expect(alert?.textContent).toContain("uat is unreachable");
      expect(button("Retry", alert as Element)).toBeDefined();
      await click(button("Change server", alert as Element));
      expect(location).toBe("/tables/browse");
      expect(queryAll("ul[aria-label='Vuu servers'] a")).toHaveLength(2);
    });

    const createMonitor = () =>
      new LocalServerMonitor({
        localServerIds: localServers.map(({ connectionId }) => connectionId),
        moduleServerMap: new ModuleServerMap({
          loadConfig: async () => ({}),
          modules: [],
          portalConnectionId: "local",
        }),
      });

    it("offers Retry and Change server for a known server that is down", async () => {
      const monitor = createMonitor();
      monitor.setPresence("simul", "offline");
      const retry = vi.spyOn(monitor, "retry");
      await render({ monitor, path: "/tables/browse/simul" });

      const alert = query("[role='alert']");
      expect(alert?.textContent).toContain("simul is unreachable");
      await click(button("Retry", alert as Element));
      expect(retry).toHaveBeenCalledWith("simul");
      // The palette does not try to list the tables of a server that is down.
      expect(getTableList).not.toHaveBeenCalled();

      await click(button("Change server", alert as Element));
      expect(location).toBe("/tables/browse");
    });

    it("recovers when the server comes back", async () => {
      const monitor = createMonitor();
      monitor.setPresence("simul", "offline");
      await render({ monitor, path: "/tables/browse/simul" });
      expect(query("[role='alert']")?.textContent).toContain(
        "simul is unreachable",
      );

      await act(async () => monitor.setPresence("simul", undefined));

      await vi.waitFor(() => expect(query("[role='alert']")).toBeNull());
      expect(query(".vuuWorkspaceDropZone h4")?.textContent).toBe(
        "Pick a table",
      );
      await waitForTables();
      expect(getTableList).toHaveBeenCalledTimes(1);
    });

    it("treats a server that is reconnecting as reachable", async () => {
      const monitor = createMonitor();
      monitor.setPresence("simul", "degraded");
      await render({ monitor, path: "/tables/browse/simul" });
      expect(query("[role='alert']")).toBeNull();
      await waitForTables();
    });
  });
});
