import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { EChartsCoreOption } from "echarts/core";
import {
  Aggregator,
  colorForRow,
  filterRows,
  getColumnValue,
  getNumber,
  sortRowsByNumber,
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
  hasSlider,
  legendOption,
  markLineOption,
  textStyle,
  tooltipOption,
  GRID_OUTER_BOUNDS,
} from "../options/common";
import { type ChartTheme, resolveColor } from "../theme/chartTheme";
import type {
  Aggregation,
  ColorBy,
  DataZoomOption,
  LegendPosition,
  MarkLineDef,
  RowMatch,
  XAxisType,
} from "../vuu-chart-types";

export type CartesianSeriesType = "line" | "area" | "bar" | "scatter";

export interface CartesianSeriesDef {
  type: CartesianSeriesType;
  /** Column providing the (y) value */
  columnName: string;
  /** Default is columnName. Used to identify series in echartsOptions overrides. */
  id?: string;
  /** Display name (legend/tooltip), default is columnName */
  name?: string;
  /**
   * Read this series from a different DataSource than the chart default
   * (e.g. to overlay fills on a price line).
   */
  dataSource?: DataSource;
  /** x column, if different from the chart xAxis.columnName */
  xColumnName?: string;
  /** Restrict the rows used for this series e.g { side: "BUY" } */
  where?: RowMatch;
  /** index into yAxes, default 0 */
  yAxisIndex?: number;
  /** series with same stack name are stacked (bar, line, area) */
  stack?: string;
  /** stepped line/area */
  step?: "start" | "middle" | "end";
  smooth?: boolean;
  /** default true for scatter, false for line/area */
  showSymbol?: boolean;
  symbolSize?: number;
  /** css colour or 'up' | 'down' | 'palette-n' */
  color?: string;
  /** per point colour, by value of a column */
  colorBy?: ColorBy;
  /** area fill opacity (area series), default 0.25 */
  areaOpacity?: number;
  markLines?: MarkLineDef[];
}

export interface CartesianXAxisDef {
  columnName: string;
  /**
   * 'time' expects epoch millisecond timestamps (vuu epochtimestamp),
   * 'category' (default) uses distinct values in DataSource order,
   * 'value' a numeric axis.
   */
  type?: XAxisType;
  name?: string;
}

export interface CartesianYAxisDef {
  name?: string;
  position?: "left" | "right";
  /** Do not force axis to include zero. Default true unless chart has bars */
  scale?: boolean;
  type?: "value" | "log";
  min?: number;
  max?: number;
}

export interface CartesianChartOptions {
  /**
   * Category axis only. Aggregate the values of rows that share the same
   * category (e.g. sum notional by sector).
   */
  aggregation?: Aggregation;
  /** Show axis crosshair with tooltip. Default true */
  crosshair?: boolean;
  dataSource: DataSource;
  dataZoom?: DataZoomOption;
  legend?: LegendPosition;
  /** 'horizontal' places the category/x axis vertically (horizontal bars) */
  orientation?: "vertical" | "horizontal";
  series: CartesianSeriesDef[];
  showTooltip?: boolean;
  xAxis: CartesianXAxisDef;
  yAxes?: CartesianYAxisDef[];
}

export const seriesIds = (series: CartesianSeriesDef[]) => {
  const ids = new Set<string>();
  return series.map(({ columnName, id = columnName }, i) => {
    const uniqueId = ids.has(id) ? `${id}-${i}` : id;
    ids.add(uniqueId);
    return uniqueId;
  });
};

type DataItem =
  | [number, number | null]
  | { value: [number, number | null]; itemStyle: { color?: string } };

