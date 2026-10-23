import { TableSchema } from "@vuu-ui/vuu-data-types";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";
import { VUU_DEFAULT_COLUMNS } from "../default-column-definitions";

const DEFAULT_RANGE_LIMITS = {
  maxRangeEnd: 1_000_000,
  maxRangeWidth: 1_000,
};

export type SimulTableName =
  | "instruments"
  | "instrumentsExtended"
  | "instrumentPrices"
  | "orders"
  | "childOrders"
  | "parentOrders"
  | "prices";

// These Schemas take the form of the schemas that we create
// with TABLE_META returned by Vuu.
export const schemas: Readonly<Record<SimulTableName, Readonly<TableSchema>>> =
{
  instruments: {
    columns: [
      { name: "bbg", serverDataType: "string" },
      { name: "currency", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "isin", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
      { name: "ric", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "ric",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "instruments" },
  },
  /**
   * Covers every Vuu column data type, so it is the preferred table for
   * filter tests and examples. Client-side only, not defined in the Vuu server.
   */
  instrumentsExtended: {
    columns: [
      { name: "bbg", serverDataType: "string" },
      { name: "currency", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "isin", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "char" },
      { name: "supported", serverDataType: "boolean" },
      { name: "wishlist", serverDataType: "boolean" },
      { name: "lastUpdated", serverDataType: "long" },
      { name: "price", serverDataType: "double" },
      { name: "notional", serverDataType: "scaleddecimal2" },
      { name: "closePrice", serverDataType: "scaleddecimal4" },
      { name: "fxRate", serverDataType: "scaleddecimal6" },
      { name: "weight", serverDataType: "scaleddecimal8" },
      { name: "tradeDate", serverDataType: "epochtimestamp" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "ric",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "instrumentsExtended" },
  },
  instrumentPrices: {
    columns: [
      { name: "ask", serverDataType: "double" },
      { name: "askSize", serverDataType: "double" }, // type: "int"
      { name: "bbg", serverDataType: "string" },
      { name: "bid", serverDataType: "double" },
      { name: "bidSize", serverDataType: "double" },
      { name: "close", serverDataType: "double" },
      { name: "currency", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "isin", serverDataType: "string" },
      { name: "last", serverDataType: "double" },
      { name: "lotSize", serverDataType: "int" },
      { name: "open", serverDataType: "double" },
      { name: "phase", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "scenario", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "ric",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "instrumentPrices" },
  },
  orders: {
    columns: [
      { name: "status", serverDataType: "string" },
      { name: "ccy", serverDataType: "string" },
      { name: "filledQuantity", serverDataType: "double" },
      { name: "lastUpdate", serverDataType: "long" },
      { name: "orderId", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "trader", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "orderId",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "orders" },
  },
  childOrders: {
    columns: [
      { name: "account", serverDataType: "string" },
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "parentOrderId", serverDataType: "string" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "strategy", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "id",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "childOrders" },
  },
  parentOrders: {
    columns: [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "exchange", serverDataType: "string" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "id",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "parentOrders" },
  },
  prices: {
    columns: [
      { name: "ask", serverDataType: "double" },
      { name: "askSize", serverDataType: "double" }, // type: "int"
      { name: "bid", serverDataType: "double" },
      { name: "bidSize", serverDataType: "double" },
      { name: "close", serverDataType: "double" },
      { name: "last", serverDataType: "double" },
      { name: "open", serverDataType: "double" },
      { name: "phase", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "scenario", serverDataType: "string" },
      ...VUU_DEFAULT_COLUMNS,
    ],
    key: "ric",
    rangeLimits: DEFAULT_RANGE_LIMITS,
    table: { module: "SIMUL", table: "prices" },
  },
};

export type SimulVuuTable = {
  module: "SIMUL";
  table: SimulTableName;
};

export const isSimulTable = (table: VuuTable): table is SimulVuuTable =>
  table.module === "SIMUL";
