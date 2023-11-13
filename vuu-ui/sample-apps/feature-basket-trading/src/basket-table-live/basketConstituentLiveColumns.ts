import { ColumnDescriptor } from "packages/vuu-datagrid-types";

const hidden = true;
const ticking = {
  name: "number",
  formatting: {
    alignOnDecimals: true,
    decimals: 2,
    zeroPad: true,
  },
  renderer: { name: "vuu.price-move-background", flashStyle: "bg-only" },
};

export default [
  {
    label: "B/S",
    name: "side",
    pin: "left",
    type: {
      name: "string",
      renderer: {
        name: "toggle-cell",
        values: ["BUY", "SELL"],
      },
    },
    width: 60,
  },
  { name: "ric", pin: "left" },
  {
    name: "status",
    label: "Status",
    type: {
      name: "string",
      renderer: {
        name: "basket-status",
      },
    },
  },
  { name: "description", label: "Name", width: 220 },
  { name: "quantity" },
  { name: "weighting" },
  { name: "last" },
  { name: "bid", type: ticking },
  { name: "ask", type: ticking },
  { name: "limitPrice" },
  {
    name: "priceStrategyId",
    type: {
      name: "string",
      // renderer: {
      //   lookup: {
      //     labelColumn: "priceStrategy",
      //     table: { module: "BASKET", table: "priceStrategyType" },
      //     valueColumn: "id",
      //   },
      //   name: "dropdown-cell",
      // },
    },
    width: 120,
  },
  {
    name: "priceSpread",
    label: "Price Spread",
    type: {
      name: "number",
      renderer: {
        name: "basket-spread",
      },
    },
  },
  { name: "notionalUsd" },
  { name: "notionalLocal" },
  { name: "venue" },
  {
    name: "algo",
    type: {
      name: "string",
      // renderer: {
      //   lookup: {
      //     labelColumn: "algoType",
      //     table: { module: "BASKET", table: "algoType" },
      //     valueColumn: "id",
      //   },
      //   name: "dropdown-cell",
      // },
    },
    width: 120,
  },
  { name: "algoParams" },
  { name: "basketId", hidden },
  { name: "instanceId", hidden },
  { name: "instanceIdRic", hidden },
] as ColumnDescriptor[];
