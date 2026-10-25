import {
  GridLayout,
  type GridLayoutDocument,
  GridLayoutProvider,
} from "@vuu-ui/grid-layout";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider } from "../../src/auth/AuthenticationProvider";
import { DataProvider } from "../../src/context-definitions/DataProvider";
import {
  ApplicationStateProvider,
  type ApplicationStateStore,
  createPortalPersistenceService,
  InMemoryPersistenceBackend,
  type PortalPersistenceService,
} from "../../src/persistence";
import {
  AddPanelButton,
  createPortalComponentRegistries,
  filterPanelItemGroups,
  getSplitPosition,
  OpenPanelProvider,
  type OpenPanelResult,
  PANELS_PALETTE_PINNED_KEY,
  PanelsPalette,
  PanelsPaletteStateProvider,
  RECENT_PANELS_KEY,
  type RemoteModuleDescriptor,
  TemplateDragHint,
  tablePanelItem,
  useOpenPanel,
  WorkspaceDropZone,
} from "../../src/portal";
import type { LocalVuuServer } from "../../src/VuuServerDescriptor";

const icon =
  "data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'/%3E";

const descriptor = (
  id: string,
  title: string,
  overrides: Partial<RemoteModuleDescriptor> = {},
): RemoteModuleDescriptor => ({
  accessRole: "",
  clientIdentifier: id,
  description: `${title} module`,
  id,
  mfComponent: "./Module",
  mfScope: id,
  mfUrl: `http://localhost/${id}`,
  name: id,
  navLocation: "/Apps",
  path: `/${id}`,
  title,
  version: 1,
  ...overrides,
});

const modules = [
  descriptor("orders", "Orders", {
    workspace: { iconUrl: icon, paletteGroup: "Trading" },
  }),
  descriptor("chart", "Chart", {
    workspace: { defaultSize: { cols: 1, rows: 2 }, paletteGroup: "Analytics" },
  }),
  descriptor("blotter", "Blotter", {
    workspace: { defaultSize: { cols: 3, rows: 1 }, paletteGroup: "Trading" },
  }),
  descriptor("admin", "Admin"),
];

const tables: VuuTable[] = [
  { module: "SIMUL", table: "prices" },
  { module: "BASKET", table: "basket" },
  { module: "SIMUL", table: "instruments" },
];

const getTableList = vi.fn(async () => ({ tables }));

type DataProviderProps = Parameters<typeof DataProvider>[0];

const LocalDataProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider
    getServerAPI={
      (async () => ({
        getTableList,
      })) as unknown as DataProviderProps["getServerAPI"]
    }
    VuuDataSource={undefined as unknown as DataProviderProps["VuuDataSource"]}
  >
    {children}
  </DataProvider>
);

const localServers: LocalVuuServer[] = [
  { connectionId: "local-a", DataSourceProvider: LocalDataProvider },
];

const { renderers, settingsCodecs } = createPortalComponentRegistries({
  renderModule: ({ title }) => <span data-module={title}>{title}</span>,
});

interface Panel {
  id: string;
  moduleId: string;
  title: string;
}

const workspaceDocument = (panels: readonly Panel[]): GridLayoutDocument => {
  if (panels.length === 0) {
    return {
      components: [],
      kind: "grid-layout",
      layout: {
        columns: ["1fr"],
        id: "workspace",
        items: [
          {
            column: { span: 1, start: 1 },
            id: "placeholder",
            row: { span: 1, start: 1 },
          },
        ],
        placeholderIds: ["placeholder"],
        rows: ["1fr"],
        stacks: [],
      },
      version: 2,
    } as unknown as GridLayoutDocument;
  }
  return {
    components: panels.map(({ id, moduleId }) => ({
      id: `component-${id}`,
      settings: { moduleId },
      type: "portal-module",
      version: 1,
    })),
    kind: "grid-layout",
    layout: {
      columns: panels.map(() => "1fr"),
      id: "workspace",
      items: panels.map(({ id, title }, index) => ({
        column: { span: 1, start: index + 1 },
        componentInstanceId: `component-${id}`,
        dropTarget: true,
        header: true,
        id,
        resizeable: "hv",
        row: { span: 1, start: 1 },
        title,
      })),
      placeholderIds: [],
      rows: ["1fr"],
      stacks: [],
    },
    version: 2,
  } as unknown as GridLayoutDocument;
};

