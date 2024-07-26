import {
  ClientToServerMenuRowRPC,
  ShowNotificationAction,
  VuuLink,
  VuuMenu,
} from "@finos/vuu-protocol-types";
import { Table, buildDataColumnMap, joinTables } from "../Table";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import { pricesTable } from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";
import { RpcService, RpcServiceRequest, VuuModule } from "../VuuModule";
import { MenuRpcResponse } from "packages/vuu-data-types";

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

async function cancelOrder(
  rpcRequest: RpcServiceRequest
): Promise<Omit<MenuRpcResponse<ShowNotificationAction>, "requestId">> {
  const { rowKey } = rpcRequest as ClientToServerMenuRowRPC;
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
  };
}

const services: Record<SimulTableName, RpcService[] | undefined> = {
  ...undefinedTables,
  orders: [
    {
      rpcName: "CANCEL_ORDER",
      service: cancelOrder,
    },
  ],
};

export const simulModule = new VuuModule<SimulTableName>({
  menus,
  name: "SIMUL",
  schemas,
  services,
  tables,
  vuuLinks,
});
