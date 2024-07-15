import { LinkDescriptorWithLabel, VuuMenu } from "@finos/vuu-protocol-types";
import { Table, buildDataColumnMap, joinTables } from "../Table";
import { instrumentsTable } from "./reference-data/instruments";
import { instrumentsExtendedTable } from "./reference-data/instruments-extended";
import { ordersTable } from "./reference-data/orders";
import { pricesTable } from "./reference-data/prices";
import { schemas, type SimulTableName } from "./simul-schemas";
import { VuuModule } from "../VuuModule";

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

const visualLinks: Record<
  SimulTableName,
  LinkDescriptorWithLabel[] | undefined
> = {
  childOrders: undefined,
  instruments: undefined,
  instrumentsExtended: undefined,
  instrumentPrices: undefined,
  orders: undefined,
  parentOrders: undefined,
  prices: undefined,
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

export const simulModule = new VuuModule<SimulTableName>({
  menus,
  name: "SIMUL",
  schemas,
  tables,
  visualLinks,
});
