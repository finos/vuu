import InstrumentReferenceData from "./instruments";
import PriceReferenceData from "./prices";
import { priceStrategies } from "./priceStrategies";
import { random, randomPercentage } from "./utils";

export type ric = string;
export type status = string;
export type name = string;
export type quantity = number;
export type filled = number;
export type weighting = number;
export type last = number;
export type bid = number;
export type ask = number;
export type limitPrice = number;
export type priceSpread = number;
export type priceStrategy = string;
export type dollarNotional = number;
export type localNotional = number;
export type venue = string;
export type algo = string;
export type algoParams = string;

export type BasketOrdersDataRow = [
  ric,
  status,
  name,
  quantity,
  filled,
  weighting,
  last,
  bid,
  ask,
  limitPrice,
  priceSpread,
  priceStrategy,
  dollarNotional,
  localNotional,
  venue,
  algo,
  algoParams
];

export const BasketOrdersColumnMap = {
  ric: 0,
  status: 1,
  name: 2,
  quantity: 3,
  filled: 4,
  weighting: 5,
  last: 6,
  bid: 7,
  ask: 8,
  limitPrice: 9,
  priceSpread: 10,
  priceStrategy: 11,
  dollarNotional: 12,
  localNotional: 13,
  venue: 14,
  algo: 15,
  algoParam: 16,
};

const orderStatus = ["on market", "fully filled", "rejected", "cancelled"];

const basketOrders: BasketOrdersDataRow[] = [];

const generateLimitPrice = (bid: number, ask: number) => {
  // low price
  if (random(0, 11) > 10) {
    return bid * 0.995;
  }
  if (random(0, 11) > 10) {
    return bid;
  }
  // high price
  if (random(0, 11) > 10) {
    return ask * 1.005;
  }
  if (random(0, 11) > 10) {
    return ask;
  }
  return bid + randomPercentage(ask - bid);
};

// const start = performance.now();
// Create 100_000 Instruments

for (let i = 0; i < InstrumentReferenceData.length; i++) {
  // prettier-ignore
  const [,,name,,,,ric] = InstrumentReferenceData[i];
  const [ask, , bid, , , last] = PriceReferenceData[i];
  const status = orderStatus[random(0, orderStatus.length - 1)];

  const quantity = random(1000, 100000);
  const filled = status === "rejected" ? 0 : random(0, quantity);
  const weighting = 1;
  const limitPrice = generateLimitPrice(bid, ask);
  const priceSpread = 0;
  const priceStrategy = priceStrategies[random(0, priceStrategies.length - 1)];

  const dollarNotional = 120;
  const localNotional = 100;
  const venue = "ballroom";
  const algo = "seeker";
  const algoParams = "1,2,3";

  basketOrders.push([
    ric,
    status,
    name,
    quantity,
    filled,
    weighting,
    last,
    bid,
    ask,
    limitPrice,
    priceSpread,
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

export default basketOrders;
