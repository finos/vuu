import { useData } from "@vuu-ui/core";
import type { ServerAPI } from "@vuu-ui/vuu-data-types";
import { act, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it } from "vitest";
import moduleContainer from "../src/core/module/ModuleContainer";
import {
  createLocalVuuServer,
  LocalDataSourceProvider,
} from "../src/local-datasource-provider/LocalDatasourceProvider";
// SIMUL creates tables that BASKET joins, so it must be imported first.
import { simulModule } from "../src/simul/SimulModule";
import { basketModule } from "../src/basket/BasketModule";

type TestServerAPI = Pick<ServerAPI, "getTableList" | "getTableSchema">;

const captureServerAPI = async (
  Provider: ReturnType<typeof createLocalVuuServer>["DataSourceProvider"],
) => {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  const container = document.createElement("div");
  const root = createRoot(container);
  let serverAPI: TestServerAPI | undefined;
  const Probe = () => {
    const { getServerAPI } = useData();
    useEffect(() => {
      getServerAPI().then((api) => {
        serverAPI = api as TestServerAPI;
      });
    }, [getServerAPI]);
    return null;
  };
  await act(async () => {
    root.render(
      <Provider>
        <Probe />
      </Provider>,
    );
  });
  act(() => root.unmount());
  if (!serverAPI) {
    throw Error("serverAPI was not provided");
  }
  return serverAPI;
};

describe("createLocalVuuServer", () => {
  afterEach(() => {
    globalThis.IS_REACT_ACT_ENVIRONMENT = false;
  });

  it("registers its modules and describes the server", () => {
    const server = createLocalVuuServer({
      connectionId: "simul",
      description: "Simulated market data",
      modules: [simulModule],
      title: "Simulation",
    });

    expect(moduleContainer.has("SIMUL")).toBe(true);
    expect(server).toMatchObject({
      connectionId: "simul",
      description: "Simulated market data",
      title: "Simulation",
    });
  });

  it("publishes only the tables of its own modules", async () => {
    const simul = createLocalVuuServer({
      connectionId: "simul",
      modules: [simulModule],
      title: "Simulation",
    });
    createLocalVuuServer({
      connectionId: "basket",
      modules: [basketModule],
      title: "Baskets",
    });

    const serverAPI = await captureServerAPI(simul.DataSourceProvider);
    const { tables } = await serverAPI.getTableList();

    expect(tables.length).toBeGreaterThan(0);
    expect(tables.every(({ module }) => module === "SIMUL")).toBe(true);
    await expect(
      serverAPI.getTableSchema({ module: "SIMUL", table: "instruments" }),
    ).resolves.toMatchObject({
      table: { module: "SIMUL", table: "instruments" },
    });
    await expect(
      serverAPI.getTableSchema({ module: "BASKET", table: "basket" }),
    ).rejects.toThrow("module BASKET is not available on this server");
  });

  it("leaves LocalDataSourceProvider covering every registered module", async () => {
    createLocalVuuServer({
      connectionId: "all",
      modules: [simulModule, basketModule],
      title: "All",
    });
    const serverAPI = await captureServerAPI(LocalDataSourceProvider);
    const { tables } = await serverAPI.getTableList();
    const modules = new Set(tables.map(({ module }) => module));

    expect(modules.has("SIMUL")).toBe(true);
    expect(modules.has("BASKET")).toBe(true);
  });
});
