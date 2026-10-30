import { DepthChart } from "@vuu-ui/vuu-chart";
import { useSimulatedDepth } from "./trading-data";

const chartStyle = { height: 480, width: 800 };

/**
 * Cumulative size computed from level sizes.
 */
export const MarketDepth = () => {
  const dataSource = useSimulatedDepth();
  return <DepthChart dataSource={dataSource} style={chartStyle} />;
};

/**
 * Cumulative size read from the cumSize column of the depth table.
 */
export const MarketDepthCumSizeColumn = () => {
  const dataSource = useSimulatedDepth({ levels: 25 });
  return (
    <DepthChart
      cumulativeSizeColumnName="cumSize"
      dataSource={dataSource}
      style={chartStyle}
    />
  );
};
