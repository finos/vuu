import { ServerToClientCreateViewPortSuccess } from "@finos/vuu-protocol-types";
import { describe, expect, vi, it } from "vitest";
import { ServerProxySubscribeMessage } from "../src";
import { Viewport } from "../src/server-proxy/viewport";
import "./global-mocks";

const config_options = {
  aggregations: [],
  columns: ["col1"],
  filter: { filter: "" },
  groupBy: [],
  sort: { sortDefs: [] },
};

const vuu_config_options = {
  aggregations: [],
  columns: ["col1"],
  filterSpec: { filter: "" },
  groupBy: [],
  sort: { sortDefs: [] },
};

const vuu_table = { module: "TEST", table: "test-table" };

const constructor_options = {
  ...config_options,
  range: { from: 0, to: 0 },
  table: vuu_table,
  viewport: "vp1",
} as ServerProxySubscribeMessage;

describe("Viewport", () => {
  describe("constructor", () => {
    it("initial status is empty", () => {
      const vp = new Viewport(constructor_options);
      expect(vp.status).toEqual("");
    });
  });

  describe("subscribe", () => {
    it("uses constructor params to construct subscribe message", () => {
      const vp = new Viewport(constructor_options);
      const message = vp.subscribe();
      const {
        filter: { filter },
        viewport,
        range,
        ...rest
      } = constructor_options;

      // default bufferSize is 50
      expect(message).toEqual({
        type: "CREATE_VP",
        ...rest,
        filterSpec: { filter },
        range: { from: 0, to: 50 },
      });
    });
    it("sets status to subscribing", () => {
      const vp = new Viewport(constructor_options);
      vp.subscribe();
      expect(vp.status).toEqual("subscribing");
    });

    it("uses bufferSize when constructing range", () => {
      const vp = new Viewport({
        bufferSize: 100,
        ...constructor_options,
      });
      const message = vp.subscribe();
      const {
        filter: { filter },
        viewport,
        range,
        ...rest
      } = constructor_options;

      // default bufferSize is 50
      expect(message).toEqual({
        type: "CREATE_VP",
        ...rest,
        filterSpec: { filter },
        range: { from: 0, to: 100 },
      });
    });
    it("applies bufferSize to existing range", () => {
      const vp = new Viewport({
        ...constructor_options,
        bufferSize: 100,
        range: { from: 0, to: 100 },
      });
      const message = vp.subscribe();
      const {
        filter: { filter },
        viewport,
        range,
        ...rest
      } = constructor_options;

      expect(message).toEqual({
        type: "CREATE_VP",
        ...rest,
        filterSpec: { filter },
        range: { from: 0, to: 200 },
      });
    });
    it("splits bufferSize around existing range", () => {
      const vp = new Viewport({
        ...constructor_options,
        bufferSize: 100,
        range: { from: 100, to: 200 },
      });
      const message = vp.subscribe();
      const {
        filter: { filter },
        viewport,
        range,
        ...rest
      } = constructor_options;

      expect(message).toEqual({
        type: "CREATE_VP",
        ...rest,
        filterSpec: { filter },
        range: { from: 50, to: 250 },
      });
    });
  });

  describe("subscribed", () => {
    it("sets status to subscribed", () => {
      const vp = new Viewport(constructor_options);
      const vuuMessageBody: ServerToClientCreateViewPortSuccess = {
        ...vuu_config_options,
        range: { from: 0, to: 50 },
        type: "CREATE_VP_SUCCESS",
        table: vuu_table.table,
        viewPortId: "server-vp1",
      };
      vp.handleSubscribed(vuuMessageBody);
      expect(vp.status).toEqual("subscribed");
    });

    it("echos back subscription details, enriching values sent by server", () => {
      const vp = new Viewport(constructor_options);
      const vuuMessageBody: ServerToClientCreateViewPortSuccess = {
        ...vuu_config_options,
        range: { from: 0, to: 50 },
        type: "CREATE_VP_SUCCESS",
        table: vuu_table.table,
        viewPortId: "server-vp1",
      };
      const message = vp.handleSubscribed(vuuMessageBody);

      expect(message).toEqual({
        ...config_options,
        clientViewportId: constructor_options.viewport,
        range: { from: 0, to: 50 },
        tableMeta: null,
        type: "subscribed",
      });
    });
    it("includes tableMeta, when this has been received", () => {
      const vp = new Viewport(constructor_options);
      const vuuMessageBody: ServerToClientCreateViewPortSuccess = {
        ...vuu_config_options,
        range: { from: 0, to: 50 },
        type: "CREATE_VP_SUCCESS",
        table: vuu_table.table,
        viewPortId: "server-vp1",
      };

      vp.setTableMeta(["col1"], ["string"]);

      const message = vp.handleSubscribed(vuuMessageBody);

      expect(message).toEqual({
        ...config_options,
        clientViewportId: constructor_options.viewport,
        range: { from: 0, to: 50 },
        tableMeta: { columns: ["col1"], dataTypes: ["string"] },
        type: "subscribed",
      });
    });
  });
});
