import { random } from "./utils";

export type id = string;
export type symbolName = string;
export type name = string;
export type units = number;
export type totalDollarNotional = number;
export type totalNotional = number;
export type currency = string;
export type exchangeRateToUSD = number;

export type BasketDefinitionsDataRow = [
  id,
  symbolName,
  name,
  units,
  totalDollarNotional,
  totalNotional,
  currency,
  exchangeRateToUSD
];

export const BasketDefinitionsColumnMap = {
  id: 0,
  symbolName: 1,
  name: 2,
  units: 3,
  totalDollarNotional: 4,
  totalNotional: 5,
  currency: 6,
  exchangeRateToUSD: 7,
};

const baskets = [
  ["001", "FTSE 1", "FTSE Basket Name 1"],
  ["002", "ABCD 2", "ABCD Basket Name 2"],
  ["003", "BBDF 3", "BBDF Basket Name 3"],
  ["004", "MYCD 4", "MYCD Basket Name 4"],
  ["005", "BIDO 5", "BIDO Basket Name 5"],
];

const basketDefinitions: BasketDefinitionsDataRow[] = [];

// const start = performance.now();
// Create 100_000 Instruments

for (const basket of baskets) {
  // prettier-ignore
  const [id,symbolName,name] = basket;

  const units = 1000;
  const currency = "GBP";
  const exchangeRateToUSD = 1.6 + random(1, 9) / 101;
  const totalNotional = random(100_000, 1_000_000);
  const totalDollarNotional = totalNotional * exchangeRateToUSD;

  basketDefinitions.push([
    id,
    symbolName,
    name,
    units,
    totalDollarNotional,
    totalNotional,
    currency,
    exchangeRateToUSD,
  ]);
}

// const end = performance.now();
// console.log(`generating 100,000 instrumentPrices took ${end - start} ms`);

export default basketDefinitions;
