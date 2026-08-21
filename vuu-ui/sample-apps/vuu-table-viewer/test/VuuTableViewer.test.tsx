import {
  DataProvider,
  TableRegistrationContext,
  type TableRegistrationContextValue,
} from "@vuu-ui/core";
import { VuuDataSource } from "@vuu-ui/vuu-data-remote";
import type { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import VuuTableViewer from "../src/VuuTableViewer";

const tables: VuuTable[] = [{ module: "SIMUL", table: "instruments" }];

describe("VuuTableViewer", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it("registers its table list and unregisters on unmount", async () => {
    const registration: TableRegistrationContextValue = {
      registerTables: vi.fn(),
      reportSourceStatus: vi.fn(),
      unregisterTables: vi.fn(),
    };

    await act(async () => {
      root.render(
        <DataProvider
          VuuDataSource={VuuDataSource}
          getServerAPI={async () => ({
            getTableList: async () => ({ tables }),
            getTableSchema: async () => {
              throw Error("not used");
            },
            rpcCall: async () => {
              throw Error("not used");
            },
          })}
        >
          <TableRegistrationContext.Provider value={registration}>
            <VuuTableViewer sourceId="test-source" />
          </TableRegistrationContext.Provider>
        </DataProvider>,
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
});
