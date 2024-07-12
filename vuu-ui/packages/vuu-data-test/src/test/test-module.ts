import { buildDataColumnMap, Table } from "../Table";
import { defaultGenerators } from "../vuu-row-generator";
import { schemas, TestTableName } from "./test-schemas";
import { VuuModule } from "../VuuModule";

const { RowGenerator } = defaultGenerators;

const manyColumnGenerator = RowGenerator(
  schemas.TwoHundredColumns.columns.map((c) => c.name)
);

const tables: Record<TestTableName, Table> = {
  TwoHundredColumns: new Table(
    schemas.TwoHundredColumns,
    new Array(100).fill(1).map((_, i) => manyColumnGenerator(i)),
    buildDataColumnMap(schemas, "TwoHundredColumns")
  ),
};

export const testModule = new VuuModule<TestTableName>({
  name: "TEST",
  schemas,
  tables,
});
