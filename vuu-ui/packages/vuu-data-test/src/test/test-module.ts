import type { SuggestionFetcher } from "@finos/vuu-data-types";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { makeSuggestions } from "../makeSuggestions";
import { buildDataColumnMap, Table } from "../Table";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { VuuModule } from "../vuu-modules";
import { defaultGenerators } from "../vuu-row-generator";
import { schemas, TestTableName } from "./test-schemas";

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

const getColumnDescriptors = (tableName: TestTableName) => {
  const schema = schemas[tableName];
  if (schema) {
    return schema.columns;
  } else {
    throw Error(`test-module no schema found for table TEST ${tableName}`);
  }
};

const createDataSource = (tableName: TestTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn: schemas[tableName].key,
    table: tables[tableName],
    // menu: menus[tableName],
    // rpcServices: services[tableName],
  });
};

const suggestionFetcher: SuggestionFetcher = ([
  vuuTable,
  column,
  pattern,
]: TypeaheadParams) => {
  const table = tables[vuuTable.table as TestTableName];
  if (table) {
    return makeSuggestions(table, column, pattern);
  } else {
    throw Error(
      `SIMUL suggestionFetcher, unknown table ${vuuTable.module} ${vuuTable.table}`
    );
  }
};

const testModule: VuuModule<TestTableName> = {
  createDataSource,
  typeaheadHook: () => suggestionFetcher,
};

export default testModule;
