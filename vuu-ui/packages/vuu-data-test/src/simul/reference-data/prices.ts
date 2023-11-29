import instrumentTable, { InstrumentsDataRow } from "./instruments";
import { buildDataColumnMap, Table } from "../../Table";
import { schemas } from "../simul-schemas";
import { random } from "./utils";

export type ask = number;
export type askSize = number;
export type bid = number;
export type bidSize = number;
export type close = number;
export type last = number;
export type open = number;
export type phase = "C";
export type ric = string;
export type scenario = "close";

export type PricesDataRow = [
  ask,
  askSize,
  bid,
  bidSize,
  close,
  last,
  open,
  phase,
  ric,
  scenario
];

const prices: PricesDataRow[] = [];

const start = performance.now();
// Create 100_000 Instruments

// prettier-ignore
for (const [,,,,,,ric,
  priceSeed,
] of instrumentTable.data as InstrumentsDataRow[]) {
  const spread = random(0, 10);

  const ask = priceSeed + spread / 2;
  const askSize = random(1000, 3000);
  const bid = priceSeed - spread / 2;
  const bidSize = random(1000, 3000);
  const close = priceSeed + random(0, 1) / 10;
  const last = priceSeed + random(0, 1) / 10;
  const open = priceSeed + random(0, 1) / 10;
  const phase = "C";
  const scenario = "close";
  prices.push([
    ask,
    askSize,
    bid,
    bidSize,
    close,
    last,
    open,
    phase,
    ric,
    scenario,
  ]);
}

const end = performance.now();
console.log(`generating 100,000 prices took ${end - start} ms`);

const pricesTable = new Table(
  schemas.prices,
  prices,
  buildDataColumnMap(schemas.prices)
);

export default pricesTable;
