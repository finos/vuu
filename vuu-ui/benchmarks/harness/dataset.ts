/**
 * Synthetic benchmark data and update generation, shared by the in-page
 * harness (local data) and the mock Vuu server (remote data), so that a
 * seed produces the same rows and the same updates on both paths. Pure
 * functions only, this file runs in the browser and in node.
 */
import type { DatasetConfig } from "./types";

export type RowValue = string | number | boolean;
export type Row = RowValue[];

/** mulberry32, small and fast seeded PRNG returning values in [0, 1) */
export const createRandom = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export type Random = ReturnType<typeof createRandom>;

export const KEY_COLUMN = "id";
/** carries the update batch sequence number, used to time update-to-paint */
export const SEQ_COLUMN = "seq";
/** index of the first value column, after id, seq and the text columns */
export const FIRST_VALUE_COLUMN = 4;

const TEXT_VALUES = ["AAPL", "MSFT", "AMZN", "GOOG", "META", "NVDA", "TSLA"];
const CCY_VALUES = ["USD", "EUR", "GBP", "JPY", "CHF"];

export const columnCount = ({ cols }: Pick<DatasetConfig, "cols">) =>
  Math.max(cols, FIRST_VALUE_COLUMN);

export interface DatasetColumn {
  name: string;
  serverDataType: "string" | "double";
}

/**
 * Columns: id, seq, two text columns, then (cols - 4) double columns.
 * Value columns are the ones that tick.
 */
export const datasetColumns = (dataset: Pick<DatasetConfig, "cols">) => {
  const columns: DatasetColumn[] = [
    { name: KEY_COLUMN, serverDataType: "string" },
    { name: SEQ_COLUMN, serverDataType: "string" },
    { name: "ric", serverDataType: "string" },
    { name: "ccy", serverDataType: "string" },
  ];
  for (let i = FIRST_VALUE_COLUMN; i < columnCount(dataset); i++) {
    columns.push({
      name: `value${i - FIRST_VALUE_COLUMN + 1}`,
      serverDataType: "double",
    });
  }
  return columns;
};

export const rowKey = (index: number) => `row-${index}`;

export const generateRows = (dataset: DatasetConfig): Row[] => {
  const { rows, seed } = dataset;
  const random = createRandom(seed);
  const count = columnCount(dataset);
  const data = new Array<Row>(rows);
  for (let r = 0; r < rows; r++) {
    const row = new Array<RowValue>(count);
    row[0] = rowKey(r);
    row[1] = "0";
    row[2] = TEXT_VALUES[Math.floor(random() * TEXT_VALUES.length)];
    row[3] = CCY_VALUES[Math.floor(random() * CCY_VALUES.length)];
    for (let c = FIRST_VALUE_COLUMN; c < count; c++) {
      row[c] = Math.round(random() * 100_000) / 100;
    }
    data[r] = row;
  }
  return data;
};

/**
 * The Vuu table name for a dataset. The mock Vuu server generates the
 * dataset from the name, so the page needs no other channel to describe it.
 */
export const datasetTableName = ({ rows, cols, seed }: DatasetConfig) =>
  `bench_${rows}_${cols}_${seed}`;

export const parseDatasetTableName = (
  name: string,
): Pick<DatasetConfig, "rows" | "cols" | "seed"> | undefined => {
  const match = /^bench_(\d+)_(\d+)_(\d+)$/.exec(name);
  return match
    ? { rows: Number(match[1]), cols: Number(match[2]), seed: Number(match[3]) }
    : undefined;
};

/** PRNG for the update stream of a tick run */
export const updateRandom = (seed: number) => createRandom(seed + 2);

/**
 * Returns a copy of row with the batch sequence number in the seq column and
 * `columnsPerUpdate` value columns moved by up to +/-0.1%.
 */
export const updatedRow = (
  row: Row,
  seq: number,
  random: Random,
  columnsPerUpdate: number,
): Row => {
  const valueColumns = row.length - FIRST_VALUE_COLUMN;
  const updated = row.slice();
  updated[1] = String(seq);
  for (let c = 0; c < Math.min(columnsPerUpdate, valueColumns); c++) {
    const col = FIRST_VALUE_COLUMN + Math.floor(random() * valueColumns);
    const value = updated[col] as number;
    updated[col] =
      Math.round(value * (1 + (random() - 0.5) * 0.002) * 100) / 100;
  }
  return updated;
};

/** steady feed: update batches are emitted at this interval */
export const STEADY_INTERVAL_MS = 4;

/**
 * Number of updates a steady feed has emitted `elapsedMs` after it started
 */
export const steadyUpdatesDue = (updatesPerSecond: number, elapsedMs: number) =>
  Math.floor((updatesPerSecond * elapsedMs) / 1000);

/**
 * Pause after a burst, modelled on the Vuu simulation's price provider:
 * a random 10-400ms sleep with a 100ms minimum cycle, about 215ms on average.
 */
export const burstPauseMs = (random: Random) =>
  Math.max(100, 10 + random() * 390);
