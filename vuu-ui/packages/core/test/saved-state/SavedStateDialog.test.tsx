import {
  fireEvent,
  getByRole,
  queryByRole,
  queryByText,
  waitFor,
} from "@testing-library/dom";
import { SaltProvider } from "@salt-ds/core";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  InMemoryPersistenceBackend,
  PortalPersistenceProvider,
  type PortalPersistenceService,
  createPortalPersistenceService,
} from "../../src/persistence";
import type { PersistenceBackend } from "../../src/persistence/PersistenceBackend";
import { PortalUserMenu } from "../../src/portal-header/PortalUserMenu";
import type { RemoteModuleDescriptor } from "../../src/RemoteModuleDescriptor";
import { SavedStateProvider, useSavedStateDialog } from "../../src/saved-state";

vi.mock("@vuu-ui/core", () => ({
  useLogout: () => async () => undefined,
  useOptionalAuthenticatedUser: () => ({ userName: "steve" }),
}));

const modules = [
  {
    clientIdentifier: "instruments",
    navLocation: "/Reference/Instruments",
    title: "Instruments",
    version: 2,
  },
  {
    clientIdentifier: "orders",
    navLocation: "/Trading/Orders",
    title: "Orders",
    version: 1,
  },
] as RemoteModuleDescriptor[];

let openDialog: (applicationKey?: string) => void;
const Opener = () => {
  const { open } = useSavedStateDialog();
  openDialog = open;
  return null;
};

