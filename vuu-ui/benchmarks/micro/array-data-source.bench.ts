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
import { bench, describe } from "vitest";
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

  describe(`ArrayDataSource ${n} rows`, () => {
    // generate the dataset while collecting, outside any timed run
    rows(count);

    bench(
      `construct ${n}`,
      () => {
        new DataSourceClass({
          columnDescriptors,
          data: rows(count),
          keyColumn: KEY_COLUMN,
        });
      },
      options,
    );

    let dataSource: BenchDataSource;
    const setup = () => {
      dataSource = subscribed(count);
    };

    const nextSort = alternate<VuuSort>(
      { sortDefs: [{ column: "value1", sortType: "A" }] },
      { sortDefs: [{ column: "value1", sortType: "D" }] },
    );
    bench(
      `sort numeric column ${n}`,
      () => {
        dataSource.sort = nextSort();
      },
      { ...options, setup },
    );

    const nextTextSort = alternate<VuuSort>(
      { sortDefs: [{ column: "ric", sortType: "A" }] },
      { sortDefs: [{ column: "ric", sortType: "D" }] },
    );
    bench(
      `sort text column ${n}`,
      () => {
        dataSource.sort = nextTextSort();
      },
      { ...options, setup },
    );

    const nextFilter = alternate<DataSourceFilter>(
      { filter: "value1 > 500" },
      { filter: "value1 > 600" },
    );
    bench(
      `filter ${n}`,
      () => {
        dataSource.filter = nextFilter();
      },
      { ...options, setup },
    );

    const nextGroupBy = alternate<VuuGroupBy>(["ccy"], ["ric", "ccy"]);
    bench(
      `groupBy ${n}`,
      () => {
        dataSource.groupBy = nextGroupBy();
      },
      { ...options, setup },
    );

    // 100 small scroll steps of 3 rows, as a smooth vertical scroll
    let from = 0;
    bench(
      `range change, 100 x 3 row scroll ${n}`,
      () => {
        for (let i = 0; i < 100; i++) {
          from = (from + 3) % (count - PAGE);
          dataSource.range = Range(from, from + PAGE, BUFFER);
        }
      },
      { ...options, setup },
    );

    // 100 jumps to pseudo-random positions, as a scrollbar drag
    let seed = 1;
    bench(
      `range change, 100 jumps ${n}`,
      () => {
        for (let i = 0; i < 100; i++) {
          seed = (seed * 16807) % 2147483647;
          const at = seed % (count - PAGE);
          dataSource.range = Range(at, at + PAGE, BUFFER);
        }
      },
      { ...options, setup },
    );
  });
}
