import { SaltProvider } from "@salt-ds/core";
import {
  ensureVuuModule,
  LocalDataSourceProvider,
  moduleAdminModule,
} from "@vuu-ui/vuu-data-test";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ModuleAdmin from "../src/ModuleAdmin";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

ensureVuuModule(moduleAdminModule);

let root: Root | undefined;
let container: HTMLElement;
const location = { pathname: "" };

const LocationProbe = () => {
  location.pathname = useLocation().pathname;
  return null;
};

beforeEach(() => {
  // Every remote check fails fast, as no remotes are served in tests.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("", { status: 404 })),
  );
  container = document.createElement("div");
  document.body.append(container);
});

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  container.remove();
  vi.unstubAllGlobals();
});

const render = async (path: string) => {
  root = createRoot(container);
  await act(async () =>
    root?.render(
      <SaltProvider density="high">
        <LocalDataSourceProvider>
          <MemoryRouter initialEntries={[`/admin${path}`]}>
            <LocationProbe />
            <Routes>
              <Route element={<ModuleAdmin />} path="/admin/*" />
            </Routes>
          </MemoryRouter>
        </LocalDataSourceProvider>
      </SaltProvider>,
    ),
  );
};

const waitFor = async (assertion: () => void, timeout = 2000) => {
  const started = Date.now();
  for (;;) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - started > timeout) throw error;
      await act(() => new Promise((resolve) => setTimeout(resolve, 20)));
    }
  }
};

const text = (selector: string) =>
  [...container.querySelectorAll(selector)].map((el) => el.textContent);

const click = async (element: Element | null) => {
  if (!element) throw new Error("Nothing to click");
  await act(async () => (element as HTMLElement).click());
};

const buttonNamed = (name: string) =>
  [...container.querySelectorAll("button")].find(
    (button) => button.textContent?.replace(/\s+/g, "") === name,
  ) ?? null;

describe("ModuleAdmin", () => {
  it("is titled Module Config Viewer", async () => {
    await render("/modules");
    expect(text("h1")).toEqual(["Module Config Viewer"]);
  });

  it("lists modules by menu section and shows the first one", async () => {
    await render("/modules");
    await waitFor(() =>
      expect(text(".vuuModuleList-group")).toContain("Trading2"),
    );
    expect(text(".vuuModuleList-group")).toEqual([
      "Modules1",
      "Tools2",
      "Trading2",
      "Users1",
    ]);
    expect(container.querySelector(".vuuModuleDetail h2")?.textContent).toMatch(
      /^Manage remote modules/,
    );
  });

  it("shows the routed module read-only, with its issues", async () => {
    await render("/modules/order-blotter");
    await waitFor(() =>
      expect(
        container.querySelector(".vuuModuleDetail h2")?.textContent,
      ).toMatch(/^Order blotter.*Disabled/),
    );
    expect(text(".vuuModuleDetail-issues strong")).toContain("No access role");
    expect(
      container.querySelector(".vuuModuleList-row-selected")?.textContent,
    ).toMatch(/^Order blotter/);
    // The filter box is the only form control.
    expect(container.querySelectorAll("input, select, textarea")).toHaveLength(
      1,
    );
    expect(
      [...container.querySelectorAll("button")].map((b) =>
        b.textContent?.trim(),
      ),
    ).not.toEqual(expect.arrayContaining(["Edit", "Delete", "Disable"]));
  });

  it("shows the config as YAML", async () => {
    await render("/modules/basket-trading");
    await waitFor(() => expect(buttonNamed("YAML")).not.toBeNull());
    await click(buttonNamed("YAML"));
    const lines = [
      ...container.querySelectorAll(
        ".vuuModuleDetail-source .vuuModuleDetail-line",
      ),
    ].map((line) => line.textContent);
    expect(lines[0]).toMatch(/^- id: \d+$/);
    expect(lines).toEqual(
      expect.arrayContaining([
        "  name: basket-trading",
        "  mfScope: basketTrading",
        "  accessRole: basket-trading-access",
      ]),
    );
  });

  it("keeps module federation and the remote's config.json apart", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) =>
        url === "http://localhost:5006/mf-manifest.json"
          ? Response.json({
              exposes: [{ path: "./VuuBasketTradingFeature" }],
              name: "basketTrading",
            })
          : url === "http://localhost:5006/config.json"
            ? Response.json({
                connectionId: "basket",
                restUrl: "https://uat1.example/api/authn",
                websocketUrl: "wss://uat1.example/websocket",
              })
            : new Response("", { status: 404 }),
      ),
    );
    await render("/modules/basket-trading");
    const section = (title: string) =>
      container.querySelector(`section[aria-label="${title}"]`);
    await waitFor(() =>
      expect(section("Remote config")?.textContent).toContain("basket"),
    );
    const federation = section("Module federation");
    const remoteConfig = section("Remote config");
    expect(
      federation?.querySelector(".vuuModuleAdmin-sourceTag")?.textContent,
    ).toBe("modules.yaml");
    expect(
      remoteConfig?.querySelector(".vuuModuleAdmin-sourceTag")?.textContent,
    ).toBe("config.json");
    expect(remoteConfig?.textContent).toContain("wss://uat1.example/websocket");
    expect(remoteConfig?.textContent).toContain(
      "https://uat1.example/api/authn",
    );
    expect(federation?.textContent).not.toContain("wss://");
  });

  it("filters by status", async () => {
    await render("/modules");
    await waitFor(() => expect(buttonNamed("Disabled1")).not.toBeNull());
    await click(buttonNamed("Disabled1"));
    expect(text(".vuuModuleList-title")).toEqual([
      "Order blotterorder-blotter",
    ]);
  });

  it("shows the menu with nested modules under their parent", async () => {
    await render("/menu");
    await waitFor(() => expect(text(".vuuMenuPage-entry")).toContain("Tables"));
    const entries = text(".vuuMenuPage-entry");
    expect(entries.indexOf("View tablenested")).toBe(
      entries.indexOf("Tables") + 1,
    );
  });

  it("sends the editing routes to the module", async () => {
    await render("/modules/basket-trading/edit");
    await waitFor(() =>
      expect(location.pathname).toBe("/admin/modules/basket-trading"),
    );
    act(() => root?.unmount());
    root = undefined;
    await render("/overview");
    await waitFor(() => expect(location.pathname).toBe("/admin/modules"));
  });
});
