import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";

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
  {
    label: "Symbol",
    name: "ric",
    pin: "left",
    colHeaderContentRenderer: "col-header-add-symbol",
    width: 120,
  },
  { name: "description", label: "Name", width: 220 },
  { name: "quantity", label: "Quantity" },
  { name: "weighting", label: "Weight", editable },
  {
    name: "last",
    label: "Last",
    type: { name: "number", formatting: { decimals: 2, zeroPad: true } },
  },
  { name: "bid", label: "Bid", type: ticking },
  { name: "ask", label: "Ask", type: ticking },
  { name: "limitPrice", label: "Limit price", editable },
  {
    name: "priceStrategyId",
    label: "Price strategy",
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
  { name: "notionalUsd", label: "Notional (USD)" },
  { name: "notionalLocal", label: "Notional (local)" },
  { name: "venue", label: "Venue" },
  {
    name: "algo",
    label: "Algo",
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
  { name: "algoParams", label: "Algo parameters" },
  { name: "basketId", hidden },
  { name: "instanceId", hidden },
  { name: "instanceIdRic", hidden },
  { name: "priceSpread", label: "Price spread" },
] as ColumnDescriptor[];
