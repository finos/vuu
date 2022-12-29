import {
  ColumnDescriptor,
  KeyedColumnDescriptor,
} from "@finos/vuu-datagrid/src/grid-model";
import { VuuTable } from "@finos/vuu-protocol-types";
import { Reducer, useReducer } from "react";

export type Schema = { table: VuuTable; columns: ColumnDescriptor[] };
const schemas: { [key: string]: Schema } = {
  instruments: {
    columns: [
      { name: "bbg", type: "string" },
      { name: "currency", type: "string" },
      { name: "description", type: "string" },
      { name: "exchange", type: "string" },
      { name: "isin", type: "string" },
      { name: "lotSize", type: "int" },
      { name: "ric", type: "string" },
    ],
    table: { module: "SIMUL", table: "instruments" },
  },
  orders: {
    columns: [
      { name: "ccy", type: "string" },
      { name: "created", type: "long" },
      {
        name: "filledQuantity",
        label: "Filled Quantity %",
        type: {
          name: "number",
          renderer: { name: "progress", associatedField: "quantity" },
          format: { decimals: 0 },
        },
        width: 120,
      },
      { name: "lastUpdate", type: "long" },
      { name: "orderId", type: "string" },
      { name: "quantity", type: "double" },
      { name: "ric", type: "string" },
      { name: "side", type: "char" },
      { name: "trader", type: "string" },
    ],
    table: { module: "SIMUL", table: "orders" },
  },
  parentOrders: {
    columns: [
      { name: "account", type: "string" },
      { name: "algo", type: "string" },
      { name: "averagePrice", type: "double" },
      { name: "ccy", type: "string" },
      { name: "childCount", type: "int" },
      { name: "exchange", type: "string" },
      { name: "filledQty", type: "int" },
      { name: "id", type: "string" },
      { name: "idAsInt", type: "int" },
      { name: "lastUpdate", type: "long" },
      { name: "openQty", type: "int" },
      { name: "price", type: "double" },
      { name: "quantity", type: "int" },
      { name: "ric", type: "string" },
      { name: "side", type: "string" },
      { name: "status", type: "string" },
      { name: "volLimit", type: "double" },
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
