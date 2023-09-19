import InstrumentReferenceData from "./instruments";
import PriceReferenceData from "./prices";

export type ric = string;
export type quantity = number;
export type weighting = number;
export type last = number;
export type bid = number;
export type ask = number;
export type limitPrice = number;
export type pricesStrategy = string;
export type dollarNotional = number;
export type localNotional = number;
export type venue = string;
export type algo = string;
export type algoParams = string;

export type BasketDesignDataRow = [
  ric,
  quantity,
  weighting,
  last,
  bid,
  ask,
  limitPrice,
  pricesStrategy,
  dollarNotional,
  localNotional,
  venue,
  algo,
  algoParams
];

export const BasketDesignColumnMap = {
  ric: 0,
  quantity: 1,
  weighting: 2,
  last: 3,
  bid: 4,
  ask: 5,
  limitPrice: 6,
  pricesStrategy: 7,
  dollarNotional: 8,
  localNotional: 9,
  venue: 10,
  algo: 11,
  algoParam: 12,
};

const basketDesign: BasketDesignDataRow[] = [];

// const start = performance.now();
// Create 100_000 Instruments

for (let i = 0; i < InstrumentReferenceData.length; i++) {
  // prettier-ignore
  const [,,,,,,ric] = InstrumentReferenceData[i];
  const [ask, , bid, , , last] = PriceReferenceData[i];

  const quantity = 0;
  const weighting = 1;
  const limitPrice = bid * 0.995;
  const pricesStrategy = "PS";
  const dollarNotional = 120;
  const localNotional = 100;
  const venue = "ballroom";
  const algo = "seeker";
  const algoParams = "1,2,3";

  basketDesign.push([
    ric,
    quantity,
    weighting,
    last,
    bid,
    ask,
    limitPrice,
    pricesStrategy,
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