export const createCartesianModel = ({
  aggregation,
  crosshair = true,
  dataSource,
  dataZoom,
  legend,
  orientation = "vertical",
  series,
  showTooltip = true,
  xAxis,
  yAxes = [{}],
}: CartesianChartOptions): ChartModel => {
  const xType = xAxis.type ?? "category";
  const isCategory = xType === "category";
  const horizontal = orientation === "horizontal";
  const hasBars = series.some((s) => s.type === "bar");
  const ids = seriesIds(series);
  const legendPosition = legend ?? (series.length > 1 ? "top" : "none");
  const dataSources = [dataSource].concat(
    series.flatMap((s) => (s.dataSource ? [s.dataSource] : [])),
  );

  const buildBaseOption = (theme: ChartTheme): EChartsCoreOption => {
    const { palette } = theme;
    const categoryAxis = {
      id: "x",
      type: xType,
      name: xAxis.name,
      boundaryGap: isCategory ? hasBars : undefined,
      scale: xType === "value" ? true : undefined,
      ...axisStyle(theme, false),
      ...(isCategory ? { data: [] } : undefined),
    };
    const valueAxes = yAxes.map((y, i) => ({
      id: `y${i}`,
      type: y.type ?? "value",
      name: y.name,
      position:
        y.position ?? (horizontal ? undefined : i === 0 ? "left" : "right"),
      scale: y.scale ?? !hasBars,
      min: y.min,
      max: y.max,
      ...axisStyle(theme, i === 0),
    }));
    const slider = hasSlider(dataZoom);
    return {
      animation: false,
      backgroundColor: theme.backgroundColor,
      color: palette,
      textStyle: textStyle(theme),
      grid: {
        id: "main",
        left: 8,
        right: 8,
        outerBounds: GRID_OUTER_BOUNDS,
        top: legendPosition === "top" ? 32 : 16,
        bottom: (slider ? 32 : 8) + (legendPosition === "bottom" ? 24 : 0),
      },
      legend: legendOption(theme, legendPosition),
      tooltip: tooltipOption(theme, { crosshair, show: showTooltip }),
      xAxis: horizontal ? valueAxes : [categoryAxis],
      yAxis: horizontal ? [categoryAxis] : valueAxes,
      dataZoom: dataZoomOption(dataZoom, theme, [0], horizontal ? "y" : "x"),
      series: series.map((s, i) => {
        const color =
          resolveColor(s.color, theme) ?? palette[i % palette.length];
        const isLine = s.type === "line" || s.type === "area";
        const axisIndex = s.yAxisIndex ?? 0;
        return {
          id: ids[i],
          name: s.name ?? s.columnName,
          type: isLine ? "line" : s.type,
          color,
          ...(horizontal
            ? { xAxisIndex: axisIndex }
            : { yAxisIndex: axisIndex }),
          encode: horizontal ? { x: 1, y: 0 } : { x: 0, y: 1 },
          stack: s.stack,
          ...(isLine
            ? {
                step: s.step ?? false,
                smooth: s.smooth ?? false,
                showSymbol: s.showSymbol ?? false,
                symbolSize: s.symbolSize ?? 4,
                connectNulls: true,
                lineStyle: { width: 1.5 },
                areaStyle:
                  s.type === "area"
                    ? { opacity: s.areaOpacity ?? 0.25 }
                    : undefined,
              }
            : undefined),
          ...(s.type === "scatter"
            ? { symbolSize: s.symbolSize ?? 8 }
            : undefined),
          ...(s.type === "bar" ? { barMaxWidth: 40 } : undefined),
          data: [],
        };
      }),
    };
  };

  const buildDataOption = (data: ChartDataLookup, theme: ChartTheme) => {
    const { columnMap: mainColumnMap, rows: mainRows } = data.get(dataSource);
    const categories: string[] = [];
    const categoryIndex = new Map<string, number>();
    const addCategory = (value: unknown) => {
      const key = String(value);
      let index = categoryIndex.get(key);
      if (index === undefined) {
        index = categories.length;
        categories.push(key);
        categoryIndex.set(key, index);
      }
      return index;
    };
    if (isCategory) {
      for (const row of mainRows) {
        addCategory(getColumnValue(row, mainColumnMap, xAxis.columnName));
      }
    }

    const rowLookup: Record<string, SeriesRows> = {};
    const seriesData = series.map((s, i) => {
      const ds = s.dataSource ?? dataSource;
      const { columnMap, rows: allRows } = data.get(ds);
      const xColumn = s.xColumnName ?? xAxis.columnName;
      let rows = filterRows(allRows, columnMap, s.where);
      if (!isCategory) {
        rows = sortRowsByNumber(rows, columnMap, xColumn);
      }
      const items: DataItem[] = [];
      const values: Array<number | null> = [];
      const itemRows: DataSourceRow[] = [];

      const pushItem = (x: number, y: number | null, row: DataSourceRow) => {
        const color = s.colorBy
          ? colorForRow(row, columnMap, s.colorBy, theme)
          : undefined;
        items.push(color ? { value: [x, y], itemStyle: { color } } : [x, y]);
        values.push(y);
        itemRows.push(row);
      };

      if (isCategory && aggregation) {
        const aggregators = new Map<number, [Aggregator, DataSourceRow]>();
        for (const row of rows) {
          const x = addCategory(getColumnValue(row, columnMap, xColumn));
          let entry = aggregators.get(x);
          if (entry === undefined) {
            entry = [new Aggregator(aggregation), row];
            aggregators.set(x, entry);
          }
          entry[0].add(getNumber(row, columnMap, s.columnName));
        }
        const entries = Array.from(aggregators.entries()).sort(
          ([x1], [x2]) => x1 - x2,
        );
        for (const [x, [aggregator, row]] of entries) {
          pushItem(x, aggregator.value, row);
        }
      } else {
        for (const row of rows) {
          const xValue = getColumnValue(row, columnMap, xColumn);
          const x = isCategory ? addCategory(xValue) : toNumber(xValue);
          if (x !== null) {
            pushItem(x, getNumber(row, columnMap, s.columnName), row);
          }
        }
      }

      rowLookup[ids[i]] = { dataSource: ds, rows: itemRows };

      const markLine = markLineOption(s.markLines, theme, values, {
        axis: horizontal ? "xAxis" : "yAxis",
        defaultColor:
          resolveColor(s.color, theme) ??
          theme.palette[i % theme.palette.length],
        weights: s.markLines?.reduce<Array<number | null> | undefined>(
          (w, def) => {
            if (w === undefined && typeof def.value === "object") {
              const weightColumn = def.value.weightedAverage;
              return itemRows.map((row) =>
                getNumber(row, columnMap, weightColumn),
              );
            }
            return w;
          },
          undefined,
        ),
      });

      return {
        id: ids[i],
        data: items,
        ...(markLine ? { markLine } : undefined),
      };
    });

    const categoryAxisData = isCategory
      ? [{ id: "x", data: categories }]
      : undefined;
    const option: EChartsCoreOption = {
      series: seriesData,
      ...(categoryAxisData
        ? horizontal
          ? { yAxis: categoryAxisData }
          : { xAxis: categoryAxisData }
        : undefined),
    };
    return { option, rowLookup };
  };

  return { buildBaseOption, buildDataOption, dataSources };
};
