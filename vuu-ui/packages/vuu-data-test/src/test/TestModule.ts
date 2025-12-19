import { RpcMenuService, VuuModule } from "../core/module/VuuModule";
import { buildDataColumnMap, Table } from "../Table";
import { defaultGenerators } from "../vuu-row-generator";
import { schemas, TestTableName } from "./test-schemas";
import tableContainer from "../core/table/TableContainer";

const { RowGenerator } = defaultGenerators;

const manyColumnGenerator = RowGenerator(
  schemas.TwoHundredColumns.columns.map((c) => c.name),
);

class TestModule extends VuuModule<TestTableName> {
  #schemas = schemas;

  #tables: Record<TestTableName, Table> = {
    TestDates: tableContainer.createTable(
      schemas.TestDates,
      [],
      buildDataColumnMap(schemas, "TestDates"),
    ),
    TwoHundredColumns: tableContainer.createTable(
      schemas.TwoHundredColumns,
      new Array(100).fill(1).map((_, i) => manyColumnGenerator(i)),
      buildDataColumnMap(schemas, "TwoHundredColumns"),
    ),
    LinkParent: tableContainer.createTable(
      schemas.LinkParent,
      [
        ["1000000001", "data 1"],
        ["1000000002", "data 2"],
        ["1000000003", "data 2"],
      ],
      buildDataColumnMap(schemas, "LinkParent"),
    ),
    LinkChild: tableContainer.createTable(
      schemas.LinkChild,
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
      buildDataColumnMap(schemas, "LinkChild"),
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
