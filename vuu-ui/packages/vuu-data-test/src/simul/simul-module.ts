import { SuggestionFetcher } from "@finos/vuu-data-types";
import {
  ClientToServerEditRpc,
  ClientToServerMenuRPC,
  TypeaheadParams,
  VuuMenu,
  VuuRowDataItemType,
} from "@finos/vuu-protocol-types";
import { makeSuggestions } from "../makeSuggestions";
import { buildDataColumnMap, joinTables, Table } from "../Table";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import type { VuuModule } from "../vuu-modules";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import { pricesTable } from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";

type RpcService = {
  rpcName: string;
  service: (rpcRequest: any) => Promise<unknown>;
};

const sessionTables: Record<string, Table> = {};

const tables: Record<SimulTableName, Table> = {
  childOrders: new Table(
    schemas.childOrders,
    [],
    buildDataColumnMap<SimulTableName>(schemas, "childOrders")
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
    buildDataColumnMap<SimulTableName>(schemas, "parentOrders")
  ),
  prices: pricesTable,
};

const getColumnDescriptors = (tableName: SimulTableName) => {
  const schema = schemas[tableName] || sessionTables["sessionTable1"].schema;
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
      {
        context: "selected-rows",
        filter: "",
        name: "Edit Row",
        rpcName: "EDIT_ROW",
      },
      {
        context: "selected-rows",
        filter: "",
        name: "Edit Rows",
        rpcName: "OPEN_BULK_EDITS",
      },
    ],
  },
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
};

async function addInstrumentsToOrder(/*rpcRequest: unknown*/) {
  // TODO:
  // create a `session table`,
  // populate with selected Instruments
  // sens subscriptionn details to user

  // const sessionTableId = "sessionTable1";
  // sessionTables[sessionTableId] = new Table(
  //   schemas.instruments,
  //   [],
  //   buildDataColumnMap<SimulTableName>(schemas, "instruments")
  // );
  console.log("addInstrumentsToOrder");

  return {
    action: {
      renderComponent: "grid",
      table: {
        module: "SIMUL",
        table: "sessionTable1",
      },
      type: "OPEN_DIALOG_ACTION",
    },
  };
}

const keyIndex = 6;

// Open edit dialog
async function openBulkEdits(
  rpcRequest:
    | Omit<ClientToServerMenuRPC, "vpId">
    | ClientToServerEditRpc
    | { selectedRowIds: string[] }
) {
  const sessionTableId = "sessionTable1";
  const sessionData: VuuRowDataItemType[][] = [];
  const selectedRowIds = (rpcRequest as { selectedRowIds: string[] })
    .selectedRowIds;
  for (let i = 0; i < selectedRowIds.length; i++) {
    for (let j = 0; j < instrumentsTable.data.length; j++) {
      if (instrumentsTable.data[j][keyIndex] === selectedRowIds[i]) {
        sessionData.push(instrumentsTable.data[j]);
      }
    }
  }
  sessionTables[sessionTableId] = new Table(
    schemas.instruments,
    sessionData,
    buildDataColumnMap(schemas, "instruments")
  );

  return {
    action: {
      renderComponent: "grid",
      table: {
        module: "SIMUL",
        table: "sessionTable1",
      },
      type: "OPEN_DIALOG_ACTION",
    },
    requestId: "request_id",
    rpcName: "OPEN_BULK_EDITS",
  };
}

// Bulk-edit with input in session table
async function applyBulkEdits(
  rpcRequest:
    | Omit<ClientToServerMenuRPC, "vpId">
    | ClientToServerEditRpc
    | { targetCol: string }
    | { targetVal: string }
) {
  for (let i = 0; i < sessionTables["sessionTable1"].data.length; i++) {
    const newRow = sessionTables["sessionTable1"].data[i];
    sessionTables["sessionTable1"].update(
      String(newRow[keyIndex]),
      (rpcRequest as { targetCol: string }).targetCol,
      (rpcRequest as { targetVal: string }).targetVal
    );
  }

  return {
    action: {
      renderComponent: "grid",
      table: {
        module: "SIMUL",
        table: "instruments",
      },
      type: "OPEN_DIALOG_ACTION",
    },
    requestId: "request_id",
    rpcName: "APPLY_BULK_EDITS",
  };
}

// Save session table data to main table
async function saveBulkEdits() {
  for (let i = 0; i < sessionTables["sessionTable1"].data.length; i++) {
    const newRow = sessionTables["sessionTable1"].data[i];
    instrumentsTable.updateRow(newRow);
  }

  return {
    action: {
      renderComponent: "grid",
      table: {
        module: "SIMUL",
        table: "instruments",
      },
      type: "OPEN_DIALOG_ACTION",
    },
    requestId: "request_id",
    rpcName: "SAVE_BULK_EDITS",
  };
}

const services: Record<SimulTableName, RpcService[] | undefined> = {
  childOrders: undefined,
  instruments: [
    {
      rpcName: "ADD_INSTRUMENTS_TO_ORDER",
      service: addInstrumentsToOrder,
    },
    {
      rpcName: "OPEN_BULK_EDITS",
      service: openBulkEdits,
    },
    {
      rpcName: "APPLY_BULK_EDITS",
      service: applyBulkEdits,
    },
    {
      rpcName: "SAVE_BULK_EDITS",
      service: saveBulkEdits,
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
  //console.log(sessionTables['sessionTable1'].schema);
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn:
      schemas[tableName] === undefined
        ? sessionTables[tableName].schema.key
        : schemas[tableName].key,
    table: tables[tableName] || sessionTables[tableName],
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

export const simulModule: VuuModule<SimulTableName> = {
  createDataSource,
  typeaheadHook: () => suggestionFetcher,
};
