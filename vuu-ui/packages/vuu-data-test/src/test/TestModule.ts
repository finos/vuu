import { RpcMenuService, VuuModule } from "../core/module/VuuModule";
import { buildDataColumnMap, Table } from "../Table";
import {
  DefaultColumnGenerator,
  defaultGenerators,
} from "../vuu-row-generator";
import tableContainer from "../core/table/TableContainer";
import { TableSchema } from "@vuu-ui/vuu-data-types";

export type TestTableName =
  | "TestDates"
  | "TwoHundredColumns"
  | "LinkParent"
  | "LinkChild"
  | "ChartTable";

const { RowGenerator } = defaultGenerators;

const generateRows = (tableSchema: TableSchema, count: number) => {
  const columnGenerator = RowGenerator(tableSchema.columns.map((c) => c.name));
  return new Array(count).fill(1).map((_, i) => columnGenerator(i));
};

class TestModule extends VuuModule<TestTableName> {
  #schemas: Record<TestTableName, TableSchema> = {
    TestDates: {
      columns: [
        {
          name: "id",
          serverDataType: "long",
        },
        {
          name: "tradeDate",
          serverDataType: "long",
        },
        {
          name: "settlementDate",
          serverDataType: "long",
        },
      ],
      key: "id",
      table: { module: "TEST", table: "TestDates" },
    },
    TwoHundredColumns: {
      columns: DefaultColumnGenerator(200).map((col) => ({
        ...col,
        serverDataType: "string",
      })),
      key: "column_1",
      table: { module: "TEST", table: "TwoHundredColumns" },
    },
    LinkParent: {
      columns: [
        { name: "id", serverDataType: "string" },
        { name: "data", serverDataType: "string" },
      ],
      key: "id",
      table: { module: "TEST", table: "LinkParent" },
    },

    LinkChild: {
      columns: [
        { name: "id", serverDataType: "string" },
        { name: "parentId", serverDataType: "string" },
        { name: "data", serverDataType: "string" },
      ],
      key: "id",
      table: { module: "TEST", table: "LinkChild" },
    },
    ChartTable: {
      columns: [
        { name: "id", serverDataType: "string" },
        { name: "date", serverDataType: "string" },
        { name: "price", serverDataType: "double" },
        { name: "price_excluded", serverDataType: "boolean" },
        { name: "volume", serverDataType: "double" },
        { name: "volume_excluded", serverDataType: "boolean" },
      ],
      key: "id",
      table: { module: "TEST", table: "ChartTable" },
    },
  };

  #tables: Record<TestTableName, Table> = {
    TestDates: tableContainer.createTable(
      this.#schemas.TestDates,
      [],
      buildDataColumnMap(this.#schemas, "TestDates"),
    ),
    TwoHundredColumns: tableContainer.createTable(
      this.#schemas.TwoHundredColumns,
      generateRows(this.#schemas.TwoHundredColumns, 100),
      buildDataColumnMap(this.#schemas, "TwoHundredColumns"),
    ),
    LinkParent: tableContainer.createTable(
      this.#schemas.LinkParent,
      [
        ["1000000001", "data 1"],
        ["1000000002", "data 2"],
        ["1000000003", "data 2"],
      ],
      buildDataColumnMap(this.#schemas, "LinkParent"),
    ),
    LinkChild: tableContainer.createTable(
      this.#schemas.LinkChild,
      [
        ["200001", "1000000001", "child 1 (linked to 001)"],
        ["200002", "1000000001", "child 2 (linked to 001)"],
        ["200003", "1000000001", "child 3 (linked to 001)"],
        ["200004", "1000000001", "child 4 (linked to 001)"],
        ["200005", "1000000001", "child 5 (linked to 001)"],
        ["200006", "1000000001", "child 6 (linked to 001)"],
        ["200007", "1000000001", "child 7 (linked to 001)"],
        ["200008", "1000000001", "child 8 (linked to 001)"],
        ["200009", "1000000002", "child 9 (linked to 002)"],
        ["200010", "1000000003", "child 10  (linked to 003)"],
      ],
      buildDataColumnMap(this.#schemas, "LinkChild"),
    ),
    ChartTable: tableContainer.createTable(
      this.#schemas.ChartTable,
      [
        ["001", "2026-04-02", 100, false, 1000, false],
        ["002", "2026-04-03", 101, false, 999, false],
        ["003", "2026-04-04", 102, false, 1500, false],
        ["004", "2026-04-05", 103, false, 1300, false],
        ["005", "2026-04-06", 104, false, 1002, false],
        ["006", "2026-04-07", 105, false, 1000, true],
        ["007", "2026-04-08", 106, false, 1004, false],
        ["008", "2026-04-09", 107, false, 1040, false],
        ["009", "2026-04-10", 108, false, 1080, false],
        ["010", "2026-04-11", 109, false, 1100, false],
        ["011", "2026-04-12", 109, false, 1102, false],
        ["012", "2026-04-13", 114, false, 1105, false],
        ["013", "2026-04-14", 118, false, 1106, false],
        ["014", "2026-04-15", 125, false, 1107, false],
        ["015", "2026-04-16", 136, false, 1104, false],
        ["016", "2026-04-17", 170, false, 1103, false],
        ["017", "2026-04-18", 145, false, 1100, false],
        ["018", "2026-04-19", 147, false, 1100, false],
        ["019", "2026-04-20", 140, false, 1100, false],
        ["020", "2026-04-21", 138, false, 1100, false],
        ["021", "2026-04-22", 138, false, 1100, false],
        ["022", "2026-04-23", 138, false, 1100, false],
        ["023", "2026-04-24", 120, false, 1200, false],
        ["024", "2026-04-25", 120, false, 1200, false],
        ["025", "2026-04-26", 120, false, 1350, false],
      ],
      buildDataColumnMap(this.#schemas, "ChartTable"),
    ),
  };
  constructor() {
    super("TEST");
  }

  get menus() {
    return undefined;
  }
  get services() {
    return undefined;
  }

  get menuServices():
    | Record<TestTableName, RpcMenuService[] | undefined>
    | undefined {
    return undefined;
  }

  get schemas() {
    return this.#schemas;
  }

  get tables() {
    return this.#tables;
  }
  get visualLinks() {
    return undefined;
  }
}

export const testModule = new TestModule();
