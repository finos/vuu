import { useRef, useEffect, HTMLAttributes } from "react";
import { init, getInstanceByDom } from "echarts";
import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { ChartOptionsProps, useChartOptions } from "./useChartOptions";
import { useChartContextMenu } from "./useChartContextMenu";

import echartCss from "./Chart.css";

type OptionSettings = {
  notMerge: boolean;
};

type ChartSettings = {
  useCoarsePointer: boolean;
};

export interface ChartProps
  extends ChartOptionsProps,
    HTMLAttributes<HTMLDivElement> {
  chartSettings?: ChartSettings;
  events?: unknown;
  optionSettings?: OptionSettings;
}

export const Chart = ({
  categoryColumnName,
  chartSettings = { useCoarsePointer: true }, // enables clicking near a line and still highlighting it
  dataSource,
  optionSettings = { notMerge: true }, // don't merge two options together when updating option
  style = { width: "100%", height: "100%" },
  events = {},
  seriesColumnNames,
  ...htmlAttributes
}: ChartProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: echartCss,
    window: targetWindow,
  });

  const chartRef = useRef<HTMLDivElement>(null);

  const option = useChartOptions({
    categoryColumnName,
    dataSource,
    seriesColumnNames,
  });

  const onContextMenu = useChartContextMenu({ categoryColumnName, dataSource });

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

    // Set up event listeners
    // for (const [key, handler] of Object.entries(events)) {
    //   console.log(`register ${key} handler`);
    //   chart.on(key, (param) => {
    //     handler(param);
    //   });
    // }

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
  }, [chartSettings, events, onContextMenu]);

  useEffect(() => {
    if (chartRef.current) {
      // Re-render chart when option changes
      const chart = getInstanceByDom(chartRef.current);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      chart?.setOption(option, optionSettings);
    }
  }, [option, optionSettings]);

  return <div {...htmlAttributes} ref={chartRef} style={style} />;
};
