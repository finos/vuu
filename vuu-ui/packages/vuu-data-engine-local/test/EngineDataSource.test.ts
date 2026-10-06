import { describe, expect, it, vi } from "vitest";
import type {
  DataSourceRow,
  DataSourceSubscribeCallback,
  TableSchema,
} from "@vuu-ui/vuu-data-types";
import { Range } from "@vuu-ui/vuu-utils";
import { EngineDataSource } from "../src/EngineDataSource";
import { RuntimeVisualLink } from "../src/RuntimeVisualLink";
import { buildDataColumnMapFromSchema, Table } from "../src/Table";

const KEY = 6;
const DATA = 10;

const schema: TableSchema = {
  columns: [
    { name: "id", serverDataType: "string" },
    { name: "ccy", serverDataType: "string" },
    { name: "price", serverDataType: "double" },
    { name: "qty", serverDataType: "int" },
  ],
  key: "id",
  table: { module: "TEST", table: "orders" },
};

const createTable = () =>
  new Table(
    schema,
    [
      ["1", "USD", 100, 10],
      ["2", "EUR", 300, 20],
      ["3", "USD", 200, 30],
      ["4", "GBP", 400, 40],
      ["5", "EUR", 50, 50],
    ],
    buildDataColumnMapFromSchema(schema),
  );

const createDataSource = (table = createTable()) =>
  new EngineDataSource({ columnDescriptors: schema.columns, table });

const lastRows = (callback: ReturnType<typeof vi.fn>): DataSourceRow[] => {
  for (let i = callback.mock.calls.length - 1; i >= 0; i--) {
    const [message] = callback.mock.calls[i];
    if (message.type === "viewport-update" && message.rows) {
      return message.rows;
    }
  }
  return [];
};

const rowKeys = (dataSource: EngineDataSource) => {
  const keys: string[] = [];
  for (let i = 0; i < dataSource.size; i++) {
    keys.push(dataSource.getRowAtIndex(i)?.[KEY] as string);
  }
  return keys;
};

const nextFrame = () => new Promise((resolve) => setTimeout(resolve, 20));

