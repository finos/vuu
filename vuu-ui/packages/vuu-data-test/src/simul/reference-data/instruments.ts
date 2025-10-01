import { isinGenerator } from "./isin-generator";
import tableContainer from "../../core/table/TableContainer";
import { currencies } from "./currencies";
import { locations, suffixes } from "./locations";
import { lotsizes } from "./lotsizes";
import { random } from "../../data-utils";
import { buildDataColumnMap } from "../../Table";
import { schemas } from "../simul-schemas";
import { Clock } from "@vuu-ui/vuu-utils";

const { createTable } = tableContainer;

const today = new Date();
const clock = new Clock({
  year: today.getFullYear(),
  month: today.getMonth() + 1,
  day: today.getDate(),
  hours: 7,
  minutes: 0,
  seconds: 0,
  milliseconds: 0,
});

export type bbg = string;
export type currency = string;
export type ric = string;
export type description = string;
export type exchange = string;
// seed for price generation
export type price = number;
export type date = number;

export type InstrumentsDataRow = [
  bbg,
  currency,
  description,
  exchange,
  string,
  number,
  ric,
  price,
  date,
  date,
];

export const InstrumentColumnMap = {
  bbg: 0,
  currency: 1,
  description: 2,
  exchange: 3,
  string: 4,
  number: 5,
  ric: 6,
  price: 7,
  date: 8,
} as const;

const instrumentsData: InstrumentsDataRow[] = [];

const chars1 = Array.from("ABCEFGHKMN");
const chars2 = Array.from("ABCEFGHKMN");
const chars3 = Array.from("OPQRTUVWYZ");
const chars4 = Array.from("OPQRTUVWYZ");

const randomPrice = () => {
  const price = random(0, 10000);
  const multiplier = random(1, 10);
  return price / multiplier;
};

// const start = performance.now();
// Create 10_000 Instruments
let count = 0;
for (const char1 of chars1) {
  for (const char2 of chars2) {
    for (const char3 of chars3) {
      for (const char4 of chars4) {
        const suffix = suffixes[count % 8];
        const ric = char1 + char2 + char3 + char4 + "." + suffix;
        const bbg = char1 + char2 + char3 + char4 + " " + suffix;
        const description = `${ric} description`;
        const currency = currencies[random(0, 4)];
        const isin = isinGenerator();
        const lotSize = lotsizes[random(0, lotsizes.length - 1)];

        const exchange = locations[suffix][1];
        const price = randomPrice();

        const timestamp = clock.now;

        instrumentsData.push([
          bbg,
          currency,
          description,
          exchange,
          String(isin),
          lotSize,
          ric,
          price,
          timestamp,
          timestamp,
        ]);
        count++;
        clock.advance(random(0, 10000));
      }
    }
  }
}

// const end = performance.now();
// console.log(`generating 10,000 instruments took ${end - start} ms`);

export const getRic = (defaultRic: string) => {
  const row = instrumentsData.at(random(0, instrumentsData.length));
  return row?.[InstrumentColumnMap.ric] ?? defaultRic;
};

export const instrumentsTable = createTable(
  schemas.instruments,
  instrumentsData,
  buildDataColumnMap(schemas, "instruments"),
);

export { instrumentsData };
