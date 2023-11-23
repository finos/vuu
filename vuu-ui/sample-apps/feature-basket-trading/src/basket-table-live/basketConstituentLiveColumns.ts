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
  { name: "ric", pin: "left" },
  {
    name: "orderStatus",
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
  { name: "pctFilled", label: "% Filled" },
  { name: "weighting" },
  { name: "last" },
  { name: "bid", type: ticking },
  { name: "ask", type: ticking },
  { name: "limitPrice" },
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
  {
    name: "priceStrategyId",
    type: {
      name: "string",
    },
    width: 120,
  },
  { name: "notionalUsd" },
  { name: "notionalLocal" },
  { name: "venue" },
  {
    name: "algo",
    type: {
      name: "string",
    },
    width: 120,
  },
  { name: "algoParams" },
  { name: "basketId", hidden },
  { name: "instanceId", hidden },
  { name: "instanceIdRic", hidden },
] as ColumnDescriptor[];
