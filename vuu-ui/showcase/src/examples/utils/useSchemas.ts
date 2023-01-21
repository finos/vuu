import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { Reducer, useReducer } from "react";

export type Schema = { table: VuuTable; columns: ColumnDescriptor[] };
const schemas: { [key: string]: Schema } = {
  instruments: {
    columns: [
      { name: "bbg", serverDataType: "string", pin: "left" },
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
      { name: "ccy", serverDataType: "string" },
      { name: "created", serverDataType: "long" },
      {
        name: "filledQuantity",
        label: "Filled Quantity %",
        serverDataType: "int",
        type: {
          name: "number",
          renderer: { name: "progress", associatedField: "quantity" },
          formatting: { decimals: 0 },
        },
        width: 120,
      },
      { name: "lastUpdate", serverDataType: "long" },
      { name: "orderId", serverDataType: "string" },
      { name: "quantity", serverDataType: "double" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "char" },
      { name: "trader", serverDataType: "string" },
    ],
    table: { module: "SIMUL", table: "orders" },
  },
  parentOrders: {
    columns: [
      { name: "account", serverDataType: "string" },
      { name: "algo", serverDataType: "string" },
      { name: "averagePrice", serverDataType: "double" },
      { name: "ccy", serverDataType: "string" },
      { name: "childCount", serverDataType: "int" },
      { name: "exchange", serverDataType: "string" },
      { name: "filledQty", serverDataType: "int" },
      { name: "id", serverDataType: "string" },
      { name: "idAsInt", serverDataType: "int" },
      { name: "lastUpdate", serverDataType: "long" },
      { name: "openQty", serverDataType: "int" },
      { name: "price", serverDataType: "double" },
      { name: "quantity", serverDataType: "int" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "volLimit", serverDataType: "double" },
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
        aggregate: "avg",
      },
      { name: "askSize", type: "int" },
      {
        label: "Bid",
        name: "bid",
        type: {
          name: "number",
          renderer: { name: "background", flashStyle: "arrow-bg" },
          formatting: { decimals: 2, zeroPad: true },
        },
        aggregate: "avg",
      },
      { name: "bidSize", type: "int" },
      { name: "close", type: "double" },
      { name: "last", type: "double" },
      { name: "open", type: "double" },
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
  column: KeyedColumnDescriptor;
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
