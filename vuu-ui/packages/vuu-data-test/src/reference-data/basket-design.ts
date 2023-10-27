import InstrumentReferenceData from "./instruments";
import PriceReferenceData from "./prices";
import { priceStrategies } from "./priceStrategies";
import { random } from "./utils";

export type ric = string;
export type name = string;
export type quantity = number;
export type weighting = number;
export type last = number;
export type bid = number;
export type ask = number;
export type limitPrice = number;
export type priceStrategy = string;
export type dollarNotional = number;
export type localNotional = number;
export type venue = string;
export type algo = string;
export type algoParams = string;

export type BasketDesignDataRow = [
  ric,
  name,
  quantity,
  weighting,
  last,
  bid,
  ask,
  limitPrice,
  priceStrategy,
  dollarNotional,
  localNotional,
  venue,
  algo,
  algoParams
];

export const BasketDesignColumnMap = {
  ric: 0,
  name: 1,
  quantity: 2,
  weighting: 3,
  last: 4,
  bid: 5,
  ask: 6,
  limitPrice: 7,
  priceStrategy: 8,
  dollarNotional: 9,
  localNotional: 10,
  venue: 11,
  algo: 12,
  algoParam: 13,
};

const basketDesign: BasketDesignDataRow[] = [];

// const start = performance.now();
// Create 100_000 Instruments

for (let i = 0; i < InstrumentReferenceData.length; i++) {
  // prettier-ignore
  const [,,name,,,,ric] = InstrumentReferenceData[i];
  const [ask, , bid, , , last] = PriceReferenceData[i];

  const quantity = 0;
  const weighting = 1;
  const limitPrice = bid * 0.995;
  const priceStrategy = priceStrategies[random(0, priceStrategies.length - 1)];

  const dollarNotional = 120;
  const localNotional = 100;
  const venue = "ballroom";
  const algo = "seeker";
  const algoParams = "1,2,3";

  basketDesign.push([
    ric,
    name,
    quantity,
    weighting,
    last,
    bid,
    ask,
    limitPrice,
    priceStrategy,
    dollarNotional,
    localNotional,
    venue,
    algo,
    algoParams,
  ]);
}

// const end = performance.now();
// console.log(`generating 100,000 instrumentPrices took ${end - start} ms`);

export default basketDesign;
