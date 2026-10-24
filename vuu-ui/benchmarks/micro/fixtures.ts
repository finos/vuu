import { ArrayDataSource } from "@vuu-ui/vuu-data-local";
import type { ColumnDescriptor } from "@vuu-ui/vuu-table-types";
import {
  datasetColumns,
  generateRows,
  KEY_COLUMN,
  type Row,
} from "../harness/dataset";

export const COLS = 20;
export const ROW_COUNTS = [100_000, 1_000_000] as const;

export const columnDescriptors: ColumnDescriptor[] = datasetColumns({
  cols: COLS,
}).map(({ name, serverDataType }) => ({ name, serverDataType }));

const datasets = new Map<number, Row[]>();

/**
 * The benchmark dataset (see harness/dataset.ts), generated once per row
 * count and shared by every benchmark in the file. Benchmarks that modify
 * rows must copy them first.
 */
export const rows = (count: number) => {
  let data = datasets.get(count);
  if (!data) {
    data = generateRows({
      rows: count,
      cols: COLS,
      cellType: "plain",
      seed: 1,
    });
    datasets.set(count, data);
  }
  return data;
};

/** ArrayDataSource with a public entry point for row updates */
export class BenchDataSource extends ArrayDataSource {
  applyUpdate(row: Row) {
    this.updateRow(row);
  }
}

export const createDataSource = (count: number) =>
  new BenchDataSource({
    columnDescriptors,
    data: rows(count),
    keyColumn: KEY_COLUMN,
  });

export const label = (count: number) =>
  count >= 1_000_000 ? `${count / 1_000_000}m` : `${count / 1000}k`;

/**
 * tinybench options. 1M row operations take hundreds of milliseconds each,
 * so they get a fixed, small number of iterations.
 */
export const benchOptions = (count: number) =>
  count >= 1_000_000
    ? { iterations: 5, time: 0, warmupIterations: 1, warmupTime: 0 }
    : { iterations: 10, time: 500, warmupIterations: 2 };
