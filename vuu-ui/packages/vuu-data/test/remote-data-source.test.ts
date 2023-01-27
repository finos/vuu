/* eslint-disable @typescript-eslint/ban-ts-comment */
// Important: This import must come before RemoteDataSource import
import "./global-mocks";
import * as connectionExports from "../src/connection-manager";
//----------------------------------------------------
import { VuuSortCol } from "@finos/vuu-protocol-types";
import { beforeEach, describe, expect, it, vi } from "vitest";

const defaultSubscribeOptions = {
  aggregations: [],
  bufferSize: 100,
  columns: [],
  filter: { filter: "" },
  groupBy: [],
  range: { from: 0, to: 0 },
  sort: { sortDefs: [] },
  visualLink: undefined,
};

describe("RemoteDataSource", () => {
  let RemoteDataSource;
  const table = { module: "SIMUL", table: "instruments" };

  beforeEach(async () => {
    vi.clearAllMocks();
    ({ RemoteDataSource } = await import("../src/remote-data-source"));
  });

  describe("constructor", () => {
    it("cannot be created without table", () => {
      try {
        // @ts-ignore
        new RemoteDataSource();
        throw Error("RemoteDataSource was created without table");
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).to.not.eq(
          "RemoteDataSource was created without table"
        );
      }
      try {
        // @ts-ignore
        new RemoteDataSource({});
        throw Error("RemoteDataSource was created without table");
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).to.not.eq(
          "RemoteDataSource was created without table"
        );
      }
      try {
        // @ts-ignore
        new RemoteDataSource({
          bufferSize: 100,
          aggregations: [],
          columns: ["test1", "test2"],
        });
        throw Error("RemoteDataSource was created without table");
      } catch (err) {
        expect(err.message).toEqual(
          "RemoteDataSource constructor called without table"
        );
      }
    });

    it("requires only Table for successful construction", () => {
      const dataSource = new RemoteDataSource({
        table: { module: "SIMUL", table: "instruments" },
      });
      expect(dataSource).toBeDefined();
    });

    it("stores constructor props as properties", () => {
      const columns = ["col1", "col2"];
      const filter = { filter: `ccy="EUR"` };
      const sort = {
        sortDefs: [{ column: "col1", sortType: "A" } as VuuSortCol],
      };
      const dataSource = new RemoteDataSource({
        columns,
        filter,
        sort,
        table: { module: "SIMUL", table: "instruments" },
      });
      expect(dataSource.columns).toEqual(columns);
      expect(dataSource.filter).toEqual(filter);
      expect(dataSource.sort).toEqual(sort);
    });
  });

  describe("subscribe", () => {
    const callback = () => undefined;

    it("assigns viewport id if not passed, defaults all other options, server resolved immediately", async () => {
      const serverSubscribe = vi.fn();
      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        () =>
          new Promise<connectionExports.ServerAPI>((resolve) => {
            // @ts-ignore
            resolve({
              subscribe: serverSubscribe,
            });
          })
      );
      const dataSource = new RemoteDataSource({ table });
      await dataSource.subscribe({}, callback);

      expect(serverSubscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: "uuid-1",
        },
        expect.any(Function)
      );
    });

    it("assigns viewport id if not passed, defaults all other options, server resolved previously", async () => {
      const serverSubscribe = vi.fn();
      const resolvedPromise = Promise.resolve({ subscribe: serverSubscribe });

      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => resolvedPromise
      );
      const dataSource = new RemoteDataSource({ table });

      await dataSource.subscribe({}, callback);

      expect(serverSubscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: "uuid-1",
        },
        expect.any(Function)
      );
    });

    it("assigns viewport id if not passed, defaults all other options, server resolved later", async () => {
      const serverSubscribe = vi.fn();
      let resolvePromise;

      const pr = new Promise<connectionExports.ServerAPI>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(() => pr);
      const dataSource = new RemoteDataSource({ table });

      setTimeout(() => resolvePromise({ subscribe: serverSubscribe }), 50);

      await dataSource.subscribe({}, callback);

      expect(serverSubscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: "uuid-1",
        },
        expect.any(Function)
      );
    });

    it("uses options supplied at creation, if not passed with subscription", async () => {
      const serverSubscribe = vi.fn();
      const resolvedPromise = Promise.resolve({ subscribe: serverSubscribe });
      const aggregations = [{ column: "test", aggType: 1 }];
      const columns = ["test"];
      const filter = { filter: 'ccy="EUR"' };
      const groupBy = ["test"];
      const sort = { sortDefs: [{ column: "test", sortTyle: "A" }] };
      const visualLink = { colName: "test" };

      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => resolvedPromise
      );
      const dataSource = new RemoteDataSource({
        aggregations,
        bufferSize: 200,
        columns,
        filter,
        groupBy,
        sort,
        table,
        "visual-link": visualLink,
      });

      await dataSource.subscribe({}, callback);

      expect(serverSubscribe).toHaveBeenCalledWith(
        {
          aggregations,
          bufferSize: 200,
          columns,
          filter,
          groupBy,
          range: { from: 0, to: 0 },
          sort,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: "uuid-1",
          visualLink,
        },
        expect.any(Function)
      );
    });
    it("uses options passed with subscription, in preference to objects passed at creation", async () => {
      const serverSubscribe = vi.fn();
      const resolvedPromise = Promise.resolve({ subscribe: serverSubscribe });

      const aggregations = [{ column: "test", aggType: 1 }];
      const columns = ["test"];
      const filter = { filter: 'ccy="EUR"' };
      const groupBy = ["test"];
      const sort = { sortDefs: [{ column: "test", sortTyle: "A" }] };

      const aggregations2 = [{ column: "test", aggType: 1 }];
      const columns2 = ["test"];
      const filter2 = { filter: 'ccy="EUR"' };
      const groupBy2 = ["test"];
      const sort2 = { sortDefs: [{ column: "test", sortTyle: "A" }] };

      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => resolvedPromise
      );
      const dataSource = new RemoteDataSource({
        aggregations,
        columns,
        filter,
        groupBy,
        sort,
        table,
        viewport: "test-1",
      });

      await dataSource.subscribe(
        {
          aggregations: aggregations2,
          columns: columns2,
          filter: filter2,
          groupBy: groupBy2,
          sort: sort2,
          viewport: "test-2",
        },
        callback
      );

      expect(serverSubscribe).toHaveBeenCalledWith(
        {
          aggregations,
          bufferSize: 100,
          columns: columns2,
          filter: filter2,
          groupBy: groupBy2,
          range: { from: 0, to: 0 },
          sort: sort2,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: "test-2",
          visualLink: undefined,
        },
        expect.any(Function)
      );
    });

    it("subscribes with latest version of attributes, including when there are set whilst awaiting server", async () => {
      const serverSubscribe = vi.fn();
      let resolvePromise;

      const pr = new Promise<connectionExports.ServerAPI>((resolve) => {
        resolvePromise = resolve;
      });

      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(() => pr);
      const dataSource = new RemoteDataSource({ table });

      setTimeout(() => {
        // dataSource is blocked inside subscribe function, awaiting server ...
        dataSource.groupBy = ["test2"];
        dataSource.range = { from: 0, to: 50 };
        resolvePromise({ subscribe: serverSubscribe });
      }, 50);

      await dataSource.subscribe(
        { range: { from: 0, to: 20 }, groupBy: ["test1"] },
        callback
      );

      expect(serverSubscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          groupBy: ["test2"],
          range: { from: 0, to: 50 },
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: "uuid-1",
        },
        expect.any(Function)
      );
    });
  });

  describe("prop setters", () => {
    const callback = () => undefined;
    it("calls server when range set", async () => {
      const serverSend = vi.fn();
      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => Promise.resolve({ send: serverSend, subscribe: callback })
      );
      const dataSource = new RemoteDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const range = { from: 0, to: 20 };
      dataSource.range = range;

      expect(serverSend).toHaveBeenCalledWith({
        type: "setViewRange",
        range,
        viewport: "vp1",
      });
    });
    it("calls server when aggregations set", async () => {
      const serverSend = vi.fn();
      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => Promise.resolve({ send: serverSend, subscribe: callback })
      );
      const dataSource = new RemoteDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const aggregations = [{ column: "col1", aggType: 1 }];
      dataSource.aggregations = aggregations;

      expect(serverSend).toHaveBeenCalledWith({
        type: "aggregate",
        aggregations,
        viewport: "vp1",
      });
    });

    it("calls server when columns set", async () => {
      const serverSend = vi.fn();
      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => Promise.resolve({ send: serverSend, subscribe: callback })
      );
      const dataSource = new RemoteDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const columns = ["col1", "col2"];
      dataSource.columns = columns;

      expect(serverSend).toHaveBeenCalledWith({
        type: "setColumns",
        columns,
        viewport: "vp1",
      });
    });
    it("calls server when filter set", async () => {
      const serverSend = vi.fn();
      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => Promise.resolve({ send: serverSend, subscribe: callback })
      );
      const dataSource = new RemoteDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const filter = { filter: 'exchange="SETS"' };
      dataSource.filter = filter;

      expect(serverSend).toHaveBeenCalledWith({
        type: "filter",
        filter,
        viewport: "vp1",
      });
    });
    it("calls server when groupBy set", async () => {
      const serverSend = vi.fn();
      vi.spyOn(connectionExports, "getServerAPI").mockImplementation(
        // @ts-ignore
        () => Promise.resolve({ send: serverSend, subscribe: callback })
      );
      const dataSource = new RemoteDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const groupBy = ["col1", "col2"];
      dataSource.groupBy = groupBy;

      expect(serverSend).toHaveBeenCalledWith({
        type: "groupBy",
        groupBy,
        viewport: "vp1",
      });
    });
  });
});
