import { BasketTable } from "./BASKET/BasketTable";

// import { default as Basket } from "./Basket";

export const Basket = () => <BasketTable tableName="basket" />;

export const BasketConstituent = () => (
  <BasketTable tableName="basketConstituent" />
);

export const BasketTrading = () => <BasketTable tableName="basketTrading" />;

export const BasketTradingConstituent = () => (
  <BasketTable tableName="basketTradingConstituent" />
);

export const AlgoType = () => <BasketTable tableName="algoType" />;

export const PriceStrategyType = () => (
  <BasketTable tableName="priceStrategyType" />
);
