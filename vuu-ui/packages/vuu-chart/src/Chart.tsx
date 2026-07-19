import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { getInstanceByDom, init } from "echarts";
import { HTMLAttributes, useEffect, useRef } from "react";
import { useChartContextMenu } from "./useChartContextMenu";
import { ChartOptionsProps, useChartOptions } from "./useChartOptions";
import { useChartSelection } from "./useChartSelection";
import { buildColumnMap } from "@vuu-ui/vuu-utils";

import chartCss from "./Chart.css";

const classBase = "vuuChart";

type OptionSettings = {
  notMerge: boolean;
};

type ChartSettings = {
  /**
   * Default value will be svg
   */
  renderer: "svg" | "canvas";
  /**
   * Enlarges 'click zone' around interactive elements.
   * Default value true;
   */
  useCoarsePointer: boolean;
};

export interface ChartProps
  extends ChartOptionsProps,
    HTMLAttributes<HTMLDivElement> {
  chartSettings?: Partial<ChartSettings>;
  optionSettings?: OptionSettings;
  /**
   * An array of color values that will be assigned, in the order given
   * to rendered series.
   */
  palette?: string[];
  showTooltip?: boolean;
}



export const Chart = ({
  categoryColumnName,
  chartSettings = { useCoarsePointer: true, renderer: "svg" }, 
  className,
  config,
  dataExclusions,
  dataSource,
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

  const columnMap = buildColumnMap(dataSource.columns)

  const onContextMenu = useChartContextMenu({ categoryColumnName, columnMap });
  const {itemColorFunction, onClick, onMouseOut, onMouseOver, symbolSizeFunction} = useChartSelection({ categoryColumnName, selectionModel: config?.selectionModel });

    const option = useChartOptions({
      categoryColumnName,
      config,
      itemColorFunction,
      palette,
      dataExclusions,
      dataSource,
      seriesColumnNames,
      symbolSizeFunction,
      showTooltip,
  });

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
    chart.on("click", onClick);
    chart.on("mouseover", onMouseOver);
    chart.on("mouseout", onMouseOut);

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
