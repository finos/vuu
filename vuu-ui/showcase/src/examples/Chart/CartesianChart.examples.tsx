import { CartesianChart } from "@vuu-ui/vuu-chart";
import {
  useSimulatedBars,
  useSimulatedDepth,
  useSimulatedPositions,
  useSimulatedTrades,
} from "./trading-data";

const chartStyle = { height: 480, width: 800 };

/**
 * Close and vwap from the bars table, on a time axis, with dataZoom.
 */
export const TimeSeriesLine = () => {
  const { barsDataSource } = useSimulatedBars();
  return (
    <CartesianChart
      dataSource={barsDataSource}
      dataZoom="both"
      series={[
        {
          type: "line",
          columnName: "close",
          markLines: [{ value: "last", label: "Last" }],
        },
        { type: "line", columnName: "vwap", name: "VWAP" },
      ]}
      style={chartStyle}
      xAxis={{ columnName: "start", type: "time" }}
    />
  );
};

// Escape hatch: keep volume bars in the lower third of the chart
const volumeAxisOverride = {
  yAxis: [
    {
      id: "y1",
      max: ({ max }: { max: number }) => max * 3,
      splitLine: { show: false },
    },
  ],
};

/**
 * Close price as an area, volume as bars on a second y axis.
 */
export const AreaWithVolumeBars = () => {
  const { barsDataSource } = useSimulatedBars();
  return (
    <CartesianChart
      dataSource={barsDataSource}
      series={[
        { type: "area", columnName: "close" },
        {
          type: "bar",
          columnName: "volume",
          yAxisIndex: 1,
          color: "palette-2",
        },
      ]}
      style={chartStyle}
      xAxis={{ columnName: "start", type: "time" }}
      yAxes={[{ scale: true }, { name: "volume", position: "right" }]}
      echartsOptions={volumeAxisOverride}
    />
  );
};

/**
 * Market depth built with CartesianChart, stepped areas from the cumSize
 * column, bid and ask series filtered by side.
 */
export const SteppedArea = () => {
  const dataSource = useSimulatedDepth();
  return (
    <CartesianChart
      dataSource={dataSource}
      series={[
        {
          type: "area",
          columnName: "cumSize",
          name: "Bids",
          where: { side: "BUY" },
          step: "start",
          color: "up",
        },
        {
          type: "area",
          columnName: "cumSize",
          name: "Asks",
          where: { side: "SELL" },
          step: "end",
          color: "down",
        },
      ]}
      style={chartStyle}
      xAxis={{ columnName: "price", type: "value" }}
      yAxes={[{ position: "right" }]}
    />
  );
};

/**
 * Notional by sector, aggregated (sum) from positions.
 */
export const VerticalBars = () => {
  const dataSource = useSimulatedPositions();
  return (
    <CartesianChart
      aggregation="sum"
      dataSource={dataSource}
      series={[
        {
          type: "bar",
          columnName: "notional",
          markLines: [{ value: 0, color: "palette-5", lineType: "solid" }],
        },
      ]}
      style={chartStyle}
      xAxis={{ columnName: "sector" }}
    />
  );
};

/**
 * Pnl by ric, horizontal bars.
 */
export const HorizontalBars = () => {
  const dataSource = useSimulatedPositions();
  return (
    <CartesianChart
      aggregation="sum"
      dataSource={dataSource}
      orientation="horizontal"
      series={[{ type: "bar", columnName: "pnl", where: { account: "ACC-1" } }]}
      style={{ height: 560, width: 800 }}
      xAxis={{ columnName: "ric" }}
    />
  );
};

/**
 * Pnl by sector, stacked by account.
 */
export const StackedBars = () => {
  const dataSource = useSimulatedPositions();
  return (
    <CartesianChart
      aggregation="sum"
      dataSource={dataSource}
      series={[
        {
          type: "bar",
          columnName: "pnl",
          id: "acc1",
          name: "ACC-1",
          stack: "pnl",
          where: { account: "ACC-1" },
        },
        {
          type: "bar",
          columnName: "pnl",
          id: "acc2",
          name: "ACC-2",
          stack: "pnl",
          where: { account: "ACC-2" },
        },
      ]}
      style={chartStyle}
      xAxis={{ columnName: "sector" }}
    />
  );
};

/**
 * Trade prices by time, coloured by aggressor side.
 */
export const TradesScatter = () => {
  const dataSource = useSimulatedTrades({ initialCount: 300 });
  return (
    <CartesianChart
      dataSource={dataSource}
      dataZoom="inside"
      series={[
        {
          type: "scatter",
          columnName: "price",
          colorBy: {
            columnName: "aggressorSide",
            colors: { BUY: "up", SELL: "down" },
          },
          symbolSize: 6,
          markLines: [{ value: "average", label: "Avg" }],
        },
      ]}
      style={chartStyle}
      xAxis={{ columnName: "time", type: "time" }}
    />
  );
};
