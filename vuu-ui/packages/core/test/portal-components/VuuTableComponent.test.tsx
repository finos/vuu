import {
  GridLayout,
  type GridLayoutDocument,
  type GridLayoutDocumentChange,
  GridLayoutProvider,
} from "@vuu-ui/grid-layout";
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import type {
  TableConfig,
  TableConfigChangeHandler,
} from "@vuu-ui/vuu-table-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthenticationProvider, DataProvider } from "../../src";
import {
  createPortalComponentRegistries,
  VUU_TABLE_CHANGE_SERVER_EVENT,
  type VuuTableChangeServerRequest,
  type VuuTableComponentSettings,
} from "../../src/portal";

const tableProps =
  vi.fn<
    (props: {
      config: TableConfig;
      onConfigChange?: TableConfigChangeHandler;
    }) => void
  >();

vi.mock("@vuu-ui/vuu-table", () => ({
  Table: (props: {
    config: TableConfig;
    onConfigChange?: TableConfigChangeHandler;
  }) => {
    tableProps(props);
    return (
      <div data-columns={props.config.columns.map(({ name }) => name).join()}>
        table
      </div>
    );
  },
}));

const schema: TableSchema = {
  columns: [
    { name: "ric", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
  ],
  key: "ric",
  table: { module: "SIMUL", table: "prices" },
};

const getTableSchema = vi.fn(async (_table: VuuTable) => schema);

class FakeDataSource {
  constructor(readonly options: unknown) {}
  unsubscribe = vi.fn();
}

const TestDataProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider
    // biome-ignore lint/suspicious/noExplicitAny: test double
    VuuDataSource={FakeDataSource as any}
    getServerAPI={async () =>
      // biome-ignore lint/suspicious/noExplicitAny: test double
      ({ getTableSchema }) as any
    }
  >
    {children}
  </DataProvider>
);

const localServers = [
  { connectionId: "server-a", DataSourceProvider: TestDataProvider },
];

