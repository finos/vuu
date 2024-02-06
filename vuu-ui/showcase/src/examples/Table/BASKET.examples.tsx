import { BasketTable } from "./BASKET/BasketTable";

// import { default as Basket } from "./Basket";

let displaySequence = 1;

export const Basket = () => <BasketTable tableName="basket" />;
Basket.displaySequence = displaySequence++;

export const BasketConstituent = () => (
  <BasketTable tableName="basketConstituent" />
);
BasketConstituent.displaySequence = displaySequence++;

export const BasketTrading = () => <BasketTable tableName="basketTrading" />;
BasketTrading.displaySequence = displaySequence++;

export const BasketTradingConstituent = () => (
  <BasketTable tableName="basketTradingConstituent" />
);
BasketTradingConstituent.displaySequence = displaySequence++;

export const AlgoType = () => <BasketTable tableName="algoType" />;
AlgoType.displaySequence = displaySequence++;

export const PriceStrategyType = () => (
  <BasketTable tableName="priceStrategyType" />
);
PriceStrategyType.displaySequence = displaySequence++;
