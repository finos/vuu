import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { VuuRowDataItemType } from "@vuu-ui/vuu-protocol-types";
import type { EChartsCoreOption } from "echarts/core";
import {
  Aggregator,
  filterRows,
  getColumnValue,
  getNumber,
  toNumber,
} from "../chart-data/projection-utils";
import type {
  ChartDataLookup,
  ChartModel,
  SeriesRows,
} from "../engine/ChartModel";
import {
  axisStyle,
  dataZoomOption,
  formatTimeLabel,
  hasSlider,
  textStyle,
  tooltipOption,
} from "../options/common";
import type { ChartTheme } from "../theme/chartTheme";
import type { Aggregation, DataZoomOption, RowMatch } from "../vuu-chart-types";

export interface HeatmapAxisDef {
  columnName: string;
  /**
   * Numeric values are rounded down to a multiple of bucketSize, e.g. 60000
   * to bucket timestamps by minute, or 0.5 to bucket prices.
   */
  bucketSize?: number;
  /**
   * 'time' formats (epoch millis) values as times, 'value' sorts numeric
   * values, 'category' (default for non numeric values) uses DataSource order.
   */
  type?: "time" | "value" | "category";
  name?: string;
}

export interface HeatmapChartOptions {
  /** How values falling in the same cell are combined. Default 'sum' */
  aggregation?: Aggregation;
  /**
   * 'sequential' (default) maps low to high values onto theme.heatmapColors.
   * 'diverging' maps negative values to the down colour and positive values
   * to the up colour, symmetric around zero, e.g. for pnl.
   */
  colorScale?: "sequential" | "diverging";
  dataSource: DataSource;
  dataZoom?: DataZoomOption;
  /** Formats time values (epoch millis) for axis labels */
  formatTime?: (timestamp: number) => string;
  /** Fixed visualMap range, by default computed from data */
  max?: number;
  min?: number;
  showTooltip?: boolean;
  /** Show the visualMap colour scale. Default true */
  showVisualMap?: boolean;
  /** Column providing the cell value. */
  valueColumnName: string;
  where?: RowMatch;
  xAxis: HeatmapAxisDef;
  yAxis: HeatmapAxisDef;
}

const decimalPlaces = (n: number) => {
  const [, fraction = ""] = String(n).split(".");
  return fraction.length;
};

/**
 * Floor to a multiple of bucketSize, tolerant of binary floating point
 * error, e.g. 10.1 with bucketSize 0.1 gives 10.1, not 10.000000000000002
 */
const bucketFloor = (value: number, bucketSize: number) => {
  const bucket = Math.floor(value / bucketSize + 1e-9) * bucketSize;
  return Number(bucket.toFixed(decimalPlaces(bucketSize)));
};

const bucketValue = (value: unknown, axis: HeatmapAxisDef) => {
  const isNumeric = axis.type === "time" || axis.type === "value";
  if (isNumeric || axis.bucketSize !== undefined) {
    const num = toNumber(value as VuuRowDataItemType);
    if (num === null) {
      return null;
    }
    return axis.bucketSize ? bucketFloor(num, axis.bucketSize) : num;
  }
  return value === undefined || value === null ? null : String(value);
};

const sortKeys = (keys: Array<string | number>, axis: HeatmapAxisDef) =>
  axis.type === "time" || axis.type === "value" || axis.bucketSize !== undefined
    ? keys.slice().sort((k1, k2) => Number(k1) - Number(k2))
    : keys;

