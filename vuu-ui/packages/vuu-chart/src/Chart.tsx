import { useRef, useEffect, HTMLAttributes } from "react";
import { init, getInstanceByDom } from "echarts";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ChartOptionsProps, useChartOptions } from "./useChartOptions";
import { useChartContextMenu } from "./useChartContextMenu";
import cx from "clsx";

import { ItemColorFunction } from "./ChartSeries";

import chartCss from "./Chart.css";

const classBase = "vuuChart";

type OptionSettings = {
  notMerge: boolean;
};

type ChartSettings = {
  renderer: "svg" | "canvas";
  useCoarsePointer: boolean;
};

export interface ChartProps
  extends ChartOptionsProps,
    HTMLAttributes<HTMLDivElement> {
  chartSettings?: ChartSettings;
  itemColorFunction?: ItemColorFunction;
  optionSettings?: OptionSettings;
  palette?: string[];
  showTooltip?: boolean;
}

export const Chart = ({
  categoryColumnName,
  chartSettings = { useCoarsePointer: true, renderer: "svg" }, // enables clicking near a line and still highlighting it
  className,
  dataSource,
  itemColorFunction,
  optionSettings = { notMerge: true }, // don't merge two options together when updating option
  palette,
  showTooltip,
  style = { width: "100%", height: "100%" },
  seriesColumnNames,
  ...htmlAttributes
}: ChartProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: chartCss,
    window: targetWindow,
  });

  const chartRef = useRef<HTMLDivElement>(null);

  const option = useChartOptions({
    categoryColumnName,
    itemColorFunction,
    palette,
    dataSource,
    seriesColumnNames,
    showTooltip,
  });

  const onContextMenu = useChartContextMenu({ categoryColumnName });

  // Debounce resize event so it only fires periodically instead of constantly
  //   const resizeChart = useMemo(
  //     () =>
  //       debounce(() => {
  //         if (chartRef.current) {
  //           const chart = getInstanceByDom(chartRef.current);
  //           chart.resize();
  //         }
  //       }, 100),
  //     [],
  //   );

  useEffect(() => {
    // Initialize chart
    const chart = init(chartRef.current, null, chartSettings);

    chart.on("contextmenu", onContextMenu);

    // Resize event listener
    // const resizeObserver = new ResizeObserver(() => {
    //   resizeChart();
    // });

    // resizeObserver.observe(chartRef.current);

    // Return cleanup function
    return () => {
      chart?.dispose();

      //   if (chartRef.current) {
      //     resizeObserver.unobserve(chartRef.current);
      //   }
      //   resizeObserver.disconnect();
    };
  }, [chartSettings, onContextMenu]);

  useEffect(() => {
    if (chartRef.current) {
      // Re-render chart when option changes
      const chart = getInstanceByDom(chartRef.current);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chart?.setOption(option, optionSettings);
    }
  }, [option, optionSettings]);

  return (
    <div
      {...htmlAttributes}
      className={cx(classBase, className)}
      ref={chartRef}
      style={style}
    />
  );
};