describe("Saved state dialog", () => {
  let container: HTMLDivElement;
  let root: Root;
  let backend: PersistenceBackend;
  let service: PortalPersistenceService;

  const createService = () =>
    createPortalPersistenceService({
      backend,
      user: "steve",
      window: null,
      debounceMs: 0,
    });

  const seed = async () => {
    const instruments = service.getStore("instruments", 2, {
      title: "Instruments",
    });
    await instruments.ready;
    instruments.set("table/sort", [{ column: "ric" }], {
      label: "Sort order",
      group: "Table",
    });
    instruments.set("table/columns", ["ric", "price"], {
      label: "Column layout",
      group: "Table",
    });
    instruments.set("filters/named", [], {
      label: "Saved filters",
      group: "Filters",
    });
    const orders = service.getStore("orders", 1, { title: "Orders" });
    await orders.ready;
    orders.set("columns", ["side"], { label: "Order columns" });
    await service.flushAll();
  };

  beforeEach(async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    backend = new InMemoryPersistenceBackend();
    service = createService();
    await seed();
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
    document.body.innerHTML = "";
    service.dispose();
    vi.restoreAllMocks();
  });

  const renderShell = async (children: ReactNode = null) => {
    await act(async () => {
      root.render(
        <SaltProvider>
          <PortalPersistenceProvider service={service}>
            <SavedStateProvider remoteModules={modules}>
              <Opener />
              {children}
            </SavedStateProvider>
          </PortalPersistenceProvider>
        </SaltProvider>,
      );
    });
  };

  const dialog = () =>
    getByRole(document.body, "dialog", { name: "Saved state" });
  const treeItem = (name: string | RegExp) =>
    getByRole(dialog(), "treeitem", { name });
  const button = (name: string | RegExp, scope: HTMLElement = dialog()) =>
    getByRole(scope, "button", { name });

  const open = async (applicationKey?: string) => {
    await act(async () => openDialog(applicationKey));
    await waitFor(() =>
      expect(queryByRole(document.body, "tree")).not.toBeNull(),
    );
  };

  const clickPart = async (name: string | RegExp, selector: string) => {
    const part = treeItem(name).querySelector(selector);
    if (!part) throw Error(`${selector} not found`);
    await act(async () => {
      fireEvent.click(part);
    });
  };
  const expand = (name: string | RegExp) =>
    clickPart(name, ".saltTreeNodeExpansionIcon");
  const toggle = (name: string | RegExp) =>
    clickPart(name, ".saltTreeNodeTrigger");

  it("lists saved state by application, in navigation order (§9.3)", async () => {
    await renderShell();
    await open();
    await expand(/^Table,/);
    const applications = [
      ...dialog().querySelectorAll('[role="tree"] > [role="treeitem"]'),
    ].map((element) => element.getAttribute("aria-label"));
    expect(applications).toEqual([
      expect.stringMatching(/^Instruments, version 2/),
      expect.stringMatching(/^Orders, version 1/),
    ]);
    expect(treeItem(/^Sort order,/)).toBeTruthy();
    expect(queryByText(dialog(), "table/sort")).not.toBeNull();
    expect(
      queryByText(dialog(), "Nothing selected", { exact: false }),
    ).not.toBeNull();
    expect(
      button("Clear selected…").hasAttribute("disabled") ||
        button("Clear selected…").getAttribute("aria-disabled") === "true",
    ).toBe(true);
  });

  it("selects parents and children together and summarises the selection", async () => {
    await renderShell();
    await open();
    await expand(/^Table,/);
    await toggle(/^Table,/);
    expect(treeItem(/^Sort order,/).getAttribute("aria-checked")).toBe("true");
    expect(treeItem(/^Column layout,.*/).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(dialog().textContent).toContain("2 items selected in 1 application");
    await toggle(/^Sort order,/);
    expect(dialog().textContent).toContain("1 item selected in 1 application");
    expect(treeItem(/^Table,/).getAttribute("aria-checked")).toBe("mixed");
  });

  it("toggles the focused item with Space", async () => {
    await renderShell();
    await open();
    const orderColumns = treeItem(/^Order columns,/);
    await act(async () => orderColumns.focus());
    await act(async () => {
      fireEvent.keyDown(orderColumns, { key: " ", code: "Space" });
    });
    expect(treeItem(/^Order columns,/).getAttribute("aria-checked")).toBe(
      "true",
    );
    expect(dialog().textContent).toContain("1 item selected in 1 application");
  });

  it("filters the tree with the search box (§9.5)", async () => {
    await renderShell();
    await open();
    const input = getByRole(dialog(), "textbox", { name: "Find saved state" });
    await act(async () => {
      fireEvent.change(input, { target: { value: "saved filters" } });
    });
    expect(treeItem(/^Saved filters,/)).toBeTruthy();
    expect(
      queryByRole(dialog(), "treeitem", { name: /^Sort order,/ }),
    ).toBeNull();
    expect(queryByRole(dialog(), "treeitem", { name: /^Orders,/ })).toBeNull();
    await act(async () => {
      fireEvent.change(input, { target: { value: "nothing like this" } });
    });
    expect(dialog().textContent).toContain(
      'No saved state matches "nothing like this"',
    );
  });

  it("opens scoped to one application (§9.4)", async () => {
    await renderShell();
    await open("orders");
    expect(
      queryByRole(dialog(), "treeitem", { name: /^Instruments,/ }),
    ).toBeNull();
    expect(treeItem(/^Orders,/)).toBeTruthy();
  });

  it("confirms, clears the selection and reports the result (§9.6, §9.7)", async () => {
    await renderShell();
    await open();
    await expand(/^Table,/);
    await toggle(/^Sort order,/);
    await act(async () => fireEvent.click(button("Clear selected…")));
    const confirmation = getByRole(document.body, "dialog", {
      name: "Clear saved state?",
    });
    expect(confirmation.textContent).toContain("Instruments");
    expect(confirmation.textContent).toContain("Sort order");
    expect(confirmation.textContent).toContain("You can't undo this.");
    expect(document.activeElement).toBe(button("Cancel", confirmation));

    await act(async () => fireEvent.click(button("Cancel", confirmation)));
    expect(
      queryByRole(document.body, "dialog", { name: "Clear saved state?" }),
    ).toBeNull();
    expect(dialog()).toBeTruthy();

    await act(async () => fireEvent.click(button("Clear selected…")));
    await act(async () =>
      fireEvent.click(
        button(
          "Clear saved state",
          getByRole(document.body, "dialog", { name: "Clear saved state?" }),
        ),
      ),
    );
    await waitFor(() =>
      expect(document.body.textContent).toContain("Saved state cleared"),
    );
    await waitFor(() =>
      expect(
        queryByRole(dialog(), "treeitem", { name: /^Sort order,/ }),
      ).toBeNull(),
    );
    expect(dialog().textContent).toContain("Nothing selected");
    const summaries = await service.list();
    const instruments = summaries.find(
      ({ applicationKey }) => applicationKey === "instruments",
    );
    expect(instruments?.entries.map(({ key }) => key).sort()).toEqual([
      "filters/named",
      "table/columns",
    ]);
  });

  it("clears everything and shows the empty state (§9.8)", async () => {
    await renderShell();
    await open();
    await act(async () => fireEvent.click(button("Clear all saved state…")));
    const confirmation = getByRole(document.body, "dialog", {
      name: "Clear saved state?",
    });
    expect(confirmation.textContent).toContain(
      "All saved state for all applications will be permanently removed.",
    );
    await act(async () =>
      fireEvent.click(button("Clear saved state", confirmation)),
    );
    await waitFor(() =>
      expect(dialog().textContent).toContain("No saved state"),
    );
    expect(await service.list()).toEqual([]);
  });

  it("shows an error with Retry when saved state can't be read", async () => {
    const list = vi
      .spyOn(service, "list")
      .mockRejectedValueOnce(new Error("offline"));
    await renderShell();
    await act(async () => openDialog());
    await waitFor(() =>
      expect(dialog().textContent).toContain("Saved state couldn't be loaded"),
    );
    await act(async () => fireEvent.click(button("Retry")));
    await waitFor(() => expect(queryByRole(dialog(), "tree")).not.toBeNull());
    expect(list).toHaveBeenCalledTimes(2);
  });

  it("closes with the Close button", async () => {
    await renderShell();
    await open();
    await act(async () => fireEvent.click(button("Close")));
    await waitFor(() =>
      expect(
        queryByRole(document.body, "dialog", { name: "Saved state" }),
      ).toBeNull(),
    );
  });

  it("is opened from the user menu (§9.2)", async () => {
    await renderShell(<PortalUserMenu />);
    await act(async () =>
      fireEvent.click(getByRole(container, "button", { name: /steve/ })),
    );
    const item = await waitFor(() =>
      getByRole(document.body, "menuitem", { name: "Saved state…" }),
    );
    expect(
      getByRole(document.body, "menuitem", { name: "Log out" }),
    ).toBeTruthy();
    await act(async () => fireEvent.click(item));
    await waitFor(() => expect(dialog()).toBeTruthy());
  });
});

describe("PortalUserMenu without saved state", () => {
  it("only offers Log out", async () => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement("div");
    document.body.append(container);
    const root = createRoot(container);
    await act(async () =>
      root.render(
        <SaltProvider>
          <PortalUserMenu />
        </SaltProvider>,
      ),
    );
    await act(async () =>
      fireEvent.click(getByRole(container, "button", { name: /steve/ })),
    );
    await waitFor(() =>
      getByRole(document.body, "menuitem", { name: "Log out" }),
    );
    expect(
      queryByRole(document.body, "menuitem", { name: "Saved state…" }),
    ).toBeNull();
    act(() => root.unmount());
    container.remove();
  });
});
