import { TableSchema } from "@finos/vuu-data";
import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { Reducer, useReducer } from "react";

export type VuuTableName =
  | "instruments"
  | "orders"
  | "childOrders"
  | "parentOrders"
  | "prices";

export type Schema = { table: VuuTable; columns: ColumnDescriptor[] };
const schemas: { [key: string]: Schema } = {
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
    table: { module: "SIMUL", table: "instruments" },
  },
  orders: {
    columns: [
      { name: "ccy" },
      { name: "created", type: "date" },
      {
        name: "filledQuantity",
        label: "Fill Progress",

        type: {
          name: "number",
          renderer: { name: "vuu.progress", associatedField: "quantity" },
          formatting: { decimals: 0 },
        },
        width: 120,
      },
      { name: "lastUpdate", type: "date" },
      { name: "orderId" },
      { name: "quantity" },
      { name: "ric" },
      { name: "side" },
      { name: "trader" },
      // {
      //   name: "filledQtyPct",
      //   expression: "=if(quantity=0, 0, min(1, filledQuantity / quantity))",
      //   serverDataType: "double",
      // },
    ],
    table: { module: "SIMUL", table: "orders" },
  },
  childOrders: {
    columns: [
      { name: "account", serverDataType: "string" },
      { name: "averagePrice" },
      { name: "ccy", serverDataType: "string" },
      { name: "exchange", serverDataType: "string" },
      { name: "filledQty", serverDataType: "double" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "lastUpdate", serverDataType: "long", type: "date" },
      { name: "openQty", serverDataType: "double" },
      { name: "parentOrderId" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "strategy", serverDataType: "string" },
      { name: "volLimit", serverDataType: "int" },
    ],
    table: { module: "SIMUL", table: "childOrders" },
  },
  parentOrders: {
    columns: [
      { name: "account" },
      { name: "algo" },
      { name: "averagePrice" },
      { name: "ccy" },
      { name: "childCount" },
      { name: "exchange" },
      { name: "filledQty" },
      { name: "id" },
      { name: "idAsInt" },
      { name: "lastUpdate", type: "date" },
      { name: "openQty" },
      { name: "price" },
      { name: "quantity" },
      { name: "ric" },
      { name: "side" },
      { name: "status" },
      { name: "volLimit" },
    ],
    table: { module: "SIMUL", table: "parentOrders" },
  },
  prices: {
    columns: [
      {
        name: "ask",
        label: "Ask",
        type: {
          name: "number",
          renderer: { name: "background", flashStyle: "arrow-bg" },
          formatting: { decimals: 2, zeroPad: true },
        },
        aggregate: 2, // avg
      },
      { name: "askSize", type: "number" }, // type: "int"
      {
        label: "Bid",
        name: "bid",
        type: {
          name: "number",
          renderer: { name: "background", flashStyle: "arrow-bg" },
          formatting: { decimals: 2, zeroPad: true },
        },
        aggregate: 2, // avg
      },
      { name: "bidSize", type: "number" }, // type: "int"
      { name: "close", type: "number" }, // type: "double"
      { name: "last", type: "number" }, // type: "double"
      { name: "open", type: "number" }, // type: "double"
      { name: "phase", type: "string" },
      { name: "ric", type: "string" },
      { name: "scenario", type: "string" },
    ],
    table: { module: "SIMUL", table: "prices" },
  },
};

export type ColumnState = { [key: string]: Schema };

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
  const { table, columns } = useSchema(tableName);
  return {
    table,
    columns: columns.map(({ name, serverDataType = "string" }) => ({
      name,
      serverDataType,
    })),
  };
};