describe("EngineDataSource", () => {
  describe("subscribe", () => {
    it("sends subscribed message, then rows in range", async () => {
      const dataSource = createDataSource();
      const callback = vi.fn<DataSourceSubscribeCallback>();
      await dataSource.subscribe({ range: Range(0, 3) }, callback);
      expect(callback.mock.calls[0][0].type).toBe("subscribed");
      const rows = lastRows(callback);
      expect(rows).toHaveLength(3);
      expect(rows.map((r) => r[KEY])).toEqual(["1", "2", "3"]);
      expect(rows[0].slice(DATA)).toEqual(["1", "USD", 100, 10]);
      expect(dataSource.size).toBe(5);
    });

    it("sends only rows newly in range when range changes", async () => {
      const dataSource = createDataSource();
      const callback = vi.fn<DataSourceSubscribeCallback>();
      await dataSource.subscribe({ range: Range(0, 3) }, callback);
      callback.mockClear();
      dataSource.range = Range(2, 5);
      const rows = lastRows(callback);
      expect(rows.map((r) => r[0])).toEqual([3, 4]);
    });

    it("sends ticking updates for rows in range", async () => {
      const table = createTable();
      const dataSource = createDataSource(table);
      const callback = vi.fn<DataSourceSubscribeCallback>();
      await dataSource.subscribe({ range: Range(0, 5) }, callback);
      callback.mockClear();
      table.update("2", "price", 301);
      await Promise.resolve();
      const rows = lastRows(callback);
      expect(rows).toHaveLength(1);
      expect(rows[0][KEY]).toBe("2");
      expect(rows[0][DATA + 2]).toBe(301);
    });

    it("sends nothing while suspended, full range on resume", async () => {
      const table = createTable();
      const dataSource = createDataSource(table);
      const callback = vi.fn<DataSourceSubscribeCallback>();
      await dataSource.subscribe({ range: Range(0, 10) }, callback);
      dataSource.suspend();
      callback.mockClear();
      table.insert(["6", "JPY", 600, 60]);
      await Promise.resolve();
      expect(callback).not.toHaveBeenCalled();
      dataSource.resume();
      expect(lastRows(callback)).toHaveLength(6);
    });
  });

  describe("sort and filter", () => {
    it("sorts", () => {
      const dataSource = createDataSource();
      dataSource.sort = { sortDefs: [{ column: "price", sortType: "D" }] };
      expect(rowKeys(dataSource)).toEqual(["4", "2", "3", "1", "5"]);
    });

    it("multi-column sorts", () => {
      const dataSource = createDataSource();
      dataSource.sort = {
        sortDefs: [
          { column: "ccy", sortType: "A" },
          { column: "price", sortType: "D" },
        ],
      };
      expect(rowKeys(dataSource)).toEqual(["2", "5", "4", "3", "1"]);
    });

    it("filters", () => {
      const dataSource = createDataSource();
      dataSource.filter = { filter: 'ccy = "USD"' };
      expect(rowKeys(dataSource)).toEqual(["1", "3"]);
    });

    it("composes baseFilter with filter", () => {
      const dataSource = createDataSource();
      dataSource.baseFilter = { filter: "price > 99" };
      dataSource.filter = { filter: 'ccy = "EUR"' };
      expect(rowKeys(dataSource)).toEqual(["2"]);
      dataSource.filter = { filter: "" };
      expect(rowKeys(dataSource)).toEqual(["1", "2", "3", "4"]);
    });

    it("maintains filter as table changes", () => {
      const table = createTable();
      const dataSource = createDataSource(table);
      dataSource.filter = { filter: 'ccy = "USD"' };
      table.insert(["6", "USD", 1, 1]);
      table.update("1", "ccy", "GBP");
      expect(rowKeys(dataSource).sort()).toEqual(["3", "6"]);
    });

    it("emits resize when filter changes size", async () => {
      const dataSource = createDataSource();
      const callback = vi.fn<DataSourceSubscribeCallback>();
      await dataSource.subscribe({ range: Range(0, 10) }, callback);
      const onResize = vi.fn();
      dataSource.on("resize", onResize);
      dataSource.filter = { filter: 'ccy = "USD"' };
      await nextFrame();
      expect(onResize.mock.calls[0][0]).toBe(2);
    });
  });

  describe("groupBy", () => {
    it("groups and expands", async () => {
      const dataSource = createDataSource();
      await dataSource.subscribe({ range: Range(0, 10) }, vi.fn());
      dataSource.groupBy = ["ccy"];
      expect(dataSource.size).toBe(3);
      const groupRows = [0, 1, 2].map((i) => dataSource.getRowAtIndex(i));
      expect(groupRows.every((row) => row?.[2] === false)).toBe(true);
      const usd = groupRows.find((row) => row?.[DATA + 1] === "USD");
      expect(usd?.[5]).toBe(2);
      dataSource.openTreeNode(usd?.[KEY] as string);
      expect(dataSource.size).toBe(5);
      dataSource.closeTreeNode(usd?.[KEY] as string);
      expect(dataSource.size).toBe(3);
    });

    it("removing groupBy restores flat rows", () => {
      const dataSource = createDataSource();
      dataSource.groupBy = ["ccy"];
      dataSource.groupBy = [];
      expect(rowKeys(dataSource)).toEqual(["1", "2", "3", "4", "5"]);
    });
  });

  describe("selection", () => {
    it("selects rows and reports selected values", async () => {
      const dataSource = createDataSource();
      const callback = vi.fn<DataSourceSubscribeCallback>();
      await dataSource.subscribe({ range: Range(0, 10) }, callback);
      const onSelect = vi.fn();
      dataSource.on("row-selection", onSelect);
      dataSource.select({
        type: "SELECT_ROW",
        preserveExistingSelection: false,
        rowKey: "1",
      });
      dataSource.select({
        type: "SELECT_ROW",
        preserveExistingSelection: true,
        rowKey: "3",
      });
      expect(onSelect).toHaveBeenLastCalledWith(2);
      expect(dataSource.getSelectedRowIds().sort()).toEqual(["1", "3"]);
      expect([...dataSource.getSelectedValues("ccy")]).toEqual(["USD"]);
      dataSource.select({ type: "DESELECT_ALL" });
      expect(dataSource.selectedRowsCount).toBe(0);
    });

    it("selects all", async () => {
      const dataSource = createDataSource();
      await dataSource.subscribe({ range: Range(0, 10) }, vi.fn());
      dataSource.select({ type: "SELECT_ALL" });
      expect(dataSource.selectedRowsCount).toBe(5);
    });
  });

  describe("visual link", () => {
    it("filters child by values selected in parent", async () => {
      const parent = createDataSource();
      const child = createDataSource();
      await parent.subscribe({ range: Range(0, 10) }, vi.fn());
      await child.subscribe({ range: Range(0, 10) }, vi.fn());
      const link = new RuntimeVisualLink(child, parent, "ccy", "ccy");
      parent.select({
        type: "SELECT_ROW",
        preserveExistingSelection: false,
        rowKey: "2",
      });
      expect(rowKeys(child)).toEqual(["2", "5"]);

      // link filter composes with client filter
      child.filter = { filter: "price > 100" };
      expect(rowKeys(child)).toEqual(["2"]);

      parent.select({ type: "DESELECT_ALL" });
      expect(rowKeys(child)).toEqual(["2", "3", "4"]);

      link.remove();
      child.filter = { filter: "" };
      expect(child.size).toBe(5);
    });
  });

  describe("freeze", () => {
    it("excludes rows inserted after freeze", async () => {
      const tsSchema: TableSchema = {
        ...schema,
        columns: schema.columns.concat(
          { name: "vuuCreatedTimestamp", serverDataType: "long" },
          { name: "vuuUpdatedTimestamp", serverDataType: "long" },
        ),
      };
      const table = new Table(
        tsSchema,
        [["1", "USD", 100, 10, 0, 0]],
        buildDataColumnMapFromSchema(tsSchema),
      );
      const dataSource = new EngineDataSource({
        columnDescriptors: tsSchema.columns,
        table,
      });
      await dataSource.subscribe({ range: Range(0, 10) }, vi.fn());
      await new Promise((resolve) => setTimeout(resolve, 2));
      dataSource.freeze();
      await new Promise((resolve) => setTimeout(resolve, 2));
      table.insert(["2", "EUR", 1, 1, 0, 0]);
      expect(dataSource.size).toBe(1);
      dataSource.unfreeze();
      expect(dataSource.size).toBe(2);
    });
  });
});
