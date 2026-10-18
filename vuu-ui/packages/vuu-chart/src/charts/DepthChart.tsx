import { useMemo } from "react";
import { VuuChartContainer } from "../engine/VuuChartContainer";
import { useStructuralMemo } from "../engine/useStructuralMemo";
import type { VuuChartBaseProps } from "../vuu-chart-types";
import { type DepthChartOptions, createDepthModel } from "./depth-model";

export interface DepthChartProps
  extends Omit<VuuChartBaseProps, "legend">,
    DepthChartOptions {}

/**
 * Market depth chart: stepped cumulative bid and ask areas, by price.
 */
export const DepthChart = ({
  askValue,
  bidValue,
  cumulativeSizeColumnName,
  dataSource,
  legend,
  priceColumnName,
  showMidPrice,
  showTooltip,
  sideColumnName,
  sizeColumnName,
  ...props
}: DepthChartProps) => {
  const options = useStructuralMemo<DepthChartOptions>({
    askValue,
    bidValue,
    cumulativeSizeColumnName,
    dataSource,
    legend,
    priceColumnName,
    showMidPrice,
    showTooltip,
    sideColumnName,
    sizeColumnName,
  });
  const model = useMemo(() => createDepthModel(options), [options]);
  return <VuuChartContainer {...props} chartType="depth" model={model} />;
};
