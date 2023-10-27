import InstrumentReferenceData from "./instruments";
import PriceReferenceData from "./prices";

export type ask = number;
export type askSize = number;
export type bbg = string;
export type bid = number;
export type bidSize = number;
export type close = number;
export type currency = string;
export type description = string;
export type exchange = string;
export type isin = string;
export type last = number;
export type lotSize = number;
export type open = number;
export type phase = string;
export type ric = string;
export type scenario = string;

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
  scenario
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
  scenari: 15,
};

const instrumentPrices: InstrumentPricesDataRow[] = [];

// const start = performance.now();
// Create 100_000 Instruments

for (let i = 0; i < InstrumentReferenceData.length; i++) {
  // prettier-ignore
  const [bbg,currency,description,exchange,isin,lotSize,ric] = InstrumentReferenceData[i];
  const [ask, askSize, bid, bidSize, close, last, open, phase, , scenario] =
    PriceReferenceData[i];

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
  ]);
}

// const end = performance.now();
// console.log(`generating 100,000 instrumentPrices took ${end - start} ms`);

export default instrumentPrices;
