import { TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { Reducer, useReducer } from "react";

export type VuuTableName =
  | "instruments"
  | "orders"
  | "childOrders"
  | "parentOrders"
  | "prices"
  | "basketDesign";

// These Schemas take the form of the schemas that we create
// with TABLE_META returned by Vuu.
export const schemas: Record<VuuTableName, TableSchema> = {
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
  basketDesign: {
    columns: [
      { name: "ric", serverDataType: "double" },
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
    table: { module: "SIMUL", table: "prices" },
  },
};

export type ColumnState = { [key: string]: TableSchema };

export interface ColumnActionUpdate {
  type: "updateColumn";
  column: ColumnDescriptor;
}

export type ColumnAction = ColumnActionUpdate;

export type ColumnReducer = Reducer<ColumnState, ColumnAction>;

const columnReducer: ColumnReducer = (state, action) => {
  switch (action.type) {
    case "updateColumn":
      return state;
    default:
      return state;
  }
};

export const useSchemas = () => {
  const [state, dispatch] = useReducer<ColumnReducer>(columnReducer, schemas);

  return {
    schemas: state,
    dispatch,
  };
};

export const useSchema = (tableName: VuuTableName) => {
  const { schemas } = useSchemas();
  if (schemas[tableName]) {
    return schemas[tableName];
  }
  throw Error(`useSchema no schema for table ${tableName}`);
};

export const useTableSchema = (tableName: VuuTableName): TableSchema => {
  return useSchema(tableName);
};
