import { AuthenticationProvider, DataProvider } from "@vuu-ui/core";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VuuTableViewer, {
  parseViewerRoute,
  type VuuTableViewerProps,
} from "../src/VuuTableViewer";

const getTableSchema = vi.fn(async (_table: VuuTable) => {
  throw Error("schema unavailable");
});

const createProvider =
  (getSchema: typeof getTableSchema) =>
  ({ children }: { children: ReactNode }) => (
    <DataProvider
      VuuDataSource={VuuDataSource}
      getServerAPI={async () => ({
        getTableList: async () => ({ tables: [] }),
        getTableSchema: getSchema,
        rpcCall: async () => {
          throw Error("not used");
        },
      })}
    >
      {children}
    </DataProvider>
  );

const simulSchema = vi.fn(async (_table: VuuTable) => {
  throw Error("simul schema unavailable");
});
const basketSchema = vi.fn(async (_table: VuuTable) => {
  throw Error("basket schema unavailable");
});

const localServers = [
  { connectionId: "simul", DataSourceProvider: createProvider(simulSchema) },
  { connectionId: "basket", DataSourceProvider: createProvider(basketSchema) },
];
const ModuleConnection = createProvider(getTableSchema);

describe("parseViewerRoute", () => {
  it("reads <serverId>/<module>/<table>", () => {
    expect(parseViewerRoute("simul/SIMUL/instruments")).toEqual({
      module: "SIMUL",
      serverId: "simul",
      table: "instruments",
    });
    expect(parseViewerRoute("my%20server/SIMUL/instruments/")).toEqual({
      module: "SIMUL",
      serverId: "my server",
      table: "instruments",
    });
  });

  it.each([
    undefined,
    "",
    "simul",
    "simul/SIMUL",
    "a/b/c/d",
    "simul//t",
  ])("rejects %s", (route) => expect(parseViewerRoute(route)).toBeUndefined());
});

describe("VuuTableViewer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    // @ts-expect-error React test flag
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    for (const mock of [getTableSchema, simulSchema, basketSchema]) {
      mock.mockClear();
    }
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const render = async (
    props: VuuTableViewerProps = {},
    path = "/tables/view",
  ) => {
    await act(async () =>
      root.render(
        <MemoryRouter initialEntries={[path]}>
          <AuthenticationProvider localServers={localServers} mode="local">
            <ModuleConnection>
              <Routes>
                <Route
                  element={<VuuTableViewer {...props} />}
                  path="/tables/view/*"
                />
              </Routes>
            </ModuleConnection>
          </AuthenticationProvider>
        </MemoryRouter>,
      ),
    );
  };

  const alertText = () =>
    container.querySelector("[role='alert']")?.textContent;

  it("shows the table given by props, from its server", async () => {
    await render({ module: "BASKET", serverId: "basket", table: "basket" });
    await vi.waitFor(() =>
      expect(basketSchema).toHaveBeenCalledWith({
        module: "BASKET",
        table: "basket",
      }),
    );
    expect(simulSchema).not.toHaveBeenCalled();
    expect(getTableSchema).not.toHaveBeenCalled();
    await vi.waitFor(() =>
      expect(alertText()).toContain("Unable to load table BASKET:basket"),
    );
  });

  it("uses the module's own connection without a serverId", async () => {
    await render({ module: "SIMUL", table: "prices" });
    await vi.waitFor(() =>
      expect(getTableSchema).toHaveBeenCalledWith({
        module: "SIMUL",
        table: "prices",
      }),
    );
  });

  it("reads the table from its route when it has no props", async () => {
    await render({}, "/tables/view/simul/SIMUL/instruments");
    await vi.waitFor(() =>
      expect(simulSchema).toHaveBeenCalledWith({
        module: "SIMUL",
        table: "instruments",
      }),
    );
  });

  it("prefers props to the route", async () => {
    await render(
      { module: "BASKET", serverId: "basket", table: "basket" },
      "/tables/view/simul/SIMUL/instruments",
    );
    await vi.waitFor(() => expect(basketSchema).toHaveBeenCalled());
    expect(simulSchema).not.toHaveBeenCalled();
  });

  it("explains how to open a table when it has none", async () => {
    await render();
    expect(container.querySelector("[role='status']")?.textContent).toBe(
      "No table selected. Open tables from Tables › Browse.",
    );
    expect(getTableSchema).not.toHaveBeenCalled();
  });

  it("reports an unreachable server, with Retry", async () => {
    await render({ module: "SIMUL", serverId: "uat", table: "prices" });
    expect(alertText()).toContain("The Vuu server uat is not available.");
    expect(
      [...container.querySelectorAll("button")].map((b) => b.textContent),
    ).toContain("Retry");
  });

  it("retries a failed schema load", async () => {
    await render({ module: "BASKET", serverId: "basket", table: "basket" });
    await vi.waitFor(() => expect(alertText()).toContain("Unable to load"));
    const retry = [...container.querySelectorAll("button")].find(
      (b) => b.textContent === "Retry",
    );
    await act(async () => retry?.click());
    await vi.waitFor(() => expect(basketSchema).toHaveBeenCalledTimes(2));
  });
});
