import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import cx from "clsx";
import { getInstanceByDom, init } from "echarts";
import { useCallback, useEffect, useRef, useState } from "react";
import { useChartContextMenu } from "./useChartContextMenu";
import { type ChartOptionsProps, useChartOptions } from "./useChartOptions";
import { useChartSelection } from "./useChartSelection";
import { buildColumnMap } from "@vuu-ui/vuu-utils";
import {
  MeasuredContainer,
  type MeasuredContainerProps,
  type MeasuredSize,
} from "@vuu-ui/vuu-ui-controls";

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
  Omit<MeasuredContainerProps, "children" | "onResize"> {
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
  height,
  optionSettings = { notMerge: true }, // don't merge two options together when updating option
  palette,
  resizeStrategy,
  showTooltip,
  style = { width: "100%", height: "100%" },
  seriesColumnNames,
  width,
  ...htmlAttributes
}: ChartProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-toast-notification",
    css: chartCss,
    window: targetWindow,
  });

  const chartRef = useRef<HTMLDivElement>(null);
  const [chartElement, setChartElement] = useState<HTMLDivElement | null>(null);
  const setChartRef = useCallback((element: HTMLDivElement | null) => {
    chartRef.current = element;
    setChartElement(element);
  }, []);
  const onResize = useCallback((size: MeasuredSize) => {
    if (chartRef.current) {
      getInstanceByDom(chartRef.current)?.resize({
        height: size.height,
        width: size.width,
      });
    }
  }, []);

  const columnMap = buildColumnMap(dataSource.columns);

  const onContextMenu = useChartContextMenu({ categoryColumnName, columnMap });
  const {
    itemColorFunction,
    onClick,
    onMouseOut,
    onMouseOver,
    symbolSizeFunction,
  } = useChartSelection({
    categoryColumnName,
    selectionModel: config?.selectionModel,
  });

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

  useEffect(() => {
    if (!chartElement) {
      return;
    }

    const chart = init(chartElement, null, chartSettings);

    chart.on("contextmenu", onContextMenu);
    chart.on("click", onClick);
    chart.on("mouseover", onMouseOver);
    chart.on("mouseout", onMouseOut);


    return () => {
      chart?.dispose();
    };
  }, [
    chartElement,
    chartSettings,
    onClick,
    onContextMenu,
    onMouseOver,
    onMouseOut,
  ]);

  useEffect(() => {
    if (chartElement) {
      const chart = getInstanceByDom(chartElement);
      chart?.setOption(option, optionSettings);
    }
  }, [chartElement, option, optionSettings]);

  return (
    <MeasuredContainer
      {...htmlAttributes}
      className={cx(classBase, className)}
      height={height}
      onResize={onResize}
      resizeStrategy={resizeStrategy}
      style={style}
      width={width}
    >
      <div ref={setChartRef} style={{ height: "100%", width: "100%" }} />
    </MeasuredContainer>
  );
};
