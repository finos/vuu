import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { EChartsCoreOption } from "echarts/core";
import {
  colorForRow,
  filterRows,
  findFloorIndex,
  getNumber,
  sortRowsByNumber,
} from "../chart-data/projection-utils";
import type {
  ChartDataLookup,
  ChartModel,
  SeriesRows,
} from "../engine/ChartModel";
import {
  axisPointerLabel,
  axisStyle,
  dataZoomOption,
  formatTimeLabel,
  formatTimestamp,
  hasSlider,
  legendOption,
  markLineOption,
  textStyle,
  tooltipOption,
  GRID_OUTER_BOUNDS,
} from "../options/common";
import { type ChartTheme, resolveColor } from "../theme/chartTheme";
import type {
  ColorBy,
  DataZoomOption,
  LegendPosition,
  MarkLineDef,
  RowMatch,
} from "../vuu-chart-types";

export interface OhlcColumnNames {
  open: string;
  high: string;
  low: string;
  close: string;
}

export interface CandlestickOverlayDef {
  type: "line" | "scatter";
  /** Column providing the (price) value */
  columnName: string;
  /** Default is columnName */
  id?: string;
  name?: string;
  /**
   * Read the overlay from a different DataSource (e.g. fills). Points are
   * placed at the bar whose interval contains their timestamp.
   */
  dataSource?: DataSource;
  /** Timestamp column of the overlay DataSource, default is timeColumnName */
  timeColumnName?: string;
  where?: RowMatch;
  /** css colour or 'up' | 'down' | 'palette-n' */
  color?: string;
  colorBy?: ColorBy;
  /** echarts symbol e.g 'circle', 'triangle', 'diamond', 'pin' */
  symbol?: string;
  symbolSize?: number;
  markLines?: MarkLineDef[];
}

export interface CandlestickChartOptions {
  /** Default 'both' */
  dataZoom?: DataZoomOption;
  /** Show axis crosshair with tooltip. Default true */
  crosshair?: boolean;
  /** DataSource providing OHLC bars, e.g the vuu 'bars' table */
  dataSource: DataSource;
  /** Formats time values (epoch millis) for axis labels */
  formatTime?: (timestamp: number) => string;
  legend?: LegendPosition;
  /** Mark lines on the price axis, 'last' is the last close */
  markLines?: MarkLineDef[];
  /** Defaults to open, high, low, close */
  ohlcColumnNames?: Partial<OhlcColumnNames>;
  /** Additional series overlaid on the price chart */
  overlays?: CandlestickOverlayDef[];
  showTooltip?: boolean;
  /** Bar start timestamp column (epoch millis). Default 'start' */
  timeColumnName?: string;
  /** If provided, volume bars are rendered in a pane below the price chart */
  volumeColumnName?: string;
  /** Height of the volume pane, as a percentage of chart height. Default 20 */
  volumePaneHeight?: number;
  /**
   * 'category' (default) spaces bars evenly, with no gaps for periods
   * without bars. 'time' uses a continuous time axis.
   */
  xAxisType?: "category" | "time";
}

const defaultOhlc: OhlcColumnNames = {
  open: "open",
  high: "high",
  low: "low",
  close: "close",
};

const withMarkLine = (markLine: unknown) =>
  markLine ? { markLine } : undefined;

const compactNumber = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1e9) return `${+(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${+(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${+(value / 1e3).toFixed(1)}K`;
  return String(value);
};

