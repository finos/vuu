import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import {
  MeasuredContainer,
  type MeasuredContainerProps,
  type MeasuredSize,
} from "@vuu-ui/vuu-ui-controls";
import { buildColumnMap } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import type { EChartsCoreOption } from "echarts/core";
import { type ECharts, getInstanceByDom, init } from "./echarts";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChartContextMenu } from "./useChartContextMenu";
import { type ChartOptionsProps, useChartOptions } from "./useChartOptions";
import { useChartSelection } from "./useChartSelection";

import chartCss from "./Chart.css";

const classBase = "vuuChart";

type EChartsHostElement = HTMLDivElement & { echartsInstance?: ECharts };

type OptionSettings = {
  notMerge?: boolean;
};

/**
 * Applied when the set of charted series is unchanged. Merging keeps the
 * tooltip open while the chart re-renders, e.g. when a hovered point is
 * enlarged or data updates. With notMerge the tooltip is recreated, hidden,
 * on every update, so it flickers.
 */
const defaultOptionSettings: OptionSettings = { notMerge: false };
/**
 * Applied when series are added or removed. A merge would leave the axis
 * tooltip referring to removed series, so the chart is replaced.
 */
const seriesChangedOptionSettings: OptionSettings = { notMerge: true };

const seriesIds = (option: EChartsCoreOption) =>
  ((option.series ?? []) as { id?: string }[]).map(({ id }) => id).join("|");

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

const defaultChartSettings: ChartSettings = {
  useCoarsePointer: true,
  renderer: "svg",
};

export const Chart = ({
  categoryColumnName,
  chartSettings = defaultChartSettings,
  className,
  config,
  dataExclusions,
  dataSource,
  height,
  optionSettings = defaultOptionSettings,
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
    testId: "vuu-chart",
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

  const columnMap = useMemo(
    () => buildColumnMap(dataSource.columns),
    [dataSource.columns],
  );

  const { onContextMenu, onMouseMove } = useChartContextMenu({
    categoryColumnName,
    columnMap,
  });
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

  const { renderer = "svg", useCoarsePointer = true } = chartSettings;

  // The ECharts instance is created once per host element and renderer.
  // Event handlers are attached separately, so a change of handler never
  // disposes the chart (which would also discard an open tooltip).
  useEffect(() => {
    if (!chartElement) {
      return;
    }

    const chart = init(chartElement, null, { renderer, useCoarsePointer });
    // Expose the ECharts instance on the host element, so test helpers
    // (PwChart) can map data points to pixel positions.
    (chartElement as EChartsHostElement).echartsInstance = chart;

    return () => {
      chart?.dispose();
      delete (chartElement as EChartsHostElement).echartsInstance;
    };
  }, [chartElement, renderer, useCoarsePointer]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: renderer and useCoarsePointer recreate the chart, handlers must then be attached to the new instance
  useEffect(() => {
    const chart = chartElement ? getInstanceByDom(chartElement) : undefined;
    if (!chart) {
      return;
    }
    chart.on("contextmenu", onContextMenu);
    chart.on("click", onClick);
    chart.on("mouseover", onMouseOver);
    chart.on("mouseout", onMouseOut);
    chart.getZr().on("mousemove", onMouseMove);

    return () => {
      if (!chart.isDisposed()) {
        chart.getZr().off("mousemove", onMouseMove);
        chart.off("contextmenu", onContextMenu);
        chart.off("click", onClick);
        chart.off("mouseover", onMouseOver);
        chart.off("mouseout", onMouseOut);
      }
    };
  }, [
    chartElement,
    onClick,
    onContextMenu,
    onMouseMove,
    onMouseOver,
    onMouseOut,
    renderer,
    useCoarsePointer,
  ]);

  const seriesIdsRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (chartElement) {
      const chart = getInstanceByDom(chartElement);
      if (chart) {
        const ids = seriesIds(option);
        const seriesChanged = ids !== seriesIdsRef.current;
        seriesIdsRef.current = ids;
        chart.setOption(
          option,
          seriesChanged ? seriesChangedOptionSettings : optionSettings,
        );
      }
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
