import { TableSchema } from "@vuu-ui/vuu-data-types";
import { VuuTable } from "@vuu-ui/vuu-protocol-types";

export type BasketsTableName =
  | "algoType"
  | "basket"
  | "basketConstituent"
  | "basketTrading"
  | "basketTradingConstituent"
  | "basketTradingConstituentJoin"
  | "priceStrategyType";

export const schemas: Readonly<
  Record<BasketsTableName, Readonly<TableSchema>>
> = {
  algoType: {
    columns: [
      { name: "algoType", serverDataType: "string" },
      { name: "id", serverDataType: "int" },
    ],
    key: "id",
    table: { module: "BASKET", table: "algoType" },
  },
  basket: {
    columns: [
      { name: "id", serverDataType: "string" },
      { name: "name", serverDataType: "string" },
      { name: "notionalValue", serverDataType: "double" },
      { name: "notionalValueUsd", serverDataType: "double" },
    ],
    key: "id",
    table: { module: "BASKET", table: "basket" },
  },
  basketConstituent: {
    columns: [
      { name: "basketId", serverDataType: "string" },
      { name: "change", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "lastTrade", serverDataType: "string" },
      { name: "ric", serverDataType: "string" },
      { name: "ricBasketId", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "volume", serverDataType: "string" },
      { name: "weighting", serverDataType: "double" },
    ],
    key: "ricBasketId",
    table: { module: "BASKET", table: "basketConstituent" },
  },
  basketTrading: {
    columns: [
      { name: "basketId", serverDataType: "string" },
      { name: "basketName", serverDataType: "string" },
      { name: "filledPct", serverDataType: "double" },
      { name: "fxRateToUsd", serverDataType: "double" },
      { name: "instanceId", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "totalNotional", serverDataType: "double" },
      { name: "totalNotionalUsd", serverDataType: "double" },
      { name: "units", serverDataType: "int" },
    ],
    key: "instanceId",
    table: { module: "BASKET", table: "basketTrading" },
  },
  basketTradingConstituent: {
    columns: [
      { name: "algo", serverDataType: "string" },
      { name: "algoParams", serverDataType: "string" },
      { name: "basketId", serverDataType: "string" },
      { name: "description", serverDataType: "string" },
      { name: "instanceId", serverDataType: "string" },
      { name: "instanceIdRic", serverDataType: "string" },
      { name: "limitPrice", serverDataType: "double" },
      { name: "notionalLocal", serverDataType: "double" },
      { name: "notionalUsd", serverDataType: "double" },
      { name: "pctFilled", serverDataType: "double" },
      { name: "priceSpread", serverDataType: "int" },
      { name: "priceStrategyId", serverDataType: "int" },
      { name: "quantity", serverDataType: "long" },
      { name: "ric", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "venue", serverDataType: "string" },
      { name: "weighting", serverDataType: "double" },
    ],
    key: "instanceIdRic",
    table: { module: "BASKET", table: "basketTradingConstituent" },
  },

  basketTradingConstituentJoin: {
    columns: [
      { name: "algo", serverDataType: "string" },
      { name: "algoParams", serverDataType: "string" },
      { name: "ask", serverDataType: "double" },
      { name: "askSize", serverDataType: "double" },
      { name: "basketId", serverDataType: "string" },
      { name: "bid", serverDataType: "double" },
      { name: "bidSize", serverDataType: "double" },
      { name: "close", serverDataType: "double" },
      { name: "created", serverDataType: "long" },
      { name: "description", serverDataType: "string" },
      { name: "instanceId", serverDataType: "string" },
      { name: "instanceIdRic", serverDataType: "string" },
      { name: "last", serverDataType: "double" },
      { name: "lastUpdate", serverDataType: "long" },
      { name: "limitPrice", serverDataType: "double" },
      { name: "notionalLocal", serverDataType: "double" },
      { name: "notionalUsd", serverDataType: "double" },
      { name: "open", serverDataType: "double" },
      { name: "pctFilled", serverDataType: "double" },
      { name: "phase", serverDataType: "string" },
      { name: "priceSpread", serverDataType: "int" },
      { name: "priceStrategyId", serverDataType: "int" },
      { name: "quantity", serverDataType: "long" },
      { name: "ric", serverDataType: "string" },
      { name: "scenario", serverDataType: "string" },
      { name: "side", serverDataType: "string" },
      { name: "status", serverDataType: "string" },
      { name: "venue", serverDataType: "string" },
      { name: "weighting", serverDataType: "double" },
    ],
    key: "instanceIdRic",
    table: { module: "BASKET", table: "basketTradingConstituentJoin" },
  },
  priceStrategyType: {
    columns: [
      { name: "priceStrategy", serverDataType: "string" },
      { name: "id", serverDataType: "int" },
    ],
    key: "",
    table: { module: "BASKET", table: "priceStrategyType" },
  },
};

export type BasketVuuTable = {
  module: "BASKET";
  table: BasketsTableName;
};

export const isBasketTable = (table: VuuTable): table is BasketVuuTable =>
  table.module === "BASKET";
