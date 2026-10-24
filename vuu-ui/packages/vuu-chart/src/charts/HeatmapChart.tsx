import { useMemo } from "react";
import { VuuChartContainer } from "../engine/VuuChartContainer";
import { useStructuralMemo } from "../engine/useStructuralMemo";
import type { VuuChartBaseProps } from "../vuu-chart-types";
import { type HeatmapChartOptions, createHeatmapModel } from "./heatmap-model";

export interface HeatmapChartProps
  extends Omit<VuuChartBaseProps, "legend">,
    HeatmapChartOptions {}

/**
 * Heatmap of a value column by two dimensions, e.g. traded quantity by
 * price level and time bucket.
 */
export const HeatmapChart = ({
  aggregation,
  colorScale,
  dataSource,
  dataZoom,
  formatTime,
  max,
  min,
  showTooltip,
  showVisualMap,
  valueColumnName,
  where,
  xAxis,
  yAxis,
  ...props
}: HeatmapChartProps) => {
  const options = useStructuralMemo<HeatmapChartOptions>({
    aggregation,
    colorScale,
    dataSource,
    dataZoom,
    formatTime,
    max,
    min,
    showTooltip,
    showVisualMap,
    valueColumnName,
    where,
    xAxis,
    yAxis,
  });
  const model = useMemo(() => createHeatmapModel(options), [options]);
  return <VuuChartContainer {...props} chartType="heatmap" model={model} />;
};
