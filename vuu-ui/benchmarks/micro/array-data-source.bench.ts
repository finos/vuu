/**
 * ArrayDataSource (vuu-data-local) operations at 100k and 1M rows: the work
 * the data source does before anything renders. Each config change runs
 * against a subscribed data source, so the rows in range are sent to the
 * (no-op) client callback as they would be to a Table.
 */
import type {
  DataSourceFilter,
  DataSourceSubscribeCallback,
} from "@vuu-ui/vuu-data-types";
import type { VuuGroupBy, VuuSort } from "@vuu-ui/vuu-protocol-types";
import { Range } from "@vuu-ui/vuu-utils";
import { type BenchRegistration, test } from "vitest";
import { KEY_COLUMN } from "../harness/dataset";
import {
  type BenchDataSource,
  benchOptions,
  columnDescriptors,
  createDataSource,
  label,
  ROW_COUNTS,
  rows,
  BenchDataSource as DataSourceClass,
} from "./fixtures";

const PAGE = 30;
const BUFFER = 5;
const noop: DataSourceSubscribeCallback = () => undefined;

const subscribed = (count: number) => {
  const dataSource = createDataSource(count);
  dataSource.subscribe({ range: Range(0, PAGE, BUFFER) }, noop);
  return dataSource;
};

/** Alternates between two values, so every assignment is a config change */
const alternate = <T>(a: T, b: T) => {
  let i = 0;
  return () => (i++ % 2 === 0 ? a : b);
};

for (const count of ROW_COUNTS) {
  const options = benchOptions(count);
  const n = label(count);

  test(`ArrayDataSource ${n} rows`, async ({ bench }) => {
    // generate the dataset before any timed run
    rows(count);
    const benches: BenchRegistration<string>[] = [];

    benches.push(
      bench(`construct ${n}`, () => {
        new DataSourceClass({
          columnDescriptors,
          data: rows(count),
          keyColumn: KEY_COLUMN,
        });
      }),
    );

    let dataSource: BenchDataSource;
    // Benches run synchronously, so the timers the data source schedules
    // (see setup.ts) only fire between benches. afterAll lets them fire and
    // unsubscribes, otherwise each 1M row data source stays in memory.
    const hooks = {
      beforeAll: () => {
        dataSource = subscribed(count);
      },
      afterAll: async () => {
        dataSource.unsubscribe();
        await new Promise((resolve) => setTimeout(resolve, 0));
      },
    };

    const nextSort = alternate<VuuSort>(
      { sortDefs: [{ column: "value1", sortType: "A" }] },
      { sortDefs: [{ column: "value1", sortType: "D" }] },
    );
    benches.push(
      bench(`sort numeric column ${n}`, hooks, () => {
        dataSource.sort = nextSort();
      }),
    );

    const nextTextSort = alternate<VuuSort>(
      { sortDefs: [{ column: "ric", sortType: "A" }] },
      { sortDefs: [{ column: "ric", sortType: "D" }] },
    );
    benches.push(
      bench(`sort text column ${n}`, hooks, () => {
        dataSource.sort = nextTextSort();
      }),
    );

    const nextFilter = alternate<DataSourceFilter>(
      { filter: "value1 > 500" },
      { filter: "value1 > 600" },
    );
    benches.push(
      bench(`filter ${n}`, hooks, () => {
        dataSource.filter = nextFilter();
      }),
    );

    const nextGroupBy = alternate<VuuGroupBy>(["ccy"], ["ric", "ccy"]);
    benches.push(
      bench(`groupBy ${n}`, hooks, () => {
        dataSource.groupBy = nextGroupBy();
      }),
    );

    // 100 small scroll steps of 3 rows, as a smooth vertical scroll
    let from = 0;
    benches.push(
      bench(`range change, 100 x 3 row scroll ${n}`, hooks, () => {
        for (let i = 0; i < 100; i++) {
          from = (from + 3) % (count - PAGE);
          dataSource.range = Range(from, from + PAGE, BUFFER);
        }
      }),
    );

    // 100 jumps to pseudo-random positions, as a scrollbar drag
    let seed = 1;
    benches.push(
      bench(`range change, 100 jumps ${n}`, hooks, () => {
        for (let i = 0; i < 100; i++) {
          seed = (seed * 16807) % 2147483647;
          const at = seed % (count - PAGE);
          dataSource.range = Range(at, at + PAGE, BUFFER);
        }
      }),
    );

    await bench.compare(...benches, options);
  });
}
