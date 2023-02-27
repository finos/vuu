import { ColumnDescriptor } from "@finos/vuu-datagrid-types";
import { VuuTable } from "@finos/vuu-protocol-types";
import { Reducer, useReducer } from "react";

export type Schema = { table: VuuTable; columns: ColumnDescriptor[] };
const schemas: { [key: string]: Schema } = {
  instruments: {
    columns: [
      { name: "bbg" },
      { name: "currency" },
      { name: "description" },
      { name: "exchange" },
      { name: "isin" },
      { name: "lotSize" },
      { name: "ric" },
    ],
    table: { module: "SIMUL", table: "instruments" },
  },
  orders: {
    columns: [
      { name: "ccy" },
      { name: "created" },
      {
        name: "filledQuantity",
        label: "Filled Quantity %",

        type: {
          name: "number",
          renderer: { name: "progress", associatedField: "quantity" },
          formatting: { decimals: 0 },
        },
        width: 120,
      },
      { name: "lastUpdate" },
      { name: "orderId" },
      { name: "quantity" },
      { name: "ric" },
      { name: "side" },
      { name: "trader" },
    ],
    table: { module: "SIMUL", table: "orders" },
  },
  childOrders: {
    columns: [
      { name: "account" },
      { name: "averagePrice" },
      { name: "ccy" },
      { name: "exchange" },
      { name: "filledQty" },
      { name: "id" },
      { name: "idAsInt" },
      { name: "lastUpdate" },
      { name: "openQty" },
      { name: "parentOrderId" },
      { name: "price" },
      { name: "quantity" },
      { name: "ric" },
      { name: "side" },
      { name: "status" },
      { name: "strategy" },
      { name: "volLimit" },
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
      { name: "lastUpdate" },
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
