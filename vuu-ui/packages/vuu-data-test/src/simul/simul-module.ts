import { SuggestionFetcher } from "@finos/vuu-data-types";
import {
  ClientToServerViewportRpcCall,
  TypeaheadParams,
  VuuMenu,
} from "@finos/vuu-protocol-types";
import { makeSuggestions } from "../makeSuggestions";
import { buildDataColumnMap, joinTables, Table } from "../Table";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import type { RpcService, VuuModule } from "../vuu-modules";
import instrumentsTable from "./reference-data/instruments";
import instrumentsExtendedTable from "./reference-data/instruments-extended";
import ordersTable from "./reference-data/orders";
import pricesTable from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";

const sessionTables: Record<string, Table> = {};

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
  orders: ordersTable,
  parentOrders: new Table(
    schemas.parentOrders,
    [],
    buildDataColumnMap(schemas.parentOrders)
  ),
  prices: pricesTable,
};

const getColumnDescriptors = (tableName: SimulTableName) => {
  const schema = schemas[tableName];
  if (schema) {
    return schema.columns;
  } else {
    throw Error(`simul-module no schema found for table SIMUL ${tableName}`);
  }
};

const menus: Record<SimulTableName, VuuMenu | undefined> = {
  childOrders: undefined,
  instruments: {
    name: "ROOT",
    menus: [
      {
        context: "selected-rows",
        filter: "",
        name: "Add Instruments To Order",
        rpcName: "ADD_INSTRUMENTS_TO_ORDER",
      },
    ],
  },
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
};

async function addInstrumentsToOrder(rpcRequest: unknown) {
  // create a `session table`,
  // populate with selected Instruments
  // sens subscriptionn details to user

  const sessionTableId = "session-table-1";
  sessionTables[sessionTableId] = new Table(
    schemas.instruments,
    [],
    buildDataColumnMap(schemas.instruments)
  );

  return {
    action: {
      renderComponent: "grid",
      table: {
        module: "SIMUL",
        table: "session-table-1",
      },
      type: "OPEN_DIALOG_ACTION",
    },
  };
}

const services: Record<SimulTableName, RpcService[] | undefined> = {
  childOrders: undefined,
  instruments: [
    {
      rpcName: "ADD_INSTRUMENTS_TO_ORDER",
      service: addInstrumentsToOrder,
    },
  ],
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
};

const createDataSource = (tableName: SimulTableName) => {
  const columnDescriptors = getColumnDescriptors(tableName);
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn: schemas[tableName].key,
    table: tables[tableName],
    menu: menus[tableName],
    rpcServices: services[tableName],
  });
};

const suggestionFetcher: SuggestionFetcher = ([
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
