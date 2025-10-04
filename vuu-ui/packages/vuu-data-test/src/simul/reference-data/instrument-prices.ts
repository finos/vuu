import { instrumentsData } from "./instruments";
import { pricesData } from "./prices";

type ask = number;
type askSize = number;
type bbg = string;
type bid = number;
type bidSize = number;
type close = number;
type currency = string;
type description = string;
type exchange = string;
type isin = string;
type last = number;
type lotSize = number;
type open = number;
type phase = string;
type ric = string;
type scenario = string;
type vuuCreatedTimestamp = number;
type vuuUpdatedTimestamp = number;

export type InstrumentPricesDataRow = [
  ask,
  askSize,
  bbg,
  bid,
  bidSize,
  close,
  currency,
  description,
  exchange,
  isin,
  last,
  lotSize,
  open,
  phase,
  ric,
  scenario,
  vuuCreatedTimestamp,
  vuuUpdatedTimestamp,
];

export const InstrumentPricesColumnMap = {
  ask: 0,
  askSize: 1,
  bbg: 2,
  bid: 3,
  bidSize: 4,
  close: 5,
  currency: 6,
  description: 7,
  exchange: 8,
  isin: 9,
  last: 10,
  lotSize: 11,
  open: 12,
  phase: 13,
  ric: 14,
  scenario: 15,
  vuuCreatedTimestamp: 16,
  vuuUpdatedTimestamp: 17,
};

const instrumentPrices: InstrumentPricesDataRow[] = [];

// const start = performance.now();
// Create 100_000 Instruments

for (let i = 0; i < instrumentsData.length; i++) {
  // prettier-ignore
  const [bbg,currency,description,exchange,isin,lotSize,/* skip price*/ ,ric] = instrumentsData[i];
  const [ask, askSize, bid, bidSize, close, last, open, phase, , scenario] =
    pricesData[i];

  instrumentPrices.push([
    ask,
    askSize,
    bbg,
    bid,
    bidSize,
    close,
    currency,
    description,
    exchange,
    isin,
    last,
    lotSize,
    open,
    phase,
    ric,
    scenario,
    0,
    0,
  ]);
}

export { instrumentPrices };

// const end = performance.now();
// console.log(`generating 100,000 instrumentPrices took ${end - start} ms`);
