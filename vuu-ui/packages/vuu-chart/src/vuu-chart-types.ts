import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { MeasuredContainerProps } from "@vuu-ui/vuu-ui-controls";
import type { ColumnMap } from "@vuu-ui/vuu-utils";
import type { ECharts, EChartsCoreOption } from "echarts/core";
import type { ChartTheme } from "./theme/chartTheme";

export type ChartRenderer = "canvas" | "svg";

/**
 * true is equivalent to 'inside'.
 */
export type DataZoomOption = boolean | "inside" | "slider" | "both";

export type LegendPosition = "top" | "bottom" | "none";

export type XAxisType = "time" | "category" | "value";

export type RowPredicate = (
  row: DataSourceRow,
  columnMap: ColumnMap,
) => boolean;

/**
 * Restrict the rows used by a series. Either a map of column name to required
 * value (all must match) or a predicate.
 * e.g { side: "BUY" }
 */
export type RowMatch = Record<string, VuuRowDataItemType> | RowPredicate;

/**
 * Colour each data point according to the value in a column.
 * Colours may be any css colour or one of the theme colour names
 * 'up', 'down', 'palette-1' ... 'palette-8'.
 * e.g { columnName: "side", colors: { BUY: "up", SELL: "down" } }
 */
export interface ColorBy {
  columnName: string;
  colors: Record<string, string>;
  defaultColor?: string;
}

export type Aggregation = "sum" | "avg" | "min" | "max" | "count" | "last";

/**
 * - number: a fixed value
 * - 'last': the value of the last (most recent) data point
 * - 'min' | 'max' | 'average': computed over the series values
 * - { weightedAverage: column }: average of series values weighted by the
 *    named column (e.g. average fill price weighted by quantity)
 */
export type MarkLineValue =
  | number
  | "last"
  | "min"
  | "max"
  | "average"
  | { weightedAverage: string };

export interface MarkLineDef {
  value: MarkLineValue;
  label?: string;
  /** css colour or theme colour name ('up', 'down', 'palette-n') */
  color?: string;
  lineType?: "solid" | "dashed" | "dotted";
  /**
   * Position of the label, relative to the line. Default 'insideEndTop'
   * (inside the plot area, at the end of the line, so never clipped). Use
   * 'end' to place the label beyond the end of the line, e.g over a right
   * hand price axis.
   */
  labelPosition?: MarkLineLabelPosition;
}

export type MarkLineLabelPosition =
  | "start"
  | "middle"
  | "end"
  | "insideStartTop"
  | "insideStartBottom"
  | "insideMiddleTop"
  | "insideMiddleBottom"
  | "insideEndTop"
  | "insideEndBottom";

export type EChartsOptionsOverride =
  | EChartsCoreOption
  | ((generated: EChartsCoreOption) => EChartsCoreOption);

export interface ChartItemEvent {
  columnMap: ColumnMap;
  dataSource: DataSource;
  /** The DataSourceRow behind the clicked item, where one can be identified */
  row: DataSourceRow | undefined;
  /**
   * For aggregated items (hierarchy nodes, aggregated categories), all rows
   * contributing to the item.
   */
  rows?: DataSourceRow[];
  /** For hierarchy nodes, the group values from root to node */
  groupPath?: string[];
  seriesId: string;
  seriesName: string;
  dataIndex: number;
  value: unknown;
  nativeEvent?: Event;
}

export type ChartItemEventHandler = (event: ChartItemEvent) => void;

export interface VuuChartBaseProps
  extends Omit<MeasuredContainerProps, "children" | "onResize" | "onClick"> {
  /**
   * Additional raw ECharts options, deep merged over the generated options.
   * Arrays of components (series, xAxis, yAxis, grid, dataZoom etc) are
   * merged item by item, matched by id where present, otherwise by index.
   * Generated ids are documented in the README.
   * If a function is provided, it receives the generated option and returns
   * the option to be used. Note: overrides are applied when the chart
   * structure is (re)built, not on each data update.
   */
  echartsOptions?: EChartsOptionsOverride;
  /**
   * Maximum number of rows to be read from each DataSource. Default 1000.
   */
  maxRows?: number;
  /**
   * Invoked once the ECharts instance has been created.
   */
  onChartReady?: (chart: ECharts) => void;
  onItemClick?: ChartItemEventHandler;
  onItemContextMenu?: ChartItemEventHandler;
  /**
   * Default is 'canvas', which performs better with streaming data.
   */
  renderer?: ChartRenderer;
  /**
   * Show a legend. Default depends on chart type, generally shown when there
   * are multiple series.
   */
  legend?: LegendPosition;
  /**
   * Default true
   */
  showTooltip?: boolean;
  /**
   * Override any of the theme colours (by default resolved from css tokens).
   */
  theme?: Partial<ChartTheme>;
}

export type { ChartTheme };
