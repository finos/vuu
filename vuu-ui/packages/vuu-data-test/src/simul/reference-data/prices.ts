import { buildDataColumnMap } from "../../Table";
import { BaseUpdateGenerator } from "../../UpdateGenerator";
import { schemas } from "../simul-schemas";
import { instrumentsData, InstrumentColumnMap } from "./instruments";
import { random } from "../../data-utils";
import basketConstituentData from "../../basket/reference-data/constituents";
import tableContainer from "../../core/table/TableContainer";

type ask = number;
type askSize = number;
type bid = number;
type bidSize = number;
type close = number;
type last = number;
type open = number;
type phase = "C";
type ric = string;
type scenario = "close";
type lastUpdate = number;
type created = number;

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
  scenario,
  lastUpdate,
  created,
];

const { bid, bidSize, ask, askSize } = buildDataColumnMap(schemas, "prices");
const pricesUpdateGenerator = new BaseUpdateGenerator({
  bid,
  bidSize,
  ask,
  askSize,
});

const now = Date.now();
const lastUpdate = now;
const created = now;

// const start = performance.now();
// Create 100_000 Instruments
const requiredInstrumentFields = ["ric", "price"] as const;
const pricesData: Array<PricesDataRow> = instrumentsData.map((instrument) => {
  const { ric, price: priceSeed } = requiredInstrumentFields.reduce(
    (obj, f) => ({ ...obj, [f]: instrument[InstrumentColumnMap[f]] }),
    {} as { ric: string; price: number },
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
  const lastUpdate = now;
  const created = now;
  return [
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
    lastUpdate,
    created,
  ];
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
      lastUpdate,
      created
    ]);
  }
}

// const end = performance.now();
// console.log(`generating 100,000 prices took ${end - start} ms`);

export const pricesTable = tableContainer.createTable(
  schemas.prices,
  pricesData,
  buildDataColumnMap(schemas, "prices"),
  pricesUpdateGenerator,
);

export { pricesData };
