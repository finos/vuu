import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { ChartDataLookup, ChartRowData } from "../src/engine/ChartModel";
import { defaultChartTheme } from "../src/theme/chartTheme";

export const theme = defaultChartTheme;

export const fakeDataSource = (name: string) =>
  ({ name }) as unknown as DataSource;

/**
 * Rows are plain arrays of column values, no metadata.
 */
export const rowData = (
  columns: string[],
  rows: unknown[][],
): ChartRowData => ({
  columnMap: Object.fromEntries(columns.map((c, i) => [c, i])),
  rows: rows as DataSourceRow[],
});

export const lookup = (
  entries: Array<[DataSource, ChartRowData]>,
): ChartDataLookup => {
  const map = new Map(entries);
  return {
    get: (ds) => {
      const data = map.get(ds);
      if (!data) {
        throw Error("unknown DataSource");
      }
      return data;
    },
  };
};

// biome-ignore lint/suspicious/noExplicitAny: test access to option internals
export type AnyOption = any;
