import {
  ClientToServerMenuRowRPC,
  VuuLink,
  VuuMenu,
  VuuRpcViewportResponse,
} from "@vuu-ui/vuu-protocol-types";
import { isVuuMenuRpcRequest } from "@vuu-ui/vuu-utils";
import {
  RpcService,
  ServiceHandler,
  VuuModule,
} from "../core/module/VuuModule";
import { Table } from "../Table";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import {
  childOrdersTable,
  parentOrdersTable,
  startGeneratingNewOrders,
  stopGeneratingNewOrders,
} from "./reference-data/parent-child-orders";
import { pricesTable } from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";
import tableContainer from "../core/table/TableContainer";

const undefinedTables = {
  childOrders: undefined,
  instruments: undefined,
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
};

/**
 * This is an example of how we might extend the built-in VuuModule to
 * implement a module-specific service in such a way that it can invoke
 * methods on the VuuModule.
 */
export class SimulModule extends VuuModule<SimulTableName> {
  constructor() {
    super("SIMUL");
  }

  #schemas = schemas;
  #tables: Record<SimulTableName, Table> = {
    childOrders: childOrdersTable,
    instruments: instrumentsTable,
    instrumentsExtended: instrumentsExtendedTable,
    instrumentPrices: tableContainer.createJoinTable(
      { module: "SIMUL", table: "instrumentPrices" },
      { module: "SIMUL", table: "instruments" },
      { module: "SIMUL", table: "prices" },
      "ric",
    ),
    orders: ordersTable,
    parentOrders: parentOrdersTable,
    prices: pricesTable,
  };

  get menus(): Record<SimulTableName, VuuMenu | undefined> | undefined {
    return {
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
  }

  get schemas() {
    return this.#schemas;
  }

  get services(): Record<SimulTableName, RpcService[] | undefined> | undefined {
    return {
      ...undefinedTables,
      orders: [
        {
          rpcName: "CANCEL_ORDER",
          service: this.cancelOrder,
        },
      ],
      parentOrders: [
        {
          rpcName: "startGeneratingNewOrders",
          service: this.startOrders,
        },
        {
          rpcName: "stopGeneratingNewOrders",
          service: this.stopOrders,
        },
      ],
    };
  }

  get tables() {
    return this.#tables;
  }

  get visualLinks(): Record<SimulTableName, VuuLink[] | undefined> {
    return {
      ...undefinedTables,
      childOrders: [
        {
          fromColumn: "parentOrderId",
          toColumn: "id",
          toTable: "parentOrders",
        },
      ],
      parentOrders: [
        { fromColumn: "ric", toColumn: "ric", toTable: "instruments" },
      ],
    };
  }

  cancelOrder: ServiceHandler = async (rpcRequest) => {
    if (isVuuMenuRpcRequest(rpcRequest)) {
      const { rowKey, vpId } = rpcRequest as ClientToServerMenuRowRPC;
      const table = this.tables.orders;
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

  startOrders = async () => {
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
  stopOrders = async () => {
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
}

export const simulModule = new SimulModule();
