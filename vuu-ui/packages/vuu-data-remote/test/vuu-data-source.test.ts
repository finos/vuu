/* eslint-disable @typescript-eslint/ban-ts-comment */
// Important: This import must come before VuuDataSource import
import "./global-mocks";
import { beforeEach, describe, expect, it, vi } from "vitest";
//----------------------------------------------------
import {
  ServerAPI,
  WithBaseFilter,
  WithFullConfig,
} from "@vuu-ui/vuu-data-types";
import {
  LinkDescriptorWithLabel,
  VuuSortCol,
} from "@vuu-ui/vuu-protocol-types";
import { VuuDataSource } from "../src/VuuDataSource";
import ConnectionManager from "../src/ConnectionManager";
import { Range } from "@vuu-ui/vuu-utils";

type ConfigType = WithBaseFilter<WithFullConfig>;

vi.mock("../src/ConnectionManager", () => ({
  default: {
    serverAPI: new Promise<ServerAPI>((resolve) => {
      // @ts-ignore
      resolve({
        send: vi.fn(),
        subscribe: vi.fn(),
      });
    }),
  },
}));

const defaultSubscribeOptions = {
  aggregations: [],
  bufferSize: 100,
  columns: [],
  filterSpec: { filter: "" },
  groupBy: [],
  range: { from: 0, to: 0 },
  sort: { sortDefs: [] },
  visualLink: undefined,
};

