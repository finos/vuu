import { useMemo } from "react";
import { VuuChartContainer } from "../engine/VuuChartContainer";
import { useStructuralMemo } from "../engine/useStructuralMemo";
import type { VuuChartBaseProps } from "../vuu-chart-types";
import {
  type CartesianChartOptions,
  createCartesianModel,
} from "./cartesian-model";

export interface CartesianChartProps
  extends Omit<VuuChartBaseProps, "legend">,
    CartesianChartOptions {}

/**
 * Line, area (including stepped), bar (vertical, horizontal, stacked) and
 * scatter series, on a category, time or value x axis. Series may be read
 * from multiple DataSources.
 */
export const CartesianChart = ({
  aggregation,
  crosshair,
  dataSource,
  dataZoom,
  legend,
  orientation,
  series,
  showTooltip,
  xAxis,
  yAxes,
  ...props
}: CartesianChartProps) => {
  const options = useStructuralMemo<CartesianChartOptions>({
    aggregation,
    crosshair,
    dataSource,
    dataZoom,
    legend,
    orientation,
    series,
    showTooltip,
    xAxis,
    yAxes,
  });
  const model = useMemo(() => createCartesianModel(options), [options]);
  return <VuuChartContainer {...props} chartType="cartesian" model={model} />;
};
