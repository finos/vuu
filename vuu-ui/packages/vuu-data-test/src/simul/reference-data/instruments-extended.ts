import { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import { buildDataColumnMap } from "../../Table";
import { schemas } from "../simul-schemas";
import { InstrumentColumnMap, instrumentsData } from "./instruments";
import tableContainer from "../../core/table/TableContainer";

type ScaledDecimalPlaces = 2 | 4 | 6 | 8;

/**
 * Small seeded PRNG (mulberry32) so the extended columns hold the same
 * values on every load. Tests can rely on them.
 */
const createRandom = (seed: number) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const randomInt = (next: () => number, min: number, max: number) =>
  Math.floor(next() * (max - min + 1)) + min;

/**
 * Scaled decimals are sent by the Vuu server as the string form of the
 * scaled integer, e.g. 1234.56 as a scaleddecimal2 is sent as "123456".
 */
const toScaledDecimal = (value: number, decimals: ScaledDecimalPlaces) =>
  String(Math.round(value * 10 ** decimals));

/**
 * The first rows hold edge cases for every scaled decimal column:
 * zero, a negative value, a whole number, the smallest positive and
 * negative values the precision allows, and a value with a trailing zero.
 */
const scaledDecimalEdgeCases = (decimals: ScaledDecimalPlaces) => [
  "0",
  toScaledDecimal(-1234.5, decimals),
  toScaledDecimal(100, decimals),
  "1",
  "-1",
  toScaledDecimal(1.5, decimals),
];

const scaledDecimalColumn = (
  seed: number,
  decimals: ScaledDecimalPlaces,
  min: number,
  max: number,
) => {
  const next = createRandom(seed);
  const edgeCases = scaledDecimalEdgeCases(decimals);
  const scale = 10 ** decimals;
  return (rowIndex: number) =>
    rowIndex < edgeCases.length
      ? edgeCases[rowIndex]
      : String(randomInt(next, min * scale, max * scale));
};

const nextNotional = scaledDecimalColumn(2, 2, -1_000_000, 10_000_000);
const nextClosePrice = scaledDecimalColumn(4, 4, 0, 5_000);
const nextFxRate = scaledDecimalColumn(6, 6, 0.5, 2);
const nextWeight = scaledDecimalColumn(8, 8, 0, 0.05);

const nextRandom = createRandom(1);

const ONE_DAY = 24 * 60 * 60 * 1000;
const today = new Date();
today.setHours(0, 0, 0, 0);
const startOfToday = today.getTime();

const columns = schemas.instrumentsExtended.columns;

const instrumentsExtendedData: VuuRowDataItemType[][] = instrumentsData.map(
  (instrument, rowIndex) => {
    const values: Record<string, VuuRowDataItemType> = {
      bbg: instrument[InstrumentColumnMap.bbg],
      currency: instrument[InstrumentColumnMap.currency],
      description: instrument[InstrumentColumnMap.description],
      exchange: instrument[InstrumentColumnMap.exchange],
      isin: instrument[InstrumentColumnMap.string],
      lotSize: instrument[InstrumentColumnMap.number],
      ric: instrument[InstrumentColumnMap.ric],
      side: nextRandom() < 0.5 ? "B" : "S",
      supported: nextRandom() < 0.5,
      wishlist: nextRandom() < 0.5,
      lastUpdated: instrument[InstrumentColumnMap.vuuUpdatedTimestamp],
      price: Math.round(nextRandom() * 100_000) / 100,
      notional: nextNotional(rowIndex),
      closePrice: nextClosePrice(rowIndex),
      fxRate: nextFxRate(rowIndex),
      weight: nextWeight(rowIndex),
      tradeDate: startOfToday - (rowIndex % 30) * ONE_DAY,
      vuuCreatedTimestamp: instrument[InstrumentColumnMap.vuuCreatedTimestamp],
      vuuUpdatedTimestamp: instrument[InstrumentColumnMap.vuuUpdatedTimestamp],
      vuuMsg: "",
    };
    return columns.map(({ name }) => values[name]);
  },
);

export const instrumentsExtendedTable = tableContainer.createTable(
  schemas.instrumentsExtended,
  instrumentsExtendedData,
  buildDataColumnMap(schemas, "instrumentsExtended"),
);