describe("VuuDataSource", () => {
  const table = { module: "SIMUL", table: "instruments" };

  beforeEach(async () => {
    vi.clearAllMocks();
  });

  describe("constructor", () => {
    it("cannot be created without table", () => {
      try {
        // @ts-ignore
        new VuuDataSource();
        throw Error("RemoteDataSource was created without table");
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).to.not.eq(
          "RemoteDataSource was created without table",
        );
      }
      try {
        // @ts-ignore
        new VuuDataSource({});
        throw Error("RemoteDataSource was created without table");
      } catch (err) {
        expect(err).toBeDefined();
        expect(err.message).to.not.eq(
          "RemoteDataSource was created without table",
        );
      }
      try {
        // @ts-ignore
        new VuuDataSource({
          bufferSize: 100,
          aggregations: [],
          columns: ["test1", "test2"],
        });
        throw Error("RemoteDataSource was created without table");
      } catch (err) {
        expect(err.message).toEqual(
          "RemoteDataSource constructor called without table",
        );
      }
    });

    it("requires only Table for successful construction", () => {
      const dataSource = new VuuDataSource({
        table: { module: "SIMUL", table: "instruments" },
      });
      expect(dataSource).toBeDefined();
    });

    it("stores constructor props as properties", () => {
      const columns = ["col1", "col2"];
      const filterSpec = { filter: `ccy="EUR"` };
      const sort = {
        sortDefs: [{ column: "col1", sortType: "A" } as VuuSortCol],
      };
      const dataSource = new VuuDataSource({
        columns,
        filterSpec,
        sort,
        table: { module: "SIMUL", table: "instruments" },
      });

      expect(dataSource.columns).toEqual(columns);
      expect(dataSource.filter).toEqual(filterSpec);
      expect(dataSource.sort).toEqual(sort);
    });
  });

  describe("subscribe", () => {
    const callback = () => undefined;

    it("assigns viewport id if not passed, defaults all other options, server resolved immediately", async () => {
      const dataSource = new VuuDataSource({ table });
      await dataSource.subscribe({}, callback);

      const serverAPI = await ConnectionManager.serverAPI;
      expect(serverAPI.subscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: expect.stringMatching(/^\S{21}$/),
        },
        expect.any(Function),
      );
    });

    it("uses options supplied at creation, if not passed with subscription", async () => {
      const aggregations = [{ column: "test", aggType: 1 } as const];
      const columns = ["test"];
      const filterSpec = { filter: 'ccy="EUR"' };
      const groupBy = ["test"];
      const sort = {
        sortDefs: [{ column: "test", sortType: "A" } as const],
      };
      const visualLink: LinkDescriptorWithLabel = {
        link: {
          fromColumn: "ccy",
          toTable: "test",
          toColumn: "test",
        },
        parentClientVpId: "test",
        parentVpId: "test",
      };

      const dataSource = new VuuDataSource({
        aggregations,
        bufferSize: 200,
        columns,
        filterSpec,
        groupBy,
        sort,
        table,
        visualLink,
      });

      const serverAPI = await ConnectionManager.serverAPI;

      await dataSource.subscribe({}, callback);

      expect(serverAPI.subscribe).toHaveBeenCalledWith(
        {
          aggregations,
          bufferSize: 200,
          columns,
          filterSpec: {
            ...filterSpec,
            filterStruct: {
              column: "ccy",
              op: "=",
              value: "EUR",
            },
          },
          groupBy,
          range: { from: 0, to: 0 },
          sort,
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: expect.stringMatching(/^\S{21}$/),
        },
        expect.any(Function),
      );
    });
    it("uses options passed with subscription, in preference to objects passed at creation", async () => {
      const aggregations = [{ column: "test", aggType: 1 } as const];
      const columns = ["test"];
      const filterSpec = { filter: 'ccy="EUR"' };
      const groupBy = ["test"];
      const sort = { sortDefs: [{ column: "test", sortType: "A" } as const] };

      const aggregations2 = [{ column: "test", aggType: 1 } as const];
      const columns2 = ["test"];
      const filter2 = { filter: 'ccy="EUR"' };
      const groupBy2 = ["test"];
      const sort2 = { sortDefs: [{ column: "test", sortType: "A" } as const] };

      const dataSource = new VuuDataSource({
        aggregations,
        columns,
        filterSpec,
        groupBy,
        sort,
        table,
        viewport: "test-1",
      });

      const serverAPI = await ConnectionManager.serverAPI;

      await dataSource.subscribe(
        {
          aggregations: aggregations2,
          columns: columns2,
          filterSpec: filter2,
          groupBy: groupBy2,
          sort: sort2,
          viewport: "test-2",
        },
        callback,
      );

      expect(serverAPI.subscribe).toHaveBeenCalledWith(
        {
          aggregations,
          bufferSize: 100,
          columns: columns2,
          filterSpec: {
            ...filter2,
            filterStruct: {
              column: "ccy",
              op: "=",
              value: "EUR",
            },
          },
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
        expect.any(Function),
      );
    });

    it("subscribes with latest version of attributes, including when there are set whilst awaiting server", async () => {
      const serverAPI = await ConnectionManager.serverAPI;

      const dataSource = new VuuDataSource({ table });

      const pendingSubscribe = dataSource.subscribe(
        { range: Range(0, 20), groupBy: ["test1"] },
        callback,
      );

      // dataSource is blocked inside subscribe function, awaiting server ...
      dataSource.groupBy = ["test2"];
      dataSource.range = Range(0, 50);

      await pendingSubscribe;

      expect(serverAPI.subscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          groupBy: ["test2"],
          range: { from: 0, to: 50 },
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: expect.stringMatching(/^\S{21}$/),
        },
        expect.any(Function),
      );
    });
  });

  describe("prop setters", () => {
    const callback = () => undefined;
    it("calls server when range set", async () => {
      const serverAPI = await ConnectionManager.serverAPI;

      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const range = Range(0, 20);
      dataSource.range = range;

      expect(serverAPI.send).toHaveBeenCalledWith({
        type: "setViewRange",
        range,
        viewport: "vp1",
      });
    });
    it("calls server when aggregations set", async () => {
      const { send } = await ConnectionManager.serverAPI;

      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const aggregations = [{ column: "col1", aggType: 1 } as const];
      dataSource.aggregations = aggregations;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations,
          columns: [],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("calls server when columns set", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const columns = ["col1", "col2"];
      dataSource.columns = columns;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: ["col1", "col2"],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });
    it("calls server when filter set", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const filterSpec = { filter: 'exchange="SETS"' };
      dataSource.filter = filterSpec;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: {
            filter: 'exchange="SETS"',
            filterStruct: {
              column: "exchange",
              op: "=",
              value: "SETS",
            },
          },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("calls server when baseFilter set", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const baseFilterSpec = { filter: 'exchange="SETS"' };
      dataSource.baseFilter = baseFilterSpec;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: {
            filter: 'exchange="SETS"',
            filterStruct: {
              column: "exchange",
              op: "=",
              value: "SETS",
            },
          },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("calls server when groupBy set, using config message", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const groupBy = ["col1", "col2"];
      dataSource.groupBy = groupBy;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: {
            filter: "",
          },
          groupBy,
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("calls server when config set, if config has changed", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      let config: ConfigType = {
        aggregations: [] as const,
        columns: [],
        filterSpec: { filter: "" },
        groupBy: [],
        sort: { sortDefs: [{ column: "col1", sortType: "A" }] },
      };

      dataSource.config = config;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [{ column: "col1", sortType: "A" }] },
        },
        viewport: "vp1",
      });

      config = {
        aggregations: [],
        columns: ["col1", "col2", "col3"],
        filterSpec: { filter: "" },
        groupBy: [],
        sort: { sortDefs: [] },
      };

      dataSource.config = config;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: ["col1", "col2", "col3"],
          filterSpec: { filter: "" },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("parses filterStruct, if filterQuery only is provided", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const config: ConfigType = {
        aggregations: [],
        columns: [],
        filterSpec: { filter: 'ccy = "EUR"' },
        groupBy: [],
        sort: { sortDefs: [] },
      };

      dataSource.config = config;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: {
            filter: 'ccy = "EUR"',
            filterStruct: {
              column: "ccy",
              op: "=",
              value: "EUR",
            },
          },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("parses filterStruct, if both baseFilter and filter are provided", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const config: ConfigType = {
        aggregations: [],
        baseFilterSpec: { filter: 'ccy = "EUR"' },
        columns: [],
        filterSpec: { filter: 'exchange starts "X"' },
        groupBy: [],
        sort: { sortDefs: [] },
      };

      dataSource.config = config;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: {
            filter: 'exchange starts "X" and ccy = "EUR"',
            filterStruct: {
              filters: [
                { column: "exchange", op: "starts", value: "X" },
                { column: "ccy", op: "=", value: "EUR" },
              ],
              op: "and",
            },
          },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("parses filterStruct, if baseFilter only is provided", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const config: ConfigType = {
        aggregations: [],
        baseFilterSpec: { filter: 'ccy = "GBP"' },
        columns: [],
        filterSpec: { filter: "" },
        groupBy: [],
        sort: { sortDefs: [] },
      };

      dataSource.config = config;

      expect(send).toHaveBeenCalledWith({
        type: "config",
        config: {
          aggregations: [],
          columns: [],
          filterSpec: {
            filter: 'ccy = "GBP"',
            filterStruct: { column: "ccy", op: "=", value: "GBP" },
          },
          groupBy: [],
          sort: { sortDefs: [] },
        },
        viewport: "vp1",
      });
    });

    it("does not call server when config set, if config has not changed", async () => {
      const { send } = await ConnectionManager.serverAPI;
      const dataSource = new VuuDataSource({ table, viewport: "vp1" });
      await dataSource.subscribe({}, callback);

      const config: ConfigType = {
        aggregations: [],
        baseFilterSpec: { filter: "" },
        columns: [],
        filterSpec: { filter: "" },
        groupBy: [],
        sort: { sortDefs: [{ column: "col1", sortType: "A" }] },
      };

      dataSource.config = config;
      send["mockClear"]();

      dataSource.config = config;

      expect(send).toHaveBeenCalledTimes(0);
    });
  });

  describe("autoSubscribe Columns", () => {
    it("includes autosubscribe columns in subscription", async () => {
      const callback = () => undefined;
      const dataSource = new VuuDataSource({
        autosubscribeColumns: ["col4"],
        columns: ["col1", "col2", "col3"],
        table,
      });
      await dataSource.subscribe({}, callback);

      const serverAPI = await ConnectionManager.serverAPI;
      expect(serverAPI.subscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          columns: ["col1", "col2", "col3", "col4"],
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: expect.stringMatching(/^\S{21}$/),
        },
        expect.any(Function),
      );
    });

    it("handles dupe autosubscribe columns", async () => {
      const callback = () => undefined;
      const dataSource = new VuuDataSource({
        autosubscribeColumns: ["col1", "col4", "col3"],
        columns: ["col1", "col2", "col3"],
        table,
      });
      await dataSource.subscribe({}, callback);

      const serverAPI = await ConnectionManager.serverAPI;
      expect(serverAPI.subscribe).toHaveBeenCalledWith(
        {
          ...defaultSubscribeOptions,
          columns: ["col1", "col2", "col3", "col4"],
          table: {
            module: "SIMUL",
            table: "instruments",
          },
          viewport: expect.stringMatching(/^\S{21}$/),
        },
        expect.any(Function),
      );
    });

    it("includes autosubscribe columns in columns prop", async () => {
      const dataSource = new VuuDataSource({
        autosubscribeColumns: ["col1", "col4", "col3"],
        columns: ["col1", "col2", "col3"],
        table,
      });
      expect(dataSource.columns).toEqual(["col1", "col2", "col3", "col4"]);
    });

    it("allows update to columns, correctly allowing for autoSubscribe colmns", async () => {
      const dataSource = new VuuDataSource({
        autosubscribeColumns: ["col1", "col4"],
        columns: ["col1", "col2", "col3"],
        table,
      });
      expect(dataSource.columns).toEqual(["col1", "col2", "col3", "col4"]);

      dataSource.columns = ["col1", "col2"];

      expect(dataSource.columns).toEqual(["col1", "col2", "col4"]);
    });
  });
});