const ORDERS = { id: "orders-panel", moduleId: "orders", title: "Orders" };
const CHART = { id: "chart-panel", moduleId: "chart", title: "Chart" };

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
) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperties(event, {
    clientX: { value: 50 },
    clientY: { value: 50 },
    dataTransfer: { value: dataTransfer },
  });
  act(() => element.dispatchEvent(event));
};

describe("PanelsPalette", () => {
  let container: HTMLDivElement;
  let root: Root;
  let persistence: PortalPersistenceService;
  let appState: ApplicationStateStore;
  let documents: GridLayoutDocument[];
  let openPanelApi: ReturnType<typeof useOpenPanel>;

  const CaptureOpenPanel = () => {
    openPanelApi = useOpenPanel();
    return null;
  };

  const render = async ({
    defaultOpen = true,
    panels = [ORDERS, CHART],
  }: {
    defaultOpen?: boolean;
    panels?: readonly Panel[];
  } = {}) => {
    await act(async () =>
      root.render(
        <ApplicationStateProvider store={appState}>
          <AuthenticationProvider
            localServers={localServers}
            mode="local"
            registry={{ modules }}
          >
            <PanelsPaletteStateProvider defaultOpen={defaultOpen}>
              <AddPanelButton />
              <GridLayoutProvider
                componentRenderers={renderers}
                document={workspaceDocument(panels)}
                onDocumentChange={(document) => documents.push(document)}
                settingsCodecs={settingsCodecs}
              >
                <OpenPanelProvider>
                  <GridLayout
                    id="workspace"
                    placeholderContent={
                      panels.length === 0 ? <WorkspaceDropZone /> : undefined
                    }
                  />
                  <TemplateDragHint />
                  <PanelsPalette />
                  <CaptureOpenPanel />
                </OpenPanelProvider>
              </GridLayoutProvider>
            </PanelsPaletteStateProvider>
          </AuthenticationProvider>
        </ApplicationStateProvider>,
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

  const groupLabels = () =>
    queryAll(".vuuPanelsPalette-groupHeader").map(
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

  const button = (name: string) => {
    const element = queryAll("button").find(
      (candidate) =>
        candidate.getAttribute("aria-label") === name ||
        candidate.textContent === name,
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

  const pointerDown = (element: Element) =>
    act(() => {
      element.dispatchEvent(new Event("pointerdown", { bubbles: true }));
    });

  const key = async (element: Element, keyName: string, shiftKey = false) => {
    await act(async () => {
      element.dispatchEvent(
        new KeyboardEvent("keydown", {
          bubbles: true,
          cancelable: true,
          key: keyName,
          shiftKey,
        }),
      );
    });
  };

  const selectTab = (label: string) => click(button(label));

  const setFilter = async (value: string) => {
    const input = query<HTMLInputElement>(".vuuPanelsPalette-search input");
    if (!input) {
      throw Error("no search input");
    }
    await act(async () => {
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value",
      )?.set;
      setter?.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
  };

  const moduleTitles = () =>
    queryAll("[data-module]").map((element) => element.dataset.module);

  const lastDocument = () => documents[documents.length - 1];

  const prompt = () => query("[role='menu']");

  const focusPanel = (id: string) =>
    pointerDown(query(`#${id} .vuuGridLayoutItemContent`) as Element);

  beforeEach(async () => {
    vi.stubGlobal("requestAnimationFrame", () => 0);
    vi.stubGlobal("cancelAnimationFrame", () => undefined);
    // Remote modules publish an empty config.
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}")),
    );
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    documents = [];
    getTableList.mockClear();
    persistence = createPortalPersistenceService({
      backend: new InMemoryPersistenceBackend(),
      user: "alice",
      window: null,
    });
    appState = persistence.getStore("portal", 1);
    await appState.ready;
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    document.body.innerHTML = "";
    persistence.dispose();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe("tabs", () => {
    it("lists palette modules grouped by paletteGroup, with icons", async () => {
      await render();
      expect(query("aside[aria-label='Panels']")).not.toBeNull();
      expect(button("Modules").getAttribute("aria-selected")).toBe("true");
      expect(groupLabels()).toEqual(["Trading", "Analytics"]);
      expect(rowLabels()).toEqual(["Orders", "Blotter", "Chart"]);
      expect(row("Orders").querySelector("img")?.getAttribute("src")).toBe(
        icon,
      );
      expect(
        row("Chart").querySelector(".vuuPanelsPalette-icon svg"),
      ).not.toBeNull();
      expect(row("Orders").getAttribute("draggable")).toBe("true");
      expect(row("Orders").dataset.templateComponentType).toBe("portal-module");
    });

    it("lists the tables of the selected server, grouped by module, names only", async () => {
      await render();
      await selectTab("Tables");
      await vi.waitFor(() => expect(rowLabels()).toHaveLength(3));
      expect(getTableList).toHaveBeenCalledTimes(1);
      const server = query<HTMLSelectElement>(
        ".vuuPanelsPalette-server select",
      );
      expect(server?.value).toBe("local-a");
      expect(groupLabels()).toEqual(["SIMUL", "BASKET"]);
      expect(rowLabels()).toEqual(["instruments", "prices", "basket"]);
      expect(queryAll(".vuuPanelsPalette-subtitle")).toHaveLength(0);
      expect(row("prices").dataset.templateComponentType).toBe("vuu-table");
    });

    it("lists recently added panels, kept in the user's saved state", async () => {
      await render({ panels: [] });
      await selectTab("Recent");
      expect(query(".vuuPanelsPalette-empty")?.textContent).toBe(
        "Panels you add appear here.",
      );
      await selectTab("Modules");
      await click(button("Add Chart"));
      await click(button("Add panel"));
      await selectTab("Recent");
      expect(rowLabels()).toEqual(["Chart"]);
      const saved = appState.get(RECENT_PANELS_KEY) as { label: string }[];
      expect(saved.map(({ label }) => label)).toEqual(["Chart"]);

      // A new palette reads it back.
      await act(async () => root.unmount());
      root = createRoot(container);
      await render({ panels: [] });
      await selectTab("Recent");
      expect(rowLabels()).toEqual(["Chart"]);
    });

    it("collapses and expands a group", async () => {
      await render();
      await click(button("Trading"));
      expect(rowLabels()).toEqual(["Chart"]);
      await click(button("Trading"));
      expect(rowLabels()).toEqual(["Orders", "Blotter", "Chart"]);
    });
  });

  describe("filter", () => {
    it("filters rows by name and group, case-insensitively", async () => {
      await render();
      await setFilter("CHA");
      expect(rowLabels()).toEqual(["Chart"]);
      expect(groupLabels()).toEqual(["Analytics"]);
      await setFilter("trading");
      expect(rowLabels()).toEqual(["Orders", "Blotter"]);
      await setFilter("nothing like it");
      expect(rowLabels()).toEqual([]);
      expect(query(".vuuPanelsPalette-empty")?.textContent).toBe(
        'No panels match "nothing like it".',
      );
    });

    it("applies to the Tables tab", async () => {
      await render();
      await selectTab("Tables");
      await vi.waitFor(() => expect(rowLabels()).toHaveLength(3));
      await setFilter("pri");
      expect(rowLabels()).toEqual(["prices"]);
      await setFilter("basket");
      expect(rowLabels()).toEqual(["basket"]);
    });

    it("matches every term", () => {
      const groups = [
        {
          items: [
            tablePanelItem("s", "SIMUL", "prices"),
            tablePanelItem("s", "SIMUL", "instruments"),
          ],
          label: "SIMUL",
        },
      ];
      expect(
        filterPanelItemGroups(groups, "simul pri")[0].items.map(
          ({ label }) => label,
        ),
      ).toEqual(["prices"]);
      expect(filterPanelItemGroups(groups, "  ")).toEqual(groups);
    });
  });

  describe("keyboard", () => {
    it("moves through rows with the arrows and opens with Enter", async () => {
      await render({ panels: [] });
      const list = query("[role='listbox']");
      if (!list) {
        throw Error("no listbox");
      }
      expect(row("Orders").dataset.active).toBe("true");
      await key(list, "ArrowDown");
      expect(row("Blotter").dataset.active).toBe("true");
      await key(list, "End");
      expect(row("Chart").dataset.active).toBe("true");
      await key(list, "ArrowDown");
      expect(row("Chart").dataset.active).toBe("true");
      await key(list, "Home");
      expect(row("Orders").getAttribute("aria-selected")).toBe("true");
      expect(list.getAttribute("aria-activedescendant")).toBe(row("Orders").id);
      await key(list, "ArrowDown");
      await key(list, "Enter");
      expect(moduleTitles()).toEqual(["Blotter"]);
    });

    it("navigates from the search box, Shift+Enter adds", async () => {
      await render({ panels: [] });
      const input = query(".vuuPanelsPalette-search input");
      if (!input) {
        throw Error("no input");
      }
      await setFilter("t");
      await key(input, "ArrowDown");
      await key(input, "Enter", true);
      expect(moduleTitles()).toEqual(["Blotter"]);
    });

    it("+ adds the active row", async () => {
      await render({ panels: [] });
      const list = query("[role='listbox']") as Element;
      await key(list, "End");
      await key(list, "+");
      expect(moduleTitles()).toEqual(["Chart"]);
    });
  });

  describe("+ and click", () => {
    it("+ fills an empty workspace", async () => {
      await render({ panels: [] });
      await click(button("Add Orders"));
      expect(moduleTitles()).toEqual(["Orders"]);
      expect(lastDocument().components).toEqual([
        expect.objectContaining({
          settings: { moduleId: "orders" },
          type: "portal-module",
        }),
      ]);
    });

    it("+ adds beside the focused panel, without a prompt", async () => {
      await render();
      await click(button("Add Blotter"));
      expect(prompt()).toBeNull();
      expect(moduleTitles().sort()).toEqual(["Blotter", "Chart", "Orders"]);
      expect(lastDocument().layout.items).toHaveLength(3);
    });

    it("+ adds a table panel", async () => {
      await render({ panels: [] });
      await selectTab("Tables");
      await vi.waitFor(() => expect(rowLabels()).toHaveLength(3));
      await click(button("Add prices"));
      expect(lastDocument().components).toEqual([
        expect.objectContaining({
          settings: { module: "SIMUL", serverId: "local-a", table: "prices" },
          type: "vuu-table",
        }),
      ]);
    });

    it("closes after adding unless pinned", async () => {
      await render({ panels: [] });
      expect(button("Add panel").getAttribute("aria-pressed")).toBe("true");
      await click(button("Add Orders"));
      expect(query(".vuuPanelsPalette")).toBeNull();
      expect(button("Add panel").getAttribute("aria-pressed")).toBe("false");

      await click(button("Add panel"));
      await click(button("Pin panels open"));
      expect(appState.get(PANELS_PALETTE_PINNED_KEY)).toBe(true);
      await click(button("Add Chart"));
      expect(moduleTitles().sort()).toEqual(["Chart", "Orders"]);
      expect(query(".vuuPanelsPalette")).not.toBeNull();
    });

    it("opens pinned, from the user's saved state", async () => {
      appState.set(PANELS_PALETTE_PINNED_KEY, true);
      await render({ defaultOpen: false });
      expect(query(".vuuPanelsPalette")).not.toBeNull();
      await click(button("Close panels"));
      expect(query(".vuuPanelsPalette")).toBeNull();
      expect(appState.get(PANELS_PALETTE_PINNED_KEY)).toBe(false);
    });
  });

  describe("click rule", () => {
    it("adds when the workspace has no panels", async () => {
      await render({ panels: [] });
      await click(row("Chart"));
      expect(prompt()).toBeNull();
      expect(moduleTitles()).toEqual(["Chart"]);
    });

    it("replaces the only panel", async () => {
      await render({ panels: [ORDERS] });
      await click(row("Chart"));
      expect(prompt()).toBeNull();
      expect(moduleTitles()).toEqual(["Chart"]);
      expect(lastDocument().layout.items).toHaveLength(1);
    });

    it("with several panels, asks to replace the focused panel or open a new tab", async () => {
      await render();
      focusPanel("orders-panel");
      await click(row("Blotter"));
      const menu = prompt();
      expect(menu?.getAttribute("aria-label")).toBe("Open Blotter");
      expect(menu?.textContent).toContain("Replace Orders");
      expect(menu?.textContent).toContain("Open as new tab");
      expect(menu?.textContent).toContain("Esc to cancel");
      expect(document.activeElement).toBe(menu);
      expect(
        query("#orders-panel")?.hasAttribute("data-open-panel-target"),
      ).toBe(true);
      expect(documents).toHaveLength(0);
    });

    it("R replaces the focused panel", async () => {
      await render();
      focusPanel("orders-panel");
      await click(row("Blotter"));
      await key(prompt() as Element, "r");
      expect(prompt()).toBeNull();
      expect(moduleTitles().sort()).toEqual(["Blotter", "Chart"]);
      expect(lastDocument().layout.items).toHaveLength(2);
      expect(query("[data-open-panel-target]")).toBeNull();
    });

    it("T opens a new tab, stacked with the focused panel", async () => {
      await render();
      focusPanel("chart-panel");
      await click(row("Orders"));
      expect(prompt()?.textContent).toContain("Replace Chart");
      await key(prompt() as Element, "t");
      expect(prompt()).toBeNull();
      const { stacks } = lastDocument().layout;
      expect(stacks).toHaveLength(1);
      expect(stacks[0].itemIds).toHaveLength(2);
      expect(stacks[0].itemIds[0]).toBe("chart-panel");
      expect(stacks[0].selectedItemId).toBe(stacks[0].itemIds[1]);
    });

    it("Esc cancels", async () => {
      await render();
      await click(row("Orders"));
      await key(prompt() as Element, "Escape");
      expect(prompt()).toBeNull();
      expect(documents).toHaveLength(0);
      expect(query(".vuuPanelsPalette")).not.toBeNull();
    });

    it("chooses with the arrows and Enter, or a click", async () => {
      await render();
      await click(row("Orders"));
      await key(prompt() as Element, "ArrowDown");
      await key(prompt() as Element, "Enter");
      expect(lastDocument().layout.stacks).toHaveLength(1);

      await click(button("Add panel"));
      await click(row("Chart"));
      await click(queryAll("[role='menuitem']")[0]);
      expect(prompt()).toBeNull();
      expect(lastDocument().components).toContainEqual(
        expect.objectContaining({ settings: { moduleId: "chart" } }),
      );
    });

    it("useOpenPanel resolves with the action and the new item id", async () => {
      await render({ panels: [ORDERS] });
      let result: OpenPanelResult | undefined;
      await act(async () => {
        result = await openPanelApi.openPanel({
          component: {
            settings: { moduleId: "chart" },
            type: "portal-module",
            version: 1,
          },
          label: "Chart",
        });
      });
      expect(result?.action).toBe("replace");
      expect(lastDocument().layout.items.map(({ id }) => id)).toEqual([
        result?.itemId,
      ]);
    });

    it("dragging a row never prompts", async () => {
      await render();
      const source = row("Blotter");
      const dataTransfer = new TestDataTransfer();
      dispatchDrag(source, "dragstart", dataTransfer);
      expect(source.dataset.dragging).toBe("true");
      dispatchDrag(source, "dragend", dataTransfer);
      expect(prompt()).toBeNull();
      expect(source.dataset.dragging).toBeUndefined();
    });
  });

  describe("drag hint and drop zone", () => {
    it("shows the drag hint while a row is dragged", async () => {
      await render();
      expect(query(".vuuTemplateDragHint")).toBeNull();
      const source = row("Chart");
      const dataTransfer = new TestDataTransfer();
      dispatchDrag(source, "dragstart", dataTransfer);
      const hint = query(".vuuTemplateDragHint");
      expect(hint?.textContent).toContain("Add Chart");
      expect(hint?.textContent).toContain(
        "Drop on a panel edge to split, centre to tab",
      );
      dispatchDrag(source, "dragend", dataTransfer);
      expect(query(".vuuTemplateDragHint")).toBeNull();
    });

    it("shows a drop zone in an empty workspace, highlighted while dragging", async () => {
      await render({ panels: [] });
      const dropZone = query(".vuuWorkspaceDropZone");
      expect(dropZone?.textContent).toContain("This workspace is empty");
      expect(dropZone?.dataset.dragActive).toBeUndefined();
      const dataTransfer = new TestDataTransfer();
      dispatchDrag(row("Chart"), "dragstart", dataTransfer);
      expect(query(".vuuWorkspaceDropZone")?.dataset.dragActive).toBe("true");
      dispatchDrag(row("Chart"), "dragend", dataTransfer);
    });
  });
});

describe("getSplitPosition", () => {
  const element = (width: number, height: number) =>
    ({
      getBoundingClientRect: () => ({ height, width }) as DOMRect,
    }) as Element;

  it("puts wide panels below and tall panels beside the target", () => {
    expect(getSplitPosition({ cols: 3, rows: 1 })).toBe("south");
    expect(getSplitPosition({ rows: 2 })).toBe("east");
  });

  it("otherwise splits the target along its longer side", () => {
    expect(getSplitPosition(undefined, element(200, 100))).toBe("east");
    expect(getSplitPosition({ cols: 1, rows: 1 }, element(100, 200))).toBe(
      "south",
    );
  });
});