const documentFor = (settings: VuuTableComponentSettings): GridLayoutDocument =>
  ({
    components: [
      { id: "component-t", settings, type: "vuu-table", version: 1 },
    ],
    kind: "grid-layout",
    layout: {
      columns: ["1fr"],
      id: "workspace",
      items: [
        {
          column: { span: 1, start: 1 },
          componentInstanceId: "component-t",
          id: "t",
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

describe("vuu-table renderer", () => {
  let container: HTMLDivElement;
  let root: Root;
  let onDocumentChange: ReturnType<typeof vi.fn<ChangeHandler>>;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    tableProps.mockClear();
    getTableSchema.mockClear();
    getTableSchema.mockImplementation(async () => schema);
    onDocumentChange = vi.fn<ChangeHandler>();
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  const renderTable = async (
    settings: VuuTableComponentSettings,
    onChangeServer?: (request: VuuTableChangeServerRequest) => void,
  ) => {
    const { renderers, settingsCodecs } = createPortalComponentRegistries({
      onChangeServer,
    });
    await act(async () => {
      root.render(
        <AuthenticationProvider localServers={localServers} mode="local">
          <GridLayoutProvider
            componentRenderers={renderers}
            document={documentFor(settings)}
            onDocumentChange={onDocumentChange}
            settingsCodecs={settingsCodecs}
          >
            <GridLayout id="workspace" />
          </GridLayoutProvider>
        </AuthenticationProvider>,
      );
    });
  };

  const lastSettings = () => {
    const calls = onDocumentChange.mock.calls;
    return calls[calls.length - 1][0].components[0].settings;
  };

  const button = (label: string) => {
    const match = Array.from(container.querySelectorAll("button")).find(
      (element) => element.textContent === label,
    );
    if (!match) {
      throw Error(`no ${label} button`);
    }
    return match;
  };

  it("fetches the schema live and persists column config in tableState", async () => {
    await renderTable({
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
    });

    expect(getTableSchema).toHaveBeenCalledWith({
      module: "SIMUL",
      table: "prices",
    });
    expect(
      container.querySelector("[data-columns]")?.getAttribute("data-columns"),
    ).toBe("ric,price");

    const config = { columns: [{ name: "price" }] } as TableConfig;
    await act(async () => {
      tableProps.mock.lastCall?.[0].onConfigChange?.(
        config,
        "column-removed" as never,
      );
    });
    expect(onDocumentChange.mock.lastCall?.[1].kind).toBe("settings");
    expect(lastSettings()).toEqual({
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
      tableState: { config: { columns: [{ name: "price" }] } },
    });
  });

  it("restores column config from tableState", async () => {
    await renderTable({
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
      tableState: { config: { columns: [{ name: "ric" }] } },
    });
    expect(
      container.querySelector("[data-columns]")?.getAttribute("data-columns"),
    ).toBe("ric");
  });

  it("shows an error with Retry when the table can't be loaded", async () => {
    getTableSchema.mockImplementationOnce(async () => {
      throw Error("no such table");
    });
    await renderTable({
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
    });

    expect(container.querySelector("[role='alert']")?.textContent).toContain(
      "no such table",
    );
    expect(container.querySelector("[data-columns]")).toBeNull();

    await act(async () => button("Retry").click());

    expect(getTableSchema).toHaveBeenCalledTimes(2);
    expect(container.querySelector("[role='alert']")).toBeNull();
    expect(container.querySelector("[data-columns]")).not.toBeNull();
  });

  it("shows an error with Change server when the server is unknown", async () => {
    const onChangeServer =
      vi.fn<(request: VuuTableChangeServerRequest) => void>();
    const onEvent = vi.fn();
    container.addEventListener(VUU_TABLE_CHANGE_SERVER_EVENT, onEvent);
    await renderTable(
      { module: "SIMUL", serverId: "missing", table: "prices" },
      onChangeServer,
    );

    expect(container.querySelector("[role='alert']")?.textContent).toContain(
      "Vuu server missing is not available",
    );
    expect(getTableSchema).not.toHaveBeenCalled();

    await act(async () => button("Change server").click());

    expect(onChangeServer).toHaveBeenCalledTimes(1);
    expect(onEvent).toHaveBeenCalledTimes(1);
    const request = onChangeServer.mock.calls[0][0];
    expect(request).toMatchObject({
      componentId: "component-t",
      settings: { module: "SIMUL", serverId: "missing", table: "prices" },
    });
    expect((onEvent.mock.calls[0][0] as CustomEvent).detail).toBe(request);

    await act(async () => {
      expect(request.setServerId("server-a")).toBe(true);
    });
    expect(lastSettings()).toEqual({
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
    });
    expect(container.querySelector("[role='alert']")).toBeNull();
    expect(getTableSchema).toHaveBeenCalledTimes(1);
    expect(container.querySelector("[data-columns]")).not.toBeNull();
  });

  it("keeps tableState when the server is changed", async () => {
    const onChangeServer =
      vi.fn<(request: VuuTableChangeServerRequest) => void>();
    await renderTable(
      {
        module: "SIMUL",
        serverId: "missing",
        table: "prices",
        tableState: { config: { columns: [{ name: "ric" }] } },
      },
      onChangeServer,
    );
    await act(async () => button("Change server").click());
    await act(async () => {
      onChangeServer.mock.calls[0][0].setServerId("server-a");
    });
    expect(
      container.querySelector("[data-columns]")?.getAttribute("data-columns"),
    ).toBe("ric");
    expect(lastSettings()).toMatchObject({
      serverId: "server-a",
      tableState: { config: { columns: [{ name: "ric" }] } },
    });

    await act(async () => {
      tableProps.mock.lastCall?.[0].onConfigChange?.(
        { columns: [{ name: "price" }] } as TableConfig,
        "column-removed" as never,
      );
    });
    expect(lastSettings()).toEqual({
      module: "SIMUL",
      serverId: "server-a",
      table: "prices",
      tableState: { config: { columns: [{ name: "price" }] } },
    });
  });
});