export const createHeatmapModel = ({
  aggregation = "sum",
  colorScale = "sequential",
  dataSource,
  dataZoom,
  formatTime = formatTimeLabel,
  max,
  min,
  showTooltip = true,
  showVisualMap = true,
  valueColumnName,
  where,
  xAxis,
  yAxis,
}: HeatmapChartOptions): ChartModel => {
  const labelFormatter = (axis: HeatmapAxisDef) =>
    axis.type === "time"
      ? (value: string) => formatTime(Number(value))
      : undefined;

  const diverging = colorScale === "diverging";

  const visualMapRange = (
    hasValues: boolean,
    minValue: number,
    maxValue: number,
  ) => {
    if (diverging) {
      const extent = hasValues
        ? Math.max(Math.abs(minValue), Math.abs(maxValue), 1)
        : 1;
      return { min: min ?? -extent, max: max ?? extent };
    }
    return {
      min: min ?? (hasValues ? Math.min(0, minValue) : 0),
      max: max ?? (hasValues ? Math.max(maxValue, minValue + 1) : 1),
    };
  };

  // latest categories, used by the tooltip formatter
  let xLabels: string[] = [];
  let yLabels: string[] = [];
  const formatKey = (key: string | undefined, axis: HeatmapAxisDef) =>
    key !== undefined && axis.type === "time"
      ? formatTime(Number(key))
      : (key ?? "");

  const buildBaseOption = (theme: ChartTheme): EChartsCoreOption => {
    const slider = hasSlider(dataZoom);
    return {
      animation: false,
      backgroundColor: theme.backgroundColor,
      textStyle: textStyle(theme),
      grid: {
        id: "main",
        left: 8,
        right: showVisualMap ? 56 : 8,
        top: 16,
        bottom: slider ? 36 : 8,
      },
      tooltip: {
        ...tooltipOption(theme, { show: showTooltip, trigger: "item" }),
        formatter: ({ value }: { value: [number, number, number | null] }) => {
          const [x, y, v] = value;
          return `${xAxis.name ?? xAxis.columnName}: ${formatKey(xLabels[x], xAxis)}<br/>${
            yAxis.name ?? yAxis.columnName
          }: ${formatKey(yLabels[y], yAxis)}<br/>${valueColumnName}: <b>${v ?? "-"}</b>`;
        },
      },
      xAxis: [
        {
          id: "x",
          type: "category",
          name: xAxis.name,
          data: [],
          splitArea: { show: false },
          ...axisStyle(theme, false),
          axisLabel: {
            ...axisStyle(theme).axisLabel,
            formatter: labelFormatter(xAxis),
          },
        },
      ],
      yAxis: [
        {
          id: "y0",
          type: "category",
          name: yAxis.name,
          data: [],
          ...axisStyle(theme, false),
          axisLabel: {
            ...axisStyle(theme).axisLabel,
            formatter: labelFormatter(yAxis),
          },
        },
      ],
      visualMap: [
        {
          id: "vm",
          type: "continuous",
          show: showVisualMap,
          calculable: true,
          orient: "vertical",
          right: 0,
          top: "center",
          itemHeight: 120,
          itemWidth: 12,
          min: min ?? 0,
          max: max ?? 1,
          inRange: {
            color: diverging
              ? [theme.downColor, theme.splitLineColor, theme.upColor]
              : theme.heatmapColors,
          },
          textStyle: { color: theme.secondaryForegroundColor },
        },
      ],
      dataZoom: dataZoomOption(dataZoom, theme, [0]),
      series: [
        {
          id: "heatmap",
          name: valueColumnName,
          type: "heatmap",
          encode: { x: 0, y: 1, value: 2 },
          progressive: 0,
          emphasis: {
            itemStyle: { borderColor: theme.foregroundColor, borderWidth: 1 },
          },
          data: [],
        },
      ],
    };
  };

  const buildDataOption = (data: ChartDataLookup) => {
    const { columnMap, rows: allRows } = data.get(dataSource);
    const rows = filterRows(allRows, columnMap, where);
    const cells = new Map<
      string,
      {
        x: string | number;
        y: string | number;
        agg: Aggregator;
        rows: DataSourceRow[];
      }
    >();
    const xKeys = new Set<string | number>();
    const yKeys = new Set<string | number>();
    for (const row of rows) {
      const x = bucketValue(
        getColumnValue(row, columnMap, xAxis.columnName),
        xAxis,
      );
      const y = bucketValue(
        getColumnValue(row, columnMap, yAxis.columnName),
        yAxis,
      );
      if (x === null || y === null) {
        continue;
      }
      xKeys.add(x);
      yKeys.add(y);
      const key = `${x}|${y}`;
      let cell = cells.get(key);
      if (cell === undefined) {
        cell = { x, y, agg: new Aggregator(aggregation), rows: [] };
        cells.set(key, cell);
      }
      cell.agg.add(getNumber(row, columnMap, valueColumnName));
      cell.rows.push(row);
    }
    const xCategories = sortKeys(Array.from(xKeys), xAxis);
    const yCategories = sortKeys(Array.from(yKeys), yAxis);
    const xIndex = new Map(xCategories.map((k, i) => [k, i]));
    const yIndex = new Map(yCategories.map((k, i) => [k, i]));

    let minValue = Number.POSITIVE_INFINITY;
    let maxValue = Number.NEGATIVE_INFINITY;
    const items: Array<[number, number, number | null]> = [];
    const itemRows: DataSourceRow[] = [];
    for (const cell of cells.values()) {
      const value = cell.agg.value;
      if (value !== null) {
        minValue = Math.min(minValue, value);
        maxValue = Math.max(maxValue, value);
      }
      items.push([xIndex.get(cell.x) ?? 0, yIndex.get(cell.y) ?? 0, value]);
      // the first row contributing to the cell
      itemRows.push(cell.rows[0]);
    }
    const hasValues = Number.isFinite(minValue);
    xLabels = xCategories.map(String);
    yLabels = yCategories.map(String);
    const rowLookup: Record<string, SeriesRows> = {
      heatmap: { dataSource, rows: itemRows },
    };
    const option: EChartsCoreOption = {
      xAxis: [{ id: "x", data: xLabels }],
      yAxis: [{ id: "y0", data: yLabels }],
      visualMap: [
        {
          id: "vm",
          ...visualMapRange(hasValues, minValue, maxValue),
        },
      ],
      series: [{ id: "heatmap", data: items }],
    };
    return { option, rowLookup };
  };

  return { buildBaseOption, buildDataOption, dataSources: [dataSource] };
};
