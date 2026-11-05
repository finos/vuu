import type { DataSource, DataSourceRow } from "@vuu-ui/vuu-data-types";
import { type ColumnMap, itemsChanged } from "@vuu-ui/vuu-utils";
import type { EChartsCoreOption } from "echarts/core";
import { useEffect, useMemo, useRef, useState } from "react";
import type {
  ChartSelectionModel,
  ItemColorFunction,
  SymbolSize,
  SymbolSizeFunction,
  SymbolType,
} from "./chart-types";
import { ChartSeries } from "./ChartSeries";
import { chartTooltip } from "./chartTooltip";

/**
 * Hex values of the theme's categorical palette, --salt-palette-categorical-1
 * to -20 (the -500 shade of each colour). ECharts derives hover colours by
 * parsing these, which fails for css var() values.
 */
const defaultPalette = [
  "#4676bf", // cobalt
  "#ab6528", // cider
  "#9f55c2", // plum
  "#2a8285", // aqua
  "#697694", // slate
  "#b0549d", // rose
  "#6d7c4d", // olive
  "#bd5558", // salmon
  "#7665cf", // indigo
  "#2d8543", // jade
  "#877410", // citrine
  "#bd5a13", // autumn
  "#946694", // lavender
  "#008094", // ocean
  "#72757a", // smoke
  "#c24795", // fuchsia
  "#667d15", // lime
  "#996a45", // fur
  "#636ebf", // violet
  "#23855e", // forest
];

export interface ChartConfig {
  itemColorFunction?: ItemColorFunction;
  selectionModel?: ChartSelectionModel;
  symbolSize?: SymbolSize;
}

export interface DataExclusionOptions {
  isExcludedData: (
    row: DataSourceRow,
    columnMap: ColumnMap,
    column: string,
  ) => boolean;
  /**
   * An embedded SVG path. If provided, will be used to render excluded values.
   */
  symbol?: SymbolType;
}

export interface ChartOptionsProps {
  categoryColumnName: string;
  config: ChartConfig;
  dataExclusions?: DataExclusionOptions;
  dataSource: DataSource;
  itemColorFunction?: ItemColorFunction;
  palette?: string[];
  seriesColumnNames: string[];
  showTooltip?: boolean;
  symbolSizeFunction?: SymbolSizeFunction;
}

const combineConfig = (config: ChartConfig, overrides: ChartConfig) => {
  return {
    ...config,
    ...overrides,
  };
};

export const useChartOptions = ({
  categoryColumnName,
  config,
  dataExclusions,
  dataSource,
  itemColorFunction,
  palette = defaultPalette,
  seriesColumnNames,
  showTooltip = true,
  symbolSizeFunction: symbolSize,
}: ChartOptionsProps) => {
  const [, forceRender] = useState({});
  const frameRef = useRef<number | undefined>(undefined);

  // biome-ignore lint/correctness/useExhaustiveDependencies: series is recreated only when dataSource or config change
  const chartSeries = useMemo(() => {
    const cs = new ChartSeries({
      config: combineConfig(config, { itemColorFunction, symbolSize }),
      dataExclusions,
      dataSource,
      palette,
    });
    // re-render at most once per animation frame
    cs.on("update", () => {
      if (frameRef.current === undefined) {
        frameRef.current = requestAnimationFrame(() => {
          frameRef.current = undefined;
          forceRender({});
        });
      }
    });
    return cs;
  }, [dataSource, config]);

  const chartSeriesRef = useRef(chartSeries);
  chartSeriesRef.current = chartSeries;

  useEffect(() => {
    chartSeries.subscribe();
    return () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
      // When the replacement is a session DataSource of this one (an edit
      // session has started), the source must stay suspended for the
      // duration of the session, not be disabled.
      const { dataSource } = chartSeries;
      const replacement = chartSeriesRef.current.dataSource;
      const escalateToDisable =
        replacement !== dataSource &&
        replacement.isSessionDataSourceOf?.(dataSource)
          ? false
          : undefined;
      chartSeries.release(escalateToDisable);
    };
  }, [chartSeries]);

  useMemo(() => {
    if (categoryColumnName !== chartSeries.categoryColumn) {
      chartSeries.categoryColumn = categoryColumnName;
    }
    if (itemsChanged(seriesColumnNames, chartSeries.seriesColumnNames)) {
      chartSeries.seriesColumnNames = seriesColumnNames;
    }
  }, [categoryColumnName, chartSeries, seriesColumnNames]);

  return {
    animation: false,
    color: chartSeries.palette,
    dataZoom: [
      {
        backgroundColor: "var(--vuuChart-zoom-background, transparent)",
        borderColor: "var(--vuuChart-zoom-borderColor, white)",
        handleStyle: {
          color: "var(--vuuChart-zoom-handleColor, white)",
        },
        moveHandleStyle: {
          color: "var(--vuuChart-zoom-slideColor, white)",
        },
        type: "slider",
        start: 0,
        end: 100,
      },
    ],
    grid: {
      left: "0",
      bottom: 0,
      right: 5,
    },
    series: chartSeries.series,
    tooltip: showTooltip
      ? {
        alwaysShowContent: true,
        backgroundColor: "",
        borderColor: "",
        // borderWidth: "",
        className: "vuuChartTooltip",
        enterable: true,
        formatter: chartTooltip,
        // padding: "",
        trigger: "axis",
      }
      : undefined,
    xAxis: {
      // The axis pointer would otherwise highlight the symbols under it,
      // overriding the hover and selection styling (see ChartSeries).
      axisPointer: { triggerEmphasis: false },
      data: chartSeries.categories,
    },
    yAxis: {
      splitLine: {
        lineStyle: {
          color: "var(--salt-separable-tertiary-borderColor)",
        },
      },
    },
  } as EChartsCoreOption;
};
