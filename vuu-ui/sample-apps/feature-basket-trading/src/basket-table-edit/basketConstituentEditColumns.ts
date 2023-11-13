import { ColumnDescriptor } from "packages/vuu-datagrid-types";

const editable = true;
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
    editable,
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
  { name: "description", label: "Name", width: 220 },
  { name: "quantity", editable },
  { name: "weighting", editable },
  { name: "last" },
  { name: "bid", type: ticking },
  { name: "ask", type: ticking },
  { name: "limitPrice", editable },
  {
    name: "priceStrategyId",
    editable,
    type: {
      name: "string",
      renderer: {
        lookup: {
          labelColumn: "priceStrategy",
          table: { module: "BASKET", table: "priceStrategyType" },
          valueColumn: "id",
        },
        name: "dropdown-cell",
      },
    },
    width: 120,
  },
  { name: "notionalUsd" },
  { name: "notionalLocal" },
  { name: "venue" },
  {
    name: "algo",
    editable,
    type: {
      name: "string",
      renderer: {
        lookup: {
          labelColumn: "algoType",
          table: { module: "BASKET", table: "algoType" },
          valueColumn: "id",
        },
        name: "dropdown-cell",
      },
    },
    width: 120,
  },
  { name: "algoParams" },
  { name: "basketId", hidden },
  { name: "instanceId", hidden },
  { name: "instanceIdRic", hidden },
  { name: "priceSpread" },
] as ColumnDescriptor[];
