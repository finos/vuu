import {
  ClientToServerMenuRowRPC,
  VuuLink,
  VuuMenu,
  VuuRpcViewportResponse,
} from "@vuu-ui/vuu-protocol-types";
import { isVuuMenuRpcRequest } from "@vuu-ui/vuu-utils";
import { Table, joinTables } from "../Table";
import { RpcService, ServiceHandler } from "../VuuModule";
import { SimulModule } from "./SimulModule";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import { pricesTable } from "./reference-data/prices";
import {
  parentOrdersTable,
  childOrdersTable,
  startGeneratingNewOrders,
  stopGeneratingNewOrders,
} from "./reference-data/parent-child-orders";
import { schemas, type SimulTableName } from "./simul-schemas";

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
  childOrders: childOrdersTable,
  instruments: instrumentsTable,
  instrumentsExtended: instrumentsExtendedTable,
  instrumentPrices: joinTables(
    { module: "SIMUL", table: "instrumentPrices" },
    instrumentsTable,
    pricesTable,
    "ric",
  ),
  orders: ordersTable,
  parentOrders: parentOrdersTable,
  prices: pricesTable,
};

const vuuLinks: Record<SimulTableName, VuuLink[] | undefined> = {
  ...undefinedTables,
  childOrders: [
    { fromColumn: "parentOrderId", toColumn: "id", toTable: "parentOrders" },
  ],
  parentOrders: [
    { fromColumn: "ric", toColumn: "ric", toTable: "instruments" },
  ],
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

const startOrders = async () => {
  startGeneratingNewOrders();
  return {
    type: "VIEW_PORT_RPC_RESPONSE",
    action: {
      type: "VP_RPC_SUCCESS",
    },
    method: "???",
    namedParams: {},
    params: [],
    vpId: "",
  } as VuuRpcViewportResponse;
};
const stopOrders = async () => {
  stopGeneratingNewOrders();
  return {
    type: "VIEW_PORT_RPC_RESPONSE",
    action: {
      type: "VP_RPC_SUCCESS",
    },
    method: "???",
    namedParams: {},
    params: [],
    vpId: "",
  } as VuuRpcViewportResponse;
};

const services: Record<SimulTableName, RpcService[] | undefined> = {
  ...undefinedTables,
  orders: [
    {
      rpcName: "CANCEL_ORDER",
      service: cancelOrder,
    },
  ],
  parentOrders: [
    {
      rpcName: "startGeneratingNewOrders",
      service: startOrders,
    },
    {
      rpcName: "stopGeneratingNewOrders",
      service: stopOrders,
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
