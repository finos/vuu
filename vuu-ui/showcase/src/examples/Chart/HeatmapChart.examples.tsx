import { HeatmapChart } from "@vuu-ui/vuu-chart";
import { useSimulatedPositions, useSimulatedTrades } from "./trading-data";

const chartStyle = { height: 480, width: 800 };

/**
 * Traded quantity by price level (0.05 buckets) and time (10 second buckets).
 */
export const TradedVolumeHeatmap = () => {
  const dataSource = useSimulatedTrades();
  return (
    <HeatmapChart
      dataSource={dataSource}
      style={chartStyle}
      valueColumnName="quantity"
      xAxis={{ columnName: "time", type: "time", bucketSize: 10000 }}
      yAxis={{ columnName: "price", type: "value", bucketSize: 0.05 }}
    />
  );
};

/**
 * Pnl by sector and account, using category axes and a diverging colour
 * scale (down colour for losses, up colour for gains).
 */
export const PnlHeatmap = () => {
  const dataSource = useSimulatedPositions();
  return (
    <HeatmapChart
      colorScale="diverging"
      dataSource={dataSource}
      style={{ height: 320, width: 600 }}
      valueColumnName="pnl"
      xAxis={{ columnName: "sector" }}
      yAxis={{ columnName: "account" }}
    />
  );
};
