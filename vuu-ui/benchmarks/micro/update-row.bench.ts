/**
 * Row updates by key. ArrayDataSource.updateRow and the vuu-data-test
 * Table.updateRow find the updated row with a linear findIndex over the
 * data, so the cost of an update grows with the row's position: an update
 * to the last of 1M rows scans 1M rows. Each benchmark applies 100 updates
 * to rows at one position, first, middle or last.
 */
import type { TableSchema } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
// imported from source, the package index starts the simulation modules
import { Table } from "../../packages/vuu-data-test/src/Table";
import { bench, describe } from "vitest";
import { createRandom, datasetColumns, updatedRow } from "../harness/dataset";
import {
  type BenchDataSource,
  benchOptions,
  COLS,
  createDataSource,
  label,
  ROW_COUNTS,
  rows,
} from "./fixtures";

const UPDATES = 100;

const positions = (count: number) =>
  [
    ["first", 0],
    ["middle", Math.floor(count / 2)],
    ["last", count - 1],
  ] as const;

type TableRow = Array<VuuRowDataItemType | bigint>;

const TIMESTAMP_COLUMN = "vuuUpdatedTimestamp";

const createTable = (count: number) => {
  const columns = [
    ...datasetColumns({ cols: COLS }),
    { name: TIMESTAMP_COLUMN, serverDataType: "long" as const },
  ];
  const schema: TableSchema = {
    columns,
    key: columns[0].name,
    table: { module: "BENCHMARK", table: `bench_${count}` },
  };
  const dataMap = Object.fromEntries(columns.map(({ name }, i) => [name, i]));
  const data: TableRow[] = rows(count).map((row) => [...row, 0]);
  return new Table(schema, data, dataMap);
};

for (const count of ROW_COUNTS) {
  const options = benchOptions(count);
  const n = label(count);

  describe(`ArrayDataSource.updateRow ${n} rows`, () => {
    rows(count);
    let dataSource: BenchDataSource;
    const setup = () => {
      dataSource = createDataSource(count);
    };
    for (const [position, rowIndex] of positions(count)) {
      const random = createRandom(rowIndex);
      bench(
        `${UPDATES} updates to the ${position} row of ${n}`,
        () => {
          const row = rows(count)[rowIndex];
          for (let i = 0; i < UPDATES; i++) {
            dataSource.applyUpdate(updatedRow(row, i, random, 3));
          }
        },
        { ...options, setup },
      );
    }
  });

  describe(`vuu-data-test Table.updateRow ${n} rows`, () => {
    let table: Table;
    const setup = () => {
      table = createTable(count);
    };
    for (const [position, rowIndex] of positions(count)) {
      const random = createRandom(rowIndex);
      bench(
        `${UPDATES} updates to the ${position} row of ${n}`,
        () => {
          const row = table.data[rowIndex] as Parameters<typeof updatedRow>[0];
          for (let i = 0; i < UPDATES; i++) {
            table.updateRow(updatedRow(row, i, random, 3));
          }
        },
        { ...options, setup },
      );
    }
  });
}
