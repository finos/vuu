import { buildDataColumnMap, Table } from "../../Table";
import { BaseUpdateGenerator } from "../../UpdateGenerator";
import { schemas } from "../simul-schemas";
import basketConstituentData from "../../basket/reference-data/constituents";
import { random } from "../../data-utils";
import {
  InstrumentColumnMap,
  instrumentsData,
} from "../reference-data/instruments";

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

const { bid, bidSize, ask, askSize } = buildDataColumnMap(schemas.prices);
const pricesUpdateGenerator = new BaseUpdateGenerator({
  bid,
  bidSize,
  ask,
  askSize,
});

// const start = performance.now();
// Create 100_000 Instruments
const requiredInstrumentFields = ["ric", "price"] as const;
const pricesData: Array<PricesDataRow> = instrumentsData.map((instrument) => {
  const { ric, price: priceSeed } = requiredInstrumentFields.reduce(
    (obj, f) => ({ ...obj, [f]: instrument[InstrumentColumnMap[f]] }),
    {} as { ric: string; price: number }
  );
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
  return [ask, askSize, bid, bidSize, close, last, open, phase, ric, scenario];
});

// prettier-ignore
for (const [,,,lastTrade,ric] of basketConstituentData) {
  const priceSeed = parseFloat(String(lastTrade));
  if (!isNaN(priceSeed)) {
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
    pricesData.push([
      ask,
      askSize,
      bid,
      bidSize,
      close,
      last,
      open,
      phase,
      ric as string,
      scenario,
    ]);
  }
}

// const end = performance.now();
// console.log(`generating 100,000 prices took ${end - start} ms`);

const pricesTable = new Table(
  schemas.prices,
  pricesData,
  buildDataColumnMap(schemas.prices),
  pricesUpdateGenerator
);

export { pricesData };
export default pricesTable;
