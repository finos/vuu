import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { VuuModule } from "../vuu-modules";
import instrumentsTable from "./reference-data/instruments";
import instrumentsExtendedTable from "./reference-data/instruments-extended";
import pricesTable from "./reference-data/prices";
import { schemas, SimulTableName } from "./simul-schemas";
import { buildDataColumnMap, joinTables, Table } from "../Table";
import { TypeaheadParams } from "@finos/vuu-protocol-types";
import { SuggestionFetcher } from "@finos/vuu-data-react";
import { makeSuggestions } from "../makeSuggestions";

const tables: Record<SimulTableName, Table> = {
  childOrders: new Table(
    schemas.childOrders,
    [],
    buildDataColumnMap(schemas.childOrders)
  ),
  instruments: instrumentsTable,
  instrumentsExtended: instrumentsExtendedTable,
  instrumentPrices: joinTables(
    { module: "SIMUL", table: "instrumentPrices" },
    instrumentsTable,
    pricesTable,
    "ric"
  ),
  orders: new Table(schemas.orders, [], buildDataColumnMap(schemas.orders)),
  parentOrders: new Table(
    schemas.parentOrders,
    [],
    buildDataColumnMap(schemas.parentOrders)
  ),
  prices: pricesTable,
};

// export const populateArray = (tableName: SimulTableName, count: number) => {
//   const table = tables[tableName];
//   const data: Array<VuuRowDataItemType[]> = [];
//   for (let i = 0; i < count; i++) {
//     if (i >= table.data.length) {
//       break;
//     }
//     data[i] = table.data[i];
//   }
//   return data;
// };

const getColumnDescriptors = (tableName: SimulTableName) => {
  const schema = schemas[tableName];
  if (schema) {
    return schema.columns;
  } else {
    console.error(`simul-module no schema found for table SIMUL ${tableName}`);
  }
};

const createDataSource = (tableName: SimulTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn: schemas[tableName].key,
    table: tables[tableName],
    // menu: menus[tableName],
    // rpcServices: services[tableName],
  });
};

const suggestionFetcher: SuggestionFetcher = async ([
  vuuTable,
  column,
  pattern,
]: TypeaheadParams) => {
  const table = tables[vuuTable.table as SimulTableName];
  if (table) {
    return makeSuggestions(table, column, pattern);
  } else {
    throw Error(
      `SIMUL suggestionFetcher, unknown table ${vuuTable.module} ${vuuTable.table}`
    );
  }
};

const simulModule: VuuModule<SimulTableName> = {
  createDataSource,
  typeaheadHook: () => suggestionFetcher,
};

export default simulModule;
