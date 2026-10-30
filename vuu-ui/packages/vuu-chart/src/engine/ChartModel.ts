import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { ColumnMap } from "@vuu-ui/vuu-utils";
import type { EChartsCoreOption } from "echarts/core";
import type { ChartTheme } from "../theme/chartTheme";

export interface SeriesRows {
  dataSource: DataSource;
  /** rows, in the same order as the series data items */
  rows: DataSourceRow[];
  /**
   * For aggregated items (e.g. hierarchy nodes), rows keyed by group key.
   * Data items carry the key in a `vuuGroupKey` property.
   */
  groups?: Map<string, DataSourceRow[]>;
}

/** Separator used in group keys (ascii unit separator) */
export const GROUP_KEY_SEPARATOR = "\u001f";

export interface ChartRowData {
  columnMap: ColumnMap;
  /** rows in DataSource (index) order */
  rows: DataSourceRow[];
}

/**
 * Provides the current rows for each DataSource used by a chart.
 */
export interface ChartDataLookup {
  get: (dataSource: DataSource) => ChartRowData;
}

export interface ChartDataOption {
  /**
   * Partial option, containing only data dependent values (series data,
   * category axis data, markLines, visualMap ranges). Merged (by component
   * id) into the existing chart option on each data update.
   */
  option: EChartsCoreOption;
  /** Keyed by series id, used to resolve rows for item events */
  rowLookup?: Record<string, SeriesRows>;
}

/**
 * Describes a chart to the chart engine. Each chart type creates a model
 * from its props.
 */
export interface ChartModel {
  /** All DataSources that will be read by buildDataOption */
  dataSources: DataSource[];
  /**
   * The structural option - series definitions (without data), axes, grids,
   * tooltip, legend etc. Rebuilt only when props or theme change.
   */
  buildBaseOption: (theme: ChartTheme) => EChartsCoreOption;
  /**
   * Builds the data dependent part of the option from the current rows.
   * Invoked at most once per animation frame while data is changing.
   */
  buildDataOption: (
    data: ChartDataLookup,
    theme: ChartTheme,
  ) => ChartDataOption;
}
