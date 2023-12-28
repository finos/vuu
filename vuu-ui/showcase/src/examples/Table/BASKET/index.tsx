import { BasketTable } from "./BasketTable";

import { default as Basket } from "./Basket";
import { VuuExample } from "showcase/src/showcase-utils";

let displaySequence = 1;

(Basket as VuuExample).displaySequence = displaySequence++;
export { Basket };

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
