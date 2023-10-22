import type { TableSchema } from "@finos/vuu-data";
import type { ColumnDescriptor } from "@finos/vuu-datagrid-types";

export type VuuTableName =
  | "instruments"
  | "instrumentPrices"
  | "orders"
  | "childOrders"
  | "parentOrders"
  | "prices"
  | "basket"
  | "basketDesign"
  | "basketDefinitions"
  | "basketOrders";

// These Schemas take the form of the schemas that we create
// with TABLE_META returned by Vuu.
export const schemas: Readonly<Record<VuuTableName, Readonly<TableSchema>>> = {
  basket: {
    columns: [
      { name: "ID", serverDataType: "string" },
      { name: "name", serverDataType: "string" },
      { name: "notionalValue", serverDataType: "double" },
      { name: "notionalValueUsd", serverDataType: "double" },
    ],
    key: "id",
    table: { module: "BASKET", table: "basket" },
  },
  basketDefinitions: {
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "symbolName", serverDataType: "string" },
      { name: "name", serverDataType: "string" },
      { name: "units", serverDataType: "int" },
      { name: "totalDollarNotional", serverDataType: "double" },
      { name: "totalNotional", serverDataType: "double" },
      { name: "currency", serverDataType: "string" },
      { name: "exchangeRateToUSD", serverDataType: "double" },
    ],
    key: "id",
    table: { module: "BASKET", table: "basketDefinitions" },
  },

  basketDesign: {
    columns: [
      { name: "ric", serverDataType: "string" },
      { name: "name", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "weighting", serverDataType: "double" },
      { name: "last", serverDataType: "double" },
      { name: "bid", serverDataType: "double" },
      { name: "ask", serverDataType: "double" },
      { name: "limitPrice", serverDataType: "double" },
      { name: "priceStrategy", serverDataType: "string" },
      { name: "dollarNotional", serverDataType: "double" },
      { name: "localNotional", serverDataType: "double" },
      { name: "venue", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "algoParams", serverDataType: "string" },
    ],
    key: "ric",
    table: { module: "BASKET", table: "basketDesign" },
  },
  basketOrders: {
    columns: [
      { name: "ric", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "name", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "filled", serverDataType: "double" },
      { name: "weighting", serverDataType: "double" },
      { name: "last", serverDataType: "double" },
      { name: "bid", serverDataType: "double" },
      { name: "ask", serverDataType: "double" },
      { name: "limitPrice", serverDataType: "double" },
      { name: "priceSpread", serverDataType: "double" },
      { name: "priceStrategy", serverDataType: "string" },
      { name: "dollarNotional", serverDataType: "double" },
      { name: "localNotional", serverDataType: "double" },
      { name: "venue", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "algoParams", serverDataType: "string" },
    ],
    key: "ric",
    table: { module: "BASKET", table: "basketOrders" },
  },
  instruments: {
    columns: [
      { name: "bbg", serverDataType: "string" },
      { name: "currency", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "isin", serverDataType: "string" },
      { name: "lotSize", serverDataType: "int" },
      { name: "ric", serverDataType: "string" },
    ],
    key: "ric",
    table: { module: "SIMUL", table: "instruments" },
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
    ],
    key: "ric",
    table: { module: "SIMUL", table: "instrumentPrices" },
  },
  orders: {
    columns: [
      { name: "ccy", serverDataType: "string" },
      { name: "created", serverDataType: "long" },
      { name: "filledQuantity", serverDataType: "double" },
      { name: "lastUpdate", serverDataType: "long" },
      { name: "orderId", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "trader", serverDataType: "string" },
    ],
    key: "orderId",
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
      { name: "lastUpdate", serverDataType: "long" },
      { name: "openQty", serverDataType: "double" },
      { name: "parentOrderId", serverDataType: "string" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "strategy", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
    ],
    key: "id",
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
      { name: "lastUpdate", serverDataType: "long" },
      { name: "openQty", serverDataType: "double" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
    ],
    key: "id",
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
    ],
    key: "ric",
    table: { module: "SIMUL", table: "prices" },
  },
};

export type ColumnState = { [key: string]: TableSchema };

export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}

export type ColumnAction = ColumnActionUpdate;

export const getAllSchemas = () => schemas;

export const getSchema = (tableName: VuuTableName) => {
  if (schemas[tableName]) {
    return schemas[tableName];
  }
  throw Error(`getSchema no schema for table ${tableName}`);
};
