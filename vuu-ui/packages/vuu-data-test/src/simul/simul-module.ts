import {
  ClientToServerMenuRowRPC,
  VuuLink,
  VuuMenu,
} from "@finos/vuu-protocol-types";
import { Table, buildDataColumnMap, joinTables } from "../Table";
import { RpcService, ServiceHandler } from "../VuuModule";
import { SimulModule } from "./SimulModule";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import { pricesTable } from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";
import { isVuuMenuRpcRequest } from "@finos/vuu-utils";

const undefinedTables = {
  childOrders: undefined,
  instruments: undefined,
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
};

const tables: Record<SimulTableName, Table> = {
  childOrders: new Table(
    schemas.childOrders,
    [],
    buildDataColumnMap<SimulTableName>(schemas, "childOrders"),
  ),
  instruments: instrumentsTable,
  instrumentsExtended: instrumentsExtendedTable,
  instrumentPrices: joinTables(
    { module: "SIMUL", table: "instrumentPrices" },
    instrumentsTable,
    pricesTable,
    "ric",
  ),
  orders: ordersTable,
  parentOrders: new Table(
    schemas.parentOrders,
    [],
    buildDataColumnMap<SimulTableName>(schemas, "parentOrders"),
  ),
  prices: pricesTable,
};

const vuuLinks: Record<SimulTableName, VuuLink[] | undefined> = {
  ...undefinedTables,
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
  orders: {
    name: "ROOT",
    menus: [
      {
        context: "row",
        filter: `status in ["New","Partial Exec"]`,
        name: "Cancel Order",
        rpcName: "CANCEL_ORDER",
      },
    ],
  },
  parentOrders: undefined,
  prices: undefined,
};

const cancelOrder: ServiceHandler = async (rpcRequest) => {
  if (isVuuMenuRpcRequest(rpcRequest)) {
    const { rowKey, vpId } = rpcRequest as ClientToServerMenuRowRPC;
    const table = tables.orders;
    const row = table.findByKey(rowKey);
    row[table.map.status] = "Cancelled";
    table.updateRow(row);

    return {
      action: {
        type: "SHOW_NOTIFICATION_ACTION",
        message: `Order id: ${rowKey}`,
        title: "Order cancelled",
      },
      rpcName: "CANCEL_ORDER",
      type: "VIEW_PORT_MENU_RESP",
      vpId,
    };
  } else {
    throw Error("cancelOrder invalid rpcRequest");
  }
};

const services: Record<SimulTableName, RpcService[] | undefined> = {
  ...undefinedTables,
  orders: [
    {
      rpcName: "CANCEL_ORDER",
      service: cancelOrder,
    },
  ],
};

export const simulModule = new SimulModule({
  menus,
  name: "SIMUL",
  schemas,
  services,
  tables,
  vuuLinks,
});
