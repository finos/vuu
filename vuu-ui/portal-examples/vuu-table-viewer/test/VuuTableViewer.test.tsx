import {
  AuthenticationProvider,
  DataProvider,
  TableRegistrationContext,
  type TableRegistrationContextValue,
} from "@vuu-ui/core";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VuuTableViewer from "../src/VuuTableViewer";

const tables: VuuTable[] = [{ module: "SIMUL", table: "instruments" }];

const getTableList = vi.fn(async () => ({ tables }));
const getTableSchema = vi.fn(async (_table: VuuTable) => {
  throw Error("schema unavailable");
});

const TestDataProvider = ({ children }: { children: ReactNode }) => (
  <DataProvider
    VuuDataSource={VuuDataSource}
    getServerAPI={async () => ({
      getTableList,
      getTableSchema,
      rpcCall: async () => {
        throw Error("not used");
      },
    })}
  >
    {children}
  </DataProvider>
);

const localServers = [
  { connectionId: "test-source", DataSourceProvider: TestDataProvider },
];

describe("VuuTableViewer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
    getTableList.mockClear();
    getTableSchema.mockClear();
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("registers the tables of its Vuu connection and unregisters on unmount", async () => {
    const registration: TableRegistrationContextValue = {
      registerTables: vi.fn(),
      reportSourceStatus: vi.fn(),
      unregisterTables: vi.fn(),
    };

    await act(async () => {
      root.render(
        <AuthenticationProvider localServers={localServers} mode="local">
          <TableRegistrationContext.Provider value={registration}>
            <AuthenticationProvider
              connection={{ connectionId: "test-source" }}
              mode="vuu-connection"
            >
              <VuuTableViewer />
            </AuthenticationProvider>
          </TableRegistrationContext.Provider>
        </AuthenticationProvider>,
      );
    });

    expect(registration.reportSourceStatus).toHaveBeenNthCalledWith(
      1,
      "test-source",
      "loading",
    );
    expect(registration.registerTables).toHaveBeenCalledWith(
      "test-source",
      tables,
    );
    expect(registration.reportSourceStatus).toHaveBeenNthCalledWith(
      2,
      "test-source",
      "ready",
    );

    await act(async () => root.unmount());
    expect(registration.unregisterTables).toHaveBeenCalledWith("test-source");
    root = createRoot(container);
  });

  it("explains how to use it when opened outside the table browser", async () => {
    await act(async () => {
      root.render(
        <TestDataProvider>
          <VuuTableViewer />
        </TestDataProvider>,
      );
    });

    expect(container.querySelector('[role="status"]')?.textContent).toBe(
      "Select a table in the Vuu Table Browser.",
    );
    expect(getTableList).not.toHaveBeenCalled();
  });

  it.each([
    ["shows", "test-source", 1],
    ["ignores", "other-source", 0],
  ])("%s a selected table from %s", async (_, sourceId, schemaRequests) => {
    const registration: TableRegistrationContextValue = {
      registerTables: vi.fn(),
      reportSourceStatus: vi.fn(),
      selectedTable: { sourceId, table: tables[0] },
      unregisterTables: vi.fn(),
    };

    await act(async () => {
      root.render(
        <AuthenticationProvider localServers={localServers} mode="local">
          <TableRegistrationContext.Provider value={registration}>
            <AuthenticationProvider
              connection={{ connectionId: "test-source" }}
              mode="vuu-connection"
            >
              <VuuTableViewer />
            </AuthenticationProvider>
          </TableRegistrationContext.Provider>
        </AuthenticationProvider>,
      );
    });

    expect(getTableSchema).toHaveBeenCalledTimes(schemaRequests);
    if (schemaRequests) {
      expect(getTableSchema).toHaveBeenCalledWith(tables[0]);
    }
  });
});
