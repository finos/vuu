import { useMemo } from "react";
import { VuuChartContainer } from "../engine/VuuChartContainer";
import { useStructuralMemo } from "../engine/useStructuralMemo";
import type { VuuChartBaseProps } from "../vuu-chart-types";
import {
  type HierarchyChartOptions,
  createHierarchyModel,
} from "./hierarchy-model";

export interface HierarchyChartProps
  extends Omit<VuuChartBaseProps, "legend">,
    HierarchyChartOptions {}

/**
 * Treemap, sunburst or pie breakdown of a value column, grouped by one or
 * more columns e.g. exposure by sector -> ric.
 */
export const HierarchyChart = ({
  aggregation,
  colorMode,
  dataSource,
  donut,
  formatValue,
  groupByColumnNames,
  legend,
  showTooltip,
  type,
  valueColumnName,
  where,
  ...props
}: HierarchyChartProps) => {
  const options = useStructuralMemo<HierarchyChartOptions>({
    aggregation,
    colorMode,
    dataSource,
    donut,
    formatValue,
    groupByColumnNames,
    legend,
    showTooltip,
    type,
    valueColumnName,
    where,
  });
  const model = useMemo(() => createHierarchyModel(options), [options]);
  return <VuuChartContainer {...props} chartType={type} model={model} />;
};

export type TreemapChartProps = Omit<HierarchyChartProps, "type" | "donut">;
export const TreemapChart = (props: TreemapChartProps) => (
  <HierarchyChart {...props} type="treemap" />
);

export type SunburstChartProps = Omit<HierarchyChartProps, "type" | "donut">;
export const SunburstChart = (props: SunburstChartProps) => (
  <HierarchyChart {...props} type="sunburst" />
);

export type PieChartProps = Omit<HierarchyChartProps, "type">;
export const PieChart = (props: PieChartProps) => (
  <HierarchyChart {...props} type="pie" />
);
