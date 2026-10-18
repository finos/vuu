import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import type { EChartsCoreOption } from "echarts/core";
import { getColumnValue, getNumber } from "../chart-data/projection-utils";
import type {
  ChartDataLookup,
  ChartModel,
  SeriesRows,
} from "../engine/ChartModel";
import {
  axisStyle,
  legendOption,
  textStyle,
  tooltipOption,
  GRID_OUTER_BOUNDS,
} from "../options/common";
import type { ChartTheme } from "../theme/chartTheme";
import type { LegendPosition } from "../vuu-chart-types";

export interface DepthChartOptions {
  /** Value of sideColumnName for bids. Default 'BUY' */
  bidValue?: string;
  /** Value of sideColumnName for asks. Default 'SELL' */
  askValue?: string;
  /**
   * Optional column with the cumulative size at each level (e.g. 'cumSize').
   * If not provided, cumulative size is computed from sizeColumnName.
   */
  cumulativeSizeColumnName?: string;
  /** DataSource of price levels, e.g the vuu 'depth' table */
  dataSource: DataSource;
  legend?: LegendPosition;
  /** Default 'price' */
  priceColumnName?: string;
  /** Show a mark line at the mid price. Default true */
  showMidPrice?: boolean;
  showTooltip?: boolean;
  /** Default 'side' */
  sideColumnName?: string;
  /** Default 'size' */
  sizeColumnName?: string;
}

type Level = { price: number; size: number; cum?: number; row: DataSourceRow };

/**
 * Builds cumulative depth points, from best price outwards. Bids are sorted
 * by descending price, asks by ascending price.
 */
export const cumulativeDepth = (levels: Level[], side: "bid" | "ask") => {
  const sorted = levels
    .slice()
    .sort((l1, l2) =>
      side === "bid" ? l2.price - l1.price : l1.price - l2.price,
    );
  let total = 0;
  return sorted.map((level) => {
    total = level.cum ?? total + level.size;
    return { price: level.price, cumSize: total, row: level.row };
  });
};

export const createDepthModel = ({
  askValue = "SELL",
  bidValue = "BUY",
  cumulativeSizeColumnName,
  dataSource,
  legend = "top",
  priceColumnName = "price",
  showMidPrice = true,
  showTooltip = true,
  sideColumnName = "side",
  sizeColumnName = "size",
}: DepthChartOptions): ChartModel => {
  const buildBaseOption = (theme: ChartTheme): EChartsCoreOption => {
    const sideSeries = (id: "bids" | "asks", color: string) => ({
      id,
      name: id === "bids" ? "Bids" : "Asks",
      type: "line",
      // bids are rendered best (highest) price first, steps extend leftwards
      step: id === "bids" ? "start" : "end",
      color,
      showSymbol: false,
      lineStyle: { width: 1.5 },
      areaStyle: { opacity: 0.25 },
      encode: { x: 0, y: 1 },
      data: [],
    });
    return {
      animation: false,
      backgroundColor: theme.backgroundColor,
      textStyle: textStyle(theme),
      grid: {
        id: "main",
        left: 8,
        right: 8,
        outerBounds: GRID_OUTER_BOUNDS,
        top: legend === "top" ? 32 : 16,
        bottom: legend === "bottom" ? 32 : 8,
      },
      legend: legendOption(theme, legend),
      tooltip: tooltipOption(theme, { show: showTooltip }),
      xAxis: [
        {
          id: "x",
          type: "value",
          scale: true,
          ...axisStyle(theme, false),
        },
      ],
      yAxis: [
        { id: "y0", type: "value", position: "right", ...axisStyle(theme) },
      ],
      series: [
        sideSeries("bids", theme.upColor),
        sideSeries("asks", theme.downColor),
      ],
    };
  };

  const buildDataOption = (data: ChartDataLookup, theme: ChartTheme) => {
    const { columnMap, rows } = data.get(dataSource);
    const bids: Level[] = [];
    const asks: Level[] = [];
    for (const row of rows) {
      const price = getNumber(row, columnMap, priceColumnName);
      if (price === null) {
        continue;
      }
      const side = String(getColumnValue(row, columnMap, sideColumnName));
      const level: Level = {
        price,
        size: getNumber(row, columnMap, sizeColumnName) ?? 0,
        cum: cumulativeSizeColumnName
          ? (getNumber(row, columnMap, cumulativeSizeColumnName) ?? undefined)
          : undefined,
        row,
      };
      if (side === bidValue) {
        bids.push(level);
      } else if (side === askValue) {
        asks.push(level);
      }
    }
    // bids rendered in ascending price order, so area fills under the curve
    const bidPoints = cumulativeDepth(bids, "bid").reverse();
    const askPoints = cumulativeDepth(asks, "ask");
    const bestBid = bidPoints.at(-1)?.price;
    const bestAsk = askPoints[0]?.price;
    const midPrice =
      bestBid !== undefined && bestAsk !== undefined
        ? (bestBid + bestAsk) / 2
        : undefined;

    const rowLookup: Record<string, SeriesRows> = {
      bids: { dataSource, rows: bidPoints.map((p) => p.row) },
      asks: { dataSource, rows: askPoints.map((p) => p.row) },
    };

    const option: EChartsCoreOption = {
      series: [
        {
          id: "bids",
          data: bidPoints.map((p) => [p.price, p.cumSize]),
          markLine: {
            silent: true,
            symbol: ["none", "none"],
            animation: false,
            data:
              showMidPrice && midPrice !== undefined
                ? [
                    {
                      xAxis: midPrice,
                      lineStyle: {
                        color: theme.crosshairColor,
                        type: "dashed",
                        width: 1,
                      },
                      label: {
                        color: theme.secondaryForegroundColor,
                        formatter: `Mid ${+midPrice.toFixed(6)}`,
                      },
                    },
                  ]
                : [],
          },
        },
        { id: "asks", data: askPoints.map((p) => [p.price, p.cumSize]) },
      ],
    };
    return { option, rowLookup };
  };

  return { buildBaseOption, buildDataOption, dataSources: [dataSource] };
};
