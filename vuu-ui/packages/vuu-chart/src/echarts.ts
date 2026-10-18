/**
 * Tree-shakable ECharts setup. Only the chart types and components used by
 * vuu-chart are registered, rather than importing the full "echarts" bundle.
 */
import {
  BarChart,
  CandlestickChart,
  HeatmapChart,
  LineChart,
  PieChart,
  ScatterChart,
  SunburstChart,
  TreemapChart,
} from "echarts/charts";
import {
  AxisPointerComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
} from "echarts/components";
import { use } from "echarts/core";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";

use([
  BarChart,
  CandlestickChart,
  HeatmapChart,
  LineChart,
  PieChart,
  ScatterChart,
  SunburstChart,
  TreemapChart,
  AxisPointerComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
  VisualMapContinuousComponent,
  CanvasRenderer,
  SVGRenderer,
]);

export { getInstanceByDom, init } from "echarts/core";
export type {
  ECElementEvent,
  ECharts,
  EChartsCoreOption,
} from "echarts/core";
