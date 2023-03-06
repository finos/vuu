import { ServerToClientCreateViewPortSuccess } from "@finos/vuu-protocol-types";
import { describe, expect, vi, it } from "vitest";
import { ServerProxySubscribeMessage } from "../src";
import { Viewport } from "../src/server-proxy/viewport";
import { createSubscription, createTableRows, sizeRow } from "./test-utils";

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

  describe("pending range requests", () => {
    it("holds requests in pending queue, marking them when acked, until first rows received", () => {
      const vp = new Viewport({
        ...constructor_options,
        bufferSize: 10,
        range: { from: 0, to: 10 },
      });
      const [, serverSubscription] = createSubscription();

      vp.handleSubscribed(serverSubscription.body);

      vp.updateRows([sizeRow(), ...createTableRows("server-vp-1", 0, 20)]);

      vp.rangeRequest("1", { from: 50, to: 60 });
      const pendingRangeRequests = vp["pendingRangeRequests"];

      expect(pendingRangeRequests).toHaveLength(1);
      expect(pendingRangeRequests[0].acked).toBeUndefined();

      vp.completeOperation("1", 50, 60);
      expect(pendingRangeRequests).toHaveLength(1);
      expect(pendingRangeRequests[0].acked).toEqual(true);

      vp.updateRows(createTableRows("server-vp-1", 50, 60));

      expect(pendingRangeRequests).toHaveLength(0);
    });
  });

  describe("rangeRequestAlreadyPending", () => {
    it("tests range requests against last pending server request", () => {
      const vp = new Viewport({
        ...constructor_options,
        bufferSize: 10,
        range: { from: 0, to: 10 },
      });
      const [, serverSubscription] = createSubscription();
      vp.handleSubscribed(serverSubscription.body);

      vp.updateRows([sizeRow(), ...createTableRows("server-vp-1", 0, 20)]);
      // bufferSize = 10, so range will be expanded +/-5 => [45-65]
      vp.rangeRequest("1", { from: 50, to: 60 });
      // vp.completeOperation("1", 50, 60);

      expect(vp["rangeRequestAlreadyPending"]({ from: 0, to: 10 })).toEqual(
        false
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 0, to: 50 })).toEqual(
        false
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 50, to: 60 })).toEqual(
        true
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 52, to: 62 })).toEqual(
        true
      );
      // this one breaches the bufferSize 25% threshold
      expect(vp["rangeRequestAlreadyPending"]({ from: 52, to: 63 })).toEqual(
        false
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 60, to: 70 })).toEqual(
        false
      );
    });

    it("tests range requests against multiple pending server requests", () => {
      const vp = new Viewport({
        ...constructor_options,
        bufferSize: 10,
        range: { from: 0, to: 10 },
      });
      const [, serverSubscription] = createSubscription();
      vp.handleSubscribed(serverSubscription.body);

      vp.updateRows([sizeRow(), ...createTableRows("server-vp-1", 0, 20)]);
      // bufferSize = 10, so range will be expanded +/-5 => [45-65]
      vp.rangeRequest("1", { from: 50, to: 60 });
      vp.completeOperation("1", 50, 60);
      vp.rangeRequest("2", { from: 60, to: 70 });
      vp.completeOperation("2", 60, 70);

      expect(vp["rangeRequestAlreadyPending"]({ from: 50, to: 60 })).toEqual(
        true
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 52, to: 62 })).toEqual(
        true
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 52, to: 63 })).toEqual(
        true
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 50, to: 70 })).toEqual(
        true
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 50, to: 72 })).toEqual(
        true
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 50, to: 73 })).toEqual(
        false
      );
      expect(vp["rangeRequestAlreadyPending"]({ from: 70, to: 80 })).toEqual(
        false
      );
    });
  });
});
