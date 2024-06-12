import {
  OpenDialogActionWithSchema,
  SuggestionFetcher,
} from "@finos/vuu-data-types";
import {
  ClientToServerViewportRpcCall,
  TypeaheadParams,
  VuuMenu,
  VuuTable,
} from "@finos/vuu-protocol-types";
import { uuid } from "@finos/vuu-utils";
import { Table, buildDataColumnMap, joinTables } from "../Table";
import { TickingArrayDataSource } from "../TickingArrayDataSource";
import { makeSuggestions } from "../makeSuggestions";
import { createSessionTableFromSelectedRows } from "../session-table-utils";
import type { VuuModule } from "../vuu-modules";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import { pricesTable } from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";

type RpcService = {
  rpcName: string;
  service: (
    rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId"> & {
      namedParams: { [key: string]: unknown };
      selectedRowIds: string[];
      table: VuuTable;
    }
  ) => Promise<unknown>;
};

export type SessionTableMap = Record<string, Table>;
const sessionTableMap: SessionTableMap = {};

const getSessionTable = () => {
  if (Object.keys(sessionTableMap).length === 1) {
    const [sessionTable] = Object.values(sessionTableMap);
    return sessionTable;
  } else {
    throw Error(
      "getSessionTable: should never be more than one session table in map"
    );
  }
};

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
  const schema = schemas[tableName] || getSessionTable()?.schema;
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
        rpcName: "VP_BULK_EDIT_BEGIN_RPC",
      },
    ],
  },
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
};

const keyIndex = 6;

async function openBulkEdits(
  rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId"> & {
    selectedRowIds: string[];
    table: VuuTable;
  }
) {
  const { selectedRowIds, table } = rpcRequest;

  const dataTable = tables[table.table as SimulTableName];
  if (dataTable) {
    const sessionTable = createSessionTableFromSelectedRows(
      instrumentsTable,
      selectedRowIds
    );
    const sessionTableName = `instruments-${uuid()}`;
    sessionTableMap[sessionTableName] = sessionTable;

    return {
      action: {
        renderComponent: "grid",
        table: {
          module: "SIMUL",
          table: sessionTableName,
        },
        tableSchema: dataTable.schema,
        type: "OPEN_DIALOG_ACTION",
      } as OpenDialogActionWithSchema,
      requestId: "request_id",
      rpcName: "VP_BULK_EDIT_BEGIN_RPC",
    };
  } else {
    return {
      requestId: "request_id",
      rpcName: "VP_BULK_EDIT_REJECT",
    };
  }
}

// Bulk-edit with input in session table
async function applyBulkEdits(
  rpcRequest: Omit<ClientToServerViewportRpcCall, "vpId"> & {
    namedParams: { [key: string]: unknown };
    selectedRowIds: string[];
    table: VuuTable;
  }
) {
  const sessionTable = getSessionTable();

  for (let i = 0; i < sessionTable.data.length; i++) {
    const newRow = sessionTable.data[i];
    const { column, value } = rpcRequest.namedParams;
    sessionTable.update(String(newRow[keyIndex]), column as string, value);
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
    rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
  };
}

// Save session table data to main table
async function saveBulkEdits() {
  const sessionTable = getSessionTable();

  for (let i = 0; i < sessionTable.data.length; i++) {
    const newRow = sessionTable.data[i];
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
    rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
  };
}

const services: Record<SimulTableName, RpcService[] | undefined> = {
  childOrders: undefined,
  instruments: [
    {
      rpcName: "VP_BULK_EDIT_BEGIN_RPC",
      service: openBulkEdits,
    },
    {
      rpcName: "VP_BULK_EDIT_COLUMN_CELLS_RPC",
      service: applyBulkEdits,
    },
    {
      rpcName: "VP_BULK_EDIT_SUBMIT_RPC",
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
  return new TickingArrayDataSource({
    columnDescriptors,
    keyColumn:
      schemas[tableName] === undefined
        ? sessionTableMap[tableName].schema.key
        : schemas[tableName].key,
    table: tables[tableName] || sessionTableMap[tableName],
    menu: menus[tableName],
    rpcServices: services[tableName],
    sessionTables: sessionTableMap,
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
