import { useMemo } from "react";
import { VuuChartContainer } from "../engine/VuuChartContainer";
import { useStructuralMemo } from "../engine/useStructuralMemo";
import type { VuuChartBaseProps } from "../vuu-chart-types";
import {
  type CandlestickChartOptions,
  createCandlestickModel,
} from "./candlestick-model";

export interface CandlestickChartProps
  extends Omit<VuuChartBaseProps, "legend">,
    CandlestickChartOptions {}

/**
 * OHLC candlestick chart with optional volume pane and overlay series
 * (e.g. a vwap line, or fills as scatter markers from a second DataSource).
 */
export const CandlestickChart = ({
  crosshair,
  dataSource,
  dataZoom,
  formatTime,
  legend,
  markLines,
  ohlcColumnNames,
  overlays,
  showTooltip,
  timeColumnName,
  volumeColumnName,
  volumePaneHeight,
  xAxisType,
  ...props
}: CandlestickChartProps) => {
  const options = useStructuralMemo<CandlestickChartOptions>({
    crosshair,
    dataSource,
    dataZoom,
    formatTime,
    legend,
    markLines,
    ohlcColumnNames,
    overlays,
    showTooltip,
    timeColumnName,
    volumeColumnName,
    volumePaneHeight,
    xAxisType,
  });
  const model = useMemo(() => createCandlestickModel(options), [options]);
  return <VuuChartContainer {...props} chartType="candlestick" model={model} />;
};
