import { VuuModule } from "../core/module/VuuModule";
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
