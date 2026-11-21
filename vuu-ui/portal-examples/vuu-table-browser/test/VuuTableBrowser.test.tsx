import {
  AuthenticationProvider,
  DataProvider,
  LocalServerMonitor,
  type LocalVuuServer,
  ModuleServerMap,
  ShellContextPanel,
  ShellContextPanelProvider,
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
    contextPanel = false,
    monitor,
    path = "/tables/browse/simul",
    workspaces = true,
  }: {
    /** Within the shell's context panel, as in the portal. */
    contextPanel?: boolean;
    monitor?: LocalServerMonitor;
    path?: string;
    workspaces?: boolean;
  } = {}) => {
    const routes_ = (
      <Routes>
        <Route element={<VuuTableBrowser />} path="/tables/browse/*" />
        <Route
          element={<div data-route="workspace" />}
          path="/workspaces/:id"
        />
      </Routes>
    );
    const browser = contextPanel ? (
      <ShellContextPanelProvider defaultPlacement="inline">
        {routes_}
        <ShellContextPanel />
      </ShellContextPanelProvider>
    ) : (
      routes_
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

  const selectedServer = () =>
    query(".vuuPanelsPalette-serverRow-selected .vuuPanelsPalette-serverName")
      ?.textContent ?? undefined;
  const serverRow = (name: string) => {
    const element = queryAll(".vuuPanelsPalette-serverRow").find(
      (row) =>
        row.querySelector(".vuuPanelsPalette-serverName")?.textContent === name,
    );
    if (!element) {
      throw Error(`no server ${name}`);
    }
    return element;
  };

  it("opens the Browse page on its own path, with the first server", async () => {
    await render({ path: "/tables/browse" });
    expect(query("h1")?.textContent).toBe("Tables");
    expect(
      queryAll(".vuuPanelsPalette-serverList .vuuPanelsPalette-serverName").map(
        (element) => element.textContent,
      ),
    ).toEqual(["simul", "basket"]);
    expect(selectedServer()).toBe("simul");
    await waitForTables();
  });

  describe("Browse page", () => {
    it("opens with the Tables palette pinned, on the selected server", async () => {
      await render();
      expect(query("h1")?.textContent).toBe("Tables");
      expect(query("aside[aria-label='Tables']")).not.toBeNull();
      // Tables is the only tab, so there is no tab strip.
      expect(query("aside[aria-label='Tables'] [role='tablist']")).toBeNull();
      expect(
        query("aside[aria-label='Tables'] [role='listbox']")?.getAttribute(
          "aria-label",
        ),
      ).toBe("Tables");
      expect(selectedServer()).toBe("simul");
      expect(query("input[type='search']")).toBeNull();
      await waitForTables();
      expect(
        queryAll(".vuuPanelsPalette-groupLabel").map((e) => e.textContent),
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
      expect(selectedServer()).toBe("basket");
      expect(query("[data-server-id]")?.dataset.serverId).toBe("basket");
    });

    it("lists the tables of a newly chosen server, in the context panel", async () => {
      await render({ contextPanel: true });
      await waitForTables();
      expect(query(".vuuPanelsPalette-inContextPanel")).not.toBeNull();
      expect(selectedServer()).toBe("simul");
      expect(getTableList).toHaveBeenCalledTimes(1);
      await click(serverRow("basket"));
      expect(selectedServer()).toBe("basket");
      expect(query("[data-server-id]")?.dataset.serverId).toBe("basket");
      await waitForTables();
      expect(getTableList).toHaveBeenCalledTimes(2);
    });

    it("keeps the open tables when another server is chosen", async () => {
      await render();
      await waitForTables();
      await click(button("Add instruments"));
      expect(tablePanelCount()).toBe(1);
      await click(serverRow("basket"));
      expect(selectedServer()).toBe("basket");
      expect(tablePanelCount()).toBe(1);
      expect(query(".vuuPortalWorkspaceHeader-status")?.textContent).toBe(
        "Unsaved layout",
      );
    });

    it("is pinned, with no pin button, without saving that as the user's choice", async () => {
      await render();
      await waitForTables();
      // Pinned: adding a table leaves the palette open.
      await click(button("Add instruments"));
      expect(query("aside[aria-label='Tables']")).not.toBeNull();
      expect(query("button[aria-label='Unpin tables']")).toBeNull();
      expect(query("button[aria-label='Pin tables open']")).toBeNull();
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
      expect(query("aside[aria-label='Tables']")).not.toBeNull();
    });
  });

  describe("unreachable server", () => {
    const tablesAlert = () =>
      query("aside[aria-label='Tables'] [role='alert']");

    it("shows the panel's error with Retry for an unknown server", async () => {
      await render({ path: "/tables/browse/uat" });
      expect(tablesAlert()?.textContent).toContain("Can’t list tables");
      expect(button("Retry")).toBeDefined();
      expect(query(".vuuWorkspaceDropZone h4")?.textContent).toBe(
        "Pick a table",
      );
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

    it("retries a known server that is down", async () => {
      const monitor = createMonitor();
      monitor.setPresence("simul", "offline");
      const retry = vi.spyOn(monitor, "retry");
      await render({ monitor, path: "/tables/browse/simul" });

      expect(tablesAlert()?.textContent).toContain("Can’t list tables");
      await click(button("Retry"));
      expect(retry).toHaveBeenCalledWith("simul");
      // The palette does not try to list the tables of a server that is down.
      expect(getTableList).not.toHaveBeenCalled();
    });

    it("recovers when the server comes back", async () => {
      const monitor = createMonitor();
      monitor.setPresence("simul", "offline");
      await render({ monitor, path: "/tables/browse/simul" });
      expect(tablesAlert()).not.toBeNull();

      await act(async () => monitor.setPresence("simul", undefined));

      await vi.waitFor(() => expect(tablesAlert()).toBeNull());
      await waitForTables();
      expect(getTableList).toHaveBeenCalledTimes(1);
    });

    it("treats a server that is reconnecting as reachable", async () => {
      const monitor = createMonitor();
      monitor.setPresence("simul", "degraded");
      await render({ monitor, path: "/tables/browse/simul" });
      expect(tablesAlert()).toBeNull();
      await waitForTables();
    });
  });
});
