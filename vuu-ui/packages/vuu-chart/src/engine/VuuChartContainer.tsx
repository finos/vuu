import { useComponentCssInjection } from "@salt-ds/styles";
import { useWindow } from "@salt-ds/window";
import { MeasuredContainer, type MeasuredSize } from "@vuu-ui/vuu-ui-controls";
import { ThemeContext } from "@vuu-ui/vuu-utils";
import cx from "clsx";
import {
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { ChartDataStores } from "../chart-data/ChartDataStore";
import {
  type ECElementEvent,
  type ECharts,
  type EChartsCoreOption,
  init,
} from "../echarts";
import { mergeEChartsOptions } from "../options/mergeOptions";
import { resolveChartTheme } from "../theme/chartTheme";
import type { ChartItemEvent, VuuChartBaseProps } from "../vuu-chart-types";
import {
  type ChartModel,
  GROUP_KEY_SEPARATOR,
  type SeriesRows,
} from "./ChartModel";
import { useStructuralMemo } from "./useStructuralMemo";

import chartCss from "../Chart.css";

const classBase = "vuuChart";

export interface VuuChartContainerProps extends VuuChartBaseProps {
  chartType: string;
  model: ChartModel;
}

const applyOverride = (
  option: EChartsCoreOption,
  override: VuuChartBaseProps["echartsOptions"],
) =>
  typeof override === "function"
    ? override(option)
    : mergeEChartsOptions(option, override);

/**
 * The chart engine, shared by all chart types.
 *
 * - creates (and disposes) the ECharts instance
 * - subscribes to (and unsubscribes from) DataSources, via ChartDataStores
 * - applies the full option, with notMerge, only when the chart model,
 *   theme or user overrides change
 * - applies data updates as a partial option, merged by component id, at
 *   most once per animation frame, without re-rendering React
 */
export const VuuChartContainer = ({
  chartType,
  className,
  echartsOptions,
  height,
  legend: _legend,
  maxRows,
  model,
  onChartReady,
  onItemClick,
  onItemContextMenu,
  renderer = "canvas",
  resizeStrategy,
  showTooltip: _showTooltip,
  style = { width: "100%", height: "100%" },
  theme: themeOverrides,
  width,
  ...htmlAttributes
}: VuuChartContainerProps) => {
  const targetWindow = useWindow();
  useComponentCssInjection({
    testId: "vuu-chart",
    css: chartCss,
    window: targetWindow,
  });

  const { themeMode } = useContext(ThemeContext);
  const [chartElement, setChartElement] = useState<HTMLDivElement | null>(null);
  const [chart, setChart] = useState<ECharts | undefined>(undefined);

  const overrides = useStructuralMemo(themeOverrides);
  const userOptions = useStructuralMemo(echartsOptions);
  const dataSources = useStructuralMemo(model.dataSources);

  // biome-ignore lint/correctness/useExhaustiveDependencies: themeMode change requires re-read of css tokens
  const theme = useMemo(
    () => resolveChartTheme(chartElement, overrides),
    [chartElement, overrides, themeMode],
  );

  const modelRef = useRef(model);
  modelRef.current = model;
  const themeRef = useRef(theme);
  themeRef.current = theme;
  const storesRef = useRef<ChartDataStores | undefined>(undefined);
  const rowLookupRef = useRef<Record<string, SeriesRows>>({});
  const frameRef = useRef<number | undefined>(undefined);
  const handlersRef = useRef({ onItemClick, onItemContextMenu });
  handlersRef.current = { onItemClick, onItemContextMenu };
  const onChartReadyRef = useRef(onChartReady);
  onChartReadyRef.current = onChartReady;

  useLayoutEffect(() => {
    if (!chartElement) {
      return;
    }
    const echart = init(chartElement, null, {
      renderer,
      useCoarsePointer: true,
    });

    const toItemEvent = (
      params: ECElementEvent,
    ): ChartItemEvent | undefined => {
      const seriesId = params.seriesId ?? "";
      const lookup = rowLookupRef.current[seriesId];
      if (lookup) {
        const store = storesRef.current?.get(lookup.dataSource);
        const groupKey = (params.data as { vuuGroupKey?: string } | undefined)
          ?.vuuGroupKey;
        const groupRows =
          groupKey !== undefined ? lookup.groups?.get(groupKey) : undefined;
        return {
          columnMap: store?.columnMap ?? {},
          dataIndex: params.dataIndex,
          dataSource: lookup.dataSource,
          groupPath: groupKey?.split(GROUP_KEY_SEPARATOR),
          nativeEvent: params.event?.event as Event | undefined,
          row: groupRows ? groupRows[0] : lookup.rows[params.dataIndex],
          rows: groupRows,
          seriesId,
          seriesName: params.seriesName ?? "",
          value: params.value,
        };
      }
    };

    echart.on("click", (params) => {
      const { onItemClick } = handlersRef.current;
      const evt = onItemClick && toItemEvent(params as ECElementEvent);
      if (evt) {
        onItemClick?.(evt);
      }
    });
    echart.on("contextmenu", (params) => {
      const { onItemContextMenu } = handlersRef.current;
      const evt = onItemContextMenu && toItemEvent(params as ECElementEvent);
      if (evt) {
        (params as ECElementEvent).event?.stop();
        onItemContextMenu?.(evt);
      }
    });

    setChart(echart);
    onChartReadyRef.current?.(echart);

    return () => {
      setChart(undefined);
      echart.dispose();
    };
  }, [chartElement, renderer]);

  const buildFullOption = useCallback(() => {
    const stores = storesRef.current;
    if (chart && !chart.isDisposed() && stores) {
      const { buildBaseOption, buildDataOption } = modelRef.current;
      const theme = themeRef.current;
      const { option: dataOption, rowLookup = {} } = buildDataOption(
        stores,
        theme,
      );
      const option = applyOverride(
        mergeEChartsOptions(buildBaseOption(theme), dataOption),
        userOptions,
      );
      rowLookupRef.current = rowLookup;
      chart.setOption(option, { notMerge: true });
    }
  }, [chart, userOptions]);

  const applyDataUpdate = useCallback(() => {
    frameRef.current = undefined;
    const stores = storesRef.current;
    if (chart && !chart.isDisposed() && stores) {
      const { option, rowLookup = {} } = modelRef.current.buildDataOption(
        stores,
        themeRef.current,
      );
      rowLookupRef.current = rowLookup;
      chart.setOption(option, { lazyUpdate: false, silent: true });
    }
  }, [chart]);

  const scheduleDataUpdate = useCallback(() => {
    if (frameRef.current === undefined) {
      frameRef.current = requestAnimationFrame(applyDataUpdate);
    }
  }, [applyDataUpdate]);

  // Subscribe to DataSources. Stores live as long as the chart instance and
  // the set of DataSources.
  useEffect(() => {
    if (!chart) {
      return;
    }
    const stores = new ChartDataStores(
      dataSources,
      { maxRows },
      scheduleDataUpdate,
    );
    storesRef.current = stores;
    stores.subscribe();
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
      stores.dispose();
      storesRef.current = undefined;
    };
  }, [chart, dataSources, maxRows, scheduleDataUpdate]);

  // Full rebuild when structure, theme or user overrides change
  // biome-ignore lint/correctness/useExhaustiveDependencies: model and theme are read via refs, listed here to trigger rebuild
  useEffect(() => {
    buildFullOption();
  }, [buildFullOption, dataSources, maxRows, model, theme]);

  const onResize = useCallback(
    (size: MeasuredSize) => {
      chart?.resize({ height: size.height, width: size.width });
    },
    [chart],
  );

  return (
    <MeasuredContainer
      {...htmlAttributes}
      className={cx(classBase, `${classBase}-${chartType}`, className)}
      height={height}
      onResize={onResize}
      resizeStrategy={resizeStrategy}
      style={style}
      width={width}
    >
      <div
        className={`${classBase}-canvas`}
        ref={setChartElement}
        style={{ height: "100%", width: "100%" }}
      />
    </MeasuredContainer>
  );
};