export const createCandlestickModel = ({
  crosshair = true,
  dataSource,
  dataZoom = "both",
  formatTime = formatTimeLabel,
  legend,
  markLines,
  ohlcColumnNames,
  overlays = [],
  showTooltip = true,
  timeColumnName = "start",
  volumeColumnName,
  volumePaneHeight = 20,
  xAxisType = "category",
}: CandlestickChartOptions): ChartModel => {
  const ohlc = { ...defaultOhlc, ...ohlcColumnNames };
  const isCategory = xAxisType === "category";
  const hasVolume = volumeColumnName !== undefined;
  const legendPosition = legend ?? (overlays.length > 0 ? "top" : "none");
  const overlayIds = overlays.map(
    ({ columnName, id = columnName }, i) => `overlay-${i}-${id}`,
  );
  const dataSources = [dataSource].concat(
    overlays.flatMap((o) => (o.dataSource ? [o.dataSource] : [])),
  );

  const buildBaseOption = (theme: ChartTheme): EChartsCoreOption => {
    const slider = hasSlider(dataZoom);
    const bottomMargin = slider ? 36 : 8;
    const top = legendPosition === "top" ? 32 : 16;
    const labelFormatter = isCategory
      ? (value: string) => formatTime(Number(value))
      : undefined;
    const pointerFormatter = ({ value }: { value: unknown }) =>
      formatTimestamp(Number(value));

    const grids: Record<string, unknown>[] = [
      {
        id: "price",
        left: 8,
        right: 8,
        outerBounds: GRID_OUTER_BOUNDS,
        top,
        bottom: hasVolume ? `${volumePaneHeight + 8}%` : bottomMargin,
      },
    ];
    const xAxes: Record<string, unknown>[] = [
      {
        id: "x",
        type: xAxisType,
        gridIndex: 0,
        boundaryGap: isCategory ? true : undefined,
        ...axisStyle(theme, false),
        axisLabel: {
          ...axisStyle(theme).axisLabel,
          formatter: labelFormatter,
          show: !hasVolume,
        },
        axisPointer: {
          label: { formatter: isCategory ? pointerFormatter : undefined },
        },
        ...(isCategory ? { data: [] } : undefined),
      },
    ];
    const yAxes: Record<string, unknown>[] = [
      {
        id: "price",
        type: "value",
        gridIndex: 0,
        position: "right",
        scale: true,
        ...axisStyle(theme),
      },
    ];
    if (hasVolume) {
      grids.push({
        id: "volume",
        left: 8,
        right: 8,
        outerBounds: GRID_OUTER_BOUNDS,
        height: `${volumePaneHeight}%`,
        bottom: bottomMargin,
      });
      xAxes.push({
        id: "x-volume",
        type: xAxisType,
        gridIndex: 1,
        boundaryGap: isCategory ? true : undefined,
        ...axisStyle(theme, false),
        axisLabel: { ...axisStyle(theme).axisLabel, formatter: labelFormatter },
        axisPointer: {
          label: { formatter: isCategory ? pointerFormatter : undefined },
        },
        ...(isCategory ? { data: [] } : undefined),
      });
      yAxes.push({
        id: "volume",
        type: "value",
        gridIndex: 1,
        position: "right",
        splitNumber: 2,
        ...axisStyle(theme),
        axisLabel: { ...axisStyle(theme).axisLabel, formatter: compactNumber },
      });
    }

    const { palette } = theme;
    const series: Record<string, unknown>[] = [
      {
        id: "candles",
        name: "OHLC",
        type: "candlestick",
        xAxisIndex: 0,
        yAxisIndex: 0,
        encode: { x: 0, y: [1, 2, 3, 4] },
        barMaxWidth: 16,
        itemStyle: {
          color: theme.upColor,
          color0: theme.downColor,
          borderColor: theme.upColor,
          borderColor0: theme.downColor,
        },
        data: [],
      },
    ];
    if (hasVolume) {
      series.push({
        id: "volume",
        name: volumeColumnName,
        type: "bar",
        xAxisIndex: 1,
        yAxisIndex: 1,
        encode: { x: 0, y: 1 },
        barMaxWidth: 16,
        itemStyle: { opacity: 0.6 },
        data: [],
      });
    }
    overlays.forEach((o, i) => {
      const color = resolveColor(o.color, theme) ?? palette[i % palette.length];
      series.push({
        id: overlayIds[i],
        name: o.name ?? o.columnName,
        type: o.type,
        xAxisIndex: 0,
        yAxisIndex: 0,
        encode: { x: 0, y: 1 },
        color,
        ...(o.type === "line"
          ? { showSymbol: false, connectNulls: true, lineStyle: { width: 1.5 } }
          : {
              symbol: o.symbol ?? "circle",
              symbolSize: o.symbolSize ?? 10,
              z: 5,
            }),
        data: [],
      });
    });

    return {
      animation: false,
      backgroundColor: theme.backgroundColor,
      color: palette,
      textStyle: textStyle(theme),
      axisPointer: {
        link: [{ xAxisIndex: "all" }],
        label: axisPointerLabel(theme),
      },
      grid: grids,
      legend: {
        ...legendOption(theme, legendPosition),
        ...(legendPosition !== "none"
          ? { data: overlays.map((o) => o.name ?? o.columnName) }
          : undefined),
      },
      tooltip: tooltipOption(theme, { crosshair, show: showTooltip }),
      xAxis: xAxes,
      yAxis: yAxes,
      dataZoom: dataZoomOption(dataZoom, theme, hasVolume ? [0, 1] : [0]),
      series,
    };
  };

  const buildDataOption = (data: ChartDataLookup, theme: ChartTheme) => {
    const { columnMap, rows: allRows } = data.get(dataSource);
    const rows = sortRowsByNumber(allRows, columnMap, timeColumnName);
    const times: number[] = [];
    const candles: Array<Array<number | null>> = [];
    const volumes: Array<{
      value: Array<number | null>;
      itemStyle: { color: string };
    }> = [];
    const closes: Array<number | null> = [];
    const candleRows: DataSourceRow[] = [];

    for (const row of rows) {
      const time = getNumber(row, columnMap, timeColumnName);
      if (time === null) {
        continue;
      }
      const x = isCategory ? times.length : time;
      times.push(time);
      candleRows.push(row);
      const open = getNumber(row, columnMap, ohlc.open);
      const close = getNumber(row, columnMap, ohlc.close);
      candles.push([
        x,
        open,
        close,
        getNumber(row, columnMap, ohlc.low),
        getNumber(row, columnMap, ohlc.high),
      ]);
      closes.push(close);
      if (volumeColumnName) {
        volumes.push({
          value: [x, getNumber(row, columnMap, volumeColumnName)],
          itemStyle: {
            color:
              (close ?? 0) >= (open ?? 0) ? theme.upColor : theme.downColor,
          },
        });
      }
    }

    const lastCandle = candles.at(-1);
    const lastColor =
      lastCandle && (lastCandle[2] ?? 0) < (lastCandle[1] ?? 0)
        ? theme.downColor
        : theme.upColor;

    const rowLookup: Record<string, SeriesRows> = {
      candles: { dataSource, rows: candleRows },
    };
    const series: Record<string, unknown>[] = [
      {
        id: "candles",
        data: candles,
        ...withMarkLine(
          markLineOption(markLines, theme, closes, { defaultColor: lastColor }),
        ),
      },
    ];
    if (volumeColumnName) {
      rowLookup.volume = { dataSource, rows: candleRows };
      series.push({ id: "volume", data: volumes });
    }

    overlays.forEach((o, i) => {
      const ds = o.dataSource ?? dataSource;
      const isOwnDataSource = ds === dataSource;
      const { columnMap: oColumnMap, rows: oAllRows } = isOwnDataSource
        ? { columnMap, rows }
        : data.get(ds);
      const oTimeColumn = o.timeColumnName ?? timeColumnName;
      const oRows = sortRowsByNumber(
        filterRows(oAllRows, oColumnMap, o.where),
        oColumnMap,
        oTimeColumn,
      );
      const items: unknown[] = [];
      const values: Array<number | null> = [];
      const itemRows: DataSourceRow[] = [];
      for (const row of oRows) {
        const time = getNumber(row, oColumnMap, oTimeColumn);
        if (time === null) {
          continue;
        }
        let x: number = time;
        if (isCategory) {
          x = findFloorIndex(times, time);
          if (x === -1) {
            continue;
          }
        }
        const y = getNumber(row, oColumnMap, o.columnName);
        const color = o.colorBy
          ? colorForRow(row, oColumnMap, o.colorBy, theme)
          : undefined;
        items.push(color ? { value: [x, y], itemStyle: { color } } : [x, y]);
        values.push(y);
        itemRows.push(row);
      }
      const weightDef = o.markLines?.find((m) => typeof m.value === "object");
      const weightColumn =
        weightDef && typeof weightDef.value === "object"
          ? weightDef.value.weightedAverage
          : undefined;
      rowLookup[overlayIds[i]] = { dataSource: ds, rows: itemRows };
      series.push({
        id: overlayIds[i],
        data: items,
        ...withMarkLine(
          markLineOption(o.markLines, theme, values, {
            defaultColor:
              resolveColor(o.color, theme) ??
              theme.palette[i % theme.palette.length],
            weights: weightColumn
              ? itemRows.map((row) => getNumber(row, oColumnMap, weightColumn))
              : undefined,
          }),
        ),
      });
    });

    const option: EChartsCoreOption = { series };
    if (isCategory) {
      const categories = times.map(String);
      option.xAxis = hasVolume
        ? [
            { id: "x", data: categories },
            { id: "x-volume", data: categories },
          ]
        : [{ id: "x", data: categories }];
    }
    return { option, rowLookup };
  };

  return { buildBaseOption, buildDataOption, dataSources };
};
